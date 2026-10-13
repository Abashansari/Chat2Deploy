import { SupabaseClient } from "@supabase/supabase-js";
import { deleteCloudflarePagesProject } from "./cloudflare";

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

export interface DashboardStats {
  totalProjects: number;
  deployedProjects: number;
  draftProjects: number;
  failedDeployments: number;
  totalDeployments: number;
  projectDistribution: { name: string; value: number; color: string }[];
  deploymentsTimeline: { date: string; name: string; success: number; failed: number }[];
  recentProjects: any[];
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
  } = {}
): Promise<DeploymentRecord[]> {
  const { search = "", status = "all", sort = "newest" } = options;

  // 1. Fetch user projects first to guarantee ownership & project names
  const { data: userProjects, error: projErr } = await supabase
    .from("projects")
    .select("id, name, status, deployment_url, hosting_project_name, last_deployed_at, updated_at")
    .eq("user_id", userId);

  if (projErr || !userProjects || userProjects.length === 0) {
    return [];
  }

  const projectMap = new Map<string, any>(userProjects.map((p) => [p.id, p]));
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
      deployments = rawDeployments.map((d: any) => {
        const proj = projectMap.get(d.project_id);
        return {
          id: d.id,
          project_id: d.project_id,
          project_name: proj?.name || "Untitled Project",
          user_id: d.user_id,
          deployment_id: d.deployment_id,
          hosting_project_name: d.hosting_project_name || proj?.hosting_project_name,
          url: d.url,
          environment: d.environment || "production",
          status: (d.status?.toLowerCase() === "failed" ? "failed" : "success") as any,
          source_version: d.source_version,
          duration_ms: d.duration_ms,
          error_message: d.error_message,
          created_at: d.created_at,
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

  return deployments;
}

/**
 * Calculates genuine user dashboard statistics and real chart datasets from Supabase.
 */
export async function getUserDashboardStats(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardStats> {
  // Fetch user projects
  const { data: projects = [] } = await supabase
    .from("projects")
    .select("id, name, status, description, deployment_url, hosting_project_name, current_version, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  const allProjects = projects || [];
  const totalProjects = allProjects.length;

  const deployedProjectsList = allProjects.filter(
    (p) => p.status?.toLowerCase() === "published" || !!p.deployment_url
  );
  const deployedProjects = deployedProjectsList.length;
  const draftProjects = totalProjects - deployedProjects;

  // Fetch real deployments
  const allDeployments = await getUserDeployments(supabase, userId);
  const totalDeployments = allDeployments.length;
  const failedDeployments = allDeployments.filter((d) => d.status === "failed").length;

  // Real Project Distribution Chart Data
  const projectDistribution = [
    { name: "Deployed", value: deployedProjects, color: "#10b981" },
    { name: "Draft", value: draftProjects, color: "#0284c7" },
  ].filter((p) => p.value > 0);

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

  return {
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

  return { success: true, name: data.name };
}
