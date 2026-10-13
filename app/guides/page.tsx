"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  FileText,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Layers,
  ArrowRight,
  Globe,
  Palette,
  CheckCircle2,
  Clock,
  Compass,
} from "lucide-react";

interface Guide {
  id: string;
  category: "starter" | "design" | "workflow" | "deployment";
  title: string;
  description: string;
  readTime: string;
  steps: {
    title: string;
    details: string;
    promptSnippet?: string;
  }[];
}

const GUIDES: Guide[] = [
  {
    id: "saas-landing-page",
    category: "starter",
    title: "Building a Modern SaaS Landing Page in 5 Minutes",
    description: "Learn how to prompt the AI to generate a complete SaaS marketing page with a hero, feature grid, interactive pricing calculator, and testimonials.",
    readTime: "5 min read",
    steps: [
      {
        title: "Step 1: Create a New Project",
        details: "Navigate to your Dashboard and click 'New Project'. Give your project a clear name such as 'TaskPulse AI' to provide initial context.",
      },
      {
        title: "Step 2: Craft the Initial Generation Prompt",
        details: "Include specific layout sections, your preferred color palette, and key interactive components.",
        promptSnippet: "Build a modern SaaS landing page for an AI productivity app called TaskPulse. Use a dark theme with slate background and digital teal accents. Include: 1) Navigation with logo, product links, and login button. 2) Hero with gradient headline, social proof badge, and email signup. 3) 3-column feature grid with icon illustrations. 4) Interactive monthly/annual pricing toggle. 5) FAQ accordion and responsive footer.",
      },
      {
        title: "Step 3: Test Responsiveness in the Workspace Preview",
        details: "Use the device viewport controls (Desktop, Tablet, Mobile) in the Preview panel to verify that grids collapse cleanly and the mobile menu functions properly.",
      },
      {
        title: "Step 4: One-Click Production Deployment",
        details: "Click 'Deploy' in the top right. In under 10 seconds, your site is built, bundled, and hosted live on Cloudflare Pages with SSL.",
      },
    ],
  },
  {
    id: "developer-portfolio",
    category: "design",
    title: "Designing a High-Impact Developer Portfolio",
    description: "Build a personalized portfolio showcasing your projects, technical skills, GitHub repositories, and interactive contact form.",
    readTime: "4 min read",
    steps: [
      {
        title: "Step 1: Define Your Personal Brand & Tone",
        details: "Specify whether you want a minimalistic monochrome aesthetic, a vibrant cyberpunk feel, or a clean corporate profile.",
      },
      {
        title: "Step 2: Generate Portfolio Sections",
        details: "Ask for an about section, an interactive skills grid organized by category, and project cards with live demo links.",
        promptSnippet: "Create a senior full-stack engineer portfolio. Dark mode theme (#0c0c0c), modern sans-serif typography, and subtle cyan highlights. Features: 1) Hero with avatar placeholder, bio, and resume download button. 2) Categorized skills section (Frontend, Backend, Cloud). 3) 4 project cards with GitHub tags, tech stack badges, and preview buttons. 4) Contact section with validated form.",
      },
      {
        title: "Step 3: Fine-Tune with Follow-Up Prompts",
        details: "Instead of starting over, prompt the chat assistant: 'Make the project cards hover with a subtle glow' or 'Add smooth scrolling to navigation anchors'.",
      },
    ],
  },
  {
    id: "iterative-modification",
    category: "workflow",
    title: "Surgical Refinements: Modifying Existing Websites with Chat",
    description: "Master the art of conversational iteration without breaking existing styles or losing previous progress.",
    readTime: "6 min read",
    steps: [
      {
        title: "Step 1: Isolate the Section to Update",
        details: "Be specific about which part of the page you want changed. Refer to elements by their role: 'the hero headline', 'the pricing cards', or 'the footer social icons'.",
      },
      {
        title: "Step 2: Request Targeted Modifications",
        details: "Prompting specifically prevents unwanted side effects in unrelated components.",
        promptSnippet: "In the pricing section, please change the Pro plan badge to 'Most Popular' with an amber gradient background. Also add a third feature bullet: 'Unlimited AI generation requests'. Keep all other sections unchanged.",
      },
      {
        title: "Step 3: Inspect Version History and Rollback if Needed",
        details: "Notice that every edit increments the version counter (e.g., from v1 to v2). If a modification does not look right, click the version dropdown to instantly restore v1.",
      },
    ],
  },
  {
    id: "custom-domains-edge",
    category: "deployment",
    title: "Zero-Downtime Edge Deployments & Production Management",
    description: "Understand how your static bundles are distributed across Cloudflare's global edge network with instant updates.",
    readTime: "3 min read",
    steps: [
      {
        title: "Step 1: Review Deployment Readiness",
        details: "Check your console in the Workspace preview to confirm no JavaScript errors exist before deploying.",
      },
      {
        title: "Step 2: Triggering Cloudflare Pages Edge Deployment",
        details: "When clicking Deploy, Chat2Deploy automatically packages your project files and pushes them to Cloudflare Pages. The deployment status changes from 'Queued' to 'Deploying' to 'Success' in real time.",
      },
      {
        title: "Step 3: Accessing Your Canonical URL",
        details: "Every deployment receives a dedicated, production-grade URL (e.g., https://your-project.pages.dev). Re-deploying updates the live site with zero downtime.",
      },
    ],
  },
];

export default function GuidesPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [expandedGuideId, setExpandedGuideId] = useState<string>("saas-landing-page");

  const categories = [
    { id: "all", label: "All Guides" },
    { id: "starter", label: "Getting Started" },
    { id: "design", label: "UI & Design" },
    { id: "workflow", label: "Workflow & Editing" },
    { id: "deployment", label: "Deployments" },
  ];

  const filteredGuides = activeCategory === "all"
    ? GUIDES
    : GUIDES.filter((g) => g.category === activeCategory);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background pt-12 pb-24 min-h-[calc(100vh-64px)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-muted mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight size={14} />
            <Link href="/resources" className="hover:text-foreground transition-colors">
              Resources
            </Link>
            <ChevronRight size={14} />
            <span className="text-foreground font-medium">Guides &amp; Tutorials</span>
          </div>

          {/* Header */}
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
                Guides &amp; Tutorials
              </h1>
              <p className="text-muted text-base mt-2 max-w-2xl">
                Step-by-step walkthroughs to design, customize, and deploy production websites with AI.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles size={14} />
                Start Building
              </Link>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                  activeCategory === cat.id
                    ? "bg-primary text-white"
                    : "bg-card border border-subtle text-secondary hover:text-foreground hover:border-primary/30"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Guides List */}
          <div className="space-y-6">
            {filteredGuides.map((guide) => {
              const isExpanded = expandedGuideId === guide.id;

              return (
                <div
                  key={guide.id}
                  className={`bg-card border rounded-2xl transition-all ${
                    isExpanded
                      ? "border-primary/40 shadow-sm"
                      : "border-subtle hover:border-primary/20"
                  }`}
                >
                  {/* Guide Header Banner */}
                  <div
                    onClick={() => setExpandedGuideId(isExpanded ? "" : guide.id)}
                    className="p-6 cursor-pointer flex items-start justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {guide.category}
                        </span>
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Clock size={12} />
                          {guide.readTime}
                        </span>
                      </div>
                      <h2 className="text-lg md:text-xl font-bold text-foreground hover:text-primary transition-colors">
                        {guide.title}
                      </h2>
                      <p className="text-xs md:text-sm text-muted leading-relaxed max-w-2xl">
                        {guide.description}
                      </p>
                    </div>

                    <button
                      className="shrink-0 w-8 h-8 rounded-lg bg-surface border border-subtle flex items-center justify-center text-muted hover:text-foreground transition-colors mt-1"
                      aria-label={isExpanded ? "Collapse guide" : "Expand guide"}
                    >
                      <ChevronRight
                        size={16}
                        className={`transition-transform duration-200 ${
                          isExpanded ? "rotate-90 text-primary" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Expanded Guide Steps */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-subtle space-y-6">
                      <div className="space-y-4">
                        {guide.steps.map((step, idx) => (
                          <div
                            key={idx}
                            className="bg-surface border border-subtle rounded-xl p-4 space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-primary shrink-0" />
                              <h3 className="text-sm font-bold text-foreground">
                                {step.title}
                              </h3>
                            </div>
                            <p className="text-xs text-muted leading-relaxed pl-6">
                              {step.details}
                            </p>

                            {step.promptSnippet && (
                              <div className="ml-6 mt-2 bg-card border border-subtle rounded-lg p-3">
                                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block mb-1">
                                  Recommended Prompt
                                </span>
                                <p className="text-xs font-mono text-secondary leading-relaxed whitespace-pre-wrap">
                                  {step.promptSnippet}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted">
                          Finished reading? Apply these steps in your project.
                        </span>
                        <Link
                          href="/workspace/new"
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors inline-flex items-center gap-1.5"
                        >
                          Try this in Workspace
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Support Banner */}
          <div className="mt-12 bg-card border border-subtle rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-1">Have a specific use-case in mind?</h3>
              <p className="text-xs text-muted">
                Check our Frequently Asked Questions or explore platform documentation.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/faq"
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-surface border border-subtle text-foreground hover:border-primary/40 transition-colors"
              >
                View FAQ
              </Link>
              <Link
                href="/docs"
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                Read Docs
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
