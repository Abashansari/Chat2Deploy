import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { FileText, ChevronRight, AlertCircle, ShieldAlert, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — Chat2Deploy",
  description:
    "Read the Terms of Service for Chat2Deploy. Learn about user responsibilities, AI generation guidelines, acceptable use, edge hosting limitations, and Contributor Program terms.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "October 13, 2026";
  const effectiveDate = "October 13, 2026";

  const SECTIONS = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "eligibility-accounts", title: "2. Eligibility & Account Security" },
    { id: "platform-services", title: "3. Platform Description & Capabilities" },
    { id: "ai-generated-content", title: "4. AI-Generated Output & User Review" },
    { id: "intellectual-property", title: "5. Intellectual Property & Ownership" },
    { id: "acceptable-use", title: "6. Acceptable Use & Prohibited Activities" },
    { id: "hosting-deployments", title: "7. Edge Hosting & Deployment Terms" },
    { id: "contributor-program", title: "8. Learner Contributor Program Terms" },
    { id: "disclaimers", title: "9. Disclaimers & Limitation of Liability" },
    { id: "termination-modifications", title: "10. Termination, Modifications & Contact" },
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background text-foreground pt-12 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight size={14} />
            <span className="text-foreground font-medium">Terms of Service</span>
          </div>

          {/* Header */}
          <div className="mb-10 pb-8 border-b border-subtle">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
              <FileText size={13} />
              Platform Agreement &amp; Acceptable Use
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
              Terms of Service
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
              <span><strong>Effective Date:</strong> {effectiveDate}</span>
              <span>•</span>
              <span><strong>Last Updated:</strong> {lastUpdated}</span>
            </div>
          </div>

          {/* Legal Review Draft Notice */}
          <div className="mb-10 p-4 bg-card border border-amber-500/30 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-muted leading-relaxed">
              <strong className="text-foreground block mb-0.5">Operational Draft Notice:</strong>
              These Terms of Service outline the current operating policies, AI generation safeguards, and hosting conditions for Chat2Deploy. They reflect the actual system functionality and should be reviewed by legal counsel prior to formal commercial deployment.
            </div>
          </div>

          {/* Table of Contents */}
          <div className="mb-12 p-6 bg-surface rounded-2xl border border-subtle">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              Table of Contents
            </h2>
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SECTIONS.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1.5 py-1"
                >
                  <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                  {sec.title}
                </a>
              ))}
            </nav>
          </div>

          {/* Terms Content */}
          <div className="space-y-12 text-sm text-foreground/90 leading-relaxed">
            {/* Section 1 */}
            <section id="acceptance" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                1. Acceptance of Terms
              </h2>
              <p className="text-muted leading-relaxed mb-3">
                By visiting, accessing, or using Chat2Deploy (&ldquo;the Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, you must discontinue using the platform.
              </p>
              <p className="text-muted leading-relaxed">
                Your use of Chat2Deploy is also governed by our{" "}
                <Link href="/privacy-policy" className="text-primary underline">
                  Privacy Policy
                </Link>
                , which describes our data handling, authentication, and processing practices.
              </p>
            </section>

            {/* Section 2 */}
            <section id="eligibility-accounts" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                2. Eligibility &amp; Account Security
              </h2>
              <p className="text-muted leading-relaxed mb-3">
                You must be at least 13 years old (or the legal age of digital consent in your jurisdiction) to use Chat2Deploy.
              </p>
              <p className="text-muted leading-relaxed">
                When you create an account, you agree to provide accurate information and keep your credentials secure. You are solely responsible for all activities and project generations occurring under your account. If you suspect unauthorized access, you must notify us immediately via our <Link href="/contact" className="text-primary underline">Contact page</Link>.
              </p>
            </section>

            {/* Section 3 */}
            <section id="platform-services" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                3. Platform Description &amp; Capabilities
              </h2>
              <p className="text-muted leading-relaxed mb-3">
                Chat2Deploy provides an integrated workspace where users can:
              </p>
              <ul className="space-y-1.5 text-xs text-muted leading-relaxed list-disc pl-5 mb-3">
                <li>Submit natural-language prompts to generate website code (HTML, CSS, and JavaScript).</li>
                <li>Preview generated websites in real-time inside an interactive browser preview.</li>
                <li>Modify components, layouts, or copy iteratively through conversational chat.</li>
                <li>Track and restore earlier version snapshots of their project code.</li>
                <li>Deploy static website files to a public edge network powered by Cloudflare Pages.</li>
              </ul>
              <p className="text-muted leading-relaxed">
                We continuously refine our platform, features, and model integrations. We reserve the right to modify, update, or discontinue features with or without notice.
              </p>
            </section>

            {/* Section 4 */}
            <section id="ai-generated-content" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                4. AI-Generated Output &amp; User Review
              </h2>
              <p className="text-muted leading-relaxed mb-3">
                Chat2Deploy utilizes Google Gemini and third-party large language models to produce web code. Generative artificial intelligence is an evolving technology and outputs are probabilistic in nature.
              </p>
              <div className="p-4 bg-card border border-subtle rounded-xl space-y-2 mb-3">
                <p className="text-xs text-foreground font-semibold">Important User Responsibilities:</p>
                <p className="text-xs text-muted leading-relaxed">
                  • <strong className="text-foreground">Verify Before Publishing:</strong> You are solely responsible for reviewing, testing, and confirming the safety, accuracy, functionality, and legality of any code generated by the AI before publishing or sharing it.
                </p>
                <p className="text-xs text-muted leading-relaxed">
                  • <strong className="text-foreground">No Guarantee of Perfection:</strong> AI outputs may contain syntax errors, formatting inconsistencies, broken hyperlinks, or outdated library references. We make no warranty that generated code will be error-free or suitable for any specific commercial or legal purpose.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="intellectual-property" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                5. Intellectual Property &amp; Ownership
              </h2>
              <p className="text-muted leading-relaxed mb-3">
                • <strong className="text-foreground">Your Prompts &amp; Content:</strong> You retain ownership of the original text prompts, descriptions, and uploaded assets you provide to Chat2Deploy.
              </p>
              <p className="text-muted leading-relaxed mb-3">
                • <strong className="text-foreground">Generated Code:</strong> To the maximum extent permitted by applicable law and subject to the underlying terms of our AI providers (such as Google Generative AI), you may use, modify, export, and host the code generated for your projects.
              </p>
              <p className="text-muted leading-relaxed">
                • <strong className="text-foreground">Chat2Deploy Platform IP:</strong> The Chat2Deploy name, logo, UI designs, editor layout, database schemas, and proprietary backend orchestration code remain the exclusive intellectual property of Chat2Deploy.
              </p>
            </section>

            {/* Section 6 */}
            <section id="acceptable-use" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                6. Acceptable Use &amp; Prohibited Activities
              </h2>
              <p className="text-muted leading-relaxed mb-3">
                You agree not to misuse Chat2Deploy or use it for harmful purposes. You must not:
              </p>
              <ul className="space-y-1.5 text-xs text-muted leading-relaxed list-disc pl-5">
                <li>Generate or host phishing websites, credential harvesters, scams, or fraudulent landing pages.</li>
                <li>Generate or distribute malware, spyware, ransomware, keyloggers, or malicious scripts.</li>
                <li>Attempt to bypass API rate limits, scrape platform infrastructure, or launch denial-of-service attacks.</li>
                <li>Deploy hate speech, harassment, illegal pornography, or copyright-infringing assets.</li>
                <li>Reverse-engineer backend API routes or exploit application vulnerabilities.</li>
              </ul>
              <p className="text-xs text-muted leading-relaxed mt-3">
                We reserve the right to suspend or terminate accounts and remove deployed sites that violate these acceptable use standards.
              </p>
            </section>

            {/* Section 7 */}
            <section id="hosting-deployments" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                7. Edge Hosting &amp; Deployment Terms
              </h2>
              <p className="text-muted leading-relaxed mb-3">
                When you trigger a live deployment, your static files are uploaded to Cloudflare Pages.
              </p>
              <div className="space-y-2 text-xs text-muted leading-relaxed">
                <p>
                  • Deployments are provided on an &ldquo;as is&rdquo; basis subject to Cloudflare&apos;s global network uptime, routing, and operational policies.
                </p>
                <p>
                  • Published URLs are publicly accessible on the internet. You are responsible for the content published under your deployment URLs.
                </p>
                <p>
                  • You can delete or roll back deployments from your project dashboard at any time.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="contributor-program" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                8. Learner Contributor Program Terms
              </h2>
              <div className="p-5 rounded-xl bg-card border-2 border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                  <ShieldAlert size={16} />
                  Program Disclosures &amp; Clarifications
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed">
                  Chat2Deploy offers a Learner Contributor Program to provide students and learners with practical exposure to software development workflows. The following terms govern participation in this program:
                </p>
                <ul className="space-y-2 text-xs text-muted leading-relaxed list-disc pl-5">
                  <li>
                    <strong className="text-foreground">Unpaid Educational Opportunity:</strong> Participation is strictly unpaid. <strong className="text-foreground">No stipend, salary, wage, or monetary compensation is provided.</strong>
                  </li>
                  <li>
                    <strong className="text-foreground">No Dedicated Mentor Assigned:</strong> Participants work in a collaborative team repository with shared issue boards, but a dedicated one-on-one mentor is not assigned. Learners are expected to research independently, read documentation, troubleshoot errors, and manage tasks self-reliantly.
                  </li>
                  <li>
                    <strong className="text-foreground">Conditional Certification:</strong> A certificate of completion is awarded <strong className="text-foreground">only after successful completion and fulfillment of all program requirements</strong>. Applying does not guarantee selection, and participating does not guarantee certification.
                  </li>
                  <li>
                    <strong className="text-foreground">No Guarantee of Employment:</strong> Participation is an educational project experience and does not constitute an offer, guarantee, or promise of future employment, placement, or internship.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 9 */}
            <section id="disclaimers" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                9. Disclaimers &amp; Limitation of Liability
              </h2>
              <p className="text-muted leading-relaxed mb-3">
                TO THE FULLEST EXTENT PERMITTED BY LAW, CHAT2DEPLOY AND ITS OPERATORS PROVIDE THE SERVICE &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT ANY WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>
              <p className="text-muted leading-relaxed">
                IN NO EVENT SHALL CHAT2DEPLOY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA LOSS, INTERRUPTION OF BUSINESS, OR THIRD-PARTY HOSTING OUTAGES, ARISING FROM YOUR USE OR INABILITY TO USE THE PLATFORM.
              </p>
            </section>

            {/* Section 10 */}
            <section id="termination-modifications" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                10. Termination, Modifications &amp; Contact
              </h2>
              <p className="text-muted leading-relaxed mb-3">
                We may revise these Terms of Service periodically to reflect platform enhancements, operational changes, or legal updates. When changes are made, we will update the &ldquo;Last Updated&rdquo; date at the top of this page.
              </p>
              <p className="text-muted leading-relaxed mb-4">
                If you have questions regarding these Terms of Service, please reach out via our contact channels:
              </p>
              <div className="p-4 bg-card border border-subtle rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-foreground">Chat2Deploy Inquiries</p>
                  <p className="text-xs text-muted">Submit questions via our official contact form.</p>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
