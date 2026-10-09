"use client";

import { useState, useCallback, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import WorkspaceHeader from "../../components/workspace/WorkspaceHeader";
import ChatPanel from "../../components/workspace/ChatPanel";
import PreviewPanel from "../../components/workspace/PreviewPanel";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "../../components/auth/AuthProvider";
import { Loader2 } from "lucide-react";
import type { ChatMessage, GenerationStatus } from "../../components/workspace/types";

export default function WorkspacePage({ params }: { params: Promise<{ projectId: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const supabase = createClient();

  const [isInitializing, setIsInitializing] = useState(true);
  const [device, setDevice] = useState<"Desktop" | "Tablet" | "Mobile">("Desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");
  const [projectTitle, setProjectTitle] = useState<string>("Loading Project...");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const requestIdRef = useRef(0);

  const loadProjectData = async () => {
    setIsInitializing(true);
    // Fetch project
    const { data: project, error: projError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projError || !project) {
      console.error(projError);
      router.push("/dashboard");
      return;
    }

    setProjectTitle(project.name);

    // Fetch chat history
    const { data: chats } = await supabase
      .from("chat_history")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (chats && chats.length > 0) {
      setMessages(chats.map(c => ({
        id: c.id,
        role: c.role,
        content: c.content,
        status: c.role === "assistant" ? "ready" : undefined
      })));
    }

    // Fetch latest file
    const { data: files } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (files && files.length > 0) {
      setGeneratedHtml(files[0].content);
      setGenerationStatus("ready");
    }

    setIsInitializing(false);
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadProjectData();
  }, [user, isAuthLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = useCallback(async (prompt: string) => {
    const currentRequestId = ++requestIdRef.current;

    // Add user message locally
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: "user", content: prompt }]);

    // Add assistant status message locally
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
        body: JSON.stringify({ prompt, projectId }),
      });

      if (currentRequestId !== requestIdRef.current) return;

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Request failed." }));
        throw new Error(errorData.error || `Server error (${res.status})`);
      }

      const data = await res.json();

      if (currentRequestId !== requestIdRef.current) return;

      const aiResponse = `Generated "${data.title}" — ${data.description}`;

      setMessages(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(m => m.id === assistantMsgId);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            content: aiResponse,
            status: "ready",
          };
        }
        return updated;
      });

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
  }, [projectId]);

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background flex-col gap-4">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
        <p className="text-muted text-sm font-medium">Loading Workspace...</p>
      </div>
    );
  }

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
