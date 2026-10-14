import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeEmail } from "@/lib/admin-auth";
import { markNotificationAsRead } from "@/lib/notifications";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/notifications/[id]/read
 * Marks a specific notification as read.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await context.params;
    const userEmail = normalizeEmail(user.email);

    await markNotificationAsRead(id, userEmail);

    return NextResponse.json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("[PATCH /api/notifications/[id]/read] Error:", error);
    return NextResponse.json({ error: "Failed to mark notification as read." }, { status: 500 });
  }
}
