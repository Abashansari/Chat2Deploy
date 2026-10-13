import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ContactForm from "./ContactForm";
import { ChevronRight, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us — Chat2Deploy Support & Inquiries",
  description:
    "Get in touch with the Chat2Deploy team for platform support, technical questions, bug reports, and Contributor Program inquiries.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background text-foreground pt-12 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight size={14} />
            <span className="text-foreground font-medium">Contact</span>
          </div>

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
              <Mail size={13} />
              We&apos;re Here to Help
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
              Get in Touch with Chat2Deploy
            </h1>
            <p className="text-muted text-sm md:text-base leading-relaxed">
              Have a question, feedback on website generation, edge deployment assistance, or inquiries about our programs? Send us a message below.
            </p>
          </div>

          {/* Form + Sidebar Grid */}
          <ContactForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
