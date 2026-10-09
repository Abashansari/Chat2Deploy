import Link from "next/link";

export default function Hero() {
  return (
    <section 
      className="w-full min-h-[100dvh] bg-background flex items-center justify-center relative"
      style={{ backgroundImage: "var(--hero-glow)" }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
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