"use client";

import { useState, useCallback, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import WorkspaceHeader from "../../components/workspace/WorkspaceHeader";
import ChatPanel from "../../components/workspace/ChatPanel";
import PreviewPanel from "../../components/workspace/PreviewPanel";
import VersionHistoryPanel from "../../components/workspace/VersionHistoryPanel";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "../../components/auth/AuthProvider";
import { Loader2 } from "lucide-react";
import type { ChatMessage, GenerationStatus, DeploymentStatus, DeploymentDetails } from "../../components/workspace/types";

export default function WorkspacePage({ params }: { params: Promise<{ projectId: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const supabase = createClient();

  const [isInitializing, setIsInitializing] = useState(true);
  const [device, setDevice] = useState<"Desktop" | "Tablet" | "Mobile">("Desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasFiles, setHasFiles] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>("idle");
  const [deploymentDetails, setDeploymentDetails] = useState<DeploymentDetails | null>(null);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>("Loading Project...");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentVersionNumber, setCurrentVersionNumber] = useState<number>(1);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const requestIdRef = useRef(0);

  const loadedProjectIdRef = useRef<string | null>(null);

  const loadProjectData = useCallback(async () => {
    setIsInitializing(true);

    try {
      // Parallelize all initial data queries
      const [projResult, chatsResult, filesResult, verResult, deployResult] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase.from("chat_history").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
        supabase.from("project_files").select("id").eq("project_id", projectId).limit(1),
        fetch(`/api/versions?projectId=${encodeURIComponent(projectId)}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        supabase.from("deployments").select("deployment_id, url, created_at, status, source_version").eq("project_id", projectId).eq("status", "success").order("created_at", { ascending: false }).limit(1),
      ]);

      const project = projResult.data;
      if (projResult.error || !project) {
        console.error("[WorkspacePage] Project query error:", projResult.error);
        router.push("/dashboard");
        return;
      }

      setProjectTitle(project.name);

      // Populate chats
      const chats = chatsResult.data;
      if (chats && chats.length > 0) {
        setMessages(
          chats.map((c: Record<string, unknown>) => ({
            id: String(c.id),
            role: c.role as "user" | "assistant",
            content: String(c.content || ""),
            status: c.role === "assistant" ? "ready" : undefined,
          }))
        );
      }

      // Check if project has files
      const files = filesResult.data;
      if (files && files.length > 0) {
        setHasFiles(true);
        setGenerationStatus("ready");
      }

      // Version history
      if (verResult?.versions && verResult.versions.length > 0) {
        setCurrentVersionNumber(verResult.versions[0].version_number);
      }

      // Persisted deployment details
      const deployRecords = deployResult.data;
      let existingDeployDetails: DeploymentDetails | null = null;

      if (deployRecords && deployRecords.length > 0) {
        existingDeployDetails = {
          url: deployRecords[0].url,
          id: deployRecords[0].deployment_id,
          timestamp: deployRecords[0].created_at,
          version: typeof deployRecords[0].source_version === "number" ? deployRecords[0].source_version : (typeof project.last_deployed_version === "number" ? project.last_deployed_version : null),
        };
      } else if (project.deployment_url || project.status === "published") {
        existingDeployDetails = {
          url:
            project.deployment_url ||
            `https://${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${project.id.slice(0, 8)}.pages.dev`,
          id: project.hosting_project_name || project.id.slice(0, 8),
          timestamp: project.last_deployed_at || project.updated_at,
          version: typeof project.last_deployed_version === "number" ? project.last_deployed_version : null,
        };
      }

      if (existingDeployDetails) {
        setDeploymentDetails(existingDeployDetails);
      }
    } catch (err) {
      console.error("[WorkspacePage] Error loading project data:", err);
    } finally {
      setIsInitializing(false);
    }
  }, [projectId, supabase, router]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    if (loadedProjectIdRef.current === projectId) {
      return;
    }
    loadedProjectIdRef.current = projectId;
    loadProjectData();
  }, [user, isAuthLoading, projectId, loadProjectData, router]);


  const handleVersionRestored = useCallback((newVersionNumber: number, restoredFromNumber: number) => {
    setCurrentVersionNumber(newVersionNumber);
    setHasFiles(true);
    setRefreshKey(k => k + 1);
    setHistoryRefreshTrigger(t => t + 1);
    setGenerationStatus("ready");

    setMessages(prev => [
      ...prev,
      {
        id: `restore-${Date.now()}`,
        role: "assistant",
        content: `Restored project to Version ${restoredFromNumber}. Created Version ${newVersionNumber}.`,
        status: "ready",
      },
    ]);
  }, []);

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

      if (data.version) {
        setCurrentVersionNumber(data.version);
        setHistoryRefreshTrigger(t => t + 1);
      }

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
        setHasFiles(true);
        setRefreshKey(k => k + 1);
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
            retryable: true,
            failedPrompt: prompt,
          };
        }
        return updated;
      });
      setGenerationStatus("error");
    }
  }, [projectId]);

  const handleDeploy = useCallback(async () => {
    if (!projectId || !hasFiles) return;

    setDeploymentStatus("deploying");
    setDeploymentError(null);

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Deployment failed.");
      }

      setDeploymentDetails({
        url: data.deploymentUrl,
        id: data.deploymentId,
        timestamp: data.timestamp,
        version: typeof data.sourceVersion === "number" ? data.sourceVersion : currentVersionNumber,
      });
      setDeploymentStatus("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deployment failed.";
      setDeploymentError(msg);
      setDeploymentStatus("error");
    }
  }, [projectId, hasFiles]);

  const handleDismissDeployment = useCallback(() => {
    setDeploymentStatus("idle");
    setDeploymentError(null);
  }, []);

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
          projectId={projectId}
          refreshKey={refreshKey}
          hasFiles={hasFiles}
          generationStatus={generationStatus}
          projectTitle={projectTitle}
          currentVersionNumber={currentVersionNumber}
          deploymentStatus={deploymentStatus}
          deploymentDetails={deploymentDetails}
          deploymentError={deploymentError}
          onDismissDeployment={handleDismissDeployment}
          onOpenHistory={() => setIsHistoryOpen(true)}
        />
        <VersionHistoryPanel
          projectId={projectId}
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onVersionRestored={handleVersionRestored}
          refreshTrigger={historyRefreshTrigger}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <WorkspaceHeader
        projectId={projectId}
        hasFiles={hasFiles}
        currentVersionNumber={currentVersionNumber}
        deploymentStatus={deploymentStatus}
        deploymentDetails={deploymentDetails}
        onDeploy={handleDeploy}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />
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
            projectId={projectId}
            refreshKey={refreshKey}
            hasFiles={hasFiles}
            generationStatus={generationStatus}
            projectTitle={projectTitle}
            currentVersionNumber={currentVersionNumber}
            deploymentStatus={deploymentStatus}
            deploymentDetails={deploymentDetails}
            deploymentError={deploymentError}
            onDismissDeployment={handleDismissDeployment}
            onOpenHistory={() => setIsHistoryOpen(true)}
          />
        </div>
      </div>

      {/* Version Control and Rollback Drawer */}
      <VersionHistoryPanel
        projectId={projectId}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onVersionRestored={handleVersionRestored}
        refreshTrigger={historyRefreshTrigger}
      />
    </div>
  );
}
