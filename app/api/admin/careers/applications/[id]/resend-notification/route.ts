import { NextResponse, type NextRequest } from "next/server";
import { verifyCareersAdmin } from "@/lib/admin-auth";
import { getCareerApplicationById } from "@/lib/careers";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/careers/applications/[id]/resend-notification
 * Re-dispatches an in-app notification for the applicant.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const auth = await verifyCareersAdmin();
  if (!auth.isAuthorized) {
    return NextResponse.json(
      { error: auth.error || "Access denied." },
      { status: auth.status }
    );
  }

  const { id } = await context.params;
  const application = await getCareerApplicationById(id);

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  try {
    await createNotification({
      recipientUserId: application.userId || null,
      recipientEmail: application.email,
      relatedApplicationId: application.id,
      type: "status_updated",
      title: `Application Status: ${application.status}`,
      message: `Status reminder: Your application is currently "${application.status}".` +
        (application.adminNotes ? ` Note: "${application.adminNotes}"` : ""),
    });

    return NextResponse.json({
      success: true,
      message: "In-app status notification re-delivered successfully.",
    });
  } catch (error) {
    console.error("[resend-notification] Error:", error);
    return NextResponse.json(
      { error: "Failed to create in-app notification." },
      { status: 500 }
    );
  }
}
