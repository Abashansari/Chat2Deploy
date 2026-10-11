import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deployToCloudflarePages, DeploymentError } from "@/lib/cloudflare";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to deploy." },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const { projectId } = body || {};

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "A valid project ID is required." },
        { status: 400 }
      );
    }

    // 3. Verify project ownership and fetch project info
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, user_id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found or you are not authorized to deploy it." },
        { status: 404 }
      );
    }

    // 4. Fetch the generated website files for this project
    const { data: projectFiles, error: filesError } = await supabase
      .from("project_files")
      .select("file_path, content")
      .eq("project_id", projectId);

    if (filesError || !projectFiles || projectFiles.length === 0) {
      return NextResponse.json(
        { error: "No generated website files found for this project. Generate your site first." },
        { status: 400 }
      );
    }

    const filesToDeploy = projectFiles.map((f) => ({
      path: f.file_path,
      content: f.content,
    }));

    // 5. Deploy files to Cloudflare Pages via Wrangler CLI
    const result = await deployToCloudflarePages({
      projectName: project.name,
      files: filesToDeploy,
      projectId: project.id,
    });

    // 6. Update project status in Supabase
    try {
      await supabase
        .from("projects")
        .update({
          status: "published",
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);
    } catch (dbErr) {
      console.warn("[deploy] Failed to update project status in DB:", dbErr);
    }

    // Optional: save deployment record if deployments table exists
    try {
      await supabase.from("deployments").insert({
        project_id: projectId,
        user_id: user.id,
        deployment_id: result.deploymentId,
        url: result.deploymentUrl,
        environment: "production",
        status: "success",
      });
    } catch (deployHistErr) {
      // Non-fatal if migration 002 hasn't been run yet
      console.info("[deploy] Deployments table log skipped:", deployHistErr);
    }

    // 7. Return deployment details to client
    return NextResponse.json({
      success: true,
      deploymentUrl: result.deploymentUrl,
      projectName: result.projectName,
      deploymentId: result.deploymentId,
      timestamp: result.timestamp,
      status: result.status,
    });
  } catch (error: unknown) {
    console.error("[/api/deploy] Deployment error:", error);

    if (error instanceof DeploymentError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Deployment failed unexpectedly.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
