"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    
    setIsLoading(true);
    setError(null);
    
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setSuccess(true);
    }
    
    setIsLoading(false);
  };

  if (success) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-background p-4">
          <div className="w-full max-w-md bg-card border border-subtle rounded-2xl p-8 shadow-sm text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Check your email</h1>
            <p className="text-sm text-muted mb-6">We&apos;ve sent a verification link to {email}. Please verify your email to continue.</p>
            <Link href="/login" className="inline-flex items-center justify-center py-2.5 px-4 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">
              Return to Login
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
            <h1 className="text-2xl font-bold text-foreground mb-2">Create your account</h1>
            <p className="text-sm text-muted">Join Chat2Deploy to start building</p>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-sm text-red-500 text-center">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground block">Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface border border-subtle rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                placeholder="Alex Designer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground block">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border border-subtle rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground block">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface border border-subtle rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading || !name || !email || !password}
              className="w-full flex items-center justify-center py-2.5 px-4 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-muted">
            Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Login</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
