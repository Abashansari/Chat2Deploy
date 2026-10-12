import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProjectVersionByNumber } from "@/lib/versions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ versionNumber: string }> }
) {
  try {
    const resolvedParams = await params;
    const versionNumber = parseInt(resolvedParams.versionNumber, 10);

    if (isNaN(versionNumber) || versionNumber < 1) {
      return NextResponse.json({ error: "Invalid version number." }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required." }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 2. Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found or unauthorized." }, { status: 404 });
    }

    // 3. Fetch version details
    const version = await getProjectVersionByNumber({
      supabase,
      projectId,
      userId: user.id,
      versionNumber,
    });

    if (!version) {
      return NextResponse.json(
        { error: `Version ${versionNumber} not found for this project.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      version,
    });
  } catch (error: unknown) {
    console.error("[/api/versions/[versionNumber]] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch version details.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
