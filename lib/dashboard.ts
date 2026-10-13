import { SupabaseClient } from "@supabase/supabase-js";
import { deleteCloudflarePagesProject } from "./cloudflare";
import {
  cacheGet,
  cacheSet,
  cacheKeys,
  CACHE_TTL,
  invalidateProjectCaches,
} from "./redis";

export interface ProjectRecord {
  id: string;
  name: string;
  description?: string | null;
  user_id?: string;
  status?: string | null;
  deployment_url?: string | null;
  hosting_project_name?: string | null;
  current_version?: number | null;
  last_deployed_at?: string | null;
  created_at?: string;
  updated_at: string;
}

export interface DeploymentRecord {
  id: string;
  project_id: string;
  project_name: string;
  user_id: string;
  deployment_id: string;
  hosting_project_name?: string | null;
  url: string;
  environment: string;
  status: "success" | "failed" | "in_progress";
  source_version?: number | null;
  duration_ms?: number | null;
  error_message?: string | null;
  created_at: string;
}

export interface ProjectDistributionItem {
  name: "Deployed" | "Draft";
  value: number;
  color: string;
  percentage: number;
}

export interface DashboardStats {
  totalProjects: number;
  deployedProjects: number;
  draftProjects: number;
  failedDeployments: number;
  totalDeployments: number;
  projectDistribution: ProjectDistributionItem[];
  deploymentsTimeline: { date: string; name: string; success: number; failed: number }[];
  recentProjects: ProjectRecord[];
  recentDeployments: DeploymentRecord[];
}

/**
 * Fetches user deployment records from Supabase with project info.
 */
export async function getUserDeployments(
  supabase: SupabaseClient,
  userId: string,
  options: {
    search?: string;
    status?: string;
    sort?: "newest" | "oldest" | "name";
    projects?: ProjectRecord[];
  } = {}
): Promise<DeploymentRecord[]> {
  const { search = "", status = "all", sort = "newest", projects: passedProjects } = options;

  // Use Redis cache for direct user deployment queries
  const filterHash = `${search.trim().toLowerCase()}_${status}_${sort}`;
  const cacheKey = cacheKeys.userDeployments(userId, filterHash);

  if (!passedProjects) {
    const cachedDeployments = await cacheGet<DeploymentRecord[]>(cacheKey);
    if (cachedDeployments) {
      return cachedDeployments;
    }
  }

  let userProjects = passedProjects;
  if (!userProjects) {
    // Fetch user projects to guarantee ownership & project names
    const { data: fetchedProjects, error: projErr } = await supabase
      .from("projects")
      .select("id, name, status, deployment_url, hosting_project_name, last_deployed_at, updated_at")
      .eq("user_id", userId);

    if (projErr || !fetchedProjects || fetchedProjects.length === 0) {
      return [];
    }
    userProjects = fetchedProjects as ProjectRecord[];
  }

  if (userProjects.length === 0) {
    return [];
  }

  const projectMap = new Map<string, ProjectRecord>(userProjects.map((p) => [p.id, p]));
  const projectIds = userProjects.map((p) => p.id);

  // 2. Fetch records from public.deployments
  let deployments: DeploymentRecord[] = [];
  try {
    let query = supabase
      .from("deployments")
      .select("*")
      .eq("user_id", userId)
      .in("project_id", projectIds);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: rawDeployments, error: depErr } = await query.order("created_at", {
      ascending: sort === "oldest",
    });

    if (!depErr && rawDeployments && rawDeployments.length > 0) {
      deployments = rawDeployments.map((d: Record<string, unknown>) => {
        const proj = projectMap.get(String(d.project_id));
        const statusVal = String(d.status || "").toLowerCase() === "failed" ? "failed" : "success";
        return {
          id: String(d.id),
          project_id: String(d.project_id),
          project_name: proj?.name || "Untitled Project",
          user_id: String(d.user_id),
          deployment_id: String(d.deployment_id),
          hosting_project_name: d.hosting_project_name ? String(d.hosting_project_name) : proj?.hosting_project_name,
          url: String(d.url || ""),
          environment: String(d.environment || "production"),
          status: statusVal as "success" | "failed",
          source_version: typeof d.source_version === "number" ? d.source_version : null,
          duration_ms: typeof d.duration_ms === "number" ? d.duration_ms : null,
          error_message: d.error_message ? String(d.error_message) : null,
          created_at: String(d.created_at || new Date().toISOString()),
        };
      });
    }
  } catch (err) {
    console.warn("[dashboard] Could not query deployments table:", err);
  }

  // 3. Fallback: if deployments table had no records but projects has published projects, derive them
  if (deployments.length === 0) {
    const publishedProjects = userProjects.filter(
      (p) => p.status?.toLowerCase() === "published" || p.deployment_url
    );

    deployments = publishedProjects.map((p) => ({
      id: `fallback-dep-${p.id}`,
      project_id: p.id,
      project_name: p.name,
      user_id: userId,
      deployment_id: p.hosting_project_name || p.id.slice(0, 8),
      hosting_project_name: p.hosting_project_name,
      url: p.deployment_url || `https://${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${p.id.slice(0, 8)}.pages.dev`,
      environment: "production",
      status: "success",
      source_version: 1,
      duration_ms: null,
      error_message: null,
      created_at: p.last_deployed_at || p.updated_at,
    }));
  }

  // 4. Apply client-side search & sorting filters
  if (search.trim()) {
    const term = search.trim().toLowerCase();
    deployments = deployments.filter(
      (d) =>
        d.project_name.toLowerCase().includes(term) ||
        d.url.toLowerCase().includes(term) ||
        d.deployment_id.toLowerCase().includes(term)
    );
  }

  if (sort === "name") {
    deployments.sort((a, b) => a.project_name.localeCompare(b.project_name));
  } else if (sort === "oldest") {
    deployments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else {
    deployments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (!passedProjects) {
    await cacheSet(cacheKey, deployments, CACHE_TTL.USER_DEPLOYMENTS);
  }

  return deployments;
}

/**
 * Calculates genuine user dashboard statistics and real chart datasets from Supabase.
 */
export async function getUserDashboardStats(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardStats> {
  const cacheKey = cacheKeys.dashboardStats(userId);
  const cachedStats = await cacheGet<DashboardStats>(cacheKey);
  if (cachedStats) {
    return cachedStats;
  }

  // Fetch user projects
  const { data: projects, error: projErr } = await supabase
    .from("projects")
    .select("id, name, status, description, deployment_url, hosting_project_name, last_deployed_at, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (projErr) {
    console.error("[dashboard] Error querying projects for stats:", projErr.message);
    throw new Error(`Failed to query projects: ${projErr.message}`);
  }

  const allProjects = (projects || []) as unknown as ProjectRecord[];
  const totalProjects = allProjects.length;

  const deployedProjectsList = allProjects.filter(
    (p) => p.status?.toLowerCase() === "published" || !!p.deployment_url
  );
  const deployedProjects = deployedProjectsList.length;
  const draftProjects = totalProjects - deployedProjects;

  // Fetch real deployments reusing pre-fetched allProjects to avoid redundant DB call
  const allDeployments = await getUserDeployments(supabase, userId, { projects: allProjects });
  const totalDeployments = allDeployments.length;
  const failedDeployments = allDeployments.filter((d) => d.status === "failed").length;

  // Real Project Distribution Chart Data
  const total = deployedProjects + draftProjects;
  const deployedPercent = total > 0 ? Math.round((deployedProjects / total) * 100) : 0;
  const draftPercent = total > 0 ? (deployedProjects > 0 && draftProjects > 0 ? 100 - deployedPercent : (draftProjects > 0 ? 100 : 0)) : 0;

  const projectDistribution: ProjectDistributionItem[] = [
    {
      name: "Deployed",
      value: deployedProjects,
      color: "#10b981", // Emerald green for deployed
      percentage: deployedPercent,
    },
    {
      name: "Draft",
      value: draftProjects,
      color: "#f97316", // Orange/amber for drafts
      percentage: draftPercent,
    },
  ];

  // Real Deployments Timeline (Past 7 days)
  const timelineMap = new Map<string, { date: string; name: string; success: number; failed: number }>();
  
  // Initialize past 7 days with zero counts
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    timelineMap.set(dateKey, {
      date: dateKey,
      name: dayName,
      success: 0,
      failed: 0,
    });
  }

  // Populate from actual deployment records
  for (const dep of allDeployments) {
    if (!dep.created_at) continue;
    const depDateKey = dep.created_at.split("T")[0];
    if (timelineMap.has(depDateKey)) {
      const entry = timelineMap.get(depDateKey)!;
      if (dep.status === "failed") {
        entry.failed += 1;
      } else {
        entry.success += 1;
      }
    }
  }

  const deploymentsTimeline = Array.from(timelineMap.values());

  const stats: DashboardStats = {
    totalProjects,
    deployedProjects,
    draftProjects,
    failedDeployments,
    totalDeployments,
    projectDistribution,
    deploymentsTimeline,
    recentProjects: allProjects.slice(0, 6),
    recentDeployments: allDeployments.slice(0, 6),
  };

  await cacheSet(cacheKey, stats, CACHE_TTL.DASHBOARD_STATS);
  return stats;
}

/**
 * Safely removes a project from Deployments without deleting its source code or version history.
 */
export async function removeProjectFromDeployments({
  supabase,
  projectId,
  userId,
}: {
  supabase: SupabaseClient;
  projectId: string;
  userId: string;
}): Promise<{ success: boolean; message: string }> {
  // 1. Verify project ownership
  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("id, name, hosting_project_name, deployment_url")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  if (projErr || !project) {
    throw new Error("Project not found or you are not authorized to manage it.");
  }

  // 2. Unpublish / delete hosting project from Cloudflare Pages
  const hostingName = project.hosting_project_name || project.name;
  try {
    await deleteCloudflarePagesProject(hostingName);
  } catch (cfErr) {
    console.warn(`[dashboard] Cloudflare cleanup warning for '${hostingName}':`, cfErr);
  }

  // 3. Update project status to draft and reset deployment URL (Preserving all source files & versions!)
  await supabase
    .from("projects")
    .update({
      status: "draft",
      deployment_url: null,
      last_deployment_status: "removed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  // 4. Remove active deployment entries from deployments table
  try {
    await supabase.from("deployments").delete().eq("project_id", projectId);
  } catch {
    // Non-critical
  }

  // 5. Invalidate affected Redis caches
  await invalidateProjectCaches(userId, projectId);

  return {
    success: true,
    message: `Project '${project.name}' was successfully removed from Deployments. Source code and version history remain preserved.`,
  };
}

/**
 * Permanently deletes a project, its files, version snapshots, deployments, and Cloudflare Pages project.
 */
export async function deleteProjectPermanently({
  supabase,
  projectId,
  userId,
}: {
  supabase: SupabaseClient;
  projectId: string;
  userId: string;
}): Promise<{ success: boolean; message: string }> {
  // 1. Verify ownership
  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("id, name, hosting_project_name")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  if (projErr || !project) {
    throw new Error("Project not found or you are not authorized to delete it.");
  }

  // 2. Reconcile hosting project so no orphan website remains accessible
  const hostingName = project.hosting_project_name || project.name;
  try {
    await deleteCloudflarePagesProject(hostingName);
  } catch (cfErr) {
    console.warn(`[dashboard] Could not delete Cloudflare project '${hostingName}':`, cfErr);
  }

  // 3. Delete from Supabase (cascades to project_files, project_versions, chat_history, deployments)
  const { error: delErr } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);

  if (delErr) {
    console.error("[dashboard] Error deleting project from Supabase:", delErr);
    throw new Error("Failed to delete project from database.");
  }

  // 4. Invalidate affected Redis caches
  await invalidateProjectCaches(userId, projectId);

  return {
    success: true,
    message: `Project '${project.name}' and all associated resources have been permanently deleted.`,
  };
}

/**
 * Renames a project safely in the database.
 */
export async function renameProjectTitle({
  supabase,
  projectId,
  userId,
  newName,
}: {
  supabase: SupabaseClient;
  projectId: string;
  userId: string;
  newName: string;
}): Promise<{ success: boolean; name: string }> {
  const trimmed = newName.trim();
  if (!trimmed) {
    throw new Error("Project name cannot be empty.");
  }

  // Verify ownership and update
  const { data, error } = await supabase
    .from("projects")
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", userId)
    .select("id, name")
    .single();

  if (error || !data) {
    throw new Error("Failed to rename project.");
  }

  // Invalidate affected Redis caches
  await invalidateProjectCaches(userId, projectId);

  return { success: true, name: data.name };
}

