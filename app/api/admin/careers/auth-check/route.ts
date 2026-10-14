import { NextResponse } from "next/server";
import { verifyCareersAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/admin/careers/auth-check
 *
 * Safe client check to determine if the currently logged-in user
 * is authorized as the Careers Administrator.
 *
 * Never exposes CAREERS_ADMIN_EMAIL or other credentials to the client.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        isAuthenticated: false,
        isAdmin: false,
      });
    }

    const auth = await verifyCareersAdmin();

    return NextResponse.json({
      isAuthenticated: true,
      isAdmin: auth.isAuthorized,
    });
  } catch {
    return NextResponse.json({
      isAuthenticated: false,
      isAdmin: false,
    });
  }
}
