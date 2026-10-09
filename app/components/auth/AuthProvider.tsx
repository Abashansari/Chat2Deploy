"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: { name: string; email: string }) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();

        setUser({
          id: session.user.id,
          name: profile?.full_name || session.user.email || '',
          email: session.user.email || '',
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();

        setUser({
          id: session.user.id,
          name: profile?.full_name || session.user.email || '',
          email: session.user.email || '',
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Route protection is handled by Next.js middleware, but keeping basic client check for UX
  useEffect(() => {
    if (isLoading) return;

    const protectedRoutes = ["/dashboard", "/workspace"];
    const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route));

    if (isProtectedRoute && !user) {
      router.push("/login");
    }
  }, [user, isLoading, pathname, router]);

  const login = (userData: { name: string; email: string }) => {
    // This is kept for compatibility with existing UI that might call login() immediately.
    // In real app, the onAuthStateChange will trigger.
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
