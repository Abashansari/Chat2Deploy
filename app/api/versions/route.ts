import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProjectVersionsList } from "@/lib/versions";

export async function GET(request: Request) {
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

    // 2. Validate projectId param
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "A valid project ID is required." },
        { status: 400 }
      );
    }

    // 3. Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, user_id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized." },
        { status: 404 }
      );
    }

    // 4. Retrieve version list
    const versions = await getProjectVersionsList({
      supabase,
      projectId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      projectId,
      versions,
    });
  } catch (error: unknown) {
    console.error("[/api/versions] Error fetching versions:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch versions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
