import { createClient } from "@/lib/supabase/server";

export interface AdminAuthResult {
  isAuthorized: boolean;
  status: 200 | 401 | 403 | 500;
  error?: string;
  adminEmail?: string;
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Normalizes email address for strict comparisons.
 */
export function normalizeEmail(email?: string | null): string {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

/**
 * Returns the configured careers administrator email from server environment.
 * NEVER expose this value to the client.
 */
export function getCareersAdminEmail(): string | null {
  const email = process.env.CAREERS_ADMIN_EMAIL;
  if (!email || typeof email !== "string" || !email.trim()) {
    return null;
  }
  return normalizeEmail(email);
}

/**
 * Strict server-side verification that the authenticated user
 * is authorized to access the careers admin dashboard and APIs.
 *
 * Rules:
 * 1. CAREERS_ADMIN_EMAIL must be present in server environment.
 * 2. Authenticated session must be valid (via Supabase auth.getUser).
 * 3. User's verified email must exactly match CAREERS_ADMIN_EMAIL.
 * 4. Fails securely on any missing configuration or authentication gap.
 */
export async function verifyCareersAdmin(): Promise<AdminAuthResult> {
  const configuredAdminEmail = getCareersAdminEmail();

  // Fail securely if CAREERS_ADMIN_EMAIL is missing or empty
  if (!configuredAdminEmail) {
    console.error(
      "[Careers Admin Auth] Configuration error: CAREERS_ADMIN_EMAIL is not configured or empty in the server environment. Administrative access denied."
    );
    return {
      isAuthorized: false,
      status: 500,
      error: "Careers administrative configuration error. Access denied.",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        isAuthorized: false,
        status: 401,
        error: "Authentication required. Please sign in with your administrator account.",
      };
    }

    const authenticatedEmail = normalizeEmail(user.email);

    if (!authenticatedEmail || authenticatedEmail !== configuredAdminEmail) {
      console.warn(
        `[Careers Admin Auth] Unauthorized access attempt by user '${authenticatedEmail || "no-email"}' (User ID: ${user.id}). Expected authorized admin.`
      );
      return {
        isAuthorized: false,
        status: 403,
        error: "Access denied. You are not authorized to access the Careers Admin Dashboard.",
      };
    }

    return {
      isAuthorized: true,
      status: 200,
      adminEmail: configuredAdminEmail,
      user: {
        id: user.id,
        email: authenticatedEmail,
      },
    };
  } catch (error) {
    console.error("[Careers Admin Auth] Unexpected error during admin authorization check:", error);
    return {
      isAuthorized: false,
      status: 500,
      error: "An unexpected error occurred while verifying administrator credentials.",
    };
  }
}
