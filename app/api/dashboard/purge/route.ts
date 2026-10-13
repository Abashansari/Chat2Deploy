import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { invalidateAllUserData } from "@/lib/redis";

export async function POST() {
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

    // 2. Invalidate all user cached data in Redis
    await invalidateAllUserData(user.id);

    return NextResponse.json({
      success: true,
      message: "Cache successfully purged. Live data re-synced from database.",
    });
  } catch (error: unknown) {
    console.error("[/api/dashboard/purge] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to purge cache.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
