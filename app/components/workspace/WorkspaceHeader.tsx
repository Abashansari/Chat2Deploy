"use client";

import { useState } from "react";
import { Rocket, Loader2, CheckCircle2, ExternalLink, AlertCircle, X } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { AuthAwareBackButton } from "../auth/AuthAwareBackButton";

export interface DeploymentInfo {
  url: string;
  id: string;
  timestamp: string;
}

interface WorkspaceHeaderProps {
  projectId?: string;
  hasFiles?: boolean;
}

export default function WorkspaceHeader({ projectId, hasFiles }: WorkspaceHeaderProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentInfo | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const handleDeploy = async () => {
    if (!projectId) {
      setDeployError("Project ID is missing. Cannot deploy.");
      return;
    }

    if (!hasFiles) {
      setDeployError("Please generate website files before deploying.");
      return;
    }

    setIsDeploying(true);
    setDeployError(null);

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Deployment failed.");
      }

      setDeploymentResult({
        url: data.deploymentUrl,
        id: data.deploymentId,
        timestamp: data.timestamp,
      });
      setIsSuccessModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deployment failed.";
      setDeployError(msg);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <>
      <header className="h-14 border-b border-subtle bg-background flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <AuthAwareBackButton />
          <div className="w-px h-4 bg-subtle mx-1"></div>
          <span className="font-bold text-foreground text-lg">
            Workspace
          </span>
        </div>

        <div className="flex items-center gap-4">
          {deployError && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-red-500 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20 max-w-xs truncate">
              <AlertCircle size={14} className="shrink-0" />
              <span className="truncate">{deployError}</span>
              <button
                onClick={() => setDeployError(null)}
                className="hover:text-red-700 ml-1"
                aria-label="Dismiss error"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {deploymentResult && (
            <a
              href={deploymentResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live: {deploymentResult.url.replace(/^https?:\/\//, "")}
              <ExternalLink size={12} />
            </a>
          )}

          <ThemeToggle />

          <button
            onClick={handleDeploy}
            disabled={isDeploying || !hasFiles}
            title={!hasFiles ? "Generate your website first" : "Deploy to Cloudflare Pages"}
            className="inline-flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isDeploying ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Deploying...</span>
              </>
            ) : deploymentResult ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-300" />
                <span>Redeploy</span>
              </>
            ) : (
              <>
                <Rocket size={16} />
                <span>Deploy</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Deployment Success Modal */}
      {isSuccessModalOpen && deploymentResult && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-subtle rounded-2xl p-6 shadow-2xl max-w-md w-full relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors p-1 rounded-lg"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Successfully Deployed!</h3>
                <p className="text-xs text-muted">Your static site is live on Cloudflare Pages</p>
              </div>
            </div>

            <div className="bg-surface rounded-xl p-3 border border-subtle mb-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Deployment URL</span>
                <span className="font-mono text-[10px]">ID: {deploymentResult.id}</span>
              </div>
              <a
                href={deploymentResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-mono text-xs break-all flex items-center gap-1.5"
              >
                {deploymentResult.url}
                <ExternalLink size={12} className="shrink-0" />
              </a>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Close
              </button>
              <a
                href={deploymentResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
              >
                Visit Site
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
