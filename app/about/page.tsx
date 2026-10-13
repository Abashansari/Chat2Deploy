import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Sparkles,
  Zap,
  Globe,
  Layers,
  Code2,
  Users,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  History,
  Terminal,
  Cpu,
  Target,
  Rocket,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Chat2Deploy — AI-Powered Website Creation & Edge Hosting",
  description:
    "Learn about Chat2Deploy, our mission to lower technical barriers to website creation, our natural-language AI generation workflow, and our global edge deployment infrastructure.",
};

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Describe Your Vision",
    description:
      "Type a natural-language description of the website you want — whether it's a portfolio, SaaS landing page, blog, or interactive tool. Outline your preferred sections, colors, and layout requirements.",
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    step: "02",
    title: "AI Code Generation",
    description:
      "Our AI engine processes your requirements and produces clean, responsive HTML, CSS, and modern JavaScript with semantic markup and accessible styling — ready to view instantly in the sandbox preview.",
    icon: Cpu,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
  },
  {
    step: "03",
    title: "Review & Iteratively Refine",
    description:
      "Chat with the AI assistant to adjust colors, tweak layouts, add components, or modify copy in real-time. Every revision creates a verifiable version snapshot so you can review or rollback at any time.",
    icon: History,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
  },
  {
    step: "04",
    title: "Deploy to Global Edge",
    description:
      "With a single click, publish your website directly to our Cloudflare Pages edge network, giving you a live, SSL-secured URL distributed across global data centers with low latency.",
    icon: Globe,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
];

const PLATFORM_CAPABILITIES = [
  {
    icon: Sparkles,
    title: "Natural-Language AI Builder",
    description:
      "Turn plain ideas into working web code without having to configure boilerplate, write boilerplate HTML from scratch, or configure complex build tools.",
  },
  {
    icon: Zap,
    title: "Instant Live Preview",
    description:
      "Inspect generated websites in real-time inside an interactive sandbox with responsive viewport controls for desktop, tablet, and mobile displays.",
  },
  {
    icon: History,
    title: "Version History & Rollbacks",
    description:
      "Every prompt modification generates an immutable version snapshot. Restore earlier versions with one click whenever you want to test new creative directions safely.",
  },
  {
    icon: Globe,
    title: "Global Edge Deployments",
    description:
      "Publish your generated sites directly to Cloudflare Pages edge network with automatic HTTPS, asset caching, and lightning-fast global delivery.",
  },
  {
    icon: Layers,
    title: "Project Workspace Management",
    description:
      "Organize multiple web projects, track deployment statuses, monitor build versions, and manage live URLs from a centralized dashboard.",
  },
  {
    icon: Terminal,
    title: "Developer-Friendly Export",
    description:
      "Inspect the generated code anytime. Your projects consist of clean, portable standard web files (HTML, CSS, JavaScript) that you can easily take anywhere.",
  },
];

const AUDIENCES = [
  {
    title: "Learners & Students",
    description:
      "Explore how real HTML, CSS, and JavaScript work together. Observe how the AI crafts structures, study best practices, and rapidly test design ideas.",
    badge: "Education",
  },
  {
    title: "Developers & Prototypers",
    description:
      "Skip tedious scaffolding when pitching ideas or testing UI variations. Scaffold a working prototype in minutes and refine through natural dialogue.",
    badge: "Productivity",
  },
  {
    title: "Founders & Creators",
    description:
      "Launch product landing pages, portfolios, or announcement sites without waiting for design sprints or dealing with complex web hosting configurations.",
    badge: "Speed to Launch",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background text-foreground">
        {/* Hero Section */}
        <section
          className="relative w-full pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden"
          style={{ backgroundImage: "var(--hero-glow)" }}
        >
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
              Empowering Anyone to Build &amp; Deploy{" "}
              <span className="bg-gradient-to-r from-primary via-teal-400 to-sky-400 bg-clip-text text-transparent">
                With Natural Language
              </span>
            </h1>

            <p className="text-base md:text-lg text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
              Chat2Deploy bridges the gap between imagination and production. We harness generative AI to transform conversational prompts into clean web code, paired with instant preview and global edge hosting.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
              >
                Get Started
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-foreground bg-card border border-subtle rounded-xl hover:border-primary/30 transition-all hover:-translate-y-0.5"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 md:py-20 bg-surface border-y border-subtle">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
                  <Target size={13} />
                  Our Purpose
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">
                  Democratizing Web Development
                </h2>
                <div className="space-y-4 text-sm text-muted leading-relaxed">
                  <p>
                    Building a modern website has traditionally required juggling multiple disparate systems: local code environments, CSS frameworks, version control repositories, DNS management, and cloud hosting consoles.
                  </p>
                  <p>
                    <strong className="text-foreground">Chat2Deploy was created to remove these barriers.</strong> By combining state-of-the-art conversational AI models with a streamlined workspace and direct edge deployment pipelines, we enable anyone to turn their ideas into working websites in a matter of minutes.
                  </p>
                  <p>
                    Whether you are an experienced developer prototyping a concept or a student discovering web development, our goal is to let you focus on creativity, user experience, and iteration rather than wrestling with tooling.
                  </p>
                </div>
              </div>

              <div className="bg-card border border-subtle rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                  <Rocket size={18} className="text-primary" />
                  Core Guiding Principles
                </h3>
                <ul className="space-y-3.5">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-muted leading-relaxed">
                      <strong className="text-foreground block mb-0.5">Accessibility First:</strong>
                      Plain English should be all that is needed to start bringing a web idea to life.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-muted leading-relaxed">
                      <strong className="text-foreground block mb-0.5">Iterative Refinement:</strong>
                      Great websites are built through conversation and feedback. Make changes instantly without losing prior work.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-muted leading-relaxed">
                      <strong className="text-foreground block mb-0.5">Standard, Portable Web Code:</strong>
                      Generated output is valid HTML, CSS, and JavaScript that works in any browser and can be exported at any time.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-muted leading-relaxed">
                      <strong className="text-foreground block mb-0.5">Frictionless Production:</strong>
                      One-click deployment to global edge infrastructure so ideas actually reach the real world.
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-3">
                <Zap size={13} />
                The Workflow
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                How Chat2Deploy Works
              </h2>
              <p className="text-muted text-sm md:text-base max-w-xl mx-auto">
                From initial conversation to live deployment in four simple, transparent steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {WORKFLOW_STEPS.map((step) => (
                <div
                  key={step.step}
                  className="bg-card border border-subtle rounded-2xl p-6 flex flex-col justify-between hover:border-primary/30 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-2xl font-black text-muted/30 group-hover:text-primary/50 transition-colors">
                        {step.step}
                      </span>
                      <div className={`w-10 h-10 rounded-xl ${step.bgColor} ${step.color} flex items-center justify-center`}>
                        <step.icon size={20} />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-xs text-muted leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Capabilities */}
        <section className="py-16 md:py-24 bg-surface border-y border-subtle">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Platform Capabilities
              </h2>
              <p className="text-muted text-sm md:text-base max-w-xl mx-auto">
                Built on top of robust generative AI, Supabase persistence, and global edge hosting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PLATFORM_CAPABILITIES.map((cap, i) => (
                <div
                  key={i}
                  className="bg-card border border-subtle rounded-xl p-6 hover:border-primary/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <cap.icon size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-2">{cap.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{cap.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-3">
                <Users size={13} />
                Community &amp; Users
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Who Chat2Deploy Is Built For
              </h2>
              <p className="text-muted text-sm md:text-base max-w-lg mx-auto">
                Designed to support builders at every stage of their coding and creation journey.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {AUDIENCES.map((aud, i) => (
                <div key={i} className="bg-card border border-subtle rounded-2xl p-6">
                  <span className="inline-block text-[10px] font-semibold text-primary uppercase tracking-wider mb-3 px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                    {aud.badge}
                  </span>
                  <h3 className="text-base font-bold text-foreground mb-2">{aud.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{aud.description}</p>
                </div>
              ))}
            </div>

            {/* Careers Link Callout */}
            <div className="p-6 bg-card border border-teal-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Interested in contributing to Chat2Deploy?
                </h4>
                <p className="text-xs text-muted leading-relaxed">
                  Explore our Learner Contributor Program to work on real software tasks and gain collaborative development experience.
                </p>
              </div>
              <Link
                href="/careers"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-teal-300 bg-teal-500/10 border border-teal-500/30 rounded-lg hover:bg-teal-500/20 transition-colors shrink-0"
              >
                Learn More
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-16 bg-surface border-t border-subtle">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">
              Ready to create your next website?
            </h2>
            <p className="text-sm md:text-base text-muted max-w-xl mx-auto mb-8">
              Start with a prompt, iterate in real-time, and publish to the edge in seconds.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
              >
                Start Building Now
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-muted hover:text-foreground bg-card border border-subtle rounded-xl transition-all"
              >
                Contact the Team
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
