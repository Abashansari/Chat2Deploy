import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Book, FileText, HelpCircle, Code, ArrowUpRight, ChevronRight } from "lucide-react";

export default function ResourcesPage() {
  const resources = [
    {
      title: "Documentation",
      description: "Learn how to effectively prompt the AI, structure requests, and manage edge hosting.",
      icon: <Book className="text-primary" size={24} />,
      href: "/docs",
      badge: "Core Docs",
    },
    {
      title: "Guides & Tutorials",
      description: "Step-by-step guides on building portfolios, SaaS landing pages, and iterative design.",
      icon: <FileText className="text-primary" size={24} />,
      href: "/guides",
      badge: "Walkthroughs",
    },
    {
      title: "Join our Team",
      description: "Explore the Learner Contributor Program to build practical experience on real software.",
      icon: <Code className="text-primary" size={24} />,
      href: "/careers",
      badge: "Contributor Program",
    },
    {
      title: "FAQ",
      description: "Frequently asked questions about hosting, custom domains, rollbacks, and AI limits.",
      icon: <HelpCircle className="text-primary" size={24} />,
      href: "/faq",
      badge: "Support",
    },
  ];

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
            <span className="text-foreground font-medium">Resources</span>
          </div>

          <div className="text-center mb-14">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              Resources &amp; Support
            </h1>
            <p className="text-muted text-base md:text-lg max-w-xl mx-auto">
              Everything you need to master AI website generation, versioning, and global edge deployments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resources.map((resource, i) => (
              <Link
                href={resource.href}
                key={i}
                className="group bg-card border border-subtle rounded-2xl p-6 shadow-sm hover:border-primary/60 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 shrink-0 bg-surface rounded-xl flex items-center justify-center border border-subtle group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors">
                      {resource.icon}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-muted bg-surface px-2.5 py-0.5 rounded-full border border-subtle group-hover:text-primary group-hover:border-primary/20 transition-colors">
                        {resource.badge}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-surface border border-subtle flex items-center justify-center text-muted group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                        <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>

                  <h2 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {resource.title}
                  </h2>
                  <p className="text-sm text-muted leading-relaxed">
                    {resource.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-subtle/60 flex items-center justify-between text-xs text-muted group-hover:text-primary transition-colors font-medium">
                  <span>Explore {resource.title}</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
