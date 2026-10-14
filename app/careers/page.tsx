"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  ArrowRight,
  CheckCircle2,
  Briefcase,
  Code2,
  GitBranch,
  Users,
  Award,
  Send,
  Loader2,
  AlertCircle,
  ChevronDown,
  Database,
  Layers,
  Globe,
  Cloud,
  Sparkles,
  AlertTriangle,
  FolderGit2,
  ShieldAlert,
  Check,
  Quote,
  Lightbulb,
  Compass,
  FileCheck,
} from "lucide-react";

// ==========================================
// 1. Core Required Skills Data (Unchanged)
// ==========================================

const REQUIRED_SKILL_CATEGORIES = [
  {
    name: "Project Management & Collaboration",
    icon: Users,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
    skills: ["Git", "Jira"],
  },
  {
    name: "Programming Languages",
    icon: Code2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    skills: ["Python", "JavaScript"],
  },
  {
    name: "Frameworks, Libraries & Platforms",
    icon: Layers,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    skills: ["FastAPI", "Express.js", "React", "Vue.js", "Next.js", "Tailwind CSS", "Supabase"],
  },
  {
    name: "Databases",
    icon: Database,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    skills: ["MongoDB", "PostgreSQL", "MySQL"],
  },
];

// ==========================================
// 2. Preferred Skills Data (Added Advantage)
// ==========================================

interface PreferredSkillItem {
  title: string;
  badge: string;
  icon: typeof Cloud;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  description: string;
  topics: { label: string; detail: string }[];
  pills: string[];
}

const PREFERRED_SKILLS_DATA: PreferredSkillItem[] = [
  {
    title: "AWS & Cloud Computing",
    badge: "Preferred • Not Mandatory",
    icon: Cloud,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    description:
      "Applicants with knowledge or practical experience in cloud infrastructure, hosting, and deployment workflows may have an advantage during selection.",
    topics: [
      {
        label: "AWS Services",
        detail: "Familiarity with core services like EC2, S3, Lambda, CloudFront, Route 53, or API Gateway.",
      },
      {
        label: "Cloud Infrastructure & Deployment",
        detail: "Hands-on understanding of deployment pipelines, serverless workflows, or containerized hosting.",
      },
      {
        label: "Networking & Cloud Fundamentals",
        detail: "Grasp of DNS, basic networking concepts, IAM roles, HTTPS configuration, and cloud security basics.",
      },
    ],
    pills: ["AWS Services", "Cloud Infrastructure", "Deployment", "Networking", "Cloud Fundamentals"],
  },
  {
    title: "Artificial Intelligence & Machine Learning",
    badge: "Preferred • Not Mandatory",
    icon: Sparkles,
    iconColor: "text-teal-400",
    iconBg: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
    description:
      "Applicants with background or hands-on experience integrating modern AI models, APIs, and machine learning concepts may have an advantage during selection.",
    topics: [
      {
        label: "AI/ML Fundamentals",
        detail: "Understanding of foundational AI/ML principles, data processing, model evaluation, and classification.",
      },
      {
        label: "Model Integration & APIs",
        detail: "Experience calling LLM APIs (OpenAI, Gemini, Anthropic), function calling, tool integration, and structured responses.",
      },
      {
        label: "Practical AI-Powered Applications",
        detail: "Designing real-world AI features, prompt engineering, agentic workflows, embeddings, or retrieval-augmented features.",
      },
    ],
    pills: ["AI/ML Fundamentals", "Model Integration", "LLMs & APIs", "Prompt Engineering", "Practical AI Applications"],
  },
];

// Combined skill categories available in the application form
const FORM_SKILL_CATEGORIES = [
  ...REQUIRED_SKILL_CATEGORIES,
  {
    name: "Preferred Skills (Optional / Added Advantage)",
    icon: Sparkles,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    skills: ["AWS & Cloud Computing", "AI & Machine Learning"],
  },
];

// ==========================================
// 3. Program Benefits Data
// ==========================================

const BENEFITS = [
  {
    icon: Briefcase,
    title: "Real-World Projects",
    description: "Gain practical experience contributing to real software components and active codebases.",
  },
  {
    icon: Users,
    title: "Collaborative Workflows",
    description: "Experience team-based software development with pull requests, code reviews, and agile task tracking.",
  },
  {
    icon: GitBranch,
    title: "Git & Issue Tracking",
    description: "Work with industry-standard version control (Git), branching strategies, and issue tracking tools.",
  },
  {
    icon: Code2,
    title: "Technical Skill Growth",
    description: "Strengthen your programming, debugging, and system-design skills through hands-on contribution.",
  },
  {
    icon: Award,
    title: "Certificate of Completion",
    description: "Receive a certificate upon successful completion and fulfillment of the program requirements.",
  },
  {
    icon: Globe,
    title: "Portfolio Building",
    description: "Build a verifiable track record of contributions to real, deployed software projects.",
  },
];

// ==========================================
// 4. Real-World Experience Highlights
// ==========================================

const REAL_WORLD_HIGHLIGHTS = [
  {
    icon: FolderGit2,
    title: "Practical Real Project Requirements",
    description:
      "Move beyond toy tutorials to build features with genuine functional specifications, error handling, and performance considerations.",
  },
  {
    icon: GitBranch,
    title: "Git, Jira & Collaborative Workflows",
    description:
      "Gain hands-on exposure to branches, commits, pull requests, issue lifecycles, and code reviews in an active team repository.",
  },
  {
    icon: Compass,
    title: "Independent Problem-Solving & Accountability",
    description:
      "Develop the discipline to troubleshoot bugs, research technical solutions, manage your time, and deliver tasks responsibly.",
  },
  {
    icon: Users,
    title: "Collaborative Software Contribution",
    description:
      "Learn how distributed development teams coordinate changes, communicate asynchronously, and integrate diverse modules.",
  },
  {
    icon: Code2,
    title: "Showcase Contributions on GitHub & Portfolio",
    description:
      "Where project ownership, confidentiality, and organizational policies permit, highlight your code, PRs, and solutions to future recruiters.",
  },
  {
    icon: FileCheck,
    title: "Verifiable Certificate of Completion",
    description:
      "Earn a certificate subject to successful completion and fulfillment of all program requirements, providing demonstrable validation.",
  },
];

// ==========================================
// 5. Testimonials Data (Illustrative Examples)
// ==========================================

interface TestimonialItem {
  id: string;
  name: string;
  feedback: string;
}

const ILLUSTRATIVE_TESTIMONIALS: TestimonialItem[] = [
  {
    id: "1",
    name: "Saurab Gupta",
    feedback:
      "To be honest, working without an assigned mentor was difficult in the beginning. There were times when I felt completely stuck and didn't know where to start. I had to search documentation, explore the existing code, debug errors, and figure things out step by step. Slowly, I became more confident in solving problems on my own. Now, when I face an unfamiliar issue, I know how to break it down, research possible solutions, and work towards fixing it instead of waiting for someone to guide me.",
  },
  {
    id: "2",
    name: "Harsh Agarwal",
    feedback:
      "I am really grateful to this program for giving me an opportunity to work on real-world projects. Before joining, I had learned many things through tutorials and practice projects, but I didn't fully understand what it felt like to work through real development challenges. ",
  },
  {
    id: "3",
    name: "Rejoel Bhutia",
    feedback:
      "This was actually the first time in my life that I got the chance to work with a team of people I had never met before. Using professional collaboration tools like Jira to manage tasks and Git/GitHub to track changes, share code, and work together was a completely new experience for me. Initially, I felt a little lost because I was used to working on projects by myself. Gradually, I started understanding how teams coordinate, manage responsibilities, review changes, and solve problems together. It gave me a glimpse of how software development works in a real professional environment, and I am genuinely thankful for getting this opportunity.",
  },
];

// ==========================================
// 6. Form State & Interfaces
// ==========================================

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  institution: string;
  course: string;
  currentYear: string;
  skills: string[];
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  motivation: string;
  unpaidAcknowledged: boolean;
}

const INITIAL_FORM: FormData = {
  fullName: "",
  email: "",
  phone: "",
  institution: "",
  course: "",
  currentYear: "",
  skills: [],
  githubUrl: "",
  linkedinUrl: "",
  portfolioUrl: "",
  motivation: "",
  unpaidAcknowledged: false,
};

// ==========================================
// 7. Page Component
// ==========================================

export default function CareersPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    emailWarning?: string | null;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const updateField = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (validationErrors.length > 0) setValidationErrors([]);
      if (submitResult) setSubmitResult(null);
    },
    [validationErrors.length, submitResult]
  );

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
    if (validationErrors.length > 0) setValidationErrors([]);
    if (submitResult) setSubmitResult(null);
  };

  // ---------- Client-Side Validation ----------

  const validate = (): string[] => {
    const errs: string[] = [];

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2)
      errs.push("Full name is required (minimum 2 characters).");
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.push("A valid email address is required.");
    if (!formData.institution.trim() || formData.institution.trim().length < 2)
      errs.push("College or institution is required.");
    if (!formData.course.trim() || formData.course.trim().length < 2)
      errs.push("Current course or degree is required.");
    if (!formData.currentYear.trim())
      errs.push("Current year or semester is required.");
    if (formData.skills.length === 0)
      errs.push("Please select at least one skill or technology.");
    if (!formData.githubUrl.trim())
      errs.push("GitHub profile URL is required.");
    else {
      try {
        const url = new URL(formData.githubUrl);
        if (url.hostname !== "github.com" && !url.hostname.endsWith(".github.com")) {
          errs.push("GitHub URL must be a github.com URL.");
        }
      } catch {
        errs.push("GitHub URL is not a valid URL.");
      }
    }
    if (formData.linkedinUrl.trim()) {
      try {
        const url = new URL(formData.linkedinUrl);
        if (url.hostname !== "linkedin.com" && !url.hostname.endsWith(".linkedin.com")) {
          errs.push("LinkedIn URL must be a linkedin.com URL.");
        }
      } catch {
        errs.push("LinkedIn URL is not a valid URL.");
      }
    }
    if (formData.portfolioUrl.trim()) {
      try {
        new URL(formData.portfolioUrl);
      } catch {
        errs.push("Portfolio URL is not a valid URL.");
      }
    }
    if (!formData.motivation.trim() || formData.motivation.trim().length < 20)
      errs.push("Please write at least 20 characters about why you want to join.");
    if (!formData.unpaidAcknowledged)
      errs.push("You must acknowledge that this is an unpaid opportunity.");

    return errs;
  };

  // ---------- Submit ----------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errs = validate();
    if (errs.length > 0) {
      setValidationErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);
    setSubmitResult(null);

    try {
      const res = await fetch("/api/careers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details && Array.isArray(data.details)) {
          setValidationErrors(data.details);
        } else {
          setSubmitResult({
            success: false,
            message: data.error || "Failed to submit application. Please try again.",
          });
        }
        return;
      }

      setSubmitResult({
        success: true,
        message: data.message || "Application submitted successfully!",
        emailWarning: data.emailWarning,
      });
      setFormData(INITIAL_FORM);
    } catch {
      setSubmitResult({
        success: false,
        message: "A network error occurred. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background text-foreground">
        {/* ========================================================= */}
        {/* 1. HERO SECTION                                           */}
        {/* ========================================================= */}
        <section
          className="relative w-full pt-20 pb-20 md:pt-28 md:pb-28 overflow-hidden"
          style={{ backgroundImage: "var(--hero-glow)" }}
        >
          {/* Decorative ambient gradient orbs */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Briefcase size={13} />
              Learner Contributor Program
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight mb-5">
              Build Real Projects.{" "}
              <span className="bg-gradient-to-r from-primary via-teal-400 to-sky-400 bg-clip-text text-transparent">
                Learn by Contributing.
              </span>
            </h1>

            <p className="text-base md:text-lg text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
              Work alongside a project-focused team, contribute to practical software development,
              strengthen your technical skills, and gain experience working with real-world tools
              and workflows.
            </p>

            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              Apply Now
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. PROGRAM BENEFITS & UNPAID DISCLOSURE                   */}
        {/* ========================================================= */}
        <section className="py-16 md:py-24 bg-surface">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                What You&apos;ll Gain
              </h2>
              <p className="text-muted text-sm md:text-base max-w-xl mx-auto">
                This program is designed to give students and learners meaningful, portfolio-ready experience.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {BENEFITS.map((b, i) => (
                <div
                  key={i}
                  className="bg-card border border-subtle rounded-xl p-6 hover:border-primary/30 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <b.icon size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-2">{b.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>

            {/* Unpaid Disclosure Card */}
            <div className="mt-8 p-4 bg-card border border-amber-500/20 rounded-xl max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-muted leading-relaxed">
                  <p className="font-semibold text-foreground mb-1">Important Disclosure</p>
                  <p>
                    This is an <strong className="text-foreground">unpaid opportunity</strong> — no stipend is provided.
                    A certificate is awarded only after <strong className="text-foreground">successful completion</strong> and
                    fulfillment of the program requirements. Applying does not guarantee selection, employment, or placement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. REQUIRED SKILLS: TECHNOLOGIES WE WORK WITH             */}
        {/* ========================================================= */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                <Check size={13} />
                Foundational Stack • Required Skills
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Technologies We Work With
              </h2>
              <p className="text-muted text-sm md:text-base max-w-2xl mx-auto">
                Applicants should have foundational knowledge in relevant areas and a willingness to learn,
                collaborate, and contribute. You don&apos;t need to be an expert in every technology, but you should be capable of building software using these stacks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {REQUIRED_SKILL_CATEGORIES.map((cat) => (
                <div
                  key={cat.name}
                  className="bg-card border border-subtle rounded-xl p-6 hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-lg ${cat.bgColor} ${cat.color} flex items-center justify-center`}>
                      <cat.icon size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{cat.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cat.skills.map((skill) => (
                      <span
                        key={skill}
                        className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg ${cat.bgColor} ${cat.color} border ${cat.borderColor}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. PREFERRED SKILLS — AN ADDED ADVANTAGE                 */}
        {/* ========================================================= */}
        <section className="py-16 md:py-24 bg-surface/50 border-y border-subtle relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3">
                <Sparkles size={13} />
                Preferred, Not Mandatory
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Preferred Skills — An Added Advantage
              </h2>
              <p className="text-muted text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                Applicants with knowledge or practical experience in the following areas may have an advantage during selection.
                These skills are <strong className="text-foreground">preferred, not mandatory</strong> — applicants without AWS/Cloud or AI/ML experience are <strong className="text-foreground">not</strong> disqualified.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PREFERRED_SKILLS_DATA.map((pref) => (
                <div
                  key={pref.title}
                  className={`bg-card border ${pref.borderColor} rounded-2xl p-6 md:p-8 hover:border-cyan-500/40 transition-all shadow-sm hover:shadow-cyan-500/5 relative flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl ${pref.iconBg} ${pref.iconColor} flex items-center justify-center`}>
                          <pref.icon size={22} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-foreground">{pref.title}</h3>
                          <span className="inline-block text-[11px] font-medium text-cyan-400">
                            {pref.badge}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs md:text-sm text-muted mb-6 leading-relaxed">
                      {pref.description}
                    </p>

                    <div className="space-y-3 mb-6">
                      {pref.topics.map((t, idx) => (
                        <div key={idx} className="bg-surface/80 border border-subtle/80 rounded-lg p-3">
                          <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            {t.label}
                          </p>
                          <p className="text-[11px] text-muted leading-relaxed pl-3">
                            {t.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="pt-4 border-t border-subtle flex flex-wrap gap-1.5">
                      {pref.pills.map((pill) => (
                        <span
                          key={pill}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-surface text-muted border border-subtle"
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reassurance Callout */}
            <div className="mt-8 p-4 bg-card border border-subtle rounded-xl max-w-3xl mx-auto flex items-start gap-3">
              <Lightbulb size={18} className="text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-xs text-muted leading-relaxed">
                <strong className="text-foreground">Please Note:</strong> AWS/Cloud and AI/ML skills are optional enhancements.
                If you excel in our required core technologies (Git, Jira, Python, JavaScript, modern frameworks, or databases),
                your application will receive full, unbiased consideration.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. HONEST WARNING: INDEPENDENT WORK WITHOUT A MENTOR     */}
        {/* ========================================================= */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-card border-2 border-amber-500/30 rounded-2xl p-6 sm:p-8 md:p-10 shadow-lg shadow-amber-500/5 relative overflow-hidden">
              {/* Subtle top indicator bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-primary to-amber-500" />

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                    Expectations & Working Environment
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    Important: Be Ready to Learn Independently
                  </h2>
                </div>
              </div>

              {/* Exact Primary Disclosure */}
              <div className="space-y-4 text-xs sm:text-sm text-foreground/90 leading-relaxed bg-surface/70 border border-amber-500/20 rounded-xl p-5 mb-8">
                <p>
                  This program is designed to provide exposure to real-world software development and collaborative project workflows. Please understand that <strong className="text-amber-300 font-semibold underline decoration-amber-500/50 underline-offset-2">a dedicated mentor will not be assigned to you</strong>.
                </p>
                <p>
                  As a result, you may face difficulties at the beginning while understanding the codebase, solving unfamiliar problems, debugging errors, and adapting to real-world development practices. You will be expected to research independently, read documentation, troubleshoot issues, manage your tasks, and take responsibility for your progress.
                </p>
                <p>
                  However, with consistency, discipline, patience, a willingness to learn, and leadership qualities, these challenges can become valuable learning experiences. This opportunity is best suited for learners who are comfortable taking initiative and working independently.
                </p>
              </div>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-surface border border-subtle">
                  <div className="flex items-center gap-2 mb-2 text-foreground font-semibold text-xs">
                    <AlertTriangle size={15} className="text-amber-400" />
                    No Assigned 1-on-1 Mentor
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    You participate in collaborative team workflows and shared task channels, but no one will tutor, lecture, or hold your hand through daily tasks.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-subtle">
                  <div className="flex items-center gap-2 mb-2 text-foreground font-semibold text-xs">
                    <Compass size={15} className="text-sky-400" />
                    Self-Reliant Problem-Solving
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Expect to read documentation, debug errors independently, search GitHub discussions, and experiment before asking teammates for high-level guidance.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-subtle">
                  <div className="flex items-center gap-2 mb-2 text-foreground font-semibold text-xs">
                    <Users size={15} className="text-emerald-400" />
                    Collaborative Workflows
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Work happens through pull requests, code reviews, and issue boards. Professional communication and task updates are expected.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-subtle">
                  <div className="flex items-center gap-2 mb-2 text-foreground font-semibold text-xs">
                    <Award size={15} className="text-purple-400" />
                    Discipline, Patience & Ownership
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Learners who take initiative, stick through initial frustration, and take ownership of their tickets get the greatest long-term growth.
                  </p>
                </div>
              </div>

              {/* Unpaid Program Disclosure & Realistic Disclaimer */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-muted space-y-2">
                <p className="text-foreground font-medium flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-amber-400" />
                  Program Policies & Terms
                </p>
                <p>
                  • <strong className="text-foreground">No stipend is provided.</strong> This is strictly an unpaid learning and contribution opportunity.
                </p>
                <p>
                  • A certificate may be awarded <strong className="text-foreground">only after successful completion and fulfillment of program requirements</strong>.
                </p>
                <p>
                  • Applying or participating <strong className="text-foreground">does not guarantee selection, employment, job placement, or certification</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. REAL-WORLD CORPORATE EXPERIENCE & GITHUB               */}
        {/* ========================================================= */}
        <section className="py-16 md:py-24 bg-surface">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
                <Briefcase size={13} />
                Practical Corporate Exposure
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">
                Experience the Reality of Real-World Development
              </h2>
              <div className="max-w-3xl mx-auto space-y-4 text-sm text-muted leading-relaxed text-center sm:text-left bg-card border border-subtle rounded-2xl p-6 sm:p-8">
                <p>
                  This opportunity is intended to help learners understand how software development works beyond classroom exercises and personal projects. By contributing to real-world projects, you can gain practical exposure to task management, version control, debugging, code organization, collaboration, and the challenges involved in delivering working software.
                </p>
                <p>
                  Your contributions may also strengthen your GitHub profile by giving you relevant project work to showcase. Where project ownership, confidentiality, and organizational policies permit, you can highlight your contributions, explain the problems you solved, and demonstrate your development workflow to future recruiters.
                </p>
              </div>
            </div>

            {/* Practical Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {REAL_WORLD_HIGHLIGHTS.map((item, i) => (
                <div
                  key={i}
                  className="bg-card border border-subtle rounded-xl p-6 hover:border-primary/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <item.icon size={20} />
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-xs text-muted leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Scope & Employment Disclaimer */}
            <div className="mt-8 p-4 bg-card border border-subtle rounded-xl max-w-3xl mx-auto text-xs text-muted leading-relaxed">
              <p>
                <strong className="text-foreground">Disclosure on Portfolio & Placement:</strong> While participants gain practical exposure, participation does not guarantee employment, corporate placement, or that every piece of project work will be publicly hostable on personal GitHub profiles due to confidentiality and organizational policies.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. LEARNER EXPERIENCES / TESTIMONIALS (ILLUSTRATIVE)     */}
        {/* ========================================================= */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-3">
                <Quote size={13} />
                Participant Perspective & Insights
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Learner Experiences
              </h2>
              <p className="text-muted text-sm md:text-base max-w-2xl mx-auto">
                Hear how practical project work can help learners understand real-world development, overcome challenges, and grow as contributors.
              </p>
            </div>



            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ILLUSTRATIVE_TESTIMONIALS.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-subtle rounded-2xl p-6 flex flex-col justify-between hover:border-sky-500/30 transition-all shadow-sm"
                >
                  <div>
                    {/* Header: Name, feedback*/}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{item.name}</h3>
                      </div>
                    </div>

                    {/* Quote */}
                    <div className="relative mb-6">
                      <Quote size={16} className="text-muted/30 mb-1" />
                      <p className="text-xs text-foreground/90 leading-relaxed italic">
                        &ldquo;{item.feedback}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 8. APPLICATION FORM                                      */}
        {/* ========================================================= */}
        <section className="py-16 md:py-24 bg-surface" ref={formRef} id="apply">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Apply to the Program
              </h2>
              <p className="text-muted text-sm md:text-base max-w-lg mx-auto">
                Fill out the form below. All fields marked with <span className="text-red-400">*</span> are required.
              </p>
              <div className="mt-3">
                <Link
                  href="/my-applications"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary-dark font-medium transition-colors"
                >
                  <span>Already applied? Track your status in My Applications</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* Success State */}
            {submitResult?.success ? (
              <div className="bg-card border border-emerald-500/30 rounded-2xl p-8 text-center space-y-4 animate-in fade-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="text-lg font-bold text-foreground">Application Received!</h3>
                <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
                  {submitResult.message}
                </p>
                <div className="pt-2">
                  <Link
                    href="/my-applications"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-semibold transition-all shadow-md"
                  >
                    <span>View Status in My Applications</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1.5 animate-in fade-in">
                    <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                      <AlertCircle size={14} /> Please fix the following:
                    </p>
                    {validationErrors.map((err, i) => (
                      <p key={i} className="text-xs text-red-300 pl-5">• {err}</p>
                    ))}
                  </div>
                )}

                {/* Error Result */}
                {submitResult && !submitResult.success && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{submitResult.message}</span>
                  </div>
                )}

                {/* Personal Information */}
                <fieldset className="bg-card border border-subtle rounded-xl p-5 space-y-4">
                  <legend className="text-xs font-bold text-foreground uppercase tracking-wider px-2">
                    Personal Information
                  </legend>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="fullName" className="block text-xs font-semibold text-foreground mb-1.5">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => updateField("fullName", e.target.value)}
                        placeholder="John Doe"
                        maxLength={200}
                        required
                        className="w-full bg-surface border border-subtle rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold text-foreground mb-1.5">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="john@example.com"
                        maxLength={320}
                        required
                        className="w-full bg-surface border border-subtle rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold text-foreground mb-1.5">
                      Phone Number <span className="text-muted text-[10px]">(optional)</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      maxLength={20}
                      className="w-full bg-surface border border-subtle rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                    />
                  </div>
                </fieldset>

                {/* Academic Information */}
                <fieldset className="bg-card border border-subtle rounded-xl p-5 space-y-4">
                  <legend className="text-xs font-bold text-foreground uppercase tracking-wider px-2">
                    Academic Information
                  </legend>

                  <div>
                    <label htmlFor="institution" className="block text-xs font-semibold text-foreground mb-1.5">
                      College / Institution <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="institution"
                      type="text"
                      value={formData.institution}
                      onChange={(e) => updateField("institution", e.target.value)}
                      placeholder="University of Technology"
                      maxLength={300}
                      required
                      className="w-full bg-surface border border-subtle rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="course" className="block text-xs font-semibold text-foreground mb-1.5">
                        Course / Degree <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="course"
                        type="text"
                        value={formData.course}
                        onChange={(e) => updateField("course", e.target.value)}
                        placeholder="B.Tech Computer Science"
                        maxLength={200}
                        required
                        className="w-full bg-surface border border-subtle rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="currentYear" className="block text-xs font-semibold text-foreground mb-1.5">
                        Year / Semester <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="currentYear"
                        type="text"
                        value={formData.currentYear}
                        onChange={(e) => updateField("currentYear", e.target.value)}
                        placeholder="3rd Year / 6th Semester"
                        maxLength={50}
                        required
                        className="w-full bg-surface border border-subtle rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Skills Selection */}
                <fieldset className="bg-card border border-subtle rounded-xl p-5 space-y-4">
                  <legend className="text-xs font-bold text-foreground uppercase tracking-wider px-2">
                    Skills & Technologies <span className="text-red-400">*</span>
                  </legend>

                  <p className="text-[11px] text-muted">
                    Select your foundational technologies. If you have experience in AWS/Cloud or AI/ML, you may also include them as an added advantage.
                  </p>

                  {/* Dropdown toggle */}
                  <button
                    type="button"
                    onClick={() => setIsSkillsOpen(!isSkillsOpen)}
                    className="w-full flex items-center justify-between bg-surface border border-subtle rounded-lg px-3.5 py-2.5 text-xs text-foreground hover:border-primary/30 transition-colors"
                  >
                    <span className={formData.skills.length > 0 ? "text-foreground font-medium" : "text-muted"}>
                      {formData.skills.length > 0
                        ? `${formData.skills.length} skill${formData.skills.length > 1 ? "s" : ""} selected`
                        : "Select your skills..."}
                    </span>
                    <ChevronDown size={14} className={`text-muted transition-transform ${isSkillsOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Skills Grid */}
                  {isSkillsOpen && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-1 pt-2">
                      {FORM_SKILL_CATEGORIES.map((cat) => (
                        <div key={cat.name} className="p-3 rounded-lg bg-surface/50 border border-subtle/60">
                          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <cat.icon size={12} className={cat.color} />
                            {cat.name}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {cat.skills.map((skill) => {
                              const selected = formData.skills.includes(skill);
                              return (
                                <button
                                  key={skill}
                                  type="button"
                                  onClick={() => toggleSkill(skill)}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${selected
                                    ? "bg-primary/15 text-primary border-primary/40 shadow-sm"
                                    : "bg-surface text-muted border-subtle hover:border-primary/20 hover:text-foreground"
                                    }`}
                                >
                                  {selected && <CheckCircle2 size={11} className="inline mr-1 -mt-px text-primary" />}
                                  {skill}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Skills Summary */}
                  {formData.skills.length > 0 && !isSkillsOpen && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formData.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 rounded-md"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className="hover:text-red-400 transition-colors ml-0.5 text-xs"
                            aria-label={`Remove ${skill}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </fieldset>

                {/* Profile Links */}
                <fieldset className="bg-card border border-subtle rounded-xl p-5 space-y-4">
                  <legend className="text-xs font-bold text-foreground uppercase tracking-wider px-2">
                    Profile Links
                  </legend>

                  <div>
                    <label htmlFor="githubUrl" className="block text-xs font-semibold text-foreground mb-1.5">
                      GitHub Profile URL <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="githubUrl"
                      type="url"
                      value={formData.githubUrl}
                      onChange={(e) => updateField("githubUrl", e.target.value)}
                      placeholder="https://github.com/username"
                      maxLength={500}
                      required
                      className="w-full bg-surface border border-subtle rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="linkedinUrl" className="block text-xs font-semibold text-foreground mb-1.5">
                        LinkedIn URL <span className="text-muted text-[10px]">(optional)</span>
                      </label>
                      <input
                        id="linkedinUrl"
                        type="url"
                        value={formData.linkedinUrl}
                        onChange={(e) => updateField("linkedinUrl", e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        maxLength={500}
                        className="w-full bg-surface border border-subtle rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="portfolioUrl" className="block text-xs font-semibold text-foreground mb-1.5">
                        Portfolio / Project URL <span className="text-muted text-[10px]">(optional)</span>
                      </label>
                      <input
                        id="portfolioUrl"
                        type="url"
                        value={formData.portfolioUrl}
                        onChange={(e) => updateField("portfolioUrl", e.target.value)}
                        placeholder="https://myportfolio.com"
                        maxLength={500}
                        className="w-full bg-surface border border-subtle rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Motivation */}
                <fieldset className="bg-card border border-subtle rounded-xl p-5 space-y-4">
                  <legend className="text-xs font-bold text-foreground uppercase tracking-wider px-2">
                    Motivation
                  </legend>

                  <div>
                    <label htmlFor="motivation" className="block text-xs font-semibold text-foreground mb-1.5">
                      Why do you want to join this program? <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="motivation"
                      value={formData.motivation}
                      onChange={(e) => updateField("motivation", e.target.value)}
                      placeholder="Tell us about your goals, how you plan to manage independent problem-solving, and what you hope to contribute..."
                      maxLength={2000}
                      rows={5}
                      required
                      className="w-full bg-surface border border-subtle rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors resize-y min-h-[100px]"
                    />
                    <p className="text-[10px] text-muted mt-1">
                      {formData.motivation.length} / 2000 characters
                    </p>
                  </div>
                </fieldset>

                {/* Acknowledgment */}
                <div className="bg-card border border-subtle rounded-xl p-5">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.unpaidAcknowledged}
                      onChange={(e) => updateField("unpaidAcknowledged", e.target.checked)}
                      required
                      className="mt-0.5 w-4 h-4 rounded border-subtle bg-surface text-primary focus:ring-primary/50 shrink-0 accent-primary"
                    />
                    <span className="text-xs text-muted leading-relaxed group-hover:text-foreground transition-colors">
                      I understand that this is an <strong className="text-foreground">unpaid learning and contribution opportunity</strong> with <strong className="text-foreground">no dedicated mentor assigned</strong>.
                      No stipend is provided, and a certificate is awarded only after successful completion and fulfillment of the program requirements.
                      Applying does not guarantee selection or placement. <span className="text-red-400">*</span>
                    </span>
                  </label>
                </div>

                {/* Privacy Notice */}
                <div className="text-[10px] text-muted leading-relaxed text-center px-4">
                  By submitting this application, you agree that the information provided will be used to evaluate your application
                  and to communicate with you regarding the Learner Contributor Program. Your data will not be shared publicly.
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Application
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
