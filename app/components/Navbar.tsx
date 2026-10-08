"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="w-full bg-background border-b border-subtle">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 2L14 6V14H2V6L8 2Z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  fill="none"
                />
                <rect x="6" y="9" width="4" height="5" rx="0.5" fill="white" />
              </svg>
            </div>
            <span className="text-lg font-bold text-foreground">MultiFlex</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/pricing"
              className="text-sm text-secondary hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/features"
              className="text-sm text-secondary hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="/resources"
              className="text-sm text-secondary hover:text-foreground transition-colors"
            >
              Resources
            </Link>
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm text-secondary hover:text-foreground transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary-dark transition-colors"
            >
              Signup
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              className="p-2 text-secondary hover:text-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-subtle py-4 space-y-3">
            <Link
              href="/pricing"
              className="block text-sm text-secondary hover:text-foreground py-2"
            >
              Pricing
            </Link>
            <Link
              href="/features"
              className="block text-sm text-secondary hover:text-foreground py-2"
            >
              Features
            </Link>
            <Link
              href="/resources"
              className="block text-sm text-secondary hover:text-foreground py-2"
            >
              Resources
            </Link>
            <hr className="border-subtle" />
            <Link
              href="/login"
              className="block text-sm text-secondary hover:text-foreground py-2"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary-dark transition-colors"
            >
              Signup
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
