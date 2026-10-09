"use client";

import { useState, useRef, useCallback } from "react";
import { RefreshCw, Monitor, Tablet, Smartphone, Maximize2, Minimize2, Loader2, Sparkles, AlertCircle } from "lucide-react";
import type { GenerationStatus } from "../../workspace/page";

type PreviewPanelProps = {
  device: "Desktop" | "Tablet" | "Mobile";
  setDevice: (d: "Desktop" | "Tablet" | "Mobile") => void;
  isFullscreen: boolean;
  setIsFullscreen: (b: boolean) => void;
  generatedHtml: string | null;
  generationStatus: GenerationStatus;
  projectTitle: string;
};

export default function PreviewPanel({
  device,
  setDevice,
  isFullscreen,
  setIsFullscreen,
  generatedHtml,
  generationStatus,
  projectTitle,
}: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

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
    setIframeKey((k) => k + 1);
  }, []);

  const getStatusBadge = () => {
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

  // Build the srcdoc for the sandboxed iframe
  const srcdoc = generatedHtml || null;

  return (
    <div className="flex flex-col h-full relative">
      <div className="h-12 border-b border-subtle flex items-center px-4 shrink-0 justify-between bg-background">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Live Preview</span>
          {generationStatus === "ready" && (
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
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
        <div className="absolute top-4 right-4 z-10">{getStatusBadge()}</div>

        {/* Browser Mockup */}
        <div
          className={`bg-card rounded-xl border border-subtle shadow-xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out h-full ${getPreviewWidth()} max-w-full`}
        >
          {/* Browser Bar */}
          <div className="h-10 border-b border-subtle bg-surface flex items-center px-4 gap-4 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50"></div>
            </div>
            <div className="bg-background border border-subtle rounded text-xs text-muted px-3 py-1 flex-1 max-w-md mx-auto text-center font-mono truncate">
              {generatedHtml ? `https://preview.chat2deploy.dev/${projectTitle.toLowerCase().replace(/\s+/g, "-")}` : "https://preview.chat2deploy.dev"}
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-hidden relative bg-white">
            {generationStatus === "generating" || generationStatus === "rendering" ? (
              /* Loading State */
              <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-600">
                <Loader2 size={32} className="animate-spin text-sky-500 mb-4" />
                <p className="text-sm font-medium">
                  {generationStatus === "generating"
                    ? "Generating your website..."
                    : "Preparing preview..."}
                </p>
                <p className="text-xs text-gray-400 mt-1">This may take a few seconds</p>
              </div>
            ) : srcdoc ? (
              /* Generated website via sandboxed iframe */
              <iframe
                key={iframeKey}
                ref={iframeRef}
                srcDoc={srcdoc}
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
