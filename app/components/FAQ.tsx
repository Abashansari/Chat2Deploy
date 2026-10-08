"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "How does the text-to-site engine work?",
    answer:
      "Our engine uses natural language processing to understand your requirements. It then maps these requirements to our vast library of pre-built, high-performance UI components, ensuring your site is both beautiful and fast.",
  },
  {
    question: "Do I need to know how to code?",
    answer:
      "Absolutely not. SiteFlow is designed for creators of all skill levels. Whether you're a seasoned developer or a small business owner, our platform handles the technical heavy lifting for you.",
  },
  {
    question: "Can I customize the generated site?",
    answer:
      "Yes, you have full control. Our drag-and-drop editor allows you to tweak every detail, from colors and fonts to layout and content, without touching a single line of code.",
  },
  {
    question: "Is my site secure and backed up?",
    answer:
      "Security is our top priority. Every site hosted on SiteFlow comes with automatic daily backups and enterprise-grade security protocols to protect your data and ensure your site remains online 24/7.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full bg-background py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
            Questions
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-[34px] font-bold text-foreground leading-tight">
            Frequently Asked Questions
          </h2>
        </div>

        {/* FAQ Items */}
        <div className="divide-y divide-subtle">
          {faqs.map((faq, index) => (
            <div key={index} className="py-5">
              <button
                className="w-full flex items-start justify-between gap-4 text-left cursor-pointer"
                onClick={() => toggle(index)}
                aria-expanded={openIndex === index}
              >
                <span className="text-sm font-semibold text-foreground">
                  {faq.question}
                </span>
                <span className="flex-shrink-0 mt-0.5 text-muted">
                  {openIndex === index ? (
                    <Minus size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-sm text-muted leading-relaxed pr-8">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
