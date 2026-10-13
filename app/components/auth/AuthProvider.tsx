"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

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

// Cache profile names in memory to avoid repetitive DB requests on session events
const profileNameCache = new Map<string, string>();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const isMountedRef = useRef(true);

  // Helper to update user state only when data actually changes (maintains object reference identity)
  const applyUserUpdate = useCallback((newId: string | null, newName: string = "", newEmail: string = "") => {
    setUser((prev) => {
      if (!newId) {
        return prev === null ? null : null;
      }
      if (prev && prev.id === newId && prev.name === newName && prev.email === newEmail) {
        return prev;
      }
      return { id: newId, name: newName, email: newEmail };
    });
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
      if (!isMountedRef.current) return;

      if (session?.user) {
        const userId = session.user.id;
        const email = session.user.email || "";
        const fallbackName =
          (session.user.user_metadata?.full_name as string) ||
          profileNameCache.get(userId) ||
          email;

        // Apply immediately with cached or metadata name to minimize perceived latency
        applyUserUpdate(userId, fallbackName, email);
        setIsLoading(false);

        // Fetch DB profile asynchronously only if not cached
        if (!profileNameCache.has(userId)) {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", userId)
              .maybeSingle();

            if (isMountedRef.current && profile?.full_name) {
              profileNameCache.set(userId, profile.full_name);
              applyUserUpdate(userId, profile.full_name, email);
            }
          } catch {
            // Non-critical; fallbackName is already set
          }
        }
      } else {
        applyUserUpdate(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [supabase, applyUserUpdate]);

  // Route protection is handled by Next.js middleware, but keeping basic client check for UX
  useEffect(() => {
    if (isLoading) return;

    const protectedRoutes = ["/dashboard", "/workspace"];
    const isProtectedRoute = protectedRoutes.some((route) => pathname?.startsWith(route));

    if (isProtectedRoute && !user) {
      router.push("/login");
    }
  }, [user, isLoading, pathname, router]);

  const login = useCallback((_userData?: { name: string; email: string }) => {
    void _userData;
    // Kept for backwards compatibility; onAuthStateChange handles state updates
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    applyUserUpdate(null);
    router.push("/");
  }, [supabase, router, applyUserUpdate]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

