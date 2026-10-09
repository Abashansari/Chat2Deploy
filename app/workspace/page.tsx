"use client";

import { useState, useCallback, useRef } from "react";
import WorkspaceHeader from "../components/workspace/WorkspaceHeader";
import ChatPanel from "../components/workspace/ChatPanel";
import PreviewPanel from "../components/workspace/PreviewPanel";

export type GenerationStatus = "idle" | "generating" | "rendering" | "ready" | "error";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: GenerationStatus;
};

export default function WorkspacePage() {
  const [device, setDevice] = useState<"Desktop" | "Tablet" | "Mobile">("Desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");
  const [projectTitle, setProjectTitle] = useState<string>("Untitled Project");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const requestIdRef = useRef(0);

  const handleGenerate = useCallback(async (prompt: string) => {
    const currentRequestId = ++requestIdRef.current;

    // Add user message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: "user", content: prompt }]);

    // Add assistant status message
    const assistantMsgId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      { id: assistantMsgId, role: "assistant", content: "Analyzing your prompt...", status: "generating" },
    ]);
    setGenerationStatus("generating");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      // Stale request guard
      if (currentRequestId !== requestIdRef.current) return;

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Request failed." }));
        throw new Error(errorData.error || `Server error (${res.status})`);
      }

      const data = await res.json();

      // Stale request guard
      if (currentRequestId !== requestIdRef.current) return;

      setMessages(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(m => m.id === assistantMsgId);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            content: `Generated "${data.title}" — ${data.description}`,
            status: "ready",
          };
        }
        return updated;
      });

      setProjectTitle(data.title || "Generated Website");
      setGenerationStatus("rendering");

      // Small delay to let the UI show the rendering state before iframe loads
      setTimeout(() => {
        if (currentRequestId !== requestIdRef.current) return;
        setGeneratedHtml(data.html);
        setGenerationStatus("ready");
      }, 300);
    } catch (error: unknown) {
      if (currentRequestId !== requestIdRef.current) return;

      const errorMessage = error instanceof Error ? error.message : "Generation failed.";
      setMessages(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(m => m.id === assistantMsgId);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            content: errorMessage,
            status: "error",
          };
        }
        return updated;
      });
      setGenerationStatus("error");
    }
  }, []);

  if (isFullscreen) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <PreviewPanel
          device={device}
          setDevice={setDevice}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
          generatedHtml={generatedHtml}
          generationStatus={generationStatus}
          projectTitle={projectTitle}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <WorkspaceHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane - Chat */}
        <div className="w-full md:w-[400px] lg:w-[450px] border-r border-subtle flex flex-col bg-background shrink-0 transition-all duration-300">
          <ChatPanel
            messages={messages}
            generationStatus={generationStatus}
            onGenerate={handleGenerate}
          />
        </div>

        {/* Right Pane - Preview */}
        <div className="flex-1 flex flex-col bg-surface overflow-hidden relative">
          <PreviewPanel
            device={device}
            setDevice={setDevice}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
            generatedHtml={generatedHtml}
            generationStatus={generationStatus}
            projectTitle={projectTitle}
          />
        </div>
      </div>
    </div>
  );
}
