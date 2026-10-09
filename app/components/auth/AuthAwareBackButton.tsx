"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export function AuthAwareBackButton() {
  const { isAuthenticated, isLoading } = useAuth();

  // Prevent UI flickering during hydration/loading
  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium text-transparent">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back to Dashboard
      </div>
    );
  }

  const destination = isAuthenticated ? "/dashboard" : "/";
  const label = isAuthenticated ? "Back to Dashboard" : "Back to Home";

  return (
    <Link 
      href={destination} 
      className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6"/>
      </svg>
      {label}
    </Link>
  );
}
