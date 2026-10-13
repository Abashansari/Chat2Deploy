"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  HelpCircle,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Search,
  MessageSquare,
  Sparkles,
  Cloud,
  GitBranch,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

interface FAQItem {
  id: string;
  category: "ai" | "deployments" | "versions" | "program";
  question: string;
  answer: string;
  actionLink?: {
    label: string;
    href: string;
  };
}

const FAQS: FAQItem[] = [
  {
    id: "how-does-it-work",
    category: "ai",
    question: "How does Chat2Deploy generate websites from prompts?",
    answer: "Chat2Deploy utilizes Google Gemini's multimodal intelligence paired with a specialized web-generation architecture. When you submit a prompt, the engine plans the layout, generates semantic HTML5 structure, custom CSS styling with modern design tokens, and modular JavaScript logic. The files are rendered inside an isolated live preview sandbox immediately.",
    actionLink: {
      label: "Read Documentation",
      href: "/docs",
    },
  },
  {
    id: "what-files-are-generated",
    category: "ai",
    question: "What files and code are included in a generated website?",
    answer: "Each project includes standard web assets: an index.html file with semantic sections, a CSS stylesheet or Tailwind setup containing responsive styling, and a JavaScript file handling dynamic interactivity (like mobile navigation, toggles, or modals). You can inspect and view these files directly within your workspace.",
  },
  {
    id: "incremental-modifications",
    category: "ai",
    question: "Can I modify my website iteratively without regenerating everything?",
    answer: "Yes! In the Workspace chat panel, you can ask for surgical modifications—such as 'change the button color to orange', 'add a contact form section', or 'increase font contrast'. Chat2Deploy evaluates your existing files and modifies only the necessary elements while preserving your current layout.",
    actionLink: {
      label: "View Iterative Editing Guide",
      href: "/guides#iterative-modification",
    },
  },
  {
    id: "hosting-infrastructure",
    category: "deployments",
    question: "Where are my deployed websites hosted?",
    answer: "All websites are deployed onto Cloudflare Pages global edge network. This ensures sub-100ms response times worldwide, automated DDoS protection, unlimited bandwidth, and enterprise-grade 99.99% uptime.",
    actionLink: {
      label: "Edge Hosting Details",
      href: "/docs#hosting",
    },
  },
  {
    id: "deployment-speed",
    category: "deployments",
    question: "How long does it take for a deployment to go live?",
    answer: "Typically between 5 to 10 seconds. When you click Deploy, your project files are bundled and uploaded to Cloudflare Pages via direct API calls. You will receive a live production URL immediately upon completion.",
  },
  {
    id: "custom-subdomains",
    category: "deployments",
    question: "Do I get a live URL for my website?",
    answer: "Yes! Every deployed project receives a unique canonical URL on the *.pages.dev domain (e.g., https://your-project.pages.dev). You can share this link with anyone, and it will remain active and hosted with free SSL.",
  },
  {
    id: "version-snapshots",
    category: "versions",
    question: "How does automatic versioning work?",
    answer: "Chat2Deploy automatically captures an immutable snapshot of your project every time a prompt is applied or a save is triggered. Each snapshot records the version number (v1, v2, v3), timestamp, and the prompt that generated it.",
    actionLink: {
      label: "Version Control Docs",
      href: "/docs#versioning",
    },
  },
  {
    id: "rollback-safety",
    category: "versions",
    question: "Can I roll back to an earlier version if the AI makes an unwanted change?",
    answer: "Absolutely. In the Workspace version switcher or your Dashboard project overview, you can select any historical version and restore it with one click. Your current working state is never permanently lost.",
  },
  {
    id: "contributor-program",
    category: "program",
    question: "What is the Learner Contributor Program?",
    answer: "Our Learner Contributor Program offers students and junior developers practical, hands-on experience contributing to real-world software projects. Selected participants collaborate using Git, agile sprints, and modern tech stacks. This is an unpaid educational opportunity, and participants receive a Certificate of Completion upon fulfilling the program requirements.",
    actionLink: {
      label: "Learn More & Apply",
      href: "/careers",
    },
  },
  {
    id: "is-there-a-stipend",
    category: "program",
    question: "Is there a stipend for the Contributor Program?",
    answer: "No. The Contributor Program is strictly an unpaid educational and portfolio-building opportunity. No stipend or promise of formal employment is provided. We are fully transparent about this so participants can plan accordingly.",
    actionLink: {
      label: "View Program Terms",
      href: "/careers",
    },
  },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(["how-does-it-work", "hosting-infrastructure"]));

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const categories = [
    { id: "all", label: "All Questions" },
    { id: "ai", label: "AI & Prompting", icon: Sparkles },
    { id: "deployments", label: "Hosting & Deployments", icon: Cloud },
    { id: "versions", label: "Version Control", icon: GitBranch },
    { id: "program", label: "Contributor Program", icon: ShieldAlert },
  ];

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background pt-12 pb-24 min-h-[calc(100vh-64px)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight size={14} />
            <Link href="/resources" className="hover:text-foreground transition-colors">
              Resources
            </Link>
            <ChevronRight size={14} />
            <span className="text-foreground font-medium">FAQ</span>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <Link
              href="/resources"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-dark transition-colors mb-3 font-medium"
            >
              <ArrowLeft size={14} />
              Back to Resources
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3">
              Frequently Asked Questions
            </h1>
            <p className="text-muted text-base max-w-xl mx-auto">
              Find quick answers to common questions about website generation, hosting, custom domains, and AI limits.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative mb-8 max-w-xl mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions or keywords (e.g. Cloudflare, rollback, prompt)..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-subtle rounded-xl text-xs md:text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8">
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

          {/* FAQ Accordion List */}
          <div className="space-y-4">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 bg-card border border-subtle rounded-2xl">
                <HelpCircle size={32} className="mx-auto text-muted mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">No matching questions found</h3>
                <p className="text-xs text-muted mb-4">Try clearing your search query or choosing another category.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface border border-subtle text-foreground hover:border-primary/30"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = openItems.has(faq.id);

                return (
                  <div
                    key={faq.id}
                    className={`bg-card border rounded-xl transition-all overflow-hidden ${
                      isOpen ? "border-primary/40 shadow-sm" : "border-subtle hover:border-primary/20"
                    }`}
                  >
                    <button
                      onClick={() => toggleItem(faq.id)}
                      className="w-full text-left p-5 flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm md:text-base font-semibold text-foreground hover:text-primary transition-colors">
                        {faq.question}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`text-muted shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-muted leading-relaxed border-t border-subtle/60">
                        <p>{faq.answer}</p>
                        {faq.actionLink && (
                          <div className="mt-3">
                            <Link
                              href={faq.actionLink.href}
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              {faq.actionLink.label}
                              <ArrowRight size={12} />
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Need More Assistance Banner */}
          <div className="mt-14 bg-card border border-subtle rounded-2xl p-6 sm:p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <MessageSquare size={20} />
            </div>
            <h3 className="text-base font-bold text-foreground">Still have questions?</h3>
            <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
              Explore our step-by-step guides, check out full platform documentation, or learn more about contributing to Chat2Deploy.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/guides"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-surface border border-subtle text-foreground hover:border-primary/40 transition-colors"
              >
                Browse Guides
              </Link>
              <Link
                href="/careers"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                Join Contributor Team
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
