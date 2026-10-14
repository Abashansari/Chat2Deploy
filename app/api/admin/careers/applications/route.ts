import { NextResponse, type NextRequest } from "next/server";
import { verifyCareersAdmin } from "@/lib/admin-auth";
import { getCareerApplications } from "@/lib/careers";

export const runtime = "nodejs";

/**
 * GET /api/admin/careers/applications
 *
 * Query parameters:
 *   search: string (searches name, email, institution, skills, appliedPosition)
 *   status: string (all, Submitted, Under Review, Selected, Rejected)
 *   sort: string (newest, oldest, name_asc, name_desc)
 *   page: number (1-based)
 *   pageSize: number (default 10)
 *
 * Security:
 *   Protected by server-side verifyCareersAdmin().
 *   Denies access with 401 (unauthenticated) or 403 (non-admin).
 */
export async function GET(request: NextRequest) {
  // 1. Strict Server-side Admin Authorization
  const auth = await verifyCareersAdmin();
  if (!auth.isAuthorized) {
    return NextResponse.json(
      { error: auth.error || "Access denied." },
      { status: auth.status }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const sort = (searchParams.get("sort") as "newest" | "oldest" | "name_asc" | "name_desc") || "newest";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    const result = await getCareerApplications({
      search,
      status,
      sort,
      page: isNaN(page) ? 1 : page,
      pageSize: isNaN(pageSize) ? 10 : pageSize,
    });

    return NextResponse.json({
      success: true,
      ...result,
      adminEmail: auth.adminEmail,
    });
  } catch (error) {
    console.error("[GET /api/admin/careers/applications] Error:", error);
    return NextResponse.json(
      { error: "Failed to load applications." },
      { status: 500 }
    );
  }
}
