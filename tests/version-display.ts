import "dotenv/config";
import assert from "assert";
import {
  getActiveProductionVersion,
  getWorkingDraftVersion,
  formatVersionDisplay,
  type ProjectRecord,
  type DeploymentRecord,
} from "../lib/dashboard";
import {
  createVersionSnapshot,
  getProjectVersionsList,
  resolveProjectWorkingVersion,
} from "../lib/versions";

console.log("=== Running Project & Deployment Version Display Comprehensive Tests ===\n");

function createMockDatabase() {
  const store = {
    projects: [] as any[],
    deployments: [] as any[],
    project_versions: [] as any[],
    generation_history: [] as any[],
    project_files: [] as any[],
  };

  const client = {
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
                      const item = (store as any)[table]?.find((x: any) => x[col] === val && x[col2] === val2);
                      return { data: item || null, error: item ? null : { message: "Not found" } };
                    },
                    order: (orderCol: string, { ascending }: { ascending: boolean }) => ({
                      limit: (n: number) => ({
                        data: ((store as any)[table] || [])
                          .filter((x: any) => x[col] === val && x[col2] === val2)
                          .slice(0, n),
                        error: null,
                      }),
                      then: (resolve: any) => {
                        const items = ((store as any)[table] || [])
                          .filter((x: any) => x[col] === val && x[col2] === val2);
                        items.sort((a: any, b: any) => ascending ? a[orderCol] - b[orderCol] : b[orderCol] - a[orderCol]);
                        return Promise.resolve({ data: items, error: null }).then(resolve);
                      },
                    }),
                  };
                },
                order: (orderCol: string, { ascending }: { ascending: boolean }) => {
                  const items = [...((store as any)[table]?.filter((x: any) => x[col] === val) || [])];
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

  return client;
}

async function runVerificationScenarios() {
  const db = createMockDatabase();
  const userId = "usr-tester-99";
  const projectId = "proj-ac-100";

  // SCENARIO 1: A new draft project displays its current working version
  console.log("Scenario 1: New draft project displays its current working version...");
  const draftProject: ProjectRecord = {
    id: projectId,
    user_id: userId,
    name: "Alpha Startup Website",
    status: "draft",
    current_version: 1,
    last_deployed_version: null,
    updated_at: new Date().toISOString(),
  };
  db.store.projects.push(draftProject);

  const initialWorkingVersion = getWorkingDraftVersion(draftProject);
  const initialProdVersion = getActiveProductionVersion(draftProject, []);
  assert.strictEqual(initialWorkingVersion, 1, "Working version of new draft should be 1");
  assert.strictEqual(initialProdVersion, null, "Production version of undrafted project should be null");
  assert.strictEqual(formatVersionDisplay(initialWorkingVersion), "v1");
  assert.strictEqual(formatVersionDisplay(initialProdVersion), "Version unavailable");
  console.log("✔ Scenario 1 passed: New draft displays working version v1 and prod is unavailable.\n");

  // SCENARIO 2: Editing and saving a draft updates its current version correctly
  console.log("Scenario 2: Editing and saving a draft updates current version correctly...");
  // Simulate first snapshot (v1)
  await createVersionSnapshot({
    supabase: db as any,
    projectId,
    userId,
    changeSummary: "Initial version",
    files: [{ path: "index.html", content: "<h1>Version 1</h1>" }],
  });

  // User edits and saves project -> creates Version 2
  const v2Snapshot = await createVersionSnapshot({
    supabase: db as any,
    projectId,
    userId,
    changeSummary: "Added hero section and call to action",
    files: [
      { path: "index.html", content: "<h1>Version 2 Hero</h1>" },
      { path: "styles.css", content: "h1 { color: teal; }" },
    ],
  });

  assert.strictEqual(v2Snapshot.version_number, 2, "Second snapshot should have version_number 2");
  draftProject.current_version = v2Snapshot.version_number;

  const updatedWorkingVer = getWorkingDraftVersion(draftProject);
  assert.strictEqual(updatedWorkingVer, 2, "Draft working version should be updated to 2");
  assert.strictEqual(formatVersionDisplay(updatedWorkingVer), "v2");
  console.log("✔ Scenario 2 passed: Editing and saving draft updated working version to v2.\n");

  // SCENARIO 3: A deployed project displays its actual production version
  console.log("Scenario 3: Deployed project displays its actual production version...");
  // Simulate successful deployment of version 2
  const deploy1: DeploymentRecord = {
    id: "dep-1",
    project_id: projectId,
    project_name: draftProject.name,
    user_id: userId,
    deployment_id: "cf-pages-001",
    url: "https://alpha-startup.pages.dev",
    environment: "production",
    status: "success",
    source_version: 2,
    duration_ms: 3200,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  };
  db.store.deployments.push(deploy1);
  draftProject.status = "published";
  draftProject.deployment_url = deploy1.url;
  draftProject.last_deployed_version = 2;

  const deployedProdVer = getActiveProductionVersion(draftProject, db.store.deployments);
  assert.strictEqual(deployedProdVer, 2, "Production version should match deployed source_version 2");
  assert.strictEqual(formatVersionDisplay(deployedProdVer), "v2");
  console.log("✔ Scenario 3 passed: Deployed project correctly displays production version v2.\n");

  // SCENARIO 4: Editing a deployed project without deploying changes does not change production version
  console.log("Scenario 4: Editing deployed project without deploying does not change production version...");
  // User modifies site again in workspace -> creates Version 3
  const v3Snapshot = await createVersionSnapshot({
    supabase: db as any,
    projectId,
    userId,
    changeSummary: "Draft redesign for next release",
    files: [
      { path: "index.html", content: "<h1>Version 3 Redesign</h1>" },
      { path: "styles.css", content: "h1 { color: gold; }" },
    ],
  });

  draftProject.current_version = v3Snapshot.version_number;
  assert.strictEqual(draftProject.current_version, 3, "Draft working version is now 3");

  // Check production version vs working version
  const prodVerAfterDraftEdit = getActiveProductionVersion(draftProject, db.store.deployments);
  const workingVerAfterDraftEdit = getWorkingDraftVersion(draftProject);

  assert.strictEqual(prodVerAfterDraftEdit, 2, "Production version must remain 2!");
  assert.strictEqual(workingVerAfterDraftEdit, 3, "Working draft version must be 3!");
  assert.notStrictEqual(prodVerAfterDraftEdit, workingVerAfterDraftEdit, "Production and draft versions must not be confused!");
  console.log("✔ Scenario 4 passed: Draft working version is v3 while production version remains v2.\n");

  // SCENARIO 5: A failed deployment does not replace the active production version
  console.log("Scenario 5: Failed deployment does not replace active production version...");
  // A deployment of version 3 fails
  const failedDeploy: DeploymentRecord = {
    id: "dep-2-failed",
    project_id: projectId,
    project_name: draftProject.name,
    user_id: userId,
    deployment_id: "cf-pages-fail-002",
    url: "https://alpha-startup.pages.dev",
    environment: "production",
    status: "failed",
    source_version: 3,
    error_message: "Wrangler upload timeout",
    duration_ms: 15000,
    created_at: new Date().toISOString(),
  };
  db.store.deployments.push(failedDeploy);

  // The project's last_deployed_version must NOT be updated by a failed run
  const prodVerAfterFailedDeploy = getActiveProductionVersion(draftProject, db.store.deployments);
  assert.strictEqual(prodVerAfterFailedDeploy, 2, "Failed deployment must not replace active production version v2!");
  console.log("✔ Scenario 5 passed: Production version remains v2 after failed deployment attempt.\n");

  // SCENARIO 6: A successful deployment updates the production version to the newly deployed version
  console.log("Scenario 6: Successful deployment updates production version to newly deployed version...");
  // Retry deployment succeeds with version 3
  const deploy3: DeploymentRecord = {
    id: "dep-3-success",
    project_id: projectId,
    project_name: draftProject.name,
    user_id: userId,
    deployment_id: "cf-pages-003",
    url: "https://alpha-startup.pages.dev",
    environment: "production",
    status: "success",
    source_version: 3,
    duration_ms: 2800,
    created_at: new Date(Date.now() + 1000).toISOString(),
  };
  db.store.deployments.push(deploy3);
  draftProject.last_deployed_version = 3;

  const prodVerAfterSuccess = getActiveProductionVersion(draftProject, db.store.deployments);
  assert.strictEqual(prodVerAfterSuccess, 3, "Production version must now be updated to 3!");
  assert.strictEqual(formatVersionDisplay(prodVerAfterSuccess), "v3");
  console.log("✔ Scenario 6 passed: Successful deployment updated production version to v3.\n");

  // SCENARIO 7: Version history remains accurate and accessible
  console.log("Scenario 7: Version history remains accurate and accessible...");
  const versionsList = await getProjectVersionsList({ supabase: db as any, projectId });
  assert.strictEqual(versionsList.length, 3, "There should be exactly 3 versions recorded");
  assert.strictEqual(versionsList[0].version_number, 3, "Top version should be 3");
  assert.strictEqual(versionsList[1].version_number, 2, "Second version should be 2");
  assert.strictEqual(versionsList[2].version_number, 1, "Earliest version should be 1");
  assert.strictEqual(versionsList[0].is_current, true, "Version 3 should be flagged as current");
  console.log("✔ Scenario 7 passed: Linear version history (v3, v2, v1) preserved and accessible.\n");

  // SCENARIO 8: Missing version metadata is handled gracefully
  console.log("Scenario 8: Missing version metadata is handled gracefully...");
  const projectWithNoMetadata: ProjectRecord = {
    id: "proj-empty-meta",
    user_id: userId,
    name: "Legacy Project",
    status: "draft",
    current_version: null,
    last_deployed_version: null,
    updated_at: new Date().toISOString(),
  };

  const emptyWorking = getWorkingDraftVersion(projectWithNoMetadata);
  const emptyProd = getActiveProductionVersion(projectWithNoMetadata, []);
  assert.strictEqual(emptyWorking, null, "Missing current_version returns null");
  assert.strictEqual(emptyProd, null, "Missing last_deployed_version returns null");
  assert.strictEqual(formatVersionDisplay(emptyWorking), "Version unavailable");
  assert.strictEqual(formatVersionDisplay(emptyProd), "Version unavailable");
  assert.strictEqual(formatVersionDisplay(null), "Version unavailable");
  assert.strictEqual(formatVersionDisplay(undefined), "Version unavailable");
  console.log("✔ Scenario 8 passed: Missing metadata gracefully displays 'Version unavailable' without fabricating version numbers.\n");

  console.log("🎉 All 8 Verification Scenarios passed successfully!");
}

runVerificationScenarios().catch((err) => {
  console.error("❌ Scenario test failed:", err);
  process.exit(1);
});
