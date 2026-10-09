"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  // Supabase auth handles checking the #access_token in the URL 
  // automatically with createBrowserClient, so we can just call updateUser.

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);
  };

  if (success) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-background p-4">
          <div className="w-full max-w-md bg-card border border-subtle rounded-2xl p-8 shadow-sm text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Password updated</h1>
            <p className="text-sm text-muted mb-6">Your password has been successfully reset. You can now log in with your new password.</p>
            <Link href="/login" className="inline-flex items-center justify-center py-2.5 px-4 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">
              Go to Login
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-background p-4">
        <div className="w-full max-w-md bg-card border border-subtle rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Set new password</h1>
            <p className="text-sm text-muted">Please enter your new password</p>
          </div>
          
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-sm text-red-500 text-center">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground block">New Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface border border-subtle rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground block">Confirm Password</label>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-surface border border-subtle rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading || !password || !confirmPassword}
              className="w-full flex items-center justify-center py-2.5 px-4 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Update Password"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
