import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Heart,
  Server,
  Cpu,
  Database,
  ShieldCheck,
  Sparkles,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  QrCode,
  Smartphone,
  HelpCircle,
  Share2,
  Info,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Support Us — Code2Chat | Community & Infrastructure Fund",
  description:
    "Support the future of learning on Code2Chat. Help us cover hosting, AI computing, database storage, and continuous platform development.",
};

const SUPPORT_PILLARS = [
  {
    icon: Server,
    title: "Website Hosting & Infrastructure",
    description:
      "Global edge servers, reliable container environments, and low-latency distribution networks that keep Code2Chat responsive 24/7.",
    accent: "text-primary",
    bgAccent: "bg-primary/10",
    borderAccent: "border-primary/20",
  },
  {
    icon: Cpu,
    title: "AI Model & API Usage Costs",
    description:
      "Generative language models, inference compute, and streaming token pipelines that turn natural-language prompts into production-ready web code.",
    accent: "text-sky-400",
    bgAccent: "bg-sky-500/10",
    borderAccent: "border-sky-500/20",
  },
  {
    icon: Database,
    title: "Database, Storage & Networking",
    description:
      "Scalable database queries, snapshot history stores, caching layers, and high-bandwidth asset delivery for instant preview rendering.",
    accent: "text-teal-400",
    bgAccent: "bg-teal-500/10",
    borderAccent: "border-teal-500/20",
  },
  {
    icon: ShieldCheck,
    title: "Reliability, Security & Scalability",
    description:
      "Automated SSL/TLS provisioning, anti-abuse mitigation, rigorous sandboxing, and performance tuning across high-traffic hours.",
    accent: "text-emerald-400",
    bgAccent: "bg-emerald-500/10",
    borderAccent: "border-emerald-500/20",
  },
  {
    icon: Sparkles,
    title: "Continuous Platform Development",
    description:
      "Engineering new workspace tools, responsive preview controls, one-click edge deployment workflows, and ongoing feature updates.",
    accent: "text-amber-400",
    bgAccent: "bg-amber-500/10",
    borderAccent: "border-amber-500/20",
  },
  {
    icon: BookOpen,
    title: "Accessible Learning Environment",
    description:
      "Providing a welcoming, low-barrier playground where students, aspiring developers, and hobbyists can learn web development hands-on.",
    accent: "text-cyan-400",
    bgAccent: "bg-cyan-500/10",
    borderAccent: "border-cyan-500/20",
  },
];

const FAQS = [
  {
    question: "Is there a minimum contribution amount?",
    answer:
      "No. There is no minimum contribution requirement whatsoever. Whether it is a small token of encouragement or a larger gift, every contribution directly assists with operational expenses and is warmly appreciated.",
  },
  {
    question: "Is contributing mandatory to use Code2Chat?",
    answer:
      "Never. Contributing is 100% voluntary. You can freely explore, build websites, experiment with prompts, and test deployments regardless of whether you contribute financially.",
  },
  {
    question: "How will my contribution be spent?",
    answer:
      "All voluntary contributions are allocated directly towards operational expenses: cloud edge server hosting, generative AI API tokens, persistent database storage, bandwidth, and maintenance.",
  },
  {
    question: "Which payment apps are supported by the QR code?",
    answer:
      "The QR code supports all major UPI-enabled apps, including Google Pay, PhonePe, Paytm, BHIM, Cred, and mobile banking applications that support UPI QR scanning.",
  },
  {
    question: "Are contributions tax-deductible?",
    answer:
      "No. Code2Chat is an independent educational and developer platform, not a registered charity or 501(c)(3) non-profit organization. Voluntary contributions do not qualify for tax deductions.",
  },
];

export default function SupportPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background text-foreground">
        {/* Hero Section */}
        <section
          className="relative w-full pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden"
          style={{ backgroundImage: "var(--hero-glow)" }}
        >
          {/* Subtle Ambient Glows */}
          <div className="absolute top-0 left-1/3 w-[520px] h-[520px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-6">
              <Heart size={13} className="text-teal-400 fill-teal-400/20" />
              <span>Community &amp; Infrastructure Fund</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
              Support the Future of{" "}
              <span className="bg-gradient-to-r from-primary via-teal-400 to-sky-400 bg-clip-text text-transparent">
                Learning &amp; Creation
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-muted max-w-2xl mx-auto mb-9 leading-relaxed">
              Help us keep Code2Chat running, improve our infrastructure, and
              create a better environment for everyone to learn, build, and deploy
              websites.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#donate-qr"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
              >
                <Heart size={16} className="fill-white/20" />
                Support Code2Chat
              </a>
              <a
                href="#why-it-matters"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-foreground bg-card border border-subtle rounded-xl hover:border-primary/30 transition-all hover:-translate-y-0.5"
              >
                Why Your Support Matters
                <ArrowRight size={14} />
              </a>
            </div>

            {/* Quick Guarantees */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-teal-400" />
                <span>100% Voluntary</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-teal-400" />
                <span>Zero Minimum Requirement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-teal-400" />
                <span>Direct Infrastructure Funding</span>
              </div>
            </div>
          </div>
        </section>

        {/* QR Code Donation Card Section */}
        <section
          id="donate-qr"
          className="py-16 md:py-24 bg-surface border-y border-subtle scroll-mt-12"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
                <QrCode size={13} />
                Instant Voluntary Contribution
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Contribute via UPI QR Code
              </h2>
              <p className="text-muted text-sm md:text-base max-w-xl mx-auto">
                Scan with any supported payment app to contribute directly. Every
                amount powers computing resources and keeps the platform online.
              </p>
            </div>

            {/* Card Container */}
            <div className="bg-card border border-subtle rounded-3xl p-6 sm:p-10 shadow-xl max-w-xl mx-auto transition-all hover:border-primary/30">
              {/* QR Image Frame */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-gray-200 flex flex-col items-center justify-center mx-auto max-w-sm">
                <div className="relative w-full aspect-[980/667] flex items-center justify-center overflow-hidden">
                  <Image
                    src="/QRcode.png"
                    alt="Donation QR Code to voluntarily support Code2Chat infrastructure and development"
                    width={980}
                    height={667}
                    priority
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-gray-600 text-xs font-medium">
                  <Smartphone size={13} />
                  <span>Scan with any UPI / Payment App</span>
                </div>
              </div>

              {/* Explicit Instruction */}
              <div className="mt-6 text-center">
                <p className="text-sm sm:text-base font-semibold text-foreground mb-1">
                  Scan the QR code with your preferred supported payment app to contribute.
                </p>
                <p className="text-xs text-muted leading-relaxed">
                  Supported via Google Pay, PhonePe, Paytm, BHIM, Cred, and all UPI-enabled banking apps.
                </p>
              </div>

              {/* Highlights & Security Notice */}
              <div className="mt-8 pt-6 border-t border-subtle grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-surface/50 border border-subtle/80">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Any Contribution Welcomed</h4>
                    <p className="text-[11px] text-muted leading-relaxed mt-0.5">
                      No minimum amount required. Contribute whatever you feel comfortable with.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-surface/50 border border-subtle/80">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">100% Transparent</h4>
                    <p className="text-[11px] text-muted leading-relaxed mt-0.5">
                      Directly funds cloud servers, database operations, and AI generation tokens.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Your Support Matters Section */}
        <section id="why-it-matters" className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-3">
                <Server size={13} />
                Cost Transparency
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Why Your Support Matters
              </h2>
              <p className="text-muted text-sm md:text-base max-w-2xl mx-auto">
                Running an AI code generation and edge deployment engine requires
                continuous computing, database queries, and network infrastructure.
                Here is exactly what voluntary contributions help cover:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SUPPORT_PILLARS.map((pillar, idx) => (
                <div
                  key={idx}
                  className="bg-card border border-subtle rounded-2xl p-6 flex flex-col justify-between hover:border-primary/30 transition-all group"
                >
                  <div>
                    <div
                      className={`w-12 h-12 rounded-xl ${pillar.bgAccent} ${pillar.accent} border ${pillar.borderAccent} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}
                    >
                      <pillar.icon size={22} />
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-muted leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Every Contribution Makes a Difference Section */}
        <section className="py-16 md:py-20 bg-surface border-y border-subtle">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-card border border-teal-500/30 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-4">
                  <Heart size={13} />
                  Community Impact
                </span>

                <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4">
                  Every Contribution Makes a Difference
                </h2>

                <blockquote className="text-sm sm:text-base text-secondary leading-relaxed bg-surface/60 border-l-2 border-primary pl-4 py-2 my-5 italic">
                  “Code2Chat is built to make website creation and deployment
                  easier and more accessible. Running and improving this platform
                  requires infrastructure, computing resources, and ongoing
                  development. Your support helps us maintain the service,
                  improve performance, and build a better learning environment for
                  everyone. Every contribution, regardless of its amount, is
                  genuinely appreciated.”
                </blockquote>

                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  We believe that financial barriers shouldn’t prevent anyone from
                  experiencing how modern web applications are structured and deployed.
                  Whether you are a professional developer, a college student, or a
                  curious learner, voluntary contributions from our community help us
                  keep the servers running smoothly for all builders.
                </p>

                <div className="mt-8 pt-6 border-t border-subtle flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-muted">
                    <strong className="text-foreground block mb-0.5">
                      No pressure, 100% voluntary:
                    </strong>
                    Supporting the project is entirely optional and free accounts have no mandatory fees.
                  </div>
                  <a
                    href="#donate-qr"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors"
                  >
                    Contribute Now
                    <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Alternative Ways to Support */}
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
                <Share2 size={13} />
                Other Ways to Help
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                More Ways to Support Code2Chat
              </h2>
              <p className="text-muted text-sm md:text-base max-w-lg mx-auto">
                Contributions go far beyond financial support. Here are meaningful
                ways you can help the platform grow.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-card border border-subtle rounded-2xl p-6">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                  <Share2 size={18} />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1.5">Share with Builders</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Tell friends, classmates, and fellow developers about Code2Chat. Sharing the platform helps us reach more creators.
                </p>
              </div>

              <div className="bg-card border border-subtle rounded-2xl p-6">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
                  <HelpCircle size={18} />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1.5">Send Feedback &amp; Ideas</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Have ideas for UI improvements, new features, or prompt enhancements? Share your feedback to help guide our roadmap.
                </p>
              </div>

              <div className="bg-card border border-subtle rounded-2xl p-6">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                  <BookOpen size={18} />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1.5">Build &amp; Deploy Projects</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Create portfolios, landing pages, and web experiments. Your usage and live deployments showcase what the platform can do.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="py-16 md:py-24 bg-surface border-y border-subtle">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-3">
                <HelpCircle size={13} />
                Common Questions
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-muted text-sm md:text-base max-w-xl mx-auto">
                Have questions about contributing or how funds are utilized? Here are quick answers.
              </p>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className="bg-card border border-subtle rounded-2xl p-6 transition-all hover:border-primary/20"
                >
                  <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                    <span className="text-primary font-mono text-xs">Q:</span>
                    {faq.question}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed pl-5">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            {/* Transparency & Disclaimer Box */}
            <div className="mt-8 p-5 rounded-2xl bg-card border border-subtle flex items-start gap-3.5 text-xs text-muted leading-relaxed">
              <Info size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block mb-1">
                  Transparency Notice &amp; Legal Clarification
                </strong>
                <p>
                  All contributions are strictly voluntary gifts made to assist with Code2Chat’s server hosting, AI inference, and maintenance expenses. Code2Chat is an independent web application and developer learning platform, not a registered charity, non-profit organization, or tax-exempt entity. As such, contributions are non-tax-deductible and do not convey equity, ownership, or guaranteed services.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-4">
              Ready to create something amazing?
            </h2>
            <p className="text-sm md:text-base text-muted max-w-xl mx-auto mb-8">
              Start building websites with conversational AI and deploy to the edge in seconds.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
              >
                Start Building Free
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-muted hover:text-foreground bg-card border border-subtle rounded-xl transition-all"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
