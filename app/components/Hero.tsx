import Link from "next/link";

export default function Hero() {
  return (
    <section 
      className="w-full min-h-[100dvh] bg-background flex items-center justify-center relative"
      style={{ backgroundImage: "var(--hero-glow)" }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-[28px] border border-slate-700/80 bg-[#0b0d12] shadow-[0_20px_60px_rgba(15,23,42,0.35)] ring-1 ring-white/5 sm:h-36 sm:w-36">
            <img
              src="/logo.svg"
              alt="Ansar AI logo"
              className="h-16 w-16 object-contain sm:h-24 sm:w-24"
            />
          </div>
        </div>

        {/* Trust Badge */}
        <p className="text-sm text-primary font-medium mb-6">
          Trusted by millions of users
        </p>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl md:text-[34px] font-bold text-foreground leading-tight tracking-tight mb-5">
          From creating website to host that you love
        </h1>

        {/* Subtext */}
        <p className="text-base text-muted mb-8 max-w-md mx-auto">
          Start with building the website and host that you love.
        </p>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-7 py-3 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
        >
          Get Started &rarr;
        </Link>
      </div>
    </section>
  );
}