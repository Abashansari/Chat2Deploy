import { Redis } from "@upstash/redis";

// Server-side only guard
if (typeof window !== "undefined") {
  throw new Error("Redis client must only be used on the server.");
}

/**
 * Standard Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
  DASHBOARD_STATS: 180, // 3 minutes
  USER_PROJECTS: 180, // 3 minutes
  USER_DEPLOYMENTS: 180, // 3 minutes
  PROJECT_META: 300, // 5 minutes
  PROJECT_VERSIONS: 300, // 5 minutes
} as const;

/**
 * Circuit Breaker State & Configuration
 * Ensures that Redis outages fail-open instantly without latency overhead.
 */
interface CircuitBreakerState {
  consecutiveFailures: number;
  lastFailureTime: number;
  isOpen: boolean;
  lastLogTime: number;
}

const CIRCUIT_CONFIG = {
  FAILURE_THRESHOLD: 3, // Trip circuit after 3 consecutive failures
  COOLDOWN_MS: 15000, // Stay open for 15s before attempting recovery (half-open)
  LOG_INTERVAL_MS: 30000, // Throttle error logs to once every 30s
  READ_TIMEOUT_MS: 800, // Fast 800ms read timeout
  WRITE_TIMEOUT_MS: 1000, // Fast 1000ms write timeout
};

const circuitState: CircuitBreakerState = {
  consecutiveFailures: 0,
  lastFailureTime: 0,
  isOpen: false,
  lastLogTime: 0,
};

let cachedClient: Redis | null = null;
let lastUsedUrl: string | undefined = undefined;
let lastUsedToken: string | undefined = undefined;

/**
 * Safely logs a Redis notice or error with throttling and secret sanitization.
 */
function logRedisWarning(message: string, error?: unknown): void {
  const now = Date.now();
  if (now - circuitState.lastLogTime > CIRCUIT_CONFIG.LOG_INTERVAL_MS) {
    circuitState.lastLogTime = now;
    const errText = error instanceof Error ? error.message : String(error || "");
    // Strip any possible URLs or tokens from message
    const sanitizedError = errText.replace(/https?:\/\/[^\s]+/g, "[URL_REDACTED]");
    console.warn(`[Redis Fail-Open] ${message}${sanitizedError ? ` Details: ${sanitizedError}` : ""}`);
  }
}

/**
 * Returns an Upstash Redis client if configured, dynamically re-initializing
 * if credentials or connection recovers without requiring a server restart.
 */
export function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token || url.trim() === "" || token.trim() === "") {
    logRedisWarning("Redis credentials missing. Operating in Supabase-only direct mode.");
    cachedClient = null;
    return null;
  }

  // Reset circuit breaker if credentials or endpoint configuration changed
  if (lastUsedUrl !== url || lastUsedToken !== token) {
    circuitState.isOpen = false;
    circuitState.consecutiveFailures = 0;
  }

  // Reuse existing client if credentials haven't changed
  if (cachedClient && lastUsedUrl === url && lastUsedToken === token) {
    return cachedClient;
  }

  try {
    cachedClient = new Redis({
      url,
      token,
      retry: {
        retries: 1,
        backoff: () => 50,
      },
    });
    lastUsedUrl = url;
    lastUsedToken = token;
    return cachedClient;
  } catch (err) {
    logRedisWarning("Failed to instantiate Upstash Redis client. Bypassing cache.", err);
    cachedClient = null;
    return null;
  }
}

/**
 * Checks whether the circuit breaker allows Redis operations.
 */
function shouldAttemptRedis(): boolean {
  if (!circuitState.isOpen) {
    return true;
  }

  const now = Date.now();
  // If cooldown passed, allow a probe request (half-open state)
  if (now - circuitState.lastFailureTime > CIRCUIT_CONFIG.COOLDOWN_MS) {
    return true;
  }

  return false;
}

/**
 * Records a successful Redis operation, resetting the circuit breaker.
 */
function recordRedisSuccess(): void {
  circuitState.consecutiveFailures = 0;
  if (circuitState.isOpen) {
    console.info("[Redis Fail-Open] Redis connection healthy. Circuit breaker reset; caching resumed.");
    circuitState.isOpen = false;
  }
}

/**
 * Records a failed Redis operation and trips the circuit breaker if threshold exceeded.
 */
function recordRedisFailure(error: unknown): void {
  circuitState.consecutiveFailures += 1;
  circuitState.lastFailureTime = Date.now();

  if (circuitState.consecutiveFailures >= CIRCUIT_CONFIG.FAILURE_THRESHOLD) {
    if (!circuitState.isOpen) {
      logRedisWarning(
        `Consecutive failure threshold (${CIRCUIT_CONFIG.FAILURE_THRESHOLD}) reached. Circuit breaker OPEN for ${CIRCUIT_CONFIG.COOLDOWN_MS / 1000}s. Bypassing Redis to protect application latency.`,
        error
      );
      circuitState.isOpen = true;
    }
  } else {
    logRedisWarning("Transient Redis operation error. Falling back to Supabase.", error);
  }
}

/**
 * Manually or programmatically resets the circuit breaker.
 */
export function resetCircuitBreaker(): void {
  circuitState.consecutiveFailures = 0;
  circuitState.isOpen = false;
  circuitState.lastFailureTime = 0;
}

/**
 * Bounded timeout wrapper to ensure Redis calls never block Next.js server threads.
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timer: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      resolve(null);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timer) clearTimeout(timer);
    return result;
  } catch (err) {
    if (timer) clearTimeout(timer);
    throw err;
  }
}

/**
 * Centralized, fail-open Cache-Aside helper.
 * 1. Checks Redis cache first.
 * 2. On cache miss, timeout, error, or outage, runs the Supabase `fetcher`.
 * 3. Asynchronously stores the result in Redis without delaying or failing the response.
 */
export async function fetchWithCache<T>({
  key,
  ttlSeconds,
  fetcher,
}: {
  key: string;
  ttlSeconds: number;
  fetcher: () => Promise<T>;
}): Promise<T> {
  // 1. Try reading from cache if circuit is healthy
  if (shouldAttemptRedis()) {
    try {
      const cached = await cacheGet<T>(key);
      if (cached !== null && cached !== undefined) {
        return cached;
      }
    } catch {
      // Safe fallback: proceed to fetcher
    }
  }

  // 2. Fetch authoritative data from Supabase
  const freshData = await fetcher();

  // 3. Attempt cache write safely (never fails the user request)
  if (freshData !== null && freshData !== undefined) {
    void cacheSet(key, freshData, ttlSeconds).catch(() => {
      // Intentionally ignored; write failure must not affect response
    });
  }

  return freshData;
}

/**
 * Retrieves a cached item from Redis.
 * Gracefully returns null on cache miss, timeout, or error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client || !shouldAttemptRedis()) {
    return null;
  }

  try {
    const result = await withTimeout(client.get<T>(key), CIRCUIT_CONFIG.READ_TIMEOUT_MS);
    recordRedisSuccess();
    return result;
  } catch (err) {
    recordRedisFailure(err);
    return null;
  }
}

/**
 * Stores an item in Redis with a TTL in seconds.
 * Gracefully fails without throwing or crashing.
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = CACHE_TTL.DASHBOARD_STATS
): Promise<boolean> {
  const client = getRedisClient();
  if (!client || !shouldAttemptRedis()) {
    return false;
  }

  try {
    await withTimeout(client.set(key, value, { ex: ttlSeconds }), CIRCUIT_CONFIG.WRITE_TIMEOUT_MS);
    recordRedisSuccess();
    return true;
  } catch (err) {
    recordRedisFailure(err);
    return false;
  }
}

/**
 * Deletes one or more keys from Redis. Never throws.
 */
export async function cacheDel(keys: string | string[]): Promise<void> {
  const client = getRedisClient();
  if (!client || !shouldAttemptRedis()) {
    return;
  }

  const keyList = Array.isArray(keys) ? keys : [keys];
  if (keyList.length === 0) return;

  try {
    await withTimeout(client.del(...keyList), CIRCUIT_CONFIG.WRITE_TIMEOUT_MS);
    recordRedisSuccess();
  } catch (err) {
    recordRedisFailure(err);
  }
}

/**
 * Deletes keys matching a wildcard pattern (e.g. `c2d:user:123:*`).
 * Never throws.
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  if (!client || !shouldAttemptRedis()) {
    return;
  }

  try {
    const matchedKeys = await withTimeout(client.keys(pattern), CIRCUIT_CONFIG.WRITE_TIMEOUT_MS);
    if (matchedKeys && matchedKeys.length > 0) {
      await withTimeout(client.del(...matchedKeys), CIRCUIT_CONFIG.WRITE_TIMEOUT_MS);
    }
    recordRedisSuccess();
  } catch (err) {
    recordRedisFailure(err);
  }
}


/**
 * Cache key generators strictly scoped by user and project IDs.
 */
export const cacheKeys = {
  dashboardStats: (userId: string) => `c2d:user:${userId}:dashboard_stats`,
  userProjects: (userId: string) => `c2d:user:${userId}:projects`,
  userDeployments: (userId: string, filterHash = "all") =>
    `c2d:user:${userId}:deployments:${filterHash}`,
  projectMeta: (userId: string, projectId: string) =>
    `c2d:user:${userId}:project:${projectId}:meta`,
  projectVersions: (userId: string, projectId: string) =>
    `c2d:user:${userId}:project:${projectId}:versions`,
};

/**
 * Cache Invalidation Helpers:
 * Invalidate affected user and project caches safely when mutations occur.
 * None of these helpers throw or delay application business logic.
 */
export async function invalidateUserDashboardAndProjects(userId: string): Promise<void> {
  try {
    await Promise.all([
      cacheDel(cacheKeys.dashboardStats(userId)),
      cacheDel(cacheKeys.userProjects(userId)),
      cacheDelPattern(`c2d:user:${userId}:deployments:*`),
    ]);
  } catch {
    // Fail-open: invalidation failure never breaks Supabase commits
  }
}

export async function invalidateUserDeployments(userId: string): Promise<void> {
  try {
    await Promise.all([
      cacheDel(cacheKeys.dashboardStats(userId)),
      cacheDelPattern(`c2d:user:${userId}:deployments:*`),
    ]);
  } catch {
    // Fail-open
  }
}

export async function invalidateProjectCaches(userId: string, projectId: string): Promise<void> {
  try {
    await Promise.all([
      cacheDel([
        cacheKeys.projectMeta(userId, projectId),
        cacheKeys.projectVersions(userId, projectId),
        cacheKeys.dashboardStats(userId),
        cacheKeys.userProjects(userId),
      ]),
      cacheDelPattern(`c2d:user:${userId}:deployments:*`),
    ]);
  } catch {
    // Fail-open
  }
}

export async function invalidateAllUserData(userId: string): Promise<void> {
  try {
    await cacheDelPattern(`c2d:user:${userId}:*`);
  } catch {
    // Fail-open
  }
}
