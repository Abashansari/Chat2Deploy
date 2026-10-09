"use client";

import { useState } from "react";
import { Rocket, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "../ThemeToggle";
import { AuthAwareBackButton } from "../auth/AuthAwareBackButton";

export default function WorkspaceHeader() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedStatus, setDeployedStatus] = useState<"idle" | "success">("idle");

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setDeployedStatus("success");
      setTimeout(() => setDeployedStatus("idle"), 3000);
    }, 2500);
  };

  return (
    <header className="h-14 border-b border-subtle bg-background flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <AuthAwareBackButton />
        <div className="w-px h-4 bg-subtle mx-1"></div>
        <span className="font-bold text-foreground text-lg">
          Workspace
        </span>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button
          onClick={handleDeploy}
          disabled={isDeploying || deployedStatus === "success"}
          className="inline-flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isDeploying ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Deploying...
            </>
          ) : deployedStatus === "success" ? (
            <>
              <CheckCircle2 size={16} />
              Deployed!
            </>
          ) : (
            <>
              <Rocket size={16} />
              Deploy
            </>
          )}
        </button>
      </div>
    </header>
  );
}
