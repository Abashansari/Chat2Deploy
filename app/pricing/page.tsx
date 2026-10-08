"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out Chat2Deploy and building your first site.",
    features: [
      "1 project",
      "AI-powered site builder",
      "Community support",
      "chat2deploy.dev subdomain",
      "Basic analytics",
    ],
    cta: "Get Started",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For creators and professionals who need more power and flexibility.",
    features: [
      "Unlimited projects",
      "Priority AI generation",
      "Custom domain support",
      "Advanced analytics",
      "Priority support",
      "Remove branding",
      "Team collaboration (3 seats)",
    ],
    cta: "Start Free Trial",
    href: "/register",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams and organizations that need scale, security, and dedicated support.",
    features: [
      "Everything in Pro",
      "Unlimited team seats",
      "SSO & SAML",
      "Dedicated account manager",
      "Custom SLA",
      "On-premise deployment",
      "API access",
      "Audit logs",
    ],
    cta: "Contact Sales",
    href: "#",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background pt-16 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
              Pricing
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-muted text-lg">
              Start building for free. Upgrade when you need more power.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-card border rounded-2xl p-6 lg:p-8 shadow-sm flex flex-col ${
                  plan.highlighted
                    ? "border-primary shadow-lg shadow-primary/5 ring-1 ring-primary/20 scale-[1.02]"
                    : "border-subtle"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-muted">{plan.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check size={16} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`w-full inline-flex items-center justify-center py-2.5 px-4 text-sm font-medium rounded-lg transition-colors ${
                    plan.highlighted
                      ? "text-white bg-primary hover:bg-primary-dark"
                      : "text-foreground bg-surface border border-subtle hover:bg-subtle"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <div className="text-center mt-12">
            <p className="text-sm text-muted">
              All plans include SSL certificates, global CDN, and 99.9% uptime guarantee.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
