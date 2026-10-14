import { NextResponse, type NextRequest } from "next/server";
import { verifyCareersAdmin } from "@/lib/admin-auth";
import {
  getCareerApplicationById,
  updateCareerApplicationStatus,
  normalizeStatus,
  type ApplicationStatus,
} from "@/lib/careers";

export const runtime = "nodejs";

const VALID_STATUSES = new Set<ApplicationStatus>([
  "Submitted",
  "Under Review",
  "Selected",
  "Rejected",
]);

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/careers/applications/[id]
 * Retrieves full details for a single career application.
 */
export async function GET(
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

  try {
    const application = await getCareerApplicationById(id);
    if (!application) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error(`[GET /api/admin/careers/applications/${id}] Error:`, error);
    return NextResponse.json(
      { error: "Failed to retrieve application." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/careers/applications/[id]
 * Updates status and/or notes for an application, triggering in-app learner notification.
 *
 * Body:
 *   status?: "Submitted" | "Under Review" | "Selected" | "Rejected"
 *   adminNotes?: string
 */
export async function PATCH(
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const rawStatus = typeof body.status === "string" ? normalizeStatus(body.status) : undefined;
  const adminNotes = typeof body.adminNotes === "string" ? body.adminNotes.trim() : undefined;

  if (rawStatus && !VALID_STATUSES.has(rawStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${Array.from(VALID_STATUSES).join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const current = await getCareerApplicationById(id);
    if (!current) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }

    const updated = await updateCareerApplicationStatus(
      id,
      rawStatus || current.status,
      auth.user?.email,
      adminNotes
    );

    return NextResponse.json({
      success: true,
      message: "Application status updated successfully. In-app notification delivered.",
      application: updated,
    });
  } catch (error) {
    console.error(`[PATCH /api/admin/careers/applications/${id}] Error:`, error);
    return NextResponse.json(
      { error: "Failed to update application status." },
      { status: 500 }
    );
  }
}
