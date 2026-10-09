"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/auth/AuthProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      login({ name: "Alex User", email });
      setIsLoading(false);
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-background p-4">
        <div className="w-full max-w-md bg-card border border-subtle rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-sm text-muted">Log in to your Chat2Deploy account</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
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
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground block">Password</label>
                <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface border border-subtle rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                placeholder="••••••••"
              />
            </div>
            
            <div className="flex items-center gap-2 py-2">
              <input type="checkbox" id="remember" className="rounded border-subtle bg-surface text-primary focus:ring-primary" />
              <label htmlFor="remember" className="text-sm text-muted">Remember me</label>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading || !email || !password}
              className="w-full flex items-center justify-center py-2.5 px-4 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Login"}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm text-muted">
            Don't have an account? <Link href="/register" className="text-primary hover:underline font-medium">Create account</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
