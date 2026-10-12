import "dotenv/config";
import assert from "assert";
import {
  createVersionSnapshot,
  getProjectVersionsList,
  getProjectVersionByNumber,
  restoreProjectVersion,
} from "../lib/versions";

console.log("=== Running Version Control End-to-End Resilience & Fallback Tests ===\n");

// Mock Supabase simulating a database where public.project_versions has NOT been created yet
// (returns code PGRST205, forcing fallback storage to public.generation_history)
function createFallbackSupabase() {
  const store = {
    generation_history: [] as any[],
    project_files: [] as any[],
    projects: [
      { id: "proj-fallback-1", user_id: "user-fallback", name: "Fallback Project", current_version: 1 },
    ],
  };

  return {
    store,
    from(table: string) {
      if (table === "project_versions") {
        return {
          select() {
            return {
              eq() {
                return {
                  order() {
                    // Simulates PostgREST table not found
                    return Promise.resolve({
                      data: null,
                      error: { code: "PGRST205", message: "Could not find table 'public.project_versions'" },
                    });
                  },
                  single() {
                    return Promise.resolve({
                      data: null,
                      error: { code: "PGRST205", message: "Could not find table 'public.project_versions'" },
                    });
                  },
                };
              },
            };
          },
          insert() {
            return {
              select() {
                return {
                  single: async () => ({
                    data: null,
                    error: { code: "PGRST205", message: "Could not find table 'public.project_versions'" },
                  }),
                };
              },
            };
          },
        };
      }

      return {
        select(cols?: string) {
          return {
            eq(col: string, val: any) {
              return {
                eq(col2: string, val2: any) {
                  return {
                    order: (orderCol: string, { ascending }: { ascending: boolean }) => {
                      const items = store.generation_history.filter(
                        (x: any) => x[col] === val && x[col2] === val2
                      );
                      items.sort((a, b) =>
                        ascending ? a[orderCol] - b[orderCol] : b[orderCol] - a[orderCol]
                      );
                      return Promise.resolve({ data: items, error: null });
                    },
                  };
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
          const record = { id: `gh-${Date.now()}-${Math.random()}`, created_at: new Date().toISOString(), ...data };
          store.generation_history.push(record);
          return Promise.resolve({ data: record, error: null });
        },
        upsert(data: any) {
          const list = store.project_files;
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

async function runResilienceTests() {
  const fallbackSupabase = createFallbackSupabase();
  const projectId = "proj-fallback-1";
  const userId = "user-fallback";

  // Test 1: Snapshot creation works seamlessly in fallback mode
  console.log("Test 1: Version creation under table migration pending (fallback mode)...");
  const initialFiles = [
    { path: "index.html", content: "<h1>Fallback V1</h1>" },
    { path: "styles.css", content: "body { color: blue; }" },
  ];

  fallbackSupabase.store.project_files = initialFiles.map((f) => ({
    project_id: projectId,
    file_path: f.path,
    content: f.content,
  }));

  const v1 = await createVersionSnapshot({
    supabase: fallbackSupabase as any,
    projectId,
    userId,
    changeSummary: 'Fallback initial generation',
    files: initialFiles,
  });

  assert.strictEqual(v1.version_number, 1, "Should create Version 1 in fallback");
  assert.strictEqual(fallbackSupabase.store.generation_history.length, 1);
  console.log("✔ Fallback Version 1 created.\n");

  // Test 2: Version listing in fallback mode
  console.log("Test 2: Reading version list under fallback mode...");
  const versions = await getProjectVersionsList({
    supabase: fallbackSupabase as any,
    projectId,
    userId,
  });
  assert.strictEqual(versions.length, 1);
  assert.strictEqual(versions[0].version_number, 1);
  assert.strictEqual(versions[0].is_current, true);
  console.log("✔ Fallback Version list retrieved successfully.\n");

  // Test 3: Modification creates Version 2 in fallback mode
  console.log("Test 3: Creating Version 2 in fallback mode...");
  const v2Files = [
    { path: "index.html", content: "<h1>Fallback V2 Modified</h1>" },
    { path: "styles.css", content: "body { color: green; }" },
    { path: "script.js", content: "console.log('v2');" },
  ];

  fallbackSupabase.store.project_files = v2Files.map((f) => ({
    project_id: projectId,
    file_path: f.path,
    content: f.content,
  }));

  const v2 = await createVersionSnapshot({
    supabase: fallbackSupabase as any,
    projectId,
    userId,
    changeSummary: 'Fallback modification V2',
    files: v2Files,
  });

  assert.strictEqual(v2.version_number, 2);
  const versionsAfterV2 = await getProjectVersionsList({
    supabase: fallbackSupabase as any,
    projectId,
    userId,
  });
  assert.strictEqual(versionsAfterV2.length, 2);
  assert.strictEqual(versionsAfterV2[0].version_number, 2);
  console.log("✔ Fallback Version 2 created and indexed.\n");

  // Test 4: Rollback to Version 1 under fallback mode
  console.log("Test 4: One-Click Rollback under fallback mode...");
  const rollbackRes = await restoreProjectVersion({
    supabase: fallbackSupabase as any,
    projectId,
    userId,
    versionNumber: 1,
  });

  assert.strictEqual(rollbackRes.success, true);
  assert.strictEqual(rollbackRes.newRollbackVersion.version_number, 3);
  assert.strictEqual(rollbackRes.newRollbackVersion.is_rollback, true);

  // Check working files in project_files
  assert.strictEqual(fallbackSupabase.store.project_files.length, 2);
  const idxFile = fallbackSupabase.store.project_files.find((f) => f.file_path === "index.html");
  assert.strictEqual(idxFile.content, "<h1>Fallback V1</h1>");

  const versionsAfterRollback = await getProjectVersionsList({
    supabase: fallbackSupabase as any,
    projectId,
    userId,
  });
  assert.strictEqual(versionsAfterRollback.length, 3);
  assert.deepStrictEqual(
    versionsAfterRollback.map((v) => v.version_number),
    [3, 2, 1]
  );
  console.log("✔ Fallback Rollback created Version 3 and restored files correctly.\n");

  console.log("🎉 All Fallback & Resilience tests passed successfully!");
}

runResilienceTests().catch((err) => {
  console.error("❌ Tests failed:", err);
  process.exit(1);
});
