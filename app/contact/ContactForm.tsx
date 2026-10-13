"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  MessageSquare,
  HelpCircle,
  Briefcase,
  Code2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface ContactFormData {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

const INITIAL_FORM: ContactFormData = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const updateField = useCallback(
    <K extends keyof ContactFormData>(field: K, value: ContactFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (validationErrors.length > 0) setValidationErrors([]);
      if (result) setResult(null);
    },
    [validationErrors.length, result]
  );

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      errs.push("Full name is required (minimum 2 characters).");
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.push("A valid email address is required.");
    }
    if (!formData.subject.trim() || formData.subject.trim().length < 3) {
      errs.push("Subject is required (minimum 3 characters).");
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errs.push("Message must be at least 10 characters long.");
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const clientErrors = validate();
    if (clientErrors.length > 0) {
      setValidationErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);
    setResult(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details && Array.isArray(data.details)) {
          setValidationErrors(data.details);
        } else {
          setResult({
            success: false,
            message: data.error || "Failed to submit message. Please try again.",
          });
        }
        return;
      }

      setResult({
        success: true,
        message: data.message || "Message sent successfully!",
      });
      setFormData(INITIAL_FORM);
    } catch {
      setResult({
        success: false,
        message: "A network error occurred. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Contact Form Column */}
      <div className="lg:col-span-7">
        <div className="bg-card border border-subtle rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-1.5 flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" />
              Send Us a Message
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Have questions about generating websites, deploying to the edge, technical issues, or the Contributor Program? We&apos;d love to hear from you.
            </p>
          </div>

          {result?.success ? (
            <div className="bg-surface border border-emerald-500/30 rounded-xl p-8 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-lg font-bold text-foreground">Message Delivered!</h3>
              <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
                {result.message}
              </p>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline pt-2"
              >
                Send another message &rarr;
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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

              {/* Server Error */}
              {result && !result.success && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{result.message}</span>
                </div>
              )}

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
                  placeholder="Alex Rivera"
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
                  placeholder="alex@example.com"
                  maxLength={320}
                  required
                  className="w-full bg-surface border border-subtle rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-xs font-semibold text-foreground mb-1.5">
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  placeholder="Question about Cloudflare Pages deployment or billing..."
                  maxLength={200}
                  required
                  className="w-full bg-surface border border-subtle rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-xs font-semibold text-foreground mb-1.5">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  placeholder="Provide details about your inquiry, bug report, or feedback..."
                  maxLength={3000}
                  rows={5}
                  required
                  className="w-full bg-surface border border-subtle rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors resize-y min-h-[120px]"
                />
                <p className="text-[10px] text-muted mt-1">
                  {formData.message.length} / 3000 characters (minimum 10)
                </p>
              </div>

              {/* Privacy Notice */}
              <p className="text-[11px] text-muted leading-relaxed">
                We respect your privacy. Submitting this form will only be used to answer your inquiry. See our{" "}
                <Link href="/privacy-policy" className="text-foreground underline hover:text-primary">
                  Privacy Policy
                </Link>.
              </p>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending Message...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Helpful Context & Sidebar Column */}
      <div className="lg:col-span-5 space-y-6">
        {/* Support Topics */}
        <div className="bg-card border border-subtle rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground">Frequently Inquired Topics</h3>

          <div className="space-y-3">
            <div className="p-3 bg-surface rounded-xl border border-subtle">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                <Code2 size={14} className="text-teal-400" />
                Prompting &amp; Generation Help
              </p>
              <p className="text-[11px] text-muted leading-relaxed">
                Check our documentation for tips on crafting detailed prompts and structuring sections.
              </p>
              <Link href="/docs" className="inline-flex items-center gap-1 text-[11px] text-teal-400 font-medium hover:underline mt-1.5">
                Read Documentation &rarr;
              </Link>
            </div>

            <div className="p-3 bg-surface rounded-xl border border-subtle">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                <Briefcase size={14} className="text-primary" />
                Careers &amp; Contributor Program
              </p>
              <p className="text-[11px] text-muted leading-relaxed">
                Want to apply to our Learner Contributor Program? Submit your details directly on the Careers page.
              </p>
              <Link href="/careers" className="inline-flex items-center gap-1 text-[11px] text-primary font-medium hover:underline mt-1.5">
                Go to Careers Page &rarr;
              </Link>
            </div>

            <div className="p-3 bg-surface rounded-xl border border-subtle">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                <HelpCircle size={14} className="text-sky-400" />
                Common Questions &amp; Edge Hosting
              </p>
              <p className="text-[11px] text-muted leading-relaxed">
                Find answers about version rollbacks, Cloudflare Pages hosting, and SSL certificates.
              </p>
              <Link href="/faq" className="inline-flex items-center gap-1 text-[11px] text-sky-400 font-medium hover:underline mt-1.5">
                Browse FAQ &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Verified Social Channels */}
        <div className="bg-card border border-subtle rounded-2xl p-6">
          <h3 className="text-sm font-bold text-foreground mb-2">Connect on Social</h3>
          <p className="text-xs text-muted leading-relaxed mb-4">
            Follow product updates, new releases, and developer discussions through our verified channels:
          </p>

          <div className="space-y-2">
            <a
              href="https://x.com/Abash_Ansari21?t=g8ZINRYA9Bd8RJcVg7jS-A&s=09"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-lg bg-surface hover:bg-surface/80 border border-subtle text-xs text-foreground transition-colors group"
            >
              <span>X (formerly Twitter)</span>
              <ExternalLink size={13} className="text-muted group-hover:text-foreground transition-colors" />
            </a>

            <a
              href="https://www.linkedin.com/in/abash-ansari-0bb191326/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-lg bg-surface hover:bg-surface/80 border border-subtle text-xs text-foreground transition-colors group"
            >
              <span>LinkedIn</span>
              <ExternalLink size={13} className="text-muted group-hover:text-foreground transition-colors" />
            </a>

            <a
              href="https://www.instagram.com/abash_21ansari"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-lg bg-surface hover:bg-surface/80 border border-subtle text-xs text-foreground transition-colors group"
            >
              <span>Instagram</span>
              <ExternalLink size={13} className="text-muted group-hover:text-foreground transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
