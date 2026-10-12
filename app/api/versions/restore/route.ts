import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { restoreProjectVersion } from "@/lib/versions";

export async function POST(request: Request) {
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

    // 2. Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }

    const { projectId, versionNumber } = body || {};

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "A valid project ID is required." }, { status: 400 });
    }

    const targetVersionNum = typeof versionNumber === "number" ? versionNumber : parseInt(versionNumber, 10);
    if (isNaN(targetVersionNum) || targetVersionNum < 1) {
      return NextResponse.json({ error: "A valid version number is required." }, { status: 400 });
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
        { error: "Project not found or you are not authorized to restore it." },
        { status: 404 }
      );
    }

    // 4. Perform validated rollback
    const result = await restoreProjectVersion({
      supabase,
      projectId,
      userId: user.id,
      versionNumber: targetVersionNum,
    });

    // 5. Add a chat history entry noting the restoration
    try {
      await supabase.from("chat_history").insert({
        project_id: projectId,
        role: "assistant",
        content: `Restored project to Version ${targetVersionNum} ("${result.restoredVersion.change_summary}"). Created Version ${result.newRollbackVersion.version_number}.`,
      });
    } catch {
      // Non-critical if chat log fails
    }

    return NextResponse.json({
      success: true,
      restoredVersionNumber: targetVersionNum,
      newVersionNumber: result.newRollbackVersion.version_number,
      changeSummary: result.newRollbackVersion.change_summary,
      fileCount: result.files.length,
      timestamp: result.newRollbackVersion.created_at,
    });
  } catch (error: unknown) {
    console.error("[/api/versions/restore] Error:", error);
    const message = error instanceof Error ? error.message : "Rollback failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
