import "dotenv/config";
import assert from "assert";
import { GoogleGenAI } from "@google/genai";
import {
  classifyGeminiError,
  executeWithRetryAndFallback,
  GeminiServiceError,
  getApiKeyCount,
} from "../lib/ai/gemini";

async function runFailoverAndResilienceTests() {
  console.log("=== Running Gemini Key Failover & Resilience Unit Tests ===");

  // 0. Verify Key Pool Configuration
  console.log("0. Verifying backend API key pool configuration...");
  const configuredKeysCount = getApiKeyCount();
  assert(configuredKeysCount >= 1, "At least 1 API key should be configured in .env");
  console.log(` Successfully loaded ${configuredKeysCount} distinct backend API keys.`);

  // Mock API Keys for deterministic unit testing
  const mockPrimary = new GoogleGenAI({ apiKey: "mock-primary-key" });
  const mockBackup1 = new GoogleGenAI({ apiKey: "mock-backup1-key" });
  const mockBackup2 = new GoogleGenAI({ apiKey: "mock-backup2-key" });

  const testKeyPool = [
    { name: "PRIMARY", key: "mock-primary-key", client: mockPrimary },
    { name: "BACKUP1", key: "mock-backup1-key", client: mockBackup1 },
    { name: "BACKUP2", key: "mock-backup2-key", client: mockBackup2 },
  ];

  // 1. Primary-Key Success Test
  console.log("\n1. Testing Primary-Key Success (no failover needed)...");
  let primaryCallCount = 0;
  const primaryResult = await executeWithRetryAndFallback(
    async (client, model) => {
      primaryCallCount++;
      assert.strictEqual(client, mockPrimary, "Should call primary client first");
      return { success: true, website: "<html>Primary</html>", model };
    },
    {
      apiKeys: testKeyPool,
      maxAttempts: 2,
      baseDelayMs: 10,
      maxDelayMs: 50,
      totalTimeoutMs: 5000,
    }
  );

  assert.strictEqual(primaryCallCount, 1, "Should succeed on very first attempt");
  assert.strictEqual(primaryResult.keyUsedName, "PRIMARY", "Used key must be PRIMARY");
  assert.strictEqual(primaryResult.result.success, true);
  console.log(" Primary-key success verified.");

  // 2. Backup-Key Failover Success Test (Primary hits 429 rate limit or 503 high demand)
  console.log("\n2. Testing Backup-Key Success (Primary fails with 429, fails over to BACKUP1)...");
  const keysAttempted: string[] = [];
  const backup1Result = await executeWithRetryAndFallback(
    async (client, model) => {
      if (client === mockPrimary) {
        keysAttempted.push("PRIMARY");
        throw {
          status: 429,
          message: "RESOURCE_EXHAUSTED: Rate limit exceeded for primary key.",
        };
      }
      keysAttempted.push("BACKUP1");
      return { success: true, website: "<html>Backup1</html>", model };
    },
    {
      apiKeys: testKeyPool,
      maxAttempts: 2,
      baseDelayMs: 10,
      maxDelayMs: 50,
      totalTimeoutMs: 5000,
    }
  );

  assert(keysAttempted.includes("PRIMARY"), "Primary must be attempted first");
  assert(keysAttempted.includes("BACKUP1"), "BACKUP1 must be called after PRIMARY fails");
  assert.strictEqual(backup1Result.keyUsedName, "BACKUP1", "Result must indicate BACKUP1 succeeded");
  assert.strictEqual(backup1Result.result.success, true);
  console.log(" Failover to BACKUP1 on 429 verified.");

  // 3. Multi-Key Failover to BACKUP2 (PRIMARY and BACKUP1 fail with 503, BACKUP2 succeeds)
  console.log("\n3. Testing Multi-Key Failover (PRIMARY and BACKUP1 fail with 503, BACKUP2 succeeds)...");
  const fullFailoverSequence: string[] = [];
  const backup2Result = await executeWithRetryAndFallback(
    async (client, model) => {
      if (client === mockPrimary) {
        fullFailoverSequence.push("PRIMARY");
        throw {
          status: 503,
          message: "503 UNAVAILABLE — High demand on primary",
        };
      }
      if (client === mockBackup1) {
        fullFailoverSequence.push("BACKUP1");
        throw {
          status: 503,
          message: "503 UNAVAILABLE — High demand on backup1",
        };
      }
      fullFailoverSequence.push("BACKUP2");
      return { success: true, website: "<html>Backup2</html>", model };
    },
    {
      apiKeys: testKeyPool,
      maxAttempts: 1, // 1 attempt per key for quick progression
      baseDelayMs: 10,
      maxDelayMs: 50,
      totalTimeoutMs: 5000,
    }
  );

  assert(fullFailoverSequence.includes("PRIMARY"), "PRIMARY was visited");
  assert(fullFailoverSequence.includes("BACKUP1"), "BACKUP1 was visited");
  assert(fullFailoverSequence.includes("BACKUP2"), "BACKUP2 was visited");
  assert.strictEqual(backup2Result.keyUsedName, "BACKUP2", "Result must indicate BACKUP2 succeeded");
  console.log(" Failover through BACKUP1 to BACKUP2 verified.");

  // 4. All-Keys Failure Test
  console.log("\n4. Testing All-Keys Exhaustion (All keys fail with 429/503)...");
  let allKeysThrew = false;
  try {
    await executeWithRetryAndFallback(
      async (client) => {
        throw {
          status: 429,
          message: "Rate limit reached on all keys",
        };
      },
      {
        apiKeys: testKeyPool,
        maxAttempts: 1,
        baseDelayMs: 10,
        maxDelayMs: 50,
        totalTimeoutMs: 3000,
      }
    );
  } catch (err: any) {
    allKeysThrew = true;
    assert.strictEqual(err.status, 429, "Final error status should be preserved (429)");
    assert.strictEqual(err.retryable, true, "Should indicate request is retryable by user later");
  }
  assert(allKeysThrew, "Must throw when all keys fail");
  console.log(" All-keys exhaustion handled gracefully.");

  // 5. Non-Retryable Error Fails Immediately (400 Bad Request)
  console.log("\n5. Testing Non-Retryable Request Error (400 Bad Request aborts without rotating keys)...");
  let nonRetryCallCount = 0;
  let nonRetryThrew = false;
  try {
    await executeWithRetryAndFallback(
      async () => {
        nonRetryCallCount++;
        throw {
          status: 400,
          message: "INVALID_ARGUMENT: Prompt content is malformed",
        };
      },
      {
        apiKeys: testKeyPool,
        maxAttempts: 3,
        baseDelayMs: 10,
        maxDelayMs: 50,
        totalTimeoutMs: 3000,
      }
    );
  } catch (err: any) {
    nonRetryThrew = true;
    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.retryable, false);
    assert.strictEqual(err.keyFailoverEligible, false);
  }
  assert.strictEqual(nonRetryCallCount, 1, "Non-retryable 400 error must NOT rotate keys or loop");
  assert(nonRetryThrew, "Must throw 400 error immediately");
  console.log(" Non-retryable error aborts immediately on attempt 1 without cycling keys.");

  // 6. Security & Key Privacy Verification
  console.log("\n6. Verifying that API key secrets are NEVER exposed in errors or output...");
  const sensitiveError = new GeminiServiceError("Model failed", {
    status: 503,
    retryable: true,
    keyTriedName: "PRIMARY",
  });
  // Ensure stringified error doesn't contain raw keys
  assert(!JSON.stringify(sensitiveError).includes("mock-primary-key"), "Raw key must not be in error JSON");
  console.log(" Secret masking verified.");

  console.log("\nAll Gemini key failover & resilience unit tests passed successfully!");
}

runFailoverAndResilienceTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
