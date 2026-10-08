"use client";

import { useState } from "react";
import WorkspaceHeader from "../components/workspace/WorkspaceHeader";
import ChatPanel from "../components/workspace/ChatPanel";
import PreviewPanel from "../components/workspace/PreviewPanel";

export default function WorkspacePage() {
  const [device, setDevice] = useState<"Desktop" | "Tablet" | "Mobile">("Desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (isFullscreen) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <PreviewPanel 
          device={device} 
          setDevice={setDevice} 
          isFullscreen={isFullscreen} 
          setIsFullscreen={setIsFullscreen} 
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
          <ChatPanel />
        </div>
        
        {/* Right Pane - Preview */}
        <div className="flex-1 flex flex-col bg-surface overflow-hidden relative">
          <PreviewPanel 
            device={device} 
            setDevice={setDevice} 
            isFullscreen={isFullscreen} 
            setIsFullscreen={setIsFullscreen} 
          />
        </div>
      </div>
    </div>
  );
}
