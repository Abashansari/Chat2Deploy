import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ShieldCheck, ChevronRight, AlertCircle, Lock, Server, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — Chat2Deploy",
  description:
    "Review Chat2Deploy's Privacy Policy. Understand what data we collect, how it is processed by our AI and hosting providers, and how your projects and accounts are handled.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "October 13, 2026";
  const effectiveDate = "October 13, 2026";

  const SECTIONS = [
    { id: "overview", title: "1. Overview & Operational Scope" },
    { id: "data-we-collect", title: "2. Information We Collect" },
    { id: "how-we-use", title: "3. How Information Is Used" },
    { id: "third-party-services", title: "4. Third-Party Processors & Providers" },
    { id: "ai-processing", title: "5. AI Model Processing & Prompts" },
    { id: "deployments-hosting", title: "6. Project Data & Public Edge Deployments" },
    { id: "cookies-sessions", title: "7. Cookies, Sessions & Local Storage" },
    { id: "retention-deletion", title: "8. Data Retention, Storage & Deletion" },
    { id: "security-measures", title: "9. Security Safeguards & Limitations" },
    { id: "user-rights", title: "10. User Rights & Contact Details" },
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
            <span className="text-foreground font-medium">Privacy Policy</span>
          </div>

          {/* Header */}
          <div className="mb-10 pb-8 border-b border-subtle">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-4">
              <ShieldCheck size={13} />
              Data Privacy &amp; Architecture Transparency
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
              Privacy Policy
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
              This Privacy Policy documents the actual technical architecture, database schemas, and third-party data flows currently implemented in Chat2Deploy. It is provided for user transparency and should be reviewed by legal counsel before formal commercial deployment.
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

          {/* Policy Content */}
          <div className="space-y-12 text-sm text-foreground/90 leading-relaxed">
            {/* Section 1 */}
            <section id="overview" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                1. Overview &amp; Operational Scope
              </h2>
              <p className="text-muted leading-relaxed mb-3">
                Chat2Deploy is a web application that enables users to generate, modify, and publish websites using natural language prompts powered by artificial intelligence.
              </p>
              <p className="text-muted leading-relaxed">
                This Privacy Policy explains how Chat2Deploy collects, stores, processes, and protects your personal data when you interact with our website, create an account, generate websites, submit inquiries, or apply to our Learner Contributor Program.
              </p>
            </section>

            {/* Section 2 */}
            <section id="data-we-collect" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                2. Information We Collect
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                We distinguish between information required to operate the service and optional details you choose to provide:
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-card border border-subtle">
                  <h3 className="text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                    A. Account &amp; Authentication Credentials (Required for Registered Accounts)
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    When you sign up or log in, we collect your email address and authentication credentials. Passwords are never stored in plaintext; they are securely hashed and managed through our Supabase Auth infrastructure. Session tokens are stored in secure HTTP-only cookies.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-card border border-subtle">
                  <h3 className="text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                    B. Prompts &amp; Website Generation Data (Required for Project Features)
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    To build websites, you provide conversational text prompts describing design layouts, styles, and features. We record these prompts, the resulting generated files (HTML, CSS, JavaScript), and version snapshots in our PostgreSQL database to enable your live preview and version rollback features.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-card border border-subtle">
                  <h3 className="text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                    C. Project Deployment Records (Required for Hosting Features)
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    When you publish a website to the live edge, we store the project name, generated deployment identifier, timestamp, and public Cloudflare Pages URL.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-card border border-subtle">
                  <h3 className="text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                    D. Contact Form &amp; Support Submissions (Voluntary)
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    When you submit a message via <Link href="/contact" className="text-primary underline">/contact</Link>, we collect your full name, email address, subject line, message text, and timestamp.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-card border border-subtle">
                  <h3 className="text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                    E. Careers &amp; Learner Contributor Program Applications (Voluntary)
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    When you apply via <Link href="/careers" className="text-primary underline">/careers</Link>, we collect your full name, email, phone number (optional), college/institution, course, year/semester, selected skill technologies, GitHub profile URL, optional LinkedIn/portfolio URLs, statement of motivation, and program terms acknowledgment.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-card border border-subtle">
                  <h3 className="text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                    F. Technical &amp; Operational Logs (Automatic)
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    To prevent denial-of-service attacks, spam, and brute force attempts, our server routes log client IP addresses, request headers, and timestamps for sliding-window rate limiting.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="how-we-use" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                3. How Information Is Used
              </h2>
              <ul className="space-y-2 text-xs text-muted leading-relaxed list-disc pl-5">
                <li><strong className="text-foreground">Service Delivery:</strong> To generate web code, render live previews, maintain version snapshots, and deploy projects to edge networks.</li>
                <li><strong className="text-foreground">Authentication &amp; Access Control:</strong> To authenticate your identity and restrict access to private projects via Row-Level Security (RLS).</li>
                <li><strong className="text-foreground">Communication:</strong> To respond to your contact requests and send application receipts or password reset links.</li>
                <li><strong className="text-foreground">Security &amp; Abuse Prevention:</strong> To rate limit API requests, prevent spam, block abusive behavior, and ensure system uptime.</li>
                <li><strong className="text-foreground">Application Evaluation:</strong> To review applicant qualifications for the Learner Contributor Program.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="third-party-services" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                4. Third-Party Processors &amp; Providers
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                Chat2Deploy does not sell your personal data. We utilize vetted infrastructure providers to deliver our core features. Data processed by these services is subject to their respective terms and privacy policies:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-card border border-subtle rounded-xl">
                  <h3 className="text-xs font-bold text-foreground mb-1">Google Gemini (Google Cloud)</h3>
                  <p className="text-[11px] text-muted leading-relaxed mb-2">
                    Used as our primary generative AI engine to interpret user design prompts and output structured web code.
                  </p>
                  <span className="text-[10px] text-primary">Role: AI Code Generation</span>
                </div>

                <div className="p-4 bg-card border border-subtle rounded-xl">
                  <h3 className="text-xs font-bold text-foreground mb-1">Supabase</h3>
                  <p className="text-[11px] text-muted leading-relaxed mb-2">
                    Provides PostgreSQL database persistence, authentication session management, and Row-Level Security.
                  </p>
                  <span className="text-[10px] text-teal-400">Role: Database &amp; Auth</span>
                </div>

                <div className="p-4 bg-card border border-subtle rounded-xl">
                  <h3 className="text-xs font-bold text-foreground mb-1">Cloudflare Pages</h3>
                  <p className="text-[11px] text-muted leading-relaxed mb-2">
                    Distributes and serves published static sites across Cloudflare&apos;s global CDN edge network with automatic SSL.
                  </p>
                  <span className="text-[10px] text-sky-400">Role: Global Edge Hosting</span>
                </div>

                <div className="p-4 bg-card border border-subtle rounded-xl">
                  <h3 className="text-xs font-bold text-foreground mb-1">Upstash Redis</h3>
                  <p className="text-[11px] text-muted leading-relaxed mb-2">
                    Provides server-side caching, rate limiting, and fallback queue persistence for high-availability operations.
                  </p>
                  <span className="text-[10px] text-amber-400">Role: High-Availability Cache</span>
                </div>

                <div className="p-4 bg-card border border-subtle rounded-xl col-span-1 sm:col-span-2">
                  <h3 className="text-xs font-bold text-foreground mb-1">Resend</h3>
                  <p className="text-[11px] text-muted leading-relaxed mb-2">
                    Delivers transactional emails, including contact confirmations and contributor application notifications.
                  </p>
                  <span className="text-[10px] text-purple-400">Role: Transactional Email Delivery</span>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="ai-processing" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                5. AI Model Processing &amp; Prompts
              </h2>
              <p className="text-muted leading-relaxed mb-3">
                When you request the generation or modification of a website, the prompt text you submit is sent securely over HTTPS to the Google Gemini API.
              </p>
              <p className="text-muted leading-relaxed">
                <strong className="text-foreground">Important Caution:</strong> Do not include sensitive personal data, unencrypted passwords, credit card numbers, or confidential proprietary secrets inside your website creation prompts. Generated code is returned to your project workspace and rendered inside a browser preview iframe.
              </p>
            </section>

            {/* Section 6 */}
            <section id="deployments-hosting" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                6. Project Data &amp; Public Edge Deployments
              </h2>
              <p className="text-muted leading-relaxed mb-3">
                Projects you create within Chat2Deploy remain private to your authenticated account while you are editing them in the workspace.
              </p>
              <p className="text-muted leading-relaxed">
                However, when you explicitly trigger the <strong className="text-foreground">&ldquo;Deploy&rdquo;</strong> action, the resulting static files are published to a public Cloudflare Pages URL. Anyone with that public URL will be able to view the published website. You can manage or delete your deployments directly from the project dashboard.
              </p>
            </section>

            {/* Section 7 */}
            <section id="cookies-sessions" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                7. Cookies, Sessions &amp; Local Storage
              </h2>
              <div className="space-y-3 text-xs text-muted leading-relaxed">
                <p>
                  • <strong className="text-foreground">Essential Authentication Cookies:</strong> We use secure, HTTP-only cookies managed via `@supabase/ssr` to remember your login session across page refreshes. These cookies are strictly necessary for the application to function.
                </p>
                <p>
                  • <strong className="text-foreground">Theme &amp; UI Preferences:</strong> We use browser localStorage to remember your light/dark theme preference across sessions.
                </p>
                <p>
                  • <strong className="text-foreground">No Third-Party Advertising Trackers:</strong> Chat2Deploy does not sell user ad-tracking profiles or install third-party tracking pixels for behavioral advertising.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section id="retention-deletion" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                8. Data Retention, Storage &amp; Deletion
              </h2>
              <p className="text-muted leading-relaxed mb-3">
                Your projects, version snapshots, and account details are stored as long as your account remains active.
              </p>
              <p className="text-muted leading-relaxed mb-3">
                You can delete individual projects or purge resources directly via the project management dashboard. When a project is removed, associated project records and version snapshots are deleted from our database.
              </p>
              <p className="text-muted leading-relaxed">
                Contact messages and career applications are retained for operational review and auditing purposes for up to 12 months, after which they are periodically purged.
              </p>
            </section>

            {/* Section 9 */}
            <section id="security-measures" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                9. Security Safeguards &amp; Limitations
              </h2>
              <p className="text-muted leading-relaxed mb-3">
                We employ industry-standard security measures including:
              </p>
              <ul className="space-y-1.5 text-xs text-muted leading-relaxed list-disc pl-5 mb-4">
                <li>End-to-end encrypted HTTPS transmission for all web traffic and API calls.</li>
                <li>PostgreSQL Row-Level Security (RLS) policies ensuring users can only read and modify their own projects.</li>
                <li>Server-side input sanitization and rate limiting to prevent unauthorized scraping and abuse.</li>
                <li>Encrypted storage of credentials with no client-side exposure of service-role keys or AI provider secrets.</li>
              </ul>
              <p className="text-xs text-muted leading-relaxed bg-surface border border-subtle rounded-xl p-4">
                <strong className="text-foreground">Realistic Security Notice:</strong> While we implement rigorous technical safeguards, no internet transmission or electronic storage method is guaranteed to be 100% impenetrable. We encourage users to maintain strong passwords and exercise caution regarding data shared in prompts.
              </p>
            </section>

            {/* Section 10 */}
            <section id="user-rights" className="scroll-mt-20">
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                10. User Rights &amp; Contact Details
              </h2>
              <p className="text-muted leading-relaxed mb-3">
                Depending on your location, you may have rights under applicable privacy laws (such as GDPR, CCPA/CPRA, or DPDP) regarding your personal data, including the right to access, correct, export, or delete your information.
              </p>
              <p className="text-muted leading-relaxed mb-4">
                To submit a privacy inquiry or request account deletion, please reach out to our team:
              </p>
              <div className="p-4 bg-card border border-subtle rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-foreground">Chat2Deploy Privacy &amp; Support Team</p>
                  <p className="text-xs text-muted">Submit an inquiry via our verified contact form.</p>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Contact Support
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
