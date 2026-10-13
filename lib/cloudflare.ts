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
 * Validates and sanitizes a user-provided project name into a clean, URL-safe,
 * lowercase Pages project name.
 * 
 * Rules:
 * - Lowercase alphanumeric characters and single hyphens.
 * - 1 to 58 characters.
 * - Does not start or end with a hyphen.
 * - Fallbacks gracefully to "my-site" if empty or only symbols.
 */
export function sanitizePagesProjectName(name: string, fallbackSuffix?: string): string {
  if (!name || typeof name !== "string") {
    name = "my-site";
  }

  // Convert to lowercase and replace non-alphanumeric characters with hyphens
  let sanitized = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!sanitized) {
    sanitized = "my-site";
  }

  // If a fallback suffix is explicitly provided (e.g. for collision resolution)
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
 * Retrieves the actual assigned project subdomain (e.g. "my-portfolio.pages.dev")
 * directly from the Cloudflare API if available.
 */
async function getProjectSubdomain(
  projectName: string,
  credentials: { token: string; accountId: string }
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${credentials.accountId}/pages/projects/${projectName}`,
      {
        headers: {
          Authorization: `Bearer ${credentials.token}`,
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.result?.subdomain) {
        return data.result.subdomain;
      }
    }
  } catch (err) {
    console.warn(`[cloudflare] Failed to fetch project subdomain for '${projectName}':`, err);
  }
  return null;
}

/**
 * Ensures the Cloudflare Pages project exists, creating it if necessary.
 * Handles project name collisions gracefully.
 * 
 * Returns the resolved Cloudflare project name and its canonical public pages.dev URL.
 */
async function ensurePagesProject(
  preferredName: string,
  fallbackSuffix: string | undefined,
  credentials: { token: string; accountId: string }
): Promise<{ projectName: string; expectedUrl: string }> {
  const env = {
    ...process.env,
    CLOUDFLARE_API_TOKEN: credentials.token,
    CLOUDFLARE_ACCOUNT_ID: credentials.accountId,
    WRANGLER_SEND_METRICS: "false",
  };

  // Try preferred meaningful name first
  const candidateNames = [preferredName];

  // If a fallback suffix is available and preferredName is different, prepare it as backup candidate
  if (fallbackSuffix) {
    const nameWithSuffix = sanitizePagesProjectName(preferredName, fallbackSuffix);
    if (nameWithSuffix !== preferredName) {
      candidateNames.push(nameWithSuffix);
    }
  }

  for (let i = 0; i < candidateNames.length; i++) {
    const candidate = candidateNames[i];
    try {
      const { stdout } = await execFileAsync(
        "npx",
        [
          "wrangler",
          "pages",
          "project",
          "create",
          candidate,
          "--production-branch=main",
          "--force",
        ],
        {
          env,
          timeout: 30000,
          maxBuffer: 5 * 1024 * 1024,
        }
      );

      // Successfully created! Check if wrangler output mentions the assigned domain
      const match = stdout.match(/https:\/\/([a-zA-Z0-9.-]+\.pages\.dev)/);
      const subdomain = match ? match[1] : await getProjectSubdomain(candidate, credentials) || `${candidate}.pages.dev`;

      return {
        projectName: candidate,
        expectedUrl: `https://${subdomain}`,
      };
    } catch (error: unknown) {
      const err = error as { stdout?: string; stderr?: string; message?: string };
      const combinedOutput = `${err.stdout || ""} ${err.stderr || ""} ${err.message || ""}`;

      // If the project already exists in this account, we can deploy to it!
      if (/already exists|Project already exists/i.test(combinedOutput)) {
        const subdomain = (await getProjectSubdomain(candidate, credentials)) || `${candidate}.pages.dev`;
        return {
          projectName: candidate,
          expectedUrl: `https://${subdomain}`,
        };
      }

      // If this was the last candidate, throw informative error
      if (i === candidateNames.length - 1) {
        console.warn(`[cloudflare] Failed to ensure Pages project for '${candidate}':`, err.message?.slice(0, 150));
        return {
          projectName: candidate,
          expectedUrl: `https://${candidate}.pages.dev`,
        };
      }
    }
  }

  return {
    projectName: preferredName,
    expectedUrl: `https://${preferredName}.pages.dev`,
  };
}

/**
 * Extracts deployment URL and deployment ID from wrangler deploy stdout.
 * Prefers the clean canonical production URL (e.g. "https://my-portfolio.pages.dev")
 * over the ephemeral deployment hash subdomain.
 */
function parseWranglerOutput(
  stdout: string,
  projectName: string,
  canonicalDomain?: string
): { url: string; id: string } {
  const urlRegex = /https:\/\/[a-zA-Z0-9.-]+\.pages\.dev/g;
  const matches = stdout.match(urlRegex) || [];

  let deploymentId = "";

  if (matches.length > 0) {
    const rawUrl = matches[matches.length - 1];
    const urlObj = new URL(rawUrl);
    const hostParts = urlObj.hostname.split(".");
    if (hostParts.length >= 4) {
      deploymentId = hostParts[0]; // e.g., 'ebf471c8'
    } else {
      deploymentId = `${Date.now().toString(36)}`;
    }
  } else {
    deploymentId = `${Date.now().toString(36)}`;
  }

  // Canonical production URL is https://<projectName>.pages.dev or the specific project domain assigned
  const productionUrl = canonicalDomain
    ? `https://${canonicalDomain}`
    : `https://${projectName}.pages.dev`;

  return { url: productionUrl, id: deploymentId };
}

/**
 * Deploys an array of static website files to Cloudflare Pages using Wrangler CLI.
 */
export async function deployToCloudflarePages(options: {
  projectName: string;
  files: StaticFile[];
  projectId?: string;
  existingHostingProjectName?: string;
  branch?: string;
}): Promise<DeploymentResult> {
  const { files, projectId, existingHostingProjectName, branch = "main" } = options;

  // 1. Validate files
  validateStaticFiles(files);

  // 2. Validate credentials
  const credentials = getCloudflareCredentials();

  // 3. Compute meaningful, clean project name without unnecessary random suffixes.
  // If an existing hosting project name is provided from a previous deployment, reuse it strictly!
  const safeProjectName = sanitizePagesProjectName(existingHostingProjectName || options.projectName);

  // 4. Create isolated temporary workspace for the static assets
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "c2d-deploy-"));

  try {
    // Write all static files to the directory
    for (const file of files) {
      const normalizedRelative = path.normalize(file.path);
      const destinationPath = path.join(tempDir, normalizedRelative);

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

    // 5. Ensure Pages project exists (passing projectId as fallback suffix only if collision occurs)
    const { projectName: actualProjectName, expectedUrl } = await ensurePagesProject(
      safeProjectName,
      projectId,
      credentials
    );

    // 6. Execute deployment via Wrangler CLI securely using execFile
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
      actualProjectName,
      "--branch",
      branch,
      "--commit-dirty=true",
    ];

    const { stdout, stderr } = await execFileAsync("npx", args, {
      env,
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const combinedOutput = `${stdout || ""} ${stderr || ""}`;

    if (!combinedOutput.includes("Deployment complete") && !combinedOutput.includes("Success!")) {
      throw new DeploymentError(
        `Cloudflare deployment failed: ${combinedOutput.slice(0, 300)}`,
        "DEPLOYMENT_FAILED"
      );
    }

    // Determine the true public project URL
    const canonicalDomain = expectedUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    const { url, id } = parseWranglerOutput(stdout, actualProjectName, canonicalDomain);

    return {
      success: true,
      deploymentUrl: url,
      projectName: actualProjectName,
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
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      console.warn("[cloudflare] Failed to clean temp dir:", cleanupErr);
    }
  }
}

/**
 * Safely removes a Cloudflare Pages project and unpublishes its hosted website.
 * Uses Cloudflare API directly with graceful error handling if the project is already deleted.
 */
export async function deleteCloudflarePagesProject(projectName: string): Promise<boolean> {
  if (!projectName || typeof projectName !== "string") {
    return false;
  }

  const cleanProjectName = sanitizePagesProjectName(projectName);
  let credentials;
  try {
    credentials = getCloudflareCredentials();
  } catch (err) {
    console.warn("[cloudflare] Cannot delete Cloudflare project - credentials missing:", err);
    return false;
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${credentials.accountId}/pages/projects/${cleanProjectName}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${credentials.token}`,
        },
      }
    );

    if (res.ok) {
      console.info(`[cloudflare] Successfully deleted project '${cleanProjectName}' from Cloudflare Pages.`);
      return true;
    }

    const data = await res.json().catch(() => ({}));
    // If project already doesn't exist (e.g. 404 or 8000000), treat as reconciled
    if (res.status === 404 || data.errors?.[0]?.code === 8000000) {
      console.info(`[cloudflare] Project '${cleanProjectName}' not found on Cloudflare (already deleted).`);
      return true;
    }

    console.warn(`[cloudflare] API deletion failed for '${cleanProjectName}':`, data);
  } catch (apiErr) {
    console.warn(`[cloudflare] REST delete request failed for '${cleanProjectName}':`, apiErr);
  }

  // Fallback to wrangler CLI if REST fails
  try {
    const env = {
      ...process.env,
      CLOUDFLARE_API_TOKEN: credentials.token,
      CLOUDFLARE_ACCOUNT_ID: credentials.accountId,
      WRANGLER_SEND_METRICS: "false",
    };

    await execFileAsync("npx", ["wrangler", "pages", "project", "delete", cleanProjectName, "--yes"], {
      env,
      timeout: 30000,
    });
    return true;
  } catch (cliErr: unknown) {
    const err = cliErr as { message?: string; stdout?: string };
    if (err?.message?.includes("not found") || err?.stdout?.includes("not found")) {
      return true;
    }
    console.warn(`[cloudflare] CLI project deletion failed for '${cleanProjectName}':`, err?.message);
    return false;
  }
}

