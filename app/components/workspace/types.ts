export type GenerationStatus = "idle" | "generating" | "rendering" | "ready" | "error";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: GenerationStatus;
};
