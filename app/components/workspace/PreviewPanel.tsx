"use client";

import { RefreshCw, Monitor, Tablet, Smartphone, Maximize2, Minimize2 } from "lucide-react";

type PreviewPanelProps = {
  device: "Desktop" | "Tablet" | "Mobile";
  setDevice: (d: "Desktop" | "Tablet" | "Mobile") => void;
  isFullscreen: boolean;
  setIsFullscreen: (b: boolean) => void;
};

export default function PreviewPanel({ device, setDevice, isFullscreen, setIsFullscreen }: PreviewPanelProps) {
  
  const getPreviewWidth = () => {
    switch(device) {
      case "Mobile": return "w-[375px]";
      case "Tablet": return "w-[768px]";
      case "Desktop": return "w-full";
      default: return "w-full";
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="h-12 border-b border-subtle flex items-center px-4 shrink-0 justify-between bg-background">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Live Preview</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="text-muted hover:text-foreground transition-colors" title="Refresh">
            <RefreshCw size={14} />
          </button>
          
          <div className="flex items-center gap-1 border border-subtle rounded-md p-1 bg-surface">
            <button 
              onClick={() => setDevice("Desktop")}
              className={`p-1 rounded-sm flex items-center gap-1.5 transition-colors ${device === "Desktop" ? "bg-background text-primary shadow-sm" : "text-muted hover:text-foreground"}`}
            >
              <Monitor size={14} />
              <span className="text-xs font-medium pr-1">Desktop</span>
            </button>
            <button 
              onClick={() => setDevice("Tablet")}
              className={`p-1 rounded-sm flex items-center gap-1.5 transition-colors ${device === "Tablet" ? "bg-background text-primary shadow-sm" : "text-muted hover:text-foreground"}`}
            >
              <Tablet size={14} />
              <span className="text-xs font-medium pr-1">Tablet</span>
            </button>
            <button 
              onClick={() => setDevice("Mobile")}
              className={`p-1 rounded-sm flex items-center gap-1.5 transition-colors ${device === "Mobile" ? "bg-background text-primary shadow-sm" : "text-muted hover:text-foreground"}`}
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
        <div className="absolute top-4 right-4 z-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
          Preview ready
        </div>
        
        {/* Browser Mockup */}
        <div className={`bg-card rounded-xl border border-subtle shadow-xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out h-full ${getPreviewWidth()} max-w-full`}>
          {/* Browser Bar */}
          <div className="h-10 border-b border-subtle bg-surface flex items-center px-4 gap-4 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50"></div>
            </div>
            <div className="bg-background border border-subtle rounded text-xs text-muted px-3 py-1 flex-1 max-w-md mx-auto text-center font-mono">
              https://preview.chat2deploy.dev
            </div>
          </div>
          
          {/* Dummy Website Content */}
          <div className="flex-1 overflow-auto p-6 sm:p-12 bg-white text-gray-900">
            {/* Nav */}
            <div className="flex justify-between items-center mb-16">
              <div className="text-sm font-bold text-sky-600 tracking-wider">ALEX / STUDIO</div>
              <div className="flex gap-6 text-xs font-medium text-gray-500 tracking-wider">
                <span className="hover:text-gray-900 cursor-pointer">WORK</span>
                <span className="hover:text-gray-900 cursor-pointer">ABOUT</span>
                <span className="hover:text-gray-900 cursor-pointer">CONTACT</span>
              </div>
            </div>
            
            {/* Hero */}
            <div className="max-w-2xl mb-20">
              <div className="text-xs font-bold text-sky-500 tracking-widest uppercase mb-4">
                Digital Designer + Developer
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-gray-900">
                Build what's next.
              </h1>
              <p className="text-gray-500 text-lg mb-8 max-w-md">
                A focused portfolio experience for modern digital work.
              </p>
              <button className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-md font-medium text-sm transition-colors shadow-sm">
                View Projects
              </button>
            </div>
            
            {/* Projects */}
            <div className="mb-16">
              <h2 className="text-lg font-bold mb-6 text-gray-900">Selected Projects</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-gray-200 p-5 bg-gray-50/50 rounded-sm">
                  <h3 className="font-bold text-sm mb-1 text-gray-900">ORBIT</h3>
                  <p className="text-gray-500 text-xs">Product system</p>
                </div>
                <div className="border border-gray-200 p-5 bg-gray-50/50 rounded-sm">
                  <h3 className="font-bold text-sm mb-1 text-gray-900">SIGNAL</h3>
                  <p className="text-gray-500 text-xs">Digital platform</p>
                </div>
                <div className="border border-gray-200 p-5 bg-gray-50/50 rounded-sm">
                  <h3 className="font-bold text-sm mb-1 text-gray-900">FIELD</h3>
                  <p className="text-gray-500 text-xs">Brand direction</p>
                </div>
              </div>
            </div>
            
            {/* Footer info */}
            <div className="border-t border-gray-200 pt-8 flex flex-col gap-3">
              <div className="text-xs text-gray-700">
                <span className="font-bold mr-2">Skills</span>
                Product design · Frontend · Systems
              </div>
              <div className="text-xs text-gray-700">
                <span className="font-bold mr-2">Get in touch</span>
                <a href="#" className="text-sky-600 hover:underline">hello@alex.studio</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
