import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deployToCloudflarePages, DeploymentError } from "@/lib/cloudflare";
import { invalidateProjectCaches, invalidateUserDeployments } from "@/lib/redis";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn("[/api/deploy] Authentication failed:", authError?.message || "No user session");
      return NextResponse.json(
        { error: "Your session has expired or you are not logged in. Please log in and try again." },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    let body: { projectId?: string } | undefined;
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

    // 3. Verify project exists and user owns it
    //    Query only columns guaranteed by the initial schema (migration 001).
    //    Optional deployment-related columns (migrations 002-004) are fetched separately
    //    to avoid failing when those migrations haven't been applied yet.
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, user_id, status, created_at, updated_at")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error("[/api/deploy] Project query error:", projectError.message, "| projectId:", projectId, "| userId:", user.id);

      // Supabase returns PGRST116 when .single() finds no rows
      if (projectError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Project not found. It may have been deleted or the project ID is invalid." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "Failed to verify project. Please try again." },
        { status: 500 }
      );
    }

    if (!project) {
      return NextResponse.json(
        { error: "Project not found. It may have been deleted or the project ID is invalid." },
        { status: 404 }
      );
    }

    // 4. Verify ownership server-side (defense in depth beyond RLS)
    if (project.user_id !== user.id) {
      console.warn("[/api/deploy] Ownership mismatch: project owner =", project.user_id, "| authenticated user =", user.id);
      return NextResponse.json(
        { error: "You do not have permission to deploy this project." },
        { status: 403 }
      );
    }

    // 5. Fetch optional deployment metadata columns (added by migrations 002-004)
    //    These may not exist if the user hasn't run all migrations.
    let hostingProjectName: string | null = null;
    let deploymentUrl: string | null = null;
    let currentVersionNum = 1;

    try {
      const { data: extendedProject } = await supabase
        .from("projects")
        .select("hosting_project_name, deployment_url, current_version, last_deployed_at, last_deployment_status, last_deployed_version")
        .eq("id", projectId)
        .single();

      if (extendedProject) {
        hostingProjectName = extendedProject.hosting_project_name || null;
        deploymentUrl = extendedProject.deployment_url || null;
        currentVersionNum = extendedProject.current_version || 1;
      }
    } catch {
      // Columns don't exist yet — that's okay, use defaults
      console.info("[/api/deploy] Extended deployment columns not available; using defaults.");
    }

    // Also try to get the latest version number from project_versions table
    try {
      const { data: latestVer } = await supabase
        .from("project_versions")
        .select("version_number")
        .eq("project_id", projectId)
        .order("version_number", { ascending: false })
        .limit(1);
      if (latestVer && latestVer.length > 0) {
        currentVersionNum = latestVer[0].version_number;
      }
    } catch {
      // Non-critical fallback
    }

    // 6. Fetch the generated website files for this project
    const { data: projectFiles, error: filesError } = await supabase
      .from("project_files")
      .select("file_path, content")
      .eq("project_id", projectId);

    if (filesError) {
      console.error("[/api/deploy] Failed to fetch project files:", filesError.message);
      return NextResponse.json(
        { error: "Failed to load project files. Please try again." },
        { status: 500 }
      );
    }

    if (!projectFiles || projectFiles.length === 0) {
      return NextResponse.json(
        { error: "No generated website files found for this project. Generate your site first." },
        { status: 400 }
      );
    }

    const filesToDeploy = projectFiles.map((f) => ({
      path: f.file_path,
      content: f.content,
    }));

    const startTime = Date.now();

    try {
      // 7. Deploy files to Cloudflare Pages via Wrangler CLI
      // Uses existingHostingProjectName to strictly preserve the exact same Cloudflare Pages project and domain
      const result = await deployToCloudflarePages({
        projectName: project.name,
        files: filesToDeploy,
        projectId: project.id,
        existingHostingProjectName: hostingProjectName || undefined,
      });

      const durationMs = Date.now() - startTime;

      // 8. Update project status and metadata in Supabase
      //    Build update payload dynamically — only include extended columns if they exist
      try {
        const baseUpdate: Record<string, unknown> = {
          status: "published",
          updated_at: new Date().toISOString(),
        };

        // Try the full update with all deployment columns first
        const fullUpdate = {
          ...baseUpdate,
          deployment_url: result.deploymentUrl,
          hosting_project_name: result.projectName,
          last_deployed_at: result.timestamp,
          last_deployment_status: "success",
          last_deployed_version: currentVersionNum,
        };

        const { error: updateError } = await supabase
          .from("projects")
          .update(fullUpdate)
          .eq("id", projectId);

        if (updateError) {
          // If the full update fails (e.g. columns don't exist), try a minimal update
          console.warn("[deploy] Full project update failed, trying minimal update:", updateError.message);
          await supabase
            .from("projects")
            .update(baseUpdate)
            .eq("id", projectId);
        }
      } catch (dbErr) {
        console.warn("[deploy] Failed to update project status in DB:", dbErr);
      }

      // 9. Save deployment record in deployments table
      try {
        await supabase.from("deployments").insert({
          project_id: projectId,
          user_id: user.id,
          deployment_id: result.deploymentId,
          hosting_project_name: result.projectName,
          url: result.deploymentUrl,
          environment: "production",
          status: "success",
          source_version: currentVersionNum,
          duration_ms: durationMs,
          created_at: result.timestamp,
        });
      } catch (deployHistErr) {
        console.info("[deploy] Deployments table log skipped:", deployHistErr);
      }

      // 10. Invalidate affected Redis caches (project, dashboard stats, deployments)
      await invalidateProjectCaches(user.id, projectId);

      // 11. Return deployment details to client
      return NextResponse.json({
        success: true,
        deploymentUrl: result.deploymentUrl,
        projectName: result.projectName,
        deploymentId: result.deploymentId,
        timestamp: result.timestamp,
        status: result.status,
        durationMs,
        sourceVersion: currentVersionNum,
      });
    } catch (deployError: unknown) {
      const durationMs = Date.now() - startTime;
      const errorMessage = deployError instanceof Error ? deployError.message : "Deployment failed";

      // Log failed deployment to audit history while preserving existing live deployment
      try {
        await supabase.from("deployments").insert({
          project_id: projectId,
          user_id: user.id,
          deployment_id: `failed-${Date.now().toString(36)}`,
          hosting_project_name: hostingProjectName || project.name,
          url: deploymentUrl || "",
          environment: "production",
          status: "failed",
          source_version: currentVersionNum,
          duration_ms: durationMs,
          error_message: errorMessage,
          created_at: new Date().toISOString(),
        });
      } catch {
        // Non-critical
      }

      // Invalidate user deployments in Redis so failed record is immediately visible
      await invalidateUserDeployments(user.id);

      throw deployError;
    }
  } catch (error: unknown) {
    console.error("[/api/deploy] Deployment error:", error);

    if (error instanceof DeploymentError) {
      // Map deployment error codes to user-friendly messages
      const userMessage = getDeploymentErrorMessage(error);
      return NextResponse.json(
        { error: userMessage, code: error.code },
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

/**
 * Maps internal DeploymentError codes to safe, actionable user-facing messages.
 */
function getDeploymentErrorMessage(error: DeploymentError): string {
  switch (error.code) {
    case "NO_FILES":
      return "No website files found to deploy. Please generate your website first.";
    case "MISSING_INDEX_HTML":
      return "Your website is missing an index.html file. Please regenerate your website.";
    case "MISSING_API_TOKEN":
    case "MISSING_ACCOUNT_ID":
      return "Deployment service is not properly configured. Please contact support.";
    case "DEPLOYMENT_FAILED":
      return "The hosting provider rejected the deployment. Please try again in a few moments.";
    case "DEPLOYMENT_EXECUTION_ERROR":
      return error.message.includes("Network connectivity")
        ? "Network error communicating with the hosting provider. Please try again."
        : "Deployment failed during file upload. Please try again.";
    default:
      return error.message;
  }
}
