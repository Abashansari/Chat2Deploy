import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

export interface StaticFile {
  path: string;
  content: string;
}

export interface DeploymentResult {
  success: boolean;
  deploymentUrl: string;
  projectName: string;
  deploymentId: string;
  timestamp: string;
  status: "published" | "failed";
}

export class DeploymentError extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = "DeploymentError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Validates and sanitizes a project name into a Cloudflare Pages compatible name.
 * Cloudflare Pages project names must:
 * - Be 1 to 58 characters
 * - Contain only lowercase alphanumeric characters and hyphens
 * - Not start or end with a hyphen
 */
export function sanitizePagesProjectName(name: string, fallbackSuffix?: string): string {
  if (!name || typeof name !== "string") {
    name = "chat2deploy";
  }

  // Convert to lowercase and replace non-alphanumeric characters with hyphens
  let sanitized = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!sanitized) {
    sanitized = "chat2deploy";
  }

  // Suffix with fallback or short hash if provided
  if (fallbackSuffix) {
    const cleanSuffix = fallbackSuffix.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
    if (cleanSuffix && !sanitized.endsWith(cleanSuffix)) {
      sanitized = `${sanitized.slice(0, 48)}-${cleanSuffix}`;
    }
  }

  // Clamp length to 58 chars max
  sanitized = sanitized.slice(0, 58).replace(/-+$/, "");

  // Ensure starts with alphanumeric
  if (!/^[a-z0-9]/.test(sanitized)) {
    sanitized = `p-${sanitized}`.slice(0, 58);
  }

  return sanitized;
}

/**
 * Validates the generated files to ensure a valid static site.
 */
export function validateStaticFiles(files: StaticFile[]): void {
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new DeploymentError(
      "No website files found to deploy. Please generate your website first.",
      "NO_FILES"
    );
  }

  const hasIndexHtml = files.some(
    (f) => f.path.trim().toLowerCase() === "index.html" || f.path.trim().toLowerCase().endsWith("/index.html")
  );

  if (!hasIndexHtml) {
    throw new DeploymentError(
      "Invalid static website: Missing 'index.html'. An entry point is required.",
      "MISSING_INDEX_HTML"
    );
  }

  for (const file of files) {
    if (!file.path || typeof file.path !== "string") {
      throw new DeploymentError("Malformed file path detected.", "INVALID_FILE_PATH");
    }
    // Prevent directory traversal attacks
    const normalized = path.normalize(file.path);
    if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
      throw new DeploymentError(`Illegal file path detected: ${file.path}`, "PATH_TRAVERSAL");
    }
  }
}

/**
 * Retrieves and validates Cloudflare credentials securely from environment variables.
 */
function getCloudflareCredentials(): { token: string; accountId: string } {
  const token = (process.env.CLOUDFLARE_API_TOKEN || process.env.NEXT_PUBLIC_CLOUDFLARE_API_TOKEN || "").trim();
  const rawAccountId = (process.env.CLOUDFLARE_ACCOUNT_ID || process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID || "").trim();

  // Strip trailing backslashes, spaces, or quotes if present in .env
  const accountId = rawAccountId.replace(/[\\'"\s]/g, "");

  if (!token) {
    throw new DeploymentError(
      "Cloudflare API Token is not configured on the server.",
      "MISSING_API_TOKEN"
    );
  }

  if (!accountId) {
    throw new DeploymentError(
      "Cloudflare Account ID is not configured on the server.",
      "MISSING_ACCOUNT_ID"
    );
  }

  return { token, accountId };
}

/**
 * Ensures the Cloudflare Pages project exists, creating it if necessary.
 */
async function ensurePagesProject(
  projectName: string,
  credentials: { token: string; accountId: string }
): Promise<void> {
  const env = {
    ...process.env,
    CLOUDFLARE_API_TOKEN: credentials.token,
    CLOUDFLARE_ACCOUNT_ID: credentials.accountId,
    WRANGLER_SEND_METRICS: "false",
  };

  try {
    // Attempt project creation with --force to create directly on Cloudflare Pages
    // Note: wrangler requires --force when creating pages projects without workers delegation
    await execFileAsync(
      "npx",
      [
        "wrangler",
        "pages",
        "project",
        "create",
        projectName,
        "--production-branch=main",
        "--force",
      ],
      {
        env,
        timeout: 30000,
        maxBuffer: 5 * 1024 * 1024,
      }
    );
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    const combinedOutput = `${err.stdout || ""} ${err.stderr || ""} ${err.message || ""}`;

    // If the project already exists, that is perfectly normal
    if (/already exists|Project already exists/i.test(combinedOutput)) {
      return;
    }

    // If already exists with another status code, verify by inspecting output
    if (!combinedOutput.includes("Successfully created")) {
      // If error is something else, log safely without exposing token
      console.warn(`[cloudflare] Project creation note for '${projectName}':`, err.message?.slice(0, 150));
    }
  }
}

/**
 * Extracts deployment URL and deployment ID from wrangler deploy stdout.
 */
function parseWranglerOutput(stdout: string, fallbackProjectName: string): { url: string; id: string } {
  // Typical output: "✨ Deployment complete! Take a peek over at https://ebf471c8.my-project.pages.dev"
  const urlRegex = /https:\/\/[a-zA-Z0-9.-]+\.pages\.dev/g;
  const matches = stdout.match(urlRegex) || [];

  let chosenUrl = "";
  let deploymentId = "";

  if (matches.length > 0) {
    // Pick the most specific deployment URL (e.g. hash.project.pages.dev) or primary project.pages.dev
    const specificUrl = matches.find((u) => u.includes(`.${fallbackProjectName}.pages.dev`));
    chosenUrl = specificUrl || matches[matches.length - 1];

    // Extract subdomain hash if present
    const urlObj = new URL(chosenUrl);
    const hostParts = urlObj.hostname.split(".");
    if (hostParts.length >= 4) {
      deploymentId = hostParts[0]; // e.g., 'ebf471c8'
    } else {
      deploymentId = `${Date.now().toString(36)}`;
    }
  } else {
    // Fallback URL if regex didn't catch it
    chosenUrl = `https://${fallbackProjectName}.pages.dev`;
    deploymentId = `${Date.now().toString(36)}`;
  }

  return { url: chosenUrl, id: deploymentId };
}

/**
 * Deploys an array of static website files to Cloudflare Pages using Wrangler CLI.
 * 
 * Flow:
 * 1. Validates files and credentials.
 * 2. Prepares isolated temporary output directory.
 * 3. Writes all files safely.
 * 4. Ensures project exists on Cloudflare Pages.
 * 5. Executes `npx wrangler pages deploy`.
 * 6. Cleans up temporary files securely in a finally block.
 * 7. Returns deployment status, verified URL, and ID.
 */
export async function deployToCloudflarePages(options: {
  projectName: string;
  files: StaticFile[];
  projectId?: string;
  branch?: string;
}): Promise<DeploymentResult> {
  const { files, projectId, branch = "main" } = options;

  // 1. Validate files
  validateStaticFiles(files);

  // 2. Validate credentials
  const credentials = getCloudflareCredentials();

  // 3. Compute sanitized project name
  const safeProjectName = sanitizePagesProjectName(options.projectName, projectId);

  // 4. Create isolated temporary workspace for the static assets
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "c2d-deploy-"));

  try {
    // Write all static files to the directory
    for (const file of files) {
      const normalizedRelative = path.normalize(file.path);
      const destinationPath = path.join(tempDir, normalizedRelative);

      // Create parent directories if nested (e.g., assets/style.css)
      await fs.mkdir(path.dirname(destinationPath), { recursive: true });
      await fs.writeFile(destinationPath, file.content, "utf8");
    }

    // Verify index.html exists in temp directory
    try {
      await fs.access(path.join(tempDir, "index.html"));
    } catch {
      throw new DeploymentError(
        "Verification failed: 'index.html' was not created in output directory.",
        "OUTPUT_VERIFICATION_FAILED"
      );
    }

    // 5. Ensure Pages project exists
    await ensurePagesProject(safeProjectName, credentials);

    // 6. Execute deployment via Wrangler CLI securely using execFile (prevents command injection)
    const env = {
      ...process.env,
      CLOUDFLARE_API_TOKEN: credentials.token,
      CLOUDFLARE_ACCOUNT_ID: credentials.accountId,
      WRANGLER_SEND_METRICS: "false",
    };

    const args = [
      "wrangler",
      "pages",
      "deploy",
      tempDir,
      "--project-name",
      safeProjectName,
      "--branch",
      branch,
      "--commit-dirty=true",
    ];

    const { stdout, stderr } = await execFileAsync("npx", args, {
      env,
      timeout: 120000, // 2 minutes max
      maxBuffer: 10 * 1024 * 1024,
    });

    const combinedOutput = `${stdout || ""} ${stderr || ""}`;

    // Verify successful deployment indication from Wrangler
    if (!combinedOutput.includes("Deployment complete") && !combinedOutput.includes("Success!")) {
      throw new DeploymentError(
        `Cloudflare deployment failed: ${combinedOutput.slice(0, 300)}`,
        "DEPLOYMENT_FAILED"
      );
    }

    const { url, id } = parseWranglerOutput(stdout, safeProjectName);

    return {
      success: true,
      deploymentUrl: url,
      projectName: safeProjectName,
      deploymentId: id,
      timestamp: new Date().toISOString(),
      status: "published",
    };
  } catch (error: unknown) {
    if (error instanceof DeploymentError) {
      throw error;
    }

    const err = error as { message?: string; stdout?: string; stderr?: string };
    const msg = err.message || "Unknown error during Cloudflare deployment";

    // Clean up sensitive details from error message
    const sanitizedMsg = msg
      .replace(new RegExp(credentials.token, "gi"), "[REDACTED]")
      .replace(new RegExp(credentials.accountId, "gi"), "[REDACTED]");

    console.error("[cloudflare] Deployment failed:", sanitizedMsg);

    throw new DeploymentError(
      sanitizedMsg.includes("fetch failed")
        ? "Network connectivity error while communicating with Cloudflare Pages API. Please try again."
        : `Deployment failed: ${sanitizedMsg.slice(0, 200)}`,
      "DEPLOYMENT_EXECUTION_ERROR"
    );
  } finally {
    // 7. Always cleanly remove the temporary directory and assets
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      console.warn("[cloudflare] Failed to clean temp dir:", cleanupErr);
    }
  }
}
