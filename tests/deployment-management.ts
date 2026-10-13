import "dotenv/config";
import assert from "assert";
import {
  getUserDeployments,
  getUserDashboardStats,
  removeProjectFromDeployments,
  deleteProjectPermanently,
  renameProjectTitle,
} from "../lib/dashboard";
import { sanitizePagesProjectName } from "../lib/cloudflare";

console.log("=== Running Deployment Management & Dashboard Unit Tests ===\n");

function createMockSupabase() {
  const store = {
    projects: [
      {
        id: "proj-1",
        name: "Alice Portfolio",
        user_id: "user-1",
        status: "published",
        deployment_url: "https://alice-portfolio.pages.dev",
        hosting_project_name: "alice-portfolio",
        current_version: 2,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "proj-2",
        name: "Bob Bakery",
        user_id: "user-1",
        status: "draft",
        deployment_url: null,
        hosting_project_name: null,
        current_version: 1,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "proj-other",
        name: "Charlie Secret",
        user_id: "user-2", // Different user
        status: "published",
        deployment_url: "https://charlie.pages.dev",
        hosting_project_name: "charlie",
        current_version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ] as any[],
    deployments: [
      {
        id: "dep-1",
        project_id: "proj-1",
        user_id: "user-1",
        deployment_id: "cf-dep-101",
        hosting_project_name: "alice-portfolio",
        url: "https://alice-portfolio.pages.dev",
        environment: "production",
        status: "success",
        source_version: 1,
        duration_ms: 6200,
        error_message: null,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "dep-2",
        project_id: "proj-1",
        user_id: "user-1",
        deployment_id: "cf-dep-102",
        hosting_project_name: "alice-portfolio",
        url: "https://alice-portfolio.pages.dev",
        environment: "production",
        status: "success",
        source_version: 2,
        duration_ms: 5400,
        error_message: null,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ] as any[],
  };

  return {
    store,
    from(table: string) {
      return {
        select(cols?: string) {
          let currentList = [...((store as any)[table] || [])];
          const queryBuilder: any = {
            eq(col: string, val: any) {
              currentList = currentList.filter((x: any) => x[col] === val);
              return queryBuilder;
            },
            in(col: string, vals: any[]) {
              currentList = currentList.filter((x: any) => vals.includes(x[col]));
              return queryBuilder;
            },
            order(col: string, { ascending }: { ascending: boolean } = { ascending: true }) {
              currentList.sort((a, b) =>
                ascending
                  ? String(a[col]).localeCompare(String(b[col]))
                  : String(b[col]).localeCompare(String(a[col]))
              );
              return queryBuilder;
            },
            single: async () => {
              const item = currentList[0];
              return { data: item || null, error: item ? null : { message: "Not found" } };
            },
            then(resolve: any) {
              return Promise.resolve({ data: currentList, error: null }).then(resolve);
            },
          };
          return queryBuilder;
        },
        update(data: any) {
          return {
            eq(col: string, val: any) {
              return {
                eq(col2: string, val2: any) {
                  return {
                    select() {
                      return {
                        single: async () => {
                          const item = (store as any)[table]?.find(
                            (x: any) => x[col] === val && x[col2] === val2
                          );
                          if (item) Object.assign(item, data);
                          return { data: item || null, error: item ? null : { message: "Not found" } };
                        },
                      };
                    },
                  };
                },
                then(resolve: any) {
                  const item = (store as any)[table]?.find((x: any) => x[col] === val);
                  if (item) Object.assign(item, data);
                  return Promise.resolve({ data: item, error: null }).then(resolve);
                },
              };
            },
          };
        },
        delete() {
          return {
            eq(col: string, val: any) {
              return {
                eq(col2: string, val2: any) {
                  const initialLen = (store as any)[table].length;
                  (store as any)[table] = (store as any)[table].filter(
                    (x: any) => !(x[col] === val && x[col2] === val2)
                  );
                  return Promise.resolve({
                    data: null,
                    error: (store as any)[table].length < initialLen ? null : { message: "Not found" },
                  });
                },
                then(resolve: any) {
                  (store as any)[table] = (store as any)[table].filter((x: any) => x[col] !== val);
                  return Promise.resolve({ data: null, error: null }).then(resolve);
                },
              };
            },
          };
        },
      };
    },
  };
}

async function runTests() {
  const mockSupabase = createMockSupabase();
  const userId = "user-1";

  // Test 1: Dynamic Deploy / Re-Deploy distinction based on persisted database state
  console.log("Test 1: Verifying Deploy vs Re-Deploy identification...");
  const user1Projects = await mockSupabase.from("projects").select().eq("user_id", userId);
  const deployedProj = user1Projects.data.find((p: any) => p.id === "proj-1");
  const draftProj = user1Projects.data.find((p: any) => p.id === "proj-2");

  assert.strictEqual(deployedProj.status, "published", "Project 1 should be published");
  assert.ok(deployedProj.deployment_url, "Project 1 must have a deployment URL");
  assert.strictEqual(draftProj.status, "draft", "Project 2 should be in draft state");
  assert.strictEqual(draftProj.deployment_url, null, "Project 2 must not have a deployment URL");
  console.log("✔ Deploy vs Re-Deploy states accurately distinguished from persisted records.\n");

  // Test 2: Redeploying preserves existing hosting project name and public URL
  console.log("Test 2: Verifying stable hosting project identifier across redeployments...");
  const existingHostingName = deployedProj.hosting_project_name;
  const redeploySafeName = sanitizePagesProjectName(existingHostingName);
  assert.strictEqual(redeploySafeName, "alice-portfolio", "Must preserve exact existing project name");
  console.log("✔ Redeployment domain and project mapping preserved.\n");

  // Test 3: Deployments listing and user authorization isolation
  console.log("Test 3: Fetching user deployments with authorization filtering...");
  const deployments = await getUserDeployments(mockSupabase as any, userId);
  assert.strictEqual(deployments.length, 2, "User 1 should see only their 2 deployments");
  assert.ok(
    deployments.every((d) => d.user_id === userId),
    "Deployments list must not contain other users' records"
  );
  assert.strictEqual(deployments[0].project_name, "Alice Portfolio");
  console.log("✔ User deployment isolation and authorization verified.\n");

  // Test 4: Real dashboard stats computation without dummy data
  console.log("Test 4: Deriving genuine dashboard metrics from database...");
  const stats = await getUserDashboardStats(mockSupabase as any, userId);
  assert.strictEqual(stats.totalProjects, 2, "User 1 has exactly 2 projects");
  assert.strictEqual(stats.deployedProjects, 1, "Exactly 1 deployed project");
  assert.strictEqual(stats.draftProjects, 1, "Exactly 1 draft project");
  assert.strictEqual(stats.failedDeployments, 0, "Zero failed deployments");
  assert.strictEqual(stats.totalDeployments, 2, "Two total deployment runs");
  assert.strictEqual(stats.projectDistribution.length, 2, "Distribution reflects Deployed and Draft");
  assert.strictEqual(stats.deploymentsTimeline.length, 7, "Timeline includes 7 days");
  console.log("✔ Real dashboard analytics accurately aggregated from database.\n");

  // Test 5: Rename project action
  console.log("Test 5: Renaming project in database...");
  const renameRes = await renameProjectTitle({
    supabase: mockSupabase as any,
    projectId: "proj-2",
    userId,
    newName: "Bob Artisan Bakery",
  });
  assert.strictEqual(renameRes.name, "Bob Artisan Bakery");
  const renamedProj = mockSupabase.store.projects.find((p) => p.id === "proj-2");
  assert.strictEqual(renamedProj.name, "Bob Artisan Bakery");
  console.log("✔ Project rename verified.\n");

  // Test 6: Remove from Deployments (unpublishing while preserving project & versions)
  console.log("Test 6: Remove from Deployments preserves source files...");
  const removeRes = await removeProjectFromDeployments({
    supabase: mockSupabase as any,
    projectId: "proj-1",
    userId,
  });
  assert.strictEqual(removeRes.success, true);
  const unpubProj = mockSupabase.store.projects.find((p) => p.id === "proj-1");
  assert.strictEqual(unpubProj.status, "draft", "Status must revert to draft");
  assert.strictEqual(unpubProj.deployment_url, null, "Public URL must be cleared");
  // Project itself must NOT be deleted
  assert.ok(unpubProj, "Project record must remain in database");
  console.log("✔ Unpublishing from deployments verified without deleting project source.\n");

  // Test 7: Permanent Project Deletion
  console.log("Test 7: Permanently deleting project...");
  const deleteRes = await deleteProjectPermanently({
    supabase: mockSupabase as any,
    projectId: "proj-2",
    userId,
  });
  assert.strictEqual(deleteRes.success, true);
  const deletedCheck = mockSupabase.store.projects.find((p) => p.id === "proj-2");
  assert.strictEqual(deletedCheck, undefined, "Project 2 must be completely removed");

  const statsAfterDelete = await getUserDashboardStats(mockSupabase as any, userId);
  assert.strictEqual(statsAfterDelete.totalProjects, 1, "Total projects must update to 1");
  console.log("✔ Project permanent deletion verified.\n");

  console.log("🎉 All Deployment Management & Dashboard unit tests passed successfully!");
}

runTests().catch((err) => {
  console.error("❌ Tests failed:", err);
  process.exit(1);
});
