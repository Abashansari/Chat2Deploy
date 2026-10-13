import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteProjectPermanently, renameProjectTitle } from "@/lib/dashboard";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { projectId } = resolvedParams;

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

    // 2. Perform safe, permanent deletion of project and resources
    const result = await deleteProjectPermanently({
      supabase,
      projectId,
      userId: user.id,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[/api/projects/[projectId]] DELETE Error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete project.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { projectId } = resolvedParams;

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

    // 2. Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const { name } = body || {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "A valid project name is required." }, { status: 400 });
    }

    // 3. Rename project
    const result = await renameProjectTitle({
      supabase,
      projectId,
      userId: user.id,
      newName: name,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[/api/projects/[projectId]] PATCH Error:", error);
    const message = error instanceof Error ? error.message : "Failed to rename project.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
