export type GenerationStatus = "idle" | "generating" | "rendering" | "ready" | "error";

export type DeploymentStatus = "idle" | "deploying" | "success" | "error";

export interface DeploymentDetails {
  url: string;
  id: string;
  timestamp: string;
}

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: GenerationStatus;
  retryable?: boolean;
  failedPrompt?: string;
};
