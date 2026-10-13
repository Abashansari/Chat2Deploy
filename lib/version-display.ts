export interface ProjectRecord {
  id: string;
  name: string;
  description?: string | null;
  user_id?: string;
  status?: string | null;
  deployment_url?: string | null;
  hosting_project_name?: string | null;
  current_version?: number | null;
  last_deployed_version?: number | null;
  last_deployment_status?: string | null;
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
 * Resolves the active production version for a project from genuine database records.
 * Uses the latest successful production deployment or projects.last_deployed_version.
 * Returns null if the project has never had a successful deployment or metadata is unavailable.
 */
export function getActiveProductionVersion(
  project: { id?: string; last_deployed_version?: number | null; deployment_url?: string | null; status?: string | null },
  deployments?: DeploymentRecord[]
): number | null {
  // 1. If deployments list is provided, find latest successful deployment for this project
  if (deployments && deployments.length > 0 && project.id) {
    const projectSuccessDeploys = deployments
      .filter((d) => d.project_id === project.id && d.status === "success" && typeof d.source_version === "number" && d.source_version > 0)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    if (projectSuccessDeploys.length > 0) {
      return projectSuccessDeploys[0].source_version!;
    }
  }

  // 2. If projects record has last_deployed_version, use it
  if (typeof project.last_deployed_version === "number" && project.last_deployed_version > 0) {
    return project.last_deployed_version;
  }

  return null;
}

/**
 * Resolves the current working / draft version for a project.
 * Returns null if unavailable (never invents a version).
 */
export function getWorkingDraftVersion(
  project: { current_version?: number | null }
): number | null {
  if (typeof project.current_version === "number" && project.current_version > 0) {
    return project.current_version;
  }
  return null;
}

/**
 * Formats a version number or returns a fallback string.
 */
export function formatVersionDisplay(
  version: number | null | undefined,
  fallback = "Version unavailable"
): string {
  if (typeof version === "number" && version > 0) {
    return `v${version}`;
  }
  return fallback;
}
