import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeEmail } from "@/lib/admin-auth";
import { getLearnerApplications } from "@/lib/careers";
import { getNotifications } from "@/lib/notifications";

export const runtime = "nodejs";

/**
 * GET /api/my-applications
 * Retrieves applications and notification metadata for the authenticated learner.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to view your applications." },
        { status: 401 }
      );
    }

    const userEmail = normalizeEmail(user.email);
    const applications = await getLearnerApplications(userEmail, user.id);
    const { notifications, unreadCount } = await getNotifications({
      email: userEmail,
      userId: user.id,
      isAdmin: false,
    });

    return NextResponse.json({
      success: true,
      applications,
      notifications,
      unreadNotificationsCount: unreadCount,
      user: {
        id: user.id,
        email: userEmail,
      },
    });
  } catch (error) {
    console.error("[GET /api/my-applications] Error:", error);
    return NextResponse.json(
      { error: "Failed to load applications." },
      { status: 500 }
    );
  }
}
