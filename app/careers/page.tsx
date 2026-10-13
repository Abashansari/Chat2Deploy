"use client";

import { useState, useRef, useCallback } from "react";
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
} from "lucide-react";

// ---------- Skills Data ----------

const SKILL_CATEGORIES = [
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

const ALL_SKILLS = SKILL_CATEGORIES.flatMap((c) => c.skills);

const BENEFITS = [
  {
    icon: Briefcase,
    title: "Real-World Projects",
    description: "Gain practical experience contributing to production software used by real users.",
  },
  {
    icon: Users,
    title: "Collaborative Workflows",
    description: "Experience team-based software development with pull requests, code reviews, and agile workflows.",
  },
  {
    icon: GitBranch,
    title: "Git & Issue Tracking",
    description: "Work with industry-standard version control (Git), branching strategies, and issue tracking systems.",
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
    description: "Build a verifiable portfolio of contributions to real, deployed software projects.",
  },
];

// ---------- Form State ----------

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

// ---------- Page Component ----------

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
      // Clear errors when user starts editing
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
      } catch { errs.push("GitHub URL is not a valid URL."); }
    }
    if (formData.linkedinUrl.trim()) {
      try {
        const url = new URL(formData.linkedinUrl);
        if (url.hostname !== "linkedin.com" && !url.hostname.endsWith(".linkedin.com")) {
          errs.push("LinkedIn URL must be a linkedin.com URL.");
        }
      } catch { errs.push("LinkedIn URL is not a valid URL."); }
    }
    if (formData.portfolioUrl.trim()) {
      try {
        new URL(formData.portfolioUrl);
      } catch { errs.push("Portfolio URL is not a valid URL."); }
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
      <main className="flex-1 bg-background">
        {/* ---------- HERO SECTION ---------- */}
        <section
          className="relative w-full pt-20 pb-20 md:pt-28 md:pb-28 overflow-hidden"
          style={{ backgroundImage: "var(--hero-glow)" }}
        >
          {/* Decorative gradient orbs */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Briefcase size={13} />
              Learner Contributor Program
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight mb-5">
              Build Real Projects.{" "}
              <span className="bg-gradient-to-r from-primary to-sky-400 bg-clip-text text-transparent">
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

        {/* ---------- BENEFITS SECTION ---------- */}
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

            {/* Unpaid Disclosure */}
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

        {/* ---------- SKILLS SECTION ---------- */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Technologies We Work With
              </h2>
              <p className="text-muted text-sm md:text-base max-w-xl mx-auto">
                Applicants should have foundational knowledge in relevant areas and a willingness to learn,
                collaborate, and contribute. You don&apos;t need to be an expert in every technology.You must can build software using the stacks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SKILL_CATEGORIES.map((cat) => (
                <div
                  key={cat.name}
                  className={`bg-card border border-subtle rounded-xl p-6 hover:border-primary/20 transition-colors`}
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

        {/* ---------- APPLICATION FORM ---------- */}
        <section className="py-16 md:py-24 bg-surface" ref={formRef} id="apply">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Apply to the Program
              </h2>
              <p className="text-muted text-sm md:text-base max-w-lg mx-auto">
                Fill out the form below. All fields marked with <span className="text-red-400">*</span> are required.
              </p>
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
                {submitResult.emailWarning && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{submitResult.emailWarning}</span>
                  </div>
                )}
                <p className="text-xs text-muted">
                  Our team will review your submission and contact you if you are shortlisted.
                </p>
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
                  <legend className="text-xs font-bold text-foreground uppercase tracking-wider px-2">Personal Information</legend>

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
                  <legend className="text-xs font-bold text-foreground uppercase tracking-wider px-2">Academic Information</legend>

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

                  {/* Dropdown toggle */}
                  <button
                    type="button"
                    onClick={() => setIsSkillsOpen(!isSkillsOpen)}
                    className="w-full flex items-center justify-between bg-surface border border-subtle rounded-lg px-3.5 py-2.5 text-xs text-foreground hover:border-primary/30 transition-colors"
                  >
                    <span className={formData.skills.length > 0 ? "text-foreground" : "text-muted"}>
                      {formData.skills.length > 0
                        ? `${formData.skills.length} skill${formData.skills.length > 1 ? "s" : ""} selected`
                        : "Select your skills..."}
                    </span>
                    <ChevronDown size={14} className={`text-muted transition-transform ${isSkillsOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Skills Grid */}
                  {isSkillsOpen && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                      {SKILL_CATEGORIES.map((cat) => (
                        <div key={cat.name}>
                          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">{cat.name}</p>
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
                                  {selected && <CheckCircle2 size={11} className="inline mr-1 -mt-px" />}
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
                    <div className="flex flex-wrap gap-1.5">
                      {formData.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 rounded-md"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className="hover:text-red-400 transition-colors ml-0.5"
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
                  <legend className="text-xs font-bold text-foreground uppercase tracking-wider px-2">Profile Links</legend>

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
                  <legend className="text-xs font-bold text-foreground uppercase tracking-wider px-2">Motivation</legend>

                  <div>
                    <label htmlFor="motivation" className="block text-xs font-semibold text-foreground mb-1.5">
                      Why do you want to join this program? <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="motivation"
                      value={formData.motivation}
                      onChange={(e) => updateField("motivation", e.target.value)}
                      placeholder="Tell us about your goals, what you hope to learn, and how you plan to contribute..."
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
                      I understand that this is an <strong className="text-foreground">unpaid learning and contribution opportunity</strong>.
                      No stipend is provided, and a certificate is awarded only after successful completion and fulfillment of the program requirements.
                      Applying does not guarantee selection. <span className="text-red-400">*</span>
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
