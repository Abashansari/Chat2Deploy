import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { removeProjectFromDeployments } from "@/lib/dashboard";

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
    let body: Record<string, unknown> | undefined;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const { projectId } = body || {};
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "A valid project ID is required." }, { status: 400 });
    }

    // 3. Unpublish from Cloudflare and update project status to draft
    const result = await removeProjectFromDeployments({
      supabase,
      projectId,
      userId: user.id,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[/api/deployments/remove] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to remove deployment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
