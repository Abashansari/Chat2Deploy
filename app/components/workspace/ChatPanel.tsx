"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Loader2, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import type { ChatMessage, GenerationStatus } from "../../workspace/page";

type ChatPanelProps = {
  messages: ChatMessage[];
  generationStatus: GenerationStatus;
  onGenerate: (prompt: string) => void;
};

export default function ChatPanel({ messages, generationStatus, onGenerate }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isGenerating = generationStatus === "generating" || generationStatus === "rendering";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, generationStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const prompt = input.trim();
    setInput("");
    onGenerate(prompt);
  };

  const getStatusIcon = (status?: GenerationStatus) => {
    switch (status) {
      case "generating":
        return <Loader2 size={12} className="text-primary animate-spin" />;
      case "rendering":
        return <Sparkles size={12} className="text-primary animate-pulse" />;
      case "ready":
        return <CheckCircle2 size={12} className="text-emerald-500" />;
      case "error":
        return <AlertCircle size={12} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status?: GenerationStatus) => {
    switch (status) {
      case "generating":
        return "Generating website...";
      case "rendering":
        return "Preparing preview...";
      case "ready":
        return "Preview ready";
      case "error":
        return "Generation failed";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="h-12 border-b border-subtle flex items-center px-4 shrink-0 justify-between">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">AI Chat</span>
        <div className={`w-2 h-2 rounded-full ${isGenerating ? "bg-yellow-500 animate-pulse" : "bg-emerald-500"}`}></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 workspace-scroll">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">What would you like to build?</h3>
            <p className="text-sm text-muted max-w-xs">
              Describe the website you want and Chat2Deploy will generate it for you.
            </p>
            <div className="mt-6 space-y-2 w-full max-w-xs">
              {[
                "Create a modern portfolio website",
                "Build an e-commerce landing page",
                "Design a restaurant website with a menu",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                  }}
                  className="w-full text-left text-xs text-muted bg-surface border border-subtle rounded-lg px-3 py-2.5 hover:border-primary/50 hover:text-foreground transition-all"
                >
                  &quot;{suggestion}&quot;
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            <div className="text-[10px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
              {msg.role === "user" ? "You" : "Chat2Deploy"}
            </div>
            <div
              className={`p-3 rounded-lg border ${
                msg.role === "user"
                  ? "bg-surface border-subtle"
                  : "bg-transparent border-transparent px-0"
              }`}
            >
              {msg.role === "user" ? (
                <p className="text-sm text-foreground">{msg.content}</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {msg.status && (
                    <div className="flex items-center gap-2 font-mono text-muted bg-surface p-2.5 rounded-md border border-subtle">
                      {getStatusIcon(msg.status)}
                      <span className="text-xs">{msg.status === "ready" || msg.status === "error" ? msg.content : getStatusLabel(msg.status)}</span>
                    </div>
                  )}
                  {!msg.status && (
                    <p className="text-foreground">{msg.content}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-background border-t border-subtle">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Chat2Deploy to build or modify..."
            className="w-full bg-surface border border-subtle rounded-lg pl-4 pr-12 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
          </button>
        </form>
        <div className="flex justify-end mt-2 pr-1">
          <span className="text-[10px] text-muted flex items-center gap-1">⌘ Enter <ArrowUp size={10} className="text-primary" /></span>
        </div>
      </div>
    </div>
  );
}
