import "dotenv/config";
import assert from "assert";
import {
  areFilesIdentical,
  calculateTotalBytes,
  createVersionSnapshot,
  getProjectVersionsList,
  getProjectVersionByNumber,
  restoreProjectVersion,
  VersionFile,
} from "../lib/versions";

console.log("=== Running Project Version Control and Rollback Unit Tests ===\n");

// Mock Supabase client to test versioning algorithms deterministically
function createMockSupabase() {
  const store = {
    project_versions: [] as any[],
    generation_history: [] as any[],
    project_files: [] as any[],
    projects: [
      { id: "proj-123", user_id: "user-abc", name: "Demo Site", current_version: 1 },
    ],
  };

  return {
    store,
    from(table: string) {
      return {
        select(cols?: string) {
          return {
            eq(col: string, val: any) {
              return {
                eq(col2: string, val2: any) {
                  return {
                    single: async () => {
                      const item = (store as any)[table]?.find(
                        (x: any) => x[col] === val && x[col2] === val2
                      );
                      return { data: item || null, error: item ? null : { message: "Not found" } };
                    },
                    order: (orderCol: string, { ascending }: { ascending: boolean }) => ({
                      limit: (n: number) => ({
                        data: (store as any)[table]
                          ?.filter((x: any) => x[col] === val && x[col2] === val2)
                          .slice(0, n),
                        error: null,
                      }),
                    }),
                  };
                },
                order: (orderCol: string, { ascending }: { ascending: boolean }) => {
                  let items = [...((store as any)[table]?.filter((x: any) => x[col] === val) || [])];
                  items.sort((a, b) =>
                    ascending ? a[orderCol] - b[orderCol] : b[orderCol] - a[orderCol]
                  );
                  return Promise.resolve({ data: items, error: null });
                },
                single: async () => {
                  const item = (store as any)[table]?.find((x: any) => x[col] === val);
                  return { data: item || null, error: item ? null : { message: "Not found" } };
                },
                then: (resolve: any) => {
                  const items = (store as any)[table]?.filter((x: any) => x[col] === val) || [];
                  return Promise.resolve({ data: items, error: null }).then(resolve);
                },
              };
            },
          };
        },
        insert(data: any) {
          const record = { id: `id-${Date.now()}-${Math.random()}`, created_at: new Date().toISOString(), ...data };
          (store as any)[table].push(record);
          return {
            select() {
              return {
                single: async () => ({ data: record, error: null }),
              };
            },
          };
        },
        upsert(data: any, opts?: any) {
          const list = (store as any)[table];
          const idx = list.findIndex(
            (x: any) => x.project_id === data.project_id && x.file_path === data.file_path
          );
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...data };
          } else {
            list.push({ id: `file-${Date.now()}-${Math.random()}`, ...data });
          }
          return Promise.resolve({ data, error: null });
        },
        delete() {
          return {
            eq(col: string, val: any) {
              return {
                in(col2: string, vals: any[]) {
                  store.project_files = store.project_files.filter(
                    (f) => !(f[col] === val && vals.includes(f[col2]))
                  );
                  return Promise.resolve({ error: null });
                },
              };
            },
          };
        },
        update(data: any) {
          return {
            eq(col: string, val: any) {
              const item = (store as any)[table]?.find((x: any) => x[col] === val);
              if (item) Object.assign(item, data);
              return Promise.resolve({ data: item, error: null });
            },
          };
        },
      };
    },
  };
}

async function runAllTests() {
  const mockSupabase = createMockSupabase();
  const projectId = "proj-123";
  const userId = "user-abc";

  // Test 1: File comparison and byte calculations
  console.log("Test 1: File identity comparison and byte counting...");
  const filesA: VersionFile[] = [
    { path: "index.html", content: "<h1>Hello World</h1>" },
    { path: "styles.css", content: "body { margin: 0; }" },
  ];
  const filesB: VersionFile[] = [
    { path: "index.html", content: "<h1>Hello World</h1>" },
    { path: "styles.css", content: "body { margin: 0; }" },
  ];
  const filesC: VersionFile[] = [
    { path: "index.html", content: "<h1>Hello Mars</h1>" },
    { path: "styles.css", content: "body { margin: 0; }" },
  ];

  assert.strictEqual(areFilesIdentical(filesA, filesB), true, "Identical files must return true");
  assert.strictEqual(areFilesIdentical(filesA, filesC), false, "Different content must return false");
  assert.ok(calculateTotalBytes(filesA) > 0, "Byte count must be greater than zero");
  console.log("✔ File identity and byte counting verified.\n");

  // Test 2: Acceptance Criterion 1 - Initial Generation creates Version 1
  console.log("Test 2: Acceptance Criterion 1 - Website Generation creates Version 1...");
  // Populate initial working files
  for (const f of filesA) {
    await mockSupabase.from("project_files").upsert({
      project_id: projectId,
      file_path: f.path,
      content: f.content,
      file_type: "html",
    });
  }

  const v1 = await createVersionSnapshot({
    supabase: mockSupabase as any,
    projectId,
    userId,
    changeSummary: 'Initial generation: "Modern Portfolio"',
    files: filesA,
  });

  assert.strictEqual(v1.version_number, 1, "Initial generation must be Version 1");
  assert.strictEqual(v1.file_count, 2, "Version 1 must contain 2 files");
  assert.strictEqual(v1.is_rollback, false, "Initial version is not a rollback");

  const versionsAfterV1 = await getProjectVersionsList({
    supabase: mockSupabase as any,
    projectId,
    userId,
  });
  assert.strictEqual(versionsAfterV1.length, 1);
  assert.strictEqual(versionsAfterV1[0].version_number, 1);
  assert.strictEqual(versionsAfterV1[0].is_current, true);
  console.log("✔ Version 1 generation verified.\n");

  // Test 3: Acceptance Criterion 2 - Website Modification creates Version 2
  console.log("Test 3: Acceptance Criterion 2 - Website Modification creates Version 2...");
  const filesModV2: VersionFile[] = [
    { path: "index.html", content: "<h1>Hello Universe (Modified)</h1>" },
    { path: "styles.css", content: "body { background: #111; color: #fff; }" },
    { path: "app.js", content: "console.log('v2 running');" },
  ];

  // Update working project_files
  for (const f of filesModV2) {
    await mockSupabase.from("project_files").upsert({
      project_id: projectId,
      file_path: f.path,
      content: f.content,
      file_type: "txt",
    });
  }

  const v2 = await createVersionSnapshot({
    supabase: mockSupabase as any,
    projectId,
    userId,
    changeSummary: 'Modified: "Update theme to dark and add script"',
    files: filesModV2,
  });

  assert.strictEqual(v2.version_number, 2, "Second update must be Version 2");
  assert.strictEqual(v2.file_count, 3, "Version 2 must have 3 files");

  const versionsAfterV2 = await getProjectVersionsList({
    supabase: mockSupabase as any,
    projectId,
    userId,
  });
  assert.strictEqual(versionsAfterV2.length, 2, "Must retain both Version 1 and Version 2");
  assert.strictEqual(versionsAfterV2[0].version_number, 2, "Newest version must be first");
  assert.strictEqual(versionsAfterV2[0].is_current, true);
  assert.strictEqual(versionsAfterV2[1].version_number, 1);
  console.log("✔ Version 2 modification verified.\n");

  // Test 4: Acceptance Criterion 3 - Subsequent changes retain all versions
  console.log("Test 4: Acceptance Criterion 3 - Additional modification creates Version 3...");
  const filesModV3: VersionFile[] = [
    { path: "index.html", content: "<h1>Version 3 Special Edition</h1>" },
    { path: "styles.css", content: "body { background: #222; }" },
  ];

  // Update working project_files to match Version 3
  mockSupabase.store.project_files = filesModV3.map((f) => ({
    project_id: projectId,
    file_path: f.path,
    content: f.content,
    file_type: "txt",
  }));

  const v3 = await createVersionSnapshot({
    supabase: mockSupabase as any,
    projectId,
    userId,
    changeSummary: 'Modified: "Version 3 special update"',
    files: filesModV3,
  });

  assert.strictEqual(v3.version_number, 3, "Third update must be Version 3");

  const versionsAfterV3 = await getProjectVersionsList({
    supabase: mockSupabase as any,
    projectId,
    userId,
  });
  assert.strictEqual(versionsAfterV3.length, 3, "Must retain Version 1, 2, and 3");
  console.log("✔ Multiple versions retained verified.\n");

  // Test 5: Acceptance Criterion 4 & 5 - Restore Version 1
  // - Creates new rollback Version 4
  // - Restores Version 1 files
  // - Retains Version 2 and 3 without deleting them
  console.log("Test 5: Acceptance Criteria 4 & 5 - One-Click Rollback to Version 1...");
  const rollbackResult = await restoreProjectVersion({
    supabase: mockSupabase as any,
    projectId,
    userId,
    versionNumber: 1,
  });

  assert.strictEqual(rollbackResult.success, true, "Rollback must succeed");
  assert.strictEqual(rollbackResult.restoredVersion.version_number, 1);
  assert.strictEqual(rollbackResult.newRollbackVersion.version_number, 4, "Rollback creates Version 4");
  assert.strictEqual(rollbackResult.newRollbackVersion.is_rollback, true);
  assert.strictEqual(rollbackResult.newRollbackVersion.restored_from_version, 1);

  // Check working files in project_files
  const restoredFiles = mockSupabase.store.project_files.filter((f) => f.project_id === projectId);
  assert.strictEqual(restoredFiles.length, 2, "Working files must match Version 1 file count (2)");
  const indexFile = restoredFiles.find((f) => f.file_path === "index.html");
  assert.ok(indexFile && indexFile.content.includes("Hello World"), "Preview files must reflect Version 1 content");

  // Check that all versions (1, 2, 3, 4) exist in history
  const allVersions = await getProjectVersionsList({
    supabase: mockSupabase as any,
    projectId,
    userId,
  });
  assert.strictEqual(allVersions.length, 4, "History must contain all 4 versions");
  const versionNumbers = allVersions.map((v) => v.version_number);
  assert.deepStrictEqual(versionNumbers, [4, 3, 2, 1], "All versions must be preserved in descending order");
  console.log("✔ Rollback to Version 1 created Version 4 and preserved versions 2 & 3.\n");

  // Test 6: Rollback again to Version 2 without losing anything
  console.log("Test 6: Rollback again to Version 2 creates Version 5...");
  const secondRollback = await restoreProjectVersion({
    supabase: mockSupabase as any,
    projectId,
    userId,
    versionNumber: 2,
  });

  assert.strictEqual(secondRollback.newRollbackVersion.version_number, 5);
  const versionsAfterSecondRollback = await getProjectVersionsList({
    supabase: mockSupabase as any,
    projectId,
    userId,
  });
  assert.strictEqual(versionsAfterSecondRollback.length, 5, "History now contains 5 versions");
  assert.deepStrictEqual(
    versionsAfterSecondRollback.map((v) => v.version_number),
    [5, 4, 3, 2, 1]
  );
  console.log("✔ Second rollback preserved full linear history.\n");

  // Test 7: Duplicate snapshot prevention
  console.log("Test 7: Preventing duplicate snapshot for identical files...");
  const dup = await createVersionSnapshot({
    supabase: mockSupabase as any,
    projectId,
    userId,
    changeSummary: "Duplicate attempt",
    files: filesModV2, // Same as currently restored Version 5
  });
  assert.strictEqual(dup.version_number, 5, "Should return existing version when files are identical");
  console.log("✔ Duplicate snapshot prevention verified.\n");

  // Test 8: Validation errors
  console.log("Test 8: Error handling on invalid rollback requests...");
  await assert.rejects(
    async () => {
      await restoreProjectVersion({
        supabase: mockSupabase as any,
        projectId,
        userId,
        versionNumber: 9999, // Non-existent
      });
    },
    /does not exist/,
    "Should reject non-existent version rollback"
  );

  await assert.rejects(
    async () => {
      await createVersionSnapshot({
        supabase: mockSupabase as any,
        projectId,
        userId,
        changeSummary: "Empty files",
        files: [],
      });
    },
    /empty files/,
    "Should reject snapshot with empty files"
  );
  console.log("✔ Error handling and validation verified.\n");

  console.log("🎉 All Version Control & Rollback System unit tests passed successfully!");
}

runAllTests().catch((err) => {
  console.error("❌ Tests failed:", err);
  process.exit(1);
});
