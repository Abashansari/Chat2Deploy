import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCareersAdminEmail, normalizeEmail } from "@/lib/admin-auth";
import {
  getNotifications,
  markAllNotificationsAsRead,
} from "@/lib/notifications";

export const runtime = "nodejs";

/**
 * GET /api/notifications
 * Retrieves notifications and unread count for the currently authenticated user (learner or admin).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const userEmail = normalizeEmail(user.email);
    const adminEmail = getCareersAdminEmail();
    const isAdmin = Boolean(adminEmail && userEmail === adminEmail);

    const { notifications, unreadCount } = await getNotifications({
      email: userEmail,
      userId: user.id,
      isAdmin,
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      isAdmin,
    });
  } catch (error) {
    console.error("[GET /api/notifications] Error:", error);
    return NextResponse.json({ error: "Failed to load notifications." }, { status: 500 });
  }
}

/**
 * POST /api/notifications/mark-all-read
 * Marks all notifications for the authenticated user as read.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const userEmail = normalizeEmail(user.email);
    await markAllNotificationsAsRead(userEmail, user.id);

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("[POST /api/notifications/mark-all-read] Error:", error);
    return NextResponse.json({ error: "Failed to mark notifications as read." }, { status: 500 });
  }
}
