"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  RefreshCw,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  Loader2,
  Sparkles,
  AlertCircle,
  Rocket,
  CheckCircle2,
  ExternalLink,
  ArrowUpRight,
  History,
} from "lucide-react";
import type { GenerationStatus, DeploymentStatus, DeploymentDetails } from "./types";

const ROTATING_DEPLOY_MESSAGES = [
  "Preparing your website…",
  "Optimizing static assets…",
  "Uploading files…",
  "Configuring global edge delivery…",
  "Finalizing deployment…",
  "Almost ready…",
];

type PreviewPanelProps = {
  device: "Desktop" | "Tablet" | "Mobile";
  setDevice: (d: "Desktop" | "Tablet" | "Mobile") => void;
  isFullscreen: boolean;
  setIsFullscreen: (b: boolean) => void;
  projectId: string;
  refreshKey: number;
  hasFiles: boolean;
  generationStatus: GenerationStatus;
  projectTitle: string;
  currentVersionNumber?: number;
  deploymentStatus?: DeploymentStatus;
  deploymentDetails?: DeploymentDetails | null;
  deploymentError?: string | null;
  onDismissDeployment?: () => void;
  onOpenHistory?: () => void;
};

export default function PreviewPanel({
  device,
  setDevice,
  isFullscreen,
  setIsFullscreen,
  projectId,
  refreshKey,
  hasFiles,
  generationStatus,
  projectTitle,
  currentVersionNumber,
  deploymentStatus = "idle",
  deploymentDetails = null,
  deploymentError = null,
  onDismissDeployment,
  onOpenHistory,
}: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);
  const [deployMessageIndex, setDeployMessageIndex] = useState(0);

  // Cycle rotating messages while deploying
  useEffect(() => {
    if (deploymentStatus !== "deploying") return;

    const interval = setInterval(() => {
      setDeployMessageIndex((prev) => (prev + 1) % ROTATING_DEPLOY_MESSAGES.length);
    }, 2800);

    return () => {
      clearInterval(interval);
      setDeployMessageIndex(0);
    };
  }, [deploymentStatus]);

  const getPreviewWidth = () => {
    switch (device) {
      case "Mobile":
        return "w-[375px]";
      case "Tablet":
        return "w-[768px]";
      case "Desktop":
        return "w-full";
      default:
        return "w-full";
    }
  };

  const handleRefresh = useCallback(() => {
    setLocalRefreshKey((k) => k + 1);
  }, []);

  const getStatusBadge = () => {
    if (deploymentStatus === "deploying") {
      return (
        <div className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 shadow-sm">
          <Loader2 size={10} className="animate-spin" />
          Deploying live...
        </div>
      );
    }
    if (deploymentStatus === "success") {
      return (
        <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 shadow-sm">
          <CheckCircle2 size={10} />
          Deployment live
        </div>
      );
    }
    if (deploymentStatus === "error") {
      return (
        <div className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 shadow-sm">
          <AlertCircle size={10} />
          Deployment failed
        </div>
      );
    }

    switch (generationStatus) {
      case "generating":
        return (
          <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5">
            <Loader2 size={10} className="animate-spin" />
            Generating...
          </div>
        );
      case "rendering":
        return (
          <div className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5">
            <Sparkles size={10} className="animate-pulse" />
            Rendering preview...
          </div>
        );
      case "ready":
        return (
          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            Preview ready
          </div>
        );
      case "error":
        return (
          <div className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5">
            <AlertCircle size={10} />
            Error
          </div>
        );
      default:
        return null;
    }
  };

  // Build the src for the sandboxed iframe
  const previewUrl = hasFiles ? `/api/preview/${projectId}/index.html` : null;

  return (
    <div className="flex flex-col h-full relative">
      <div className="h-12 border-b border-subtle flex items-center px-4 shrink-0 justify-between bg-background">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Live Preview</span>
          {generationStatus === "ready" && deploymentStatus === "idle" && (
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          )}
          {deploymentStatus === "deploying" && (
            <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            className="text-muted hover:text-foreground transition-colors"
            title="Refresh"
            onClick={handleRefresh}
          >
            <RefreshCw size={14} />
          </button>

          {onOpenHistory && (
            <button
              className="text-muted hover:text-foreground transition-colors flex items-center gap-1 text-xs"
              title="Version History"
              onClick={onOpenHistory}
            >
              <History size={14} />
              {currentVersionNumber !== undefined && currentVersionNumber > 0 && (
                <span className="font-mono text-[10px] font-bold text-primary hidden sm:inline">
                  v{currentVersionNumber}
                </span>
              )}
            </button>
          )}

          <div className="flex items-center gap-1 border border-subtle rounded-md p-1 bg-surface">
            <button
              onClick={() => setDevice("Desktop")}
              className={`p-1 rounded-sm flex items-center gap-1.5 transition-colors ${
                device === "Desktop"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Monitor size={14} />
              <span className="text-xs font-medium pr-1">Desktop</span>
            </button>
            <button
              onClick={() => setDevice("Tablet")}
              className={`p-1 rounded-sm flex items-center gap-1.5 transition-colors ${
                device === "Tablet"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Tablet size={14} />
              <span className="text-xs font-medium pr-1">Tablet</span>
            </button>
            <button
              onClick={() => setDevice("Mobile")}
              className={`p-1 rounded-sm flex items-center gap-1.5 transition-colors ${
                device === "Mobile"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Smartphone size={14} />
              <span className="text-xs font-medium pr-1">Mobile</span>
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-muted hover:text-foreground transition-colors ml-2"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-subtle/30 overflow-auto flex justify-center p-4 sm:p-8 relative">
        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-20">{getStatusBadge()}</div>

        {/* Browser Mockup */}
        <div
          className={`bg-card rounded-xl border border-subtle shadow-xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out h-full ${getPreviewWidth()} max-w-full relative`}
        >
          {/* Browser Bar */}
          <div className="h-10 border-b border-subtle bg-surface flex items-center px-4 gap-4 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50"></div>
            </div>
            <div className="bg-background border border-subtle rounded text-xs text-muted px-3 py-1 flex-1 max-w-md mx-auto text-center font-mono truncate">
              {deploymentStatus === "success" && deploymentDetails?.url
                ? deploymentDetails.url
                : hasFiles
                ? `https://preview.chat2deploy.dev/${projectTitle.toLowerCase().replace(/\s+/g, "-")}`
                : "https://preview.chat2deploy.dev"}
            </div>
          </div>

          {/* Preview / Overlay Container */}
          <div className="flex-1 overflow-hidden relative bg-white">
            {/* 1. ANIMATED DEPLOYMENT EXPERIENCE OVERLAY */}
            {deploymentStatus === "deploying" ? (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/90 text-white backdrop-blur-md transition-all duration-300">
                {/* Glowing Aura */}
                <div className="relative mb-6">
                  <div className="absolute -inset-4 rounded-full bg-primary/30 blur-xl animate-pulse"></div>
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-sky-600 flex items-center justify-center shadow-lg border border-white/20">
                    <Rocket className="w-10 h-10 text-white animate-bounce" />
                  </div>
                </div>

                <h3 className="text-xl font-bold tracking-tight text-white mb-2">
                  Deploying Website
                </h3>

                {/* Rotating Message with Fade Animation */}
                <div className="h-7 flex items-center justify-center overflow-hidden mb-5">
                  <p
                    key={deployMessageIndex}
                    className="text-sm font-medium text-sky-200 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    {ROTATING_DEPLOY_MESSAGES[deployMessageIndex]}
                  </p>
                </div>

                {/* Indeterminate Animated Progress Bar */}
                <div className="w-64 max-w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative shadow-inner mb-4">
                  <div className="absolute inset-y-0 bg-gradient-to-r from-primary via-sky-400 to-emerald-400 w-1/2 rounded-full animate-[progress_1.8s_ease-in-out_infinite]"></div>
                </div>

                <p className="text-xs text-slate-400 text-center max-w-xs">
                  Validating files and deploying to global edge network...
                </p>
              </div>
            ) : deploymentStatus === "success" && deploymentDetails ? (
              /* 2. REAL DEPLOYMENT SUCCESS OVERLAY */
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/95 text-white backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 size={36} />
                </div>

                <h3 className="text-xl font-bold tracking-tight text-white mb-2 text-center">
                  Deployment Successful!
                </h3>

                {/* Exact requested notification notice */}
                <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 rounded-xl px-4 py-3 text-xs text-center max-w-md mb-6 leading-relaxed shadow-sm">
                  <p className="font-medium text-emerald-100">
                    Deployment successful! Please wait 5–10 seconds before opening your website while it becomes ready.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 w-full max-w-md mb-6 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
                      Live URL
                    </p>
                    <a
                      href={deploymentDetails.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-sky-300 font-mono text-xs truncate block transition-colors"
                      title={deploymentDetails.url}
                    >
                      {deploymentDetails.url}
                    </a>
                  </div>
                  <a
                    href={deploymentDetails.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-2 rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors"
                    title="Open in new tab"
                  >
                    <ArrowUpRight size={16} />
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  {onDismissDeployment && (
                    <button
                      onClick={onDismissDeployment}
                      className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 rounded-lg transition-colors"
                    >
                      Back to Preview
                    </button>
                  )}
                  <a
                    href={deploymentDetails.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-colors"
                  >
                    Open Live Website
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ) : deploymentStatus === "error" ? (
              /* 3. REAL DEPLOYMENT ERROR OVERLAY */
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/95 text-white backdrop-blur-md animate-in fade-in duration-200">
                <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mb-4">
                  <AlertCircle size={36} />
                </div>

                <h3 className="text-xl font-bold tracking-tight text-white mb-2 text-center">
                  Deployment Failed
                </h3>

                <p className="text-xs text-red-200/90 text-center max-w-md mb-6 leading-relaxed bg-red-950/40 border border-red-500/20 rounded-xl px-4 py-3">
                  {deploymentError || "Encountered an unexpected error while deploying website files."}
                </p>

                {onDismissDeployment && (
                  <button
                    onClick={onDismissDeployment}
                    className="px-5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    Dismiss & Return to Preview
                  </button>
                )}
              </div>
            ) : null}

            {/* 4. BASE PREVIEW CONTENT */}
            {generationStatus === "generating" || generationStatus === "rendering" ? (
              /* Generation Loading State */
              <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-600">
                <Loader2 size={32} className="animate-spin text-sky-500 mb-4" />
                <p className="text-sm font-medium">
                  {generationStatus === "generating"
                    ? "Generating your website..."
                    : "Preparing preview..."}
                </p>
                <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
              </div>
            ) : previewUrl ? (
              /* Generated website via sandboxed iframe */
              <iframe
                key={`${refreshKey}-${localRefreshKey}`}
                ref={iframeRef}
                src={previewUrl}
                sandbox="allow-scripts allow-same-origin"
                className="w-full h-full border-0"
                title={projectTitle}
                style={{ colorScheme: "light" }}
              />
            ) : generationStatus === "error" ? (
              /* Error State */
              <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-600">
                <AlertCircle size={32} className="text-red-400 mb-4" />
                <p className="text-sm font-medium">Generation failed</p>
                <p className="text-xs text-gray-400 mt-1">
                  Please try again with a different prompt
                </p>
              </div>
            ) : (
              /* Empty / Default State */
              <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
                <Sparkles size={32} className="text-sky-400 mb-4" />
                <p className="text-sm font-medium text-gray-700">
                  Your website will appear here
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Enter a prompt in the AI Chat to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
