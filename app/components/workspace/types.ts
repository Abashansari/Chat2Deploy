export type GenerationStatus = "idle" | "generating" | "rendering" | "ready" | "error";

export type DeploymentStatus = "idle" | "deploying" | "success" | "error";

export interface DeploymentDetails {
  url: string;
  id: string;
  timestamp: string;
  version?: number | null;
}

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: GenerationStatus;
  retryable?: boolean;
  failedPrompt?: string;
};

export interface VersionFile {
  path: string;
  content: string;
  file_type?: string;
}

export interface VersionSummary {
  id: string;
  project_id: string;
  version_number: number;
  change_summary: string;
  file_count: number;
  total_size_bytes: number;
  restored_from_version?: number | null;
  is_rollback?: boolean;
  created_at: string;
  is_current?: boolean;
}

export interface ProjectVersionDetail extends VersionSummary {
  files: VersionFile[];
}
