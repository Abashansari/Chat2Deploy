import { NextResponse, type NextRequest } from "next/server";
import { verifyCareersAdmin } from "@/lib/admin-auth";
import {
  getCareerApplicationById,
  updateCareerApplicationStatus,
} from "@/lib/careers";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/careers/applications/[id]/select
 *
 * Marks an application as "Selected" and issues an in-app learner notification.
 * Does NOT send external emails.
 *
 * Body:
 *   message?: string (optional next steps or message)
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

  let requestBody: Record<string, unknown> = {};
  try {
    requestBody = await request.json();
  } catch {
    // optional body
  }

  const message =
    typeof requestBody.message === "string"
      ? requestBody.message.trim()
      : typeof requestBody.body === "string"
      ? requestBody.body.trim()
      : "";

  const application = await getCareerApplicationById(id);
  if (!application) {
    return NextResponse.json(
      { error: "Application not found." },
      { status: 404 }
    );
  }

  try {
    const updated = await updateCareerApplicationStatus(
      id,
      "Selected",
      auth.user?.email,
      message || application.adminNotes || undefined
    );

    return NextResponse.json({
      success: true,
      message: `Applicant ${application.fullName} has been selected! An in-app notification has been delivered.`,
      application: updated,
    });
  } catch (error) {
    console.error(`[POST /api/admin/careers/applications/${id}/select] Error:`, error);
    return NextResponse.json(
      { error: "Failed to select applicant. Database update failed." },
      { status: 500 }
    );
  }
}
