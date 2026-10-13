import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserDashboardStats } from "@/lib/dashboard";

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 2. Fetch real user dashboard stats and real chart data
    const stats = await getUserDashboardStats(supabase, user.id);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: unknown) {
    console.error("[/api/dashboard/stats] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to calculate dashboard stats.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
