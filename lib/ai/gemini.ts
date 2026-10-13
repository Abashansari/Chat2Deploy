import { GoogleGenAI, Type } from "@google/genai";

interface ApiKeyEntry {
  name: string;
  key: string;
  client: GoogleGenAI;
}

function loadApiKeyPool(): ApiKeyEntry[] {
  const candidates: { name: string; envVar: string }[] = [
    { name: "PRIMARY", envVar: "GOOGLE_GENERATIVE_AI_API_KEY" },
    { name: "BACKUP1", envVar: "GOOGLE_GENERATIVE_AI_BACKUP1_API_KEY" },
    { name: "BACKUP2", envVar: "GOOGLE_GENERATIVE_AI_BACKUP2_API_KEY" },
  ];

  const pool: ApiKeyEntry[] = [];
  const seenKeys = new Set<string>();

  for (const item of candidates) {
    const rawKey = process.env[item.envVar]?.trim();
    if (rawKey && !seenKeys.has(rawKey)) {
      seenKeys.add(rawKey);
      pool.push({
        name: item.name,
        key: rawKey,
        client: new GoogleGenAI({ apiKey: rawKey }),
      });
    }
  }

  if (pool.length === 0) {
    console.error("[gemini] No Google Gemini API keys configured in environment.");
  }

  return pool;
}

export function getApiKeyCount(): number {
  return loadApiKeyPool().length;
}

const SYSTEM_INSTRUCTION_GENERATE = `You are an expert frontend web developer. Create a multi-file website based on the user's request.
Return a JSON object containing a title, description, and an array of files.

CRITICAL RULES:
1. Generate standard web files (e.g., index.html, style.css, script.js). Do NOT use React, JSX, or build steps.
2. The design MUST be visually stunning, professional, and modern. Use beautiful colors, typography (Google Fonts), subtle shadows, gradients, and smooth CSS transitions.
3. Make it fully responsive for mobile, tablet, and desktop.
4. Implement interactivity (mobile hamburger menu, smooth scrolling) in vanilla JS.
5. Generate REAL, relevant content. NO "Lorem ipsum".
6. In your HTML, link to your CSS via <link rel="stylesheet" href="style.css"> and JS via <script src="script.js"></script>.
7. Every navbar link MUST have a working destination. For single-page sites, use anchor links (e.g., href="#about") and ensure matching IDs exist.
8. Implement smooth scrolling.

Your response must contain ONLY valid JSON matching the schema.`;

const SYSTEM_INSTRUCTION_MODIFY = `You are an expert frontend web developer performing TARGETED file operations on an existing website.
You will be provided with the current project files. Treat them as the ABSOLUTE SOURCE OF TRUTH.

MODIFICATION RULES:
1. Make ONLY the changes explicitly requested. Preserve all existing design, content, structure, and functionality that wasn't mentioned.
2. Return a JSON object with a title, description, and an array of 'operations'.
3. For small changes, use 'update' with 'replacements'. 'search' MUST be an exact substring of the current file content. Do not paraphrase.
4. Do NOT replace existing content with placeholder text.
5. Do NOT break existing navigation. If you rename an ID, update the links pointing to it.

AVAILABLE ACTIONS:
- "create": Create a new file. Requires 'path' and 'content'.
- "update": Modify an existing file. Requires 'path' and an array of 'replacements' (each with 'search' and 'replace').
- "delete": Delete a file. Requires 'path'.
- "rename": Rename a file. Requires 'path' and 'newPath'.

Your response must contain ONLY valid JSON matching the schema.`;

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface FileOperation {
  action: 'create' | 'update' | 'delete' | 'rename';
  path: string;
  newPath?: string;
  content?: string;
  replacements?: { search: string; replace: string }[];
}

export interface GenerationResult {
  title: string;
  description: string;
  files: GeneratedFile[];
  modelUsed?: string;
}

export interface ModificationContext {
  currentFiles: GeneratedFile[];
  chatHistory: { role: string; content: string }[];
}

export class GeminiServiceError extends Error {
  status: number;
  retryable: boolean;
  keyFailoverEligible: boolean;
  retryAfterSeconds?: number;
  modelTried?: string;
  keyTriedName?: string;

  constructor(message: string, options: {
    status: number;
    retryable: boolean;
    keyFailoverEligible?: boolean;
    retryAfterSeconds?: number;
    modelTried?: string;
    keyTriedName?: string;
    cause?: unknown;
  }) {
    super(message);
    this.name = "GeminiServiceError";
    this.status = options.status;
    this.retryable = options.retryable;
    this.keyFailoverEligible = options.keyFailoverEligible ?? (options.status === 429 || options.status === 503);
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.modelTried = options.modelTried;
    this.keyTriedName = options.keyTriedName;
    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  totalTimeoutMs: number;
  apiKeys?: { name: string; key: string; client: GoogleGenAI }[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 2,
  baseDelayMs: 1000,
  maxDelayMs: 6000,
  totalTimeoutMs: 50000,
};

function parseRetryAfter(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;

  const anyErr = err as Record<string, unknown>;
  const headers = anyErr.response && typeof anyErr.response === "object"
    ? (anyErr.response as Record<string, unknown>).headers
    : undefined;

  if (headers && typeof headers === "object") {
    const rawHeader = (headers as Record<string, unknown>)["retry-after"]
      || (headers as Record<string, unknown>)["Retry-After"];
    if (typeof rawHeader === "string" || typeof rawHeader === "number") {
      const parsed = Number(rawHeader);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
  }

  const msg = typeof anyErr.message === "string" ? anyErr.message : "";
  const match = msg.match(/retry(?:-after|\s+after|\s+in)?\s*[:=]?\s*(\d+)\s*(?:s|seconds)?/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }

  return undefined;
}

export function classifyGeminiError(
  err: unknown,
  currentModel?: string,
  keyTriedName?: string
): GeminiServiceError {
  if (err instanceof GeminiServiceError) {
    if (currentModel && !err.modelTried) err.modelTried = currentModel;
    if (keyTriedName && !err.keyTriedName) err.keyTriedName = keyTriedName;
    return err;
  }

  const retryAfterSeconds = parseRetryAfter(err);
  const anyErr = (err && typeof err === "object") ? (err as Record<string, unknown>) : {};
  const message = typeof anyErr.message === "string" ? anyErr.message : String(err || "");
  const statusNumber = typeof anyErr.status === "number" ? anyErr.status : undefined;

  const is503 = statusNumber === 503
    || /503\s+UNAVAILABLE|high\s+demand|spikes\s+in\s+demand|service\s+unavailable/i.test(message);

  const isAuth = statusNumber === 401 || statusNumber === 403
    || /api_key_invalid|invalid\s*api\s*key|permission_denied|unauthenticated/i.test(message);

  const isQuotaOrBilling = /quota\s*exceeded|insufficient_quota|billing|credit/i.test(message);

  const is429 = statusNumber === 429
    || /429|resource_exhausted|rate\s*limit/i.test(message)
    || isQuotaOrBilling;

  const isBadRequest = statusNumber === 400
    || /invalid_argument|bad\s*request|invalid\s*parameter/i.test(message);

  const isTimeout = /timeout|timed\s*out|deadline_exceeded/i.test(message);

  const is500 = (statusNumber !== undefined && statusNumber >= 500 && statusNumber < 600)
    || /internal\s*server\s*error|500\s*internal/i.test(message);

  if (is503) {
    return new GeminiServiceError(
      "The AI model is experiencing temporary high demand upstream. Please try again shortly.",
      {
        status: 503,
        retryable: true,
        keyFailoverEligible: true,
        retryAfterSeconds,
        modelTried: currentModel,
        keyTriedName,
        cause: err,
      }
    );
  }

  if (is429) {
    const errorText = isQuotaOrBilling
      ? "AI quota limit reached for this key. Attempting backup key..."
      : "AI rate limit reached. Please wait a moment before trying again.";

    return new GeminiServiceError(
      errorText,
      {
        status: 429,
        retryable: true,
        keyFailoverEligible: true, // Key failover is ideal for 429 and quota exhaustion!
        retryAfterSeconds,
        modelTried: currentModel,
        keyTriedName,
        cause: err,
      }
    );
  }

  if (isTimeout) {
    return new GeminiServiceError(
      "AI request timed out. Please try again.",
      {
        status: 504,
        retryable: true,
        keyFailoverEligible: true,
        modelTried: currentModel,
        keyTriedName,
        cause: err,
      }
    );
  }

  if (isAuth) {
    return new GeminiServiceError(
      "AI service authentication failed. Invalid API key.",
      {
        status: 401,
        retryable: false,
        keyFailoverEligible: true, // Key failover is helpful if primary key was revoked/invalidated but backup is valid!
        modelTried: currentModel,
        keyTriedName,
        cause: err,
      }
    );
  }

  if (isBadRequest) {
    return new GeminiServiceError(
      "Invalid generation request parameters.",
      {
        status: 400,
        retryable: false,
        keyFailoverEligible: false, // Prompt/schema error - switching keys cannot fix this!
        modelTried: currentModel,
        keyTriedName,
        cause: err,
      }
    );
  }

  if (is500) {
    return new GeminiServiceError(
      "AI service encountered a temporary upstream error. Please try again.",
      {
        status: 502,
        retryable: true,
        keyFailoverEligible: true,
        retryAfterSeconds,
        modelTried: currentModel,
        keyTriedName,
        cause: err,
      }
    );
  }

  return new GeminiServiceError(
    message || "Unexpected AI generation failure.",
    {
      status: 500,
      retryable: false,
      keyFailoverEligible: false,
      modelTried: currentModel,
      keyTriedName,
      cause: err,
    }
  );
}

function calculateDelay(attempt: number, config: RetryConfig, retryAfterSeconds?: number): number {
  if (retryAfterSeconds && retryAfterSeconds > 0) {
    return Math.min(retryAfterSeconds * 1000, config.maxDelayMs);
  }

  // Exponential backoff with random full jitter
  const expDelay = config.baseDelayMs * Math.pow(2, attempt);
  const boundedDelay = Math.min(expDelay, config.maxDelayMs);
  const jitter = Math.random() * 0.5 + 0.75; // 75% to 125% jitter
  return Math.min(boundedDelay * jitter, config.maxDelayMs);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCandidateModels(): string[] {
  const primaryModel = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.8-flash";

  const models = [primaryModel];
  if (fallbackModel && fallbackModel !== primaryModel) {
    models.push(fallbackModel);
  }
  return models;
}

export async function executeWithRetryAndFallback<T>(
  operation: (client: GoogleGenAI, model: string, signal: AbortSignal) => Promise<T>,
  customConfig?: Partial<RetryConfig>
): Promise<{ result: T; modelUsed: string; keyUsedName: string }> {
  const config: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...customConfig };
  const keys = config.apiKeys && config.apiKeys.length > 0 ? config.apiKeys : loadApiKeyPool();

  if (keys.length === 0) {
    throw new GeminiServiceError(
      "No Google Gemini API keys configured on server. Please set GOOGLE_GENERATIVE_AI_API_KEY.",
      {
        status: 503,
        retryable: false,
        keyFailoverEligible: false,
      }
    );
  }

  const models = getCandidateModels();
  const startTime = Date.now();

  let lastError: GeminiServiceError | null = null;

  for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
    const currentKeyEntry = keys[keyIdx];
    const isKeyFailover = keyIdx > 0;

    if (isKeyFailover) {
      console.warn(
        `[gemini] Initiating API key failover: switching to ${currentKeyEntry.name} key...`
      );
    }

    for (let modelIdx = 0; modelIdx < models.length; modelIdx++) {
      const currentModel = models[modelIdx];
      const isModelFallback = modelIdx > 0;

      if (isModelFallback) {
        console.warn(`[gemini] Switching to fallback model: ${currentModel} on key ${currentKeyEntry.name}`);
      }

      for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
        const elapsed = Date.now() - startTime;
        if (elapsed >= config.totalTimeoutMs) {
          throw new GeminiServiceError(
            "Generation timed out across retry and key-failover attempts.",
            {
              status: 504,
              retryable: true,
              keyFailoverEligible: true,
              modelTried: currentModel,
              keyTriedName: currentKeyEntry.name,
              cause: lastError,
            }
          );
        }

        const remainingTime = config.totalTimeoutMs - elapsed;
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), remainingTime);

        try {
          const result = await operation(currentKeyEntry.client, currentModel, timeoutController.signal);
          clearTimeout(timeoutId);
          return {
            result,
            modelUsed: currentModel,
            keyUsedName: currentKeyEntry.name,
          };
        } catch (err: unknown) {
          clearTimeout(timeoutId);
          const classified = classifyGeminiError(err, currentModel, currentKeyEntry.name);
          lastError = classified;

          // If error cannot be solved by retry or key failover (e.g. 400 Bad Request parameter error),
          // abort immediately without wasting calls or cycling keys.
          if (!classified.retryable && !classified.keyFailoverEligible) {
            throw classified;
          }

          // If the error is an auth failure on this key (401), or quota exhaustion,
          // immediately failover to the next key without retrying this unusable key.
          const hasMoreKeys = keyIdx < keys.length - 1;
          const isImmediateKeyFailover = classified.status === 401 || (classified.status === 429 && classified.message.includes("quota"));

          if (isImmediateKeyFailover) {
            if (hasMoreKeys) {
              console.warn(
                `[gemini] Key ${currentKeyEntry.name} encountered ${classified.status} (${classified.message}). Failing over immediately to next backup key...`
              );
              break; // Break inner model loop to proceed to next key
            } else {
              console.error(
                `[gemini] All keys exhausted. Key ${currentKeyEntry.name} failed with ${classified.status}.`
              );
              throw classified;
            }
          }

          const isLastAttemptForModel = attempt === config.maxAttempts - 1;
          const hasMoreModels = modelIdx < models.length - 1;

          if (isLastAttemptForModel) {
            if (hasMoreModels) {
              console.warn(
                `[gemini] Exhausted ${config.maxAttempts} retries on ${currentModel} (${classified.status} ${classified.message}) using ${currentKeyEntry.name}. Trying fallback model...`
              );
              break; // Break attempt loop to try next model with same key
            } else if (hasMoreKeys) {
              console.warn(
                `[gemini] All models exhausted on ${currentKeyEntry.name}. Failing over to next key...`
              );
              break; // Break model loop to try next key
            } else {
              console.error(
                `[gemini] All retries, models, and API keys exhausted. Last error: ${classified.status} ${classified.message}`
              );
              throw classified;
            }
          }

          const delayMs = calculateDelay(attempt, config, classified.retryAfterSeconds);
          const nextElapsed = Date.now() - startTime + delayMs;
          if (nextElapsed >= config.totalTimeoutMs) {
            if (hasMoreKeys) {
              break; // Failover to next key immediately if delay would exceed timeout
            }
            throw new GeminiServiceError(
              "Generation deadline exceeded while waiting to retry.",
              {
                status: 504,
                retryable: true,
                keyFailoverEligible: true,
                modelTried: currentModel,
                keyTriedName: currentKeyEntry.name,
                cause: classified,
              }
            );
          }

          console.warn(
            `[gemini] [${currentKeyEntry.name}] Attempt ${attempt + 1}/${config.maxAttempts} failed on ${currentModel} (${classified.status}: ${classified.message}). Retrying in ${Math.round(delayMs)}ms...`
          );
          await sleep(delayMs);
        }
      }

      // If all models on this key were exhausted or immediate failover triggered, break outer model loop
      if (modelIdx === models.length - 1 || lastError?.status === 401 || (lastError?.status === 429 && lastError?.message.includes("quota"))) {
        if (keyIdx < keys.length - 1) {
          break; // Advance keyIdx in outer loop
        }
      }
    }
  }

  throw lastError || new GeminiServiceError("All Gemini API keys and models exhausted.", {
    status: 503,
    retryable: true,
    keyFailoverEligible: true,
  });
}

export async function generateWebsite(
  prompt: string,
  options?: { retryConfig?: Partial<RetryConfig> }
): Promise<GenerationResult> {
  const pool = options?.retryConfig?.apiKeys || loadApiKeyPool();
  if (pool.length === 0) {
    throw new GeminiServiceError("No Google Gemini API keys configured on server.", {
      status: 503,
      retryable: false,
      keyFailoverEligible: false,
    });
  }
  if (!prompt || !prompt.trim()) {
    throw new GeminiServiceError("Prompt cannot be empty.", {
      status: 400,
      retryable: false,
      keyFailoverEligible: false,
    });
  }

  const { result: rawResponse, modelUsed } = await executeWithRetryAndFallback(
    async (client, model) => {
      return await client.models.generateContent({
        model,
        contents: prompt.trim(),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_GENERATE,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              files: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    path: { type: Type.STRING, description: "e.g., index.html, style.css" },
                    content: { type: Type.STRING },
                  },
                  required: ["path", "content"],
                },
              },
            },
            required: ["title", "description", "files"],
          },
        },
      });
    },
    options?.retryConfig
  );

  const text = rawResponse.text;
  if (!text) {
    throw new GeminiServiceError("Empty response received from AI model.", {
      status: 502,
      retryable: true,
      modelTried: modelUsed,
    });
  }

  let parsed: GenerationResult;
  try {
    parsed = JSON.parse(text) as GenerationResult;
  } catch (parseErr) {
    throw new GeminiServiceError("AI returned invalid JSON structure.", {
      status: 502,
      retryable: true,
      modelTried: modelUsed,
      cause: parseErr,
    });
  }

  if (!parsed.files || !Array.isArray(parsed.files) || parsed.files.length === 0) {
    throw new GeminiServiceError("AI did not generate any files.", {
      status: 502,
      retryable: true,
      modelTried: modelUsed,
    });
  }

  // Validate integrity of each generated file: path & content must be strings
  for (const file of parsed.files) {
    if (!file.path || typeof file.path !== "string" || typeof file.content !== "string") {
      throw new GeminiServiceError("AI generated malformed file entries.", {
        status: 502,
        retryable: true,
        modelTried: modelUsed,
      });
    }
  }

  // Auto-repair navigation on HTML files
  for (const file of parsed.files) {
    if (file.path.endsWith('.html')) {
      const { html, warnings } = repairNavigation(file.content);
      file.content = html;
      if (warnings.length > 0) {
        console.warn(`[gemini] Repaired navigation in ${file.path}:`, warnings);
      }
    }
  }

  parsed.modelUsed = modelUsed;
  return parsed;
}

export async function modifyWebsite(
  prompt: string,
  context: ModificationContext,
  options?: { retryConfig?: Partial<RetryConfig> }
): Promise<GenerationResult> {
  const pool = options?.retryConfig?.apiKeys || loadApiKeyPool();
  if (pool.length === 0) {
    throw new GeminiServiceError("No Google Gemini API keys configured on server.", {
      status: 503,
      retryable: false,
      keyFailoverEligible: false,
    });
  }
  if (!prompt || !prompt.trim()) {
    throw new GeminiServiceError("Prompt cannot be empty.", {
      status: 400,
      retryable: false,
      keyFailoverEligible: false,
    });
  }
  if (!context.currentFiles || context.currentFiles.length === 0) {
    throw new GeminiServiceError("No existing files to modify.", {
      status: 400,
      retryable: false,
      keyFailoverEligible: false,
    });
  }

  const recentHistory = context.chatHistory.slice(-10);
  let conversationContext = "";
  if (recentHistory.length > 0) {
    conversationContext = "\nRECENT CONVERSATION HISTORY:\n";
    for (const msg of recentHistory) {
      conversationContext += `${msg.role.toUpperCase()}: ${msg.content}\n`;
    }
  }

  let filesContext = "CURRENT PROJECT FILES:\n";
  for (const f of context.currentFiles) {
    filesContext += `\n--- ${f.path} ---\n\`\`\`\n${f.content}\n\`\`\`\n`;
  }

  const fullPrompt = `USER'S MODIFICATION REQUEST: ${prompt}
${conversationContext}
Apply ONLY the modification requested above to the project files. Return structured operations.
${filesContext}`;

  const { result: rawResponse, modelUsed } = await executeWithRetryAndFallback(
    async (client, model) => {
      return await client.models.generateContent({
        model,
        contents: fullPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_MODIFY,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              operations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING, enum: ["create", "update", "delete", "rename"] },
                    path: { type: Type.STRING },
                    newPath: { type: Type.STRING },
                    content: { type: Type.STRING },
                    replacements: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          search: { type: Type.STRING },
                          replace: { type: Type.STRING }
                        },
                        required: ["search", "replace"]
                      }
                    }
                  },
                  required: ["action", "path"]
                }
              }
            },
            required: ["title", "description", "operations"],
          },
        },
      });
    },
    options?.retryConfig
  );

  const text = rawResponse.text;
  if (!text) {
    throw new GeminiServiceError("Empty response received from AI model.", {
      status: 502,
      retryable: true,
      modelTried: modelUsed,
    });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch (parseErr) {
    throw new GeminiServiceError("AI returned invalid JSON structure.", {
      status: 502,
      retryable: true,
      modelTried: modelUsed,
      cause: parseErr,
    });
  }

  if (!parsed.operations || !Array.isArray(parsed.operations)) {
    throw new GeminiServiceError("AI did not return a valid list of operations.", {
      status: 502,
      retryable: true,
      modelTried: modelUsed,
    });
  }

  // Apply operations
  const newFiles = applyOperations(context.currentFiles, parsed.operations);

  // Validate resulting HTML files
  for (const file of newFiles) {
    if (file.path.endsWith('.html')) {
      const { html, warnings } = repairNavigation(file.content);
      file.content = html;
      if (warnings.length > 0) {
        console.warn(`[gemini] Repaired navigation in ${file.path}:`, warnings);
      }
    }
  }

  return {
    title: typeof parsed.title === "string" ? parsed.title : "Modified Website",
    description: typeof parsed.description === "string" ? parsed.description : "Website modification applied",
    files: newFiles,
    modelUsed,
  };
}

function applyOperations(currentFiles: GeneratedFile[], operations: FileOperation[]): GeneratedFile[] {
  const fileMap = new Map<string, string>();
  for (const f of currentFiles) fileMap.set(f.path, f.content);

  for (const op of operations) {
    if (op.action === 'create') {
      if (!op.content) throw new Error(`Create operation on ${op.path} missing content`);
      fileMap.set(op.path, op.content);
    } else if (op.action === 'delete') {
      fileMap.delete(op.path);
    } else if (op.action === 'rename') {
      if (!op.newPath) throw new Error(`Rename operation on ${op.path} missing newPath`);
      const content = fileMap.get(op.path);
      if (content !== undefined) {
        fileMap.delete(op.path);
        fileMap.set(op.newPath, content);
      }
    } else if (op.action === 'update') {
      if (!fileMap.has(op.path)) throw new Error(`Cannot update non-existent file: ${op.path}`);
      let content = fileMap.get(op.path)!;
      
      if (op.replacements && op.replacements.length > 0) {
        for (const rep of op.replacements) {
          if (!content.includes(rep.search)) {
             throw new Error(`Failed to apply update: exact search string not found in ${op.path}. Search string: "${rep.search}"`);
          }
          content = content.replace(rep.search, rep.replace);
        }
      } else if (op.content) {
        // Fallback: full content replacement
        content = op.content;
      } else {
        throw new Error(`Update operation on ${op.path} requires replacements or content.`);
      }
      fileMap.set(op.path, content);
    }
  }

  return Array.from(fileMap.entries()).map(([path, content]) => ({ path, content }));
}

export function repairNavigation(html: string): { html: string; warnings: string[] } {
  const warnings: string[] = [];
  let repairedHtml = html;

  const anchorLinkRegex = /href=["']#([^"']+)["']/gi;
  const idRegex = /id=["']([^"']+)["']/gi;

  const anchorTargets = new Set<string>();
  const definedIds = new Set<string>();

  let match;
  while ((match = anchorLinkRegex.exec(html)) !== null) {
    anchorTargets.add(match[1]);
  }
  while ((match = idRegex.exec(html)) !== null) {
    definedIds.add(match[1]);
  }

  for (const target of anchorTargets) {
    if (!definedIds.has(target)) {
      const targetWord = target.replace(/[-_]/g, '\\s*');
      const sectionRegex = new RegExp(
        `(<(?:section|div)(?=[^>]*class)[^>]*>)([\\s\\S]*?<(?:h[1-6])[^>]*>[\\s\\S]*?${targetWord}[\\s\\S]*?</(?:h[1-6])>)`,
        'i'
      );
      const sectionMatch = sectionRegex.exec(repairedHtml);

      if (sectionMatch) {
        const openTag = sectionMatch[1];
        if (!/id=["']/.test(openTag)) {
          const fixedTag = openTag.replace(/^(<(?:section|div))/, `$1 id="${target}"`);
          repairedHtml = repairedHtml.replace(openTag, fixedTag);
          warnings.push(`Auto-injected id="${target}" on section matching "${target}"`);
        }
      } else {
        warnings.push(`Anchor link "#${target}" has no matching element — could not auto-fix`);
      }
    }
  }

  const placeholderRegex = /href=["']#["']/gi;
  let placeholderCount = 0;
  while (placeholderRegex.exec(repairedHtml) !== null) {
    placeholderCount++;
  }
  if (placeholderCount > 0) {
    warnings.push(`Found ${placeholderCount} placeholder href="#" links (cannot auto-fix without intent)`);
  }

  return { html: repairedHtml, warnings };
}
