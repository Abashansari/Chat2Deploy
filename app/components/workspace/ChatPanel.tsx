"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Bot, User, CheckCircle2, Loader2, Sparkles } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string | React.ReactNode;
};

export default function ChatPanel() {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "user",
      content: "Create a modern portfolio website with a hero section, projects, skills and contact form."
    },
    {
      id: "2",
      role: "assistant",
      content: (
        <div className="space-y-3 text-sm">
          <p className="font-medium text-foreground">I'll build your portfolio with:</p>
          <ul className="space-y-1 text-muted">
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Hero section</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Projects section</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Skills section</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Contact form</li>
            <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Responsive layout</li>
          </ul>
          <p className="text-muted text-xs pt-2 border-t border-subtle">Creating the required components...</p>
        </div>
      )
    },
    {
      id: "3",
      role: "assistant",
      content: (
        <div className="space-y-2 text-sm text-muted font-mono bg-surface p-3 rounded-md border border-subtle">
          <div className="flex items-center gap-2"><Sparkles size={12} className="text-primary" /> Creating project</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Generated page</div>
          <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Created components</div>
          <div className="flex items-center gap-2"><Sparkles size={12} className="text-primary" /> Building preview...</div>
        </div>
      )
    },
    {
      id: "4",
      role: "user",
      content: "Make the hero section smaller and change the button color."
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMsg = input;
    setInput("");
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: userMsg }]);
    setIsGenerating(true);

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: (
          <div className="space-y-2 text-sm text-muted font-mono bg-surface p-3 rounded-md border border-subtle">
            <div className="flex items-center gap-2"><Loader2 size={12} className="text-primary animate-spin" /> Analyzing request...</div>
          </div>
        )
      }]);

      setTimeout(() => {
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: (
              <div className="space-y-3 text-sm">
                <p className="text-foreground">I've updated the website based on your request.</p>
                <div className="space-y-1 text-muted font-mono bg-surface p-2 rounded-md border border-subtle">
                  <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Changes applied successfully</div>
                </div>
              </div>
            )
          };
          return newMsgs;
        });
        setIsGenerating(false);
      }, 1500);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="h-12 border-b border-subtle flex items-center px-4 shrink-0 justify-between">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">AI Chat</span>
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6 workspace-scroll">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            <div className="text-[10px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
              {msg.role === "user" ? "You" : "Chat2Deploy"}
            </div>
            <div className={`p-3 rounded-lg border ${msg.role === "user" ? "bg-surface border-subtle" : "bg-transparent border-transparent px-0"}`}>
              {msg.role === "user" ? (
                <p className="text-sm text-foreground">{msg.content}</p>
              ) : (
                msg.content
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
