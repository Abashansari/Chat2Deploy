"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Book,
  Terminal,
  Cpu,
  Layers,
  GitBranch,
  Cloud,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
  Zap,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export default function DocsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sections = [
    { id: "overview", title: "Platform Overview" },
    { id: "prompting", title: "Prompt Engineering" },
    { id: "versioning", title: "Version Control & Snapshots" },
    { id: "hosting", title: "Cloudflare Edge Deployment" },
    { id: "architecture", title: "System Architecture" },
  ];

  const samplePrompt = `Create a high-converting landing page for an AI developer copilot called "CodePulse".
Include:
1. Hero section with dark cyber aesthetic, badge, headline, subheadline, and primary CTA.
2. Interactive code comparison box showing before & after optimization.
3. Feature grid with 6 cards covering instant refactoring, type inference, and edge testing.
4. Pricing table with Free, Pro ($19/mo), and Enterprise tiers with a toggle.
5. Responsive navigation bar and clean footer with social links.`;

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background pt-12 pb-24 min-h-[calc(100vh-64px)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center gap-2 text-xs text-muted mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight size={14} />
            <Link href="/resources" className="hover:text-foreground transition-colors">
              Resources
            </Link>
            <ChevronRight size={14} />
            <span className="text-foreground font-medium">Documentation</span>
          </div>

          <div className="flex items-center justify-between mb-8 pb-6 border-b border-subtle">
            <div>
              <Link
                href="/resources"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-dark transition-colors mb-3 font-medium"
              >
                <ArrowLeft size={14} />
                Back to Resources
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                Documentation & Platform Reference
              </h1>
              <p className="text-muted text-base mt-2 max-w-2xl">
                Comprehensive guide to prompt engineering, AI code generation, automatic versioning, and global edge deployments in Chat2Deploy.
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/workspace/new"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                <Zap size={14} />
                Open Workspace
              </Link>
            </div>
          </div>

          {/* Main Layout: Sidebar & Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {/* Table of Contents Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 bg-card border border-subtle rounded-xl p-4 space-y-2">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider block px-2 mb-2">
                  On this page
                </span>
                <nav className="space-y-1">
                  {sections.map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="block px-2.5 py-1.5 text-xs rounded-md text-secondary hover:text-foreground hover:bg-surface transition-colors"
                    >
                      {sec.title}
                    </a>
                  ))}
                </nav>

                <hr className="border-subtle my-3" />

                <div className="px-2 pt-1 text-xs space-y-2">
                  <span className="text-muted block font-medium">Need more help?</span>
                  <Link
                    href="/faq"
                    className="text-primary hover:underline block text-xs"
                  >
                    Check the FAQ &rarr;
                  </Link>
                  <Link
                    href="/guides"
                    className="text-primary hover:underline block text-xs"
                  >
                    Read Step-by-Step Guides &rarr;
                  </Link>
                </div>
              </div>
            </aside>

            {/* Content Area */}
            <div className="lg:col-span-3 space-y-14">
              {/* SECTION 1: OVERVIEW */}
              <section id="overview" className="scroll-mt-24 space-y-4">
                <div className="flex items-center gap-2.5 text-primary">
                  <Book size={20} />
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    Platform Overview
                  </h2>
                </div>
                <p className="text-sm text-muted leading-relaxed">
                  Chat2Deploy is an AI-powered website development and deployment platform. Instead of managing complex build configurations, bundling setups, or cloud provisioning, you describe your vision in conversational English. Chat2Deploy turns your prompt into a full, production-ready website with clean HTML, modern CSS, and reactive JavaScript.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="bg-card border border-subtle rounded-xl p-4 space-y-1.5">
                    <span className="text-xs font-bold text-primary">1. Conversational Prompt</span>
                    <p className="text-xs text-muted">
                      State your app goals, visual theme, and specific components. The AI analyzes requirements and creates a full web structure.
                    </p>
                  </div>
                  <div className="bg-card border border-subtle rounded-xl p-4 space-y-1.5">
                    <span className="text-xs font-bold text-primary">2. Real-Time Workspace</span>
                    <p className="text-xs text-muted">
                      Preview changes instantly in an isolated sandbox iframe. Inspect code files, modify specific sections, and view instant diffs.
                    </p>
                  </div>
                  <div className="bg-card border border-subtle rounded-xl p-4 space-y-1.5">
                    <span className="text-xs font-bold text-primary">3. Global Edge Deployment</span>
                    <p className="text-xs text-muted">
                      One-click deployment uploads your project bundle to Cloudflare Pages edge network, live with SSL in seconds.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 2: PROMPT ENGINEERING */}
              <section id="prompting" className="scroll-mt-24 space-y-5">
                <div className="flex items-center gap-2.5 text-primary">
                  <Terminal size={20} />
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    Prompt Engineering Guide
                  </h2>
                </div>
                <p className="text-sm text-muted leading-relaxed">
                  The quality and structure of your prompt directly impact the generated site. Follow these four pillars to get clean, professional results on the first attempt:
                </p>

                <div className="space-y-3">
                  <div className="bg-card border border-subtle rounded-xl p-4">
                    <h3 className="text-sm font-bold text-foreground mb-1">
                      1. Specify Visual Theme &amp; Tone
                    </h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Instead of saying &ldquo;make a nice website&rdquo;, specify colors, contrast, and style: &ldquo;Cyber oceanic dark theme, deep slate background (#0c0c0c), digital teal highlights, rounded-2xl cards, and modern typography.&rdquo;
                    </p>
                  </div>

                  <div className="bg-card border border-subtle rounded-xl p-4">
                    <h3 className="text-sm font-bold text-foreground mb-1">
                      2. Outline Sections &amp; Hierarchy
                    </h3>
                    <p className="text-xs text-muted leading-relaxed">
                      List the exact sections needed in sequence (Navbar, Hero with CTA, Feature Grid, Testimonials, Interactive Calculator, FAQ Accordion, Footer).
                    </p>
                  </div>

                  <div className="bg-card border border-subtle rounded-xl p-4">
                    <h3 className="text-sm font-bold text-foreground mb-1">
                      3. Describe Dynamic Behaviors
                    </h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Mention required interactivity, such as responsive mobile menus, pricing frequency toggles, modal dialogs, or filterable galleries.
                    </p>
                  </div>
                </div>

                {/* Example Prompt Box */}
                <div className="bg-card border border-subtle rounded-xl overflow-hidden mt-4">
                  <div className="bg-surface px-4 py-2.5 flex items-center justify-between border-b border-subtle">
                    <span className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                      <Terminal size={14} className="text-primary" />
                      Example High-Converting Prompt
                    </span>
                    <button
                      onClick={() => copyToClipboard(samplePrompt, "sample-prompt")}
                      className="text-xs text-muted hover:text-foreground flex items-center gap-1 px-2 py-1 rounded bg-card border border-subtle transition-colors"
                      aria-label="Copy prompt"
                    >
                      {copiedId === "sample-prompt" ? (
                        <>
                          <Check size={12} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-muted overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {samplePrompt}
                  </pre>
                </div>
              </section>

              {/* SECTION 3: VERSION CONTROL */}
              <section id="versioning" className="scroll-mt-24 space-y-4">
                <div className="flex items-center gap-2.5 text-primary">
                  <GitBranch size={20} />
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    Version Control &amp; Instant Rollback
                  </h2>
                </div>
                <p className="text-sm text-muted leading-relaxed">
                  Every time you generate or modify a website, Chat2Deploy creates an immutable snapshot of all project files. You are never locked into an AI generation that broke your layout.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-card border border-subtle rounded-xl p-4 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Layers size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Automatic Version Tagging</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Every prompt and manual edit increments the project version (<code className="text-primary font-mono">v1</code>, <code className="text-primary font-mono">v2</code>, <code className="text-primary font-mono">v3</code>) and records the prompt that triggered the change.
                    </p>
                  </div>

                  <div className="bg-card border border-subtle rounded-xl p-4 space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <RefreshCw size={16} />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">One-Click Rollback</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      From the Workspace version selector or the Dashboard project drawer, you can inspect historical versions and restore any previous version instantly.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 4: EDGE HOSTING */}
              <section id="hosting" className="scroll-mt-24 space-y-4">
                <div className="flex items-center gap-2.5 text-primary">
                  <Cloud size={20} />
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    Cloudflare Pages Edge Deployment
                  </h2>
                </div>
                <p className="text-sm text-muted leading-relaxed">
                  When you click <strong>Deploy</strong> in the Workspace, your files are bundled into a production release and uploaded directly to Cloudflare Pages edge infrastructure.
                </p>

                <div className="bg-card border border-subtle rounded-xl p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Sub-100ms Global Latency</h4>
                      <p className="text-xs text-muted leading-relaxed mt-0.5">
                        Your website is distributed across hundreds of edge locations worldwide. Assets are cached at the edge nearest to your users.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Automatic SSL &amp; HTTPS</h4>
                      <p className="text-xs text-muted leading-relaxed mt-0.5">
                        Every deployment is issued a free TLS certificate and served over HTTP/3 and HTTPS with zero configuration.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Unique Canonical Domains</h4>
                      <p className="text-xs text-muted leading-relaxed mt-0.5">
                        Each deployed project receives its own unique URL on <code className="text-primary font-mono">*.pages.dev</code> that updates automatically with every new production release.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 5: ARCHITECTURE */}
              <section id="architecture" className="scroll-mt-24 space-y-4">
                <div className="flex items-center gap-2.5 text-primary">
                  <Cpu size={20} />
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    System Architecture &amp; Reliability
                  </h2>
                </div>
                <p className="text-sm text-muted leading-relaxed">
                  Chat2Deploy is built with a resilient multi-tier cloud architecture designed to eliminate single points of failure:
                </p>

                <div className="bg-card border border-subtle rounded-xl p-5 space-y-3 text-xs text-muted">
                  <div className="flex items-center justify-between py-1 border-b border-subtle">
                    <span className="font-semibold text-foreground">AI Generation Engine</span>
                    <span className="text-secondary font-mono">Google Gemini 2.5/3.5 Flash</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-subtle">
                    <span className="font-semibold text-foreground">Database &amp; Authentication</span>
                    <span className="text-secondary font-mono">Supabase PostgreSQL + RLS</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-subtle">
                    <span className="font-semibold text-foreground">Caching &amp; Circuit Breaker</span>
                    <span className="text-secondary font-mono">Upstash Redis (Fail-Open)</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="font-semibold text-foreground">Edge CDN &amp; Hosting</span>
                    <span className="text-secondary font-mono">Cloudflare Pages API</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-subtle flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Ready to start building?</span>
                    <span className="text-[11px] text-muted">Experiment with real prompts in the interactive workspace.</span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors inline-flex items-center gap-1"
                  >
                    Go to Dashboard &rarr;
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
