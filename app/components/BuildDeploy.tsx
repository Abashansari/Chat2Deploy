import { FileText, Eye, Rocket } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Describe",
    description:
      "Tell us what you want to create in your own language.",
    color: "text-primary",
  },
  {
    icon: Eye,
    title: "Preview",
    description:
      "Preview your results in a live preview before you publish/deploy.",
    color: "text-primary",
  },
  {
    icon: Rocket,
    title: "Deploy",
    description:
      "It's live with managed hosting, while your site has it right.",
    color: "text-primary",
  },
];

export default function BuildDeploy() {
  return (
    <section className="w-full bg-background border-t border-subtle py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
            Build & Deploy
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-[34px] font-bold text-foreground leading-tight mb-4">
            Build & Deploy by just text.
          </h2>
          <p className="text-sm text-muted max-w-lg mx-auto leading-relaxed">
            Our AI-powered text-to-site engine allows you to describe your vision, and
            we handle the rest. From layout to hosting, it&apos;s all automated.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.title}
              className="bg-card rounded-xl p-6 border border-subtle hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center mb-4">
                <step.icon className={step.color} size={20} />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
