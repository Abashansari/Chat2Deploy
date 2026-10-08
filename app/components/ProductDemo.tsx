import { CheckCircle } from "lucide-react";

const features = [
  "Generate responsive layouts",
  "Auto-generate content structure",
  "One-click deployment",
];

export default function ProductDemo() {
  return (
    <section className="w-full bg-background py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left - Mockup */}
          <div className="relative">
            <div className="bg-surface rounded-2xl p-4 sm:p-6 overflow-hidden">
              {/* Browser chrome mockup */}
              <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                {/* Browser bar */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <div className="flex-1 ml-2">
                    <div className="h-4 w-32 bg-gray-600 rounded-sm" />
                  </div>
                </div>
                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="h-3 w-3/4 bg-gray-600 rounded" />
                  <div className="h-3 w-1/2 bg-gray-600 rounded" />
                  <div className="h-3 w-2/3 bg-gray-600 rounded" />
                </div>
              </div>

              {/* Floating card - left */}
              <div className="absolute left-2 sm:left-4 top-1/3 bg-card rounded-xl shadow-xl p-3 w-36 sm:w-40 border border-subtle">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100" />
                  <div>
                    <p className="text-[10px] font-semibold text-foreground">
                      Describe your
                    </p>
                    <p className="text-[9px] text-muted">idea</p>
                  </div>
                </div>
                <div className="space-y-1.5 mb-3 opacity-30">
                  <div className="h-1.5 w-full bg-gray-100 rounded" />
                  <div className="h-1.5 w-3/4 bg-gray-100 rounded" />
                  <div className="h-1.5 w-1/2 bg-gray-100 rounded" />
                </div>
                <button className="w-full bg-primary text-white text-[9px] font-medium py-1.5 rounded-md">
                  Generate website
                </button>
                <div className="mt-2 space-y-1">
                  <p className="text-[8px] text-muted">• Responsive layout</p>
                  <p className="text-[8px] text-muted">• Ready to publish</p>
                </div>
              </div>

              {/* Floating card - right */}
              <div className="absolute right-4 sm:right-8 top-[40%] bg-card rounded-xl shadow-xl p-3 w-36 sm:w-40 border border-subtle">
                <p className="text-[9px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Sticky North
                </p>
                <p className="text-xs font-bold text-foreground leading-snug mb-2">
                  Ideas made
                  <br />
                  into experiences.
                </p>
                <p className="text-[8px] text-muted mb-3">
                  Thoughtful design for ambitious brands.
                </p>
                <button className="bg-foreground text-background text-[8px] font-medium px-3 py-1.5 rounded-md">
                  Learn our work
                </button>
                <div className="flex gap-1.5 mt-3">
                  <div className="w-8 h-8 rounded bg-blue-200" />
                  <div className="w-8 h-8 rounded bg-blue-300" />
                  <div className="w-8 h-8 rounded bg-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
              Product Demo
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-5">
              See how easy it is to go from text to live site in seconds.
            </h2>
            <p className="text-sm text-muted leading-relaxed mb-8">
              Our platform uses advanced AI to parse your text input and generate a
              fully functional, responsive website. No coding required, just pure
              creativity.
            </p>

            {/* Feature list */}
            <ul className="space-y-3 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5">
                  <CheckCircle className="text-primary flex-shrink-0" size={18} />
                  <span className="text-sm text-secondary">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href="#demo"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
            >
              Watch Full Demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
