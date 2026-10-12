import {
  sanitizePagesProjectName,
  validateStaticFiles,
  DeploymentError,
} from "../lib/cloudflare";
import assert from "assert";

console.log("=== Running Cloudflare Pages Deployment Unit Tests ===\n");

function testProjectNameSanitization() {
  console.log("Test: Project Name Sanitization & Formatting...");

  const testCases = [
    { input: "My Awesome Portfolio", expected: "my-awesome-portfolio" },
    { input: "Coffee & Bakery Shop 2026!", expected: "coffee-bakery-shop-2026" },
    { input: "---Leading and Trailing---", expected: "leading-and-trailing" },
    { input: "$$$###", expected: "my-site" },
    { input: "", expected: "my-site" },
  ];

  for (const { input, expected } of testCases) {
    const result = sanitizePagesProjectName(input);
    assert.strictEqual(
      result,
      expected,
      `Expected '${expected}' for input '${input}', got '${result}'`
    );
  }

  // Test with projectId suffix
  const withSuffix = sanitizePagesProjectName("Portfolio", "abc12345xyz");
  assert.ok(
    withSuffix.startsWith("portfolio-abc12345"),
    `Expected suffix attached, got ${withSuffix}`
  );
  assert.ok(withSuffix.length <= 58, "Project name length must be <= 58 chars");

  console.log("✔ Project name sanitization passed.\n");
}

function testStaticFileValidation() {
  console.log("Test: Static Files Validation...");

  // 1. Empty files array
  assert.throws(
    () => validateStaticFiles([]),
    (err: any) => err instanceof DeploymentError && err.code === "NO_FILES",
    "Should reject empty file array"
  );

  // 2. Missing index.html
  assert.throws(
    () =>
      validateStaticFiles([
        { path: "style.css", content: "body { background: #000; }" },
        { path: "script.js", content: "console.log('hi');" },
      ]),
    (err: any) => err instanceof DeploymentError && err.code === "MISSING_INDEX_HTML",
    "Should reject site missing index.html"
  );

  // 3. Path traversal attempt
  assert.throws(
    () =>
      validateStaticFiles([
        { path: "index.html", content: "<h1>Hello</h1>" },
        { path: "../../../etc/passwd", content: "malicious" },
      ]),
    (err: any) => err instanceof DeploymentError && err.code === "PATH_TRAVERSAL",
    "Should reject path traversal attempts"
  );

  // 4. Valid files
  assert.doesNotThrow(() => {
    validateStaticFiles([
      { path: "index.html", content: "<!DOCTYPE html><html><body>Test</body></html>" },
      { path: "css/style.css", content: "body { margin: 0; }" },
      { path: "js/main.js", content: "console.log('ok');" },
    ]);
  }, "Should accept valid static files with index.html");

  console.log("✔ Static file validation passed.\n");
}

function runAll() {
  try {
    testProjectNameSanitization();
    testStaticFileValidation();
    console.log("🎉 All deployment unit tests passed successfully!");
  } catch (err) {
    console.error("❌ Test suite failed:", err);
    process.exit(1);
  }
}

runAll();
