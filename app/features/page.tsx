import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Bot, Zap, Globe, Layout, Smartphone, Cloud } from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      title: "AI Website Builder",
      description: "Just type what you want, and our AI will generate the layout, structure, and content.",
      icon: <Bot className="text-primary" size={24} />
    },
    {
      title: "Live Preview",
      description: "See your website update in real-time as the AI works on your requests.",
      icon: <Layout className="text-primary" size={24} />
    },
    {
      title: "Natural Language Editing",
      description: "Want to change the button color or swap a section? Just ask the AI.",
      icon: <Zap className="text-primary" size={24} />
    },
    {
      title: "Responsive by Default",
      description: "Every website generated is automatically responsive for desktop, tablet, and mobile.",
      icon: <Smartphone className="text-primary" size={24} />
    },
    {
      title: "One-Click Deployment",
      description: "When you are happy with the result, deploy your site to our global edge network instantly.",
      icon: <Globe className="text-primary" size={24} />
    },
    {
      title: "Managed Hosting",
      description: "We handle the infrastructure, CDN, and SSL certificates automatically.",
      icon: <Cloud className="text-primary" size={24} />
    }
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background pt-16 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              Everything you need to build and launch
            </h1>
            <p className="text-muted text-lg">
              Chat2Deploy gives you an AI agent that builds, modifies, and hosts your website.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-card border border-subtle rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center mb-4 border border-subtle">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
