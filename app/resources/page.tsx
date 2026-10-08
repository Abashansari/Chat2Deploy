import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Book, FileText, HelpCircle, Code } from "lucide-react";

export default function ResourcesPage() {
  const resources = [
    {
      title: "Documentation",
      description: "Learn how to effectively prompt the AI and structure your requests.",
      icon: <Book className="text-primary" size={24} />
    },
    {
      title: "Guides & Tutorials",
      description: "Step-by-step guides on building portfolios, SaaS landing pages, and more.",
      icon: <FileText className="text-primary" size={24} />
    },
    {
      title: "Deployment API",
      description: "Integrate Chat2Deploy directly into your own workflow using our API.",
      icon: <Code className="text-primary" size={24} />
    },
    {
      title: "FAQ",
      description: "Frequently asked questions about hosting, custom domains, and AI limits.",
      icon: <HelpCircle className="text-primary" size={24} />
    }
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background pt-16 pb-24 min-h-[calc(100vh-64px)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              Resources & Support
            </h1>
            <p className="text-muted text-lg">
              Everything you need to master Chat2Deploy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resources.map((resource, i) => (
              <a href="#" key={i} className="group bg-card border border-subtle rounded-2xl p-6 shadow-sm hover:border-primary transition-colors flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 bg-surface rounded-xl flex items-center justify-center border border-subtle group-hover:bg-primary/5 transition-colors">
                  {resource.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{resource.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{resource.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
