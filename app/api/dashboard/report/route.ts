import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserDeployments } from "@/lib/dashboard";
import {
  getActiveProductionVersion,
  getWorkingDraftVersion,
  formatVersionDisplay,
  type ProjectRecord,
} from "@/lib/version-display";
import {
  generateAnalyticsPdfReport,
  sanitizeErrorMessage,
  type ReportData,
} from "@/lib/report-pdf";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to download the analytics report." },
        { status: 401 }
      );
    }

    // 2. Fetch all user projects from Supabase
    const { data: rawProjects, error: projError } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (projError) {
      console.error("[/api/dashboard/report] Projects query error:", projError.message);
      return NextResponse.json(
        { error: "Failed to retrieve project records from database." },
        { status: 500 }
      );
    }

    const projects = (rawProjects || []) as ProjectRecord[];

    // 3. Fetch user deployments from database
    const userDeployments = await getUserDeployments(supabase, user.id, {
      projects,
      sort: "newest",
    });

    // 4. Batch-resolve draft versions if current_version column was not populated on projects
    const projectsNeedingDraft = projects.filter(
      (p) => p.current_version === undefined || p.current_version === null
    );

    if (projectsNeedingDraft.length > 0) {
      const pids = projectsNeedingDraft.map((p) => p.id);
      const verMap = new Map<string, number>();

      try {
        const { data: verRows } = await supabase
          .from("project_versions")
          .select("project_id, version_number")
          .in("project_id", pids)
          .order("version_number", { ascending: false });

        if (verRows && verRows.length > 0) {
          for (const v of verRows) {
            if (!verMap.has(v.project_id) && typeof v.version_number === "number") {
              verMap.set(v.project_id, v.version_number);
            }
          }
        }
      } catch {
        // Table not found, try generation_history
      }

      if (verMap.size < projectsNeedingDraft.length) {
        try {
          const { data: histRows } = await supabase
            .from("generation_history")
            .select("project_id, error_message")
            .in("project_id", pids)
            .eq("status", "version_snapshot")
            .order("created_at", { ascending: false });

          if (histRows && histRows.length > 0) {
            for (const h of histRows) {
              if (h.error_message && !verMap.has(h.project_id)) {
                try {
                  const parsed = JSON.parse(h.error_message);
                  if (parsed && typeof parsed.version_number === "number") {
                    verMap.set(h.project_id, parsed.version_number);
                  }
                } catch {
                  // ignore
                }
              }
            }
          }
        } catch {
          // Non-critical
        }
      }

      for (const p of projectsNeedingDraft) {
        if (verMap.has(p.id)) {
          p.current_version = verMap.get(p.id);
        }
      }
    }

    // 5. Partition projects into Published vs Draft
    const publishedProjectsList: ReportData["publishedProjects"] = [];
    const draftProjectsList: ReportData["draftProjects"] = [];

    for (const p of projects) {
      const isPublished =
        p.status?.toLowerCase() === "published" ||
        !!p.deployment_url ||
        userDeployments.some((d) => d.project_id === p.id && d.status === "success");

      const prodVerNum = getActiveProductionVersion(p, userDeployments);
      const draftVerNum = getWorkingDraftVersion(p);

      if (isPublished) {
        const latestSuccess = userDeployments.find(
          (d) => d.project_id === p.id && d.status === "success"
        );

        publishedProjectsList.push({
          id: p.id,
          name: p.name,
          url: p.deployment_url || latestSuccess?.url || null,
          productionVersion: formatVersionDisplay(prodVerNum),
          draftVersion: draftVerNum ? formatVersionDisplay(draftVerNum) : null,
          deployedAt: latestSuccess?.created_at || p.last_deployed_at || p.updated_at,
          deploymentId: latestSuccess?.deployment_id || p.hosting_project_name || p.id.slice(0, 8),
          status: "Published",
        });
      } else {
        draftProjectsList.push({
          id: p.id,
          name: p.name,
          workingVersion: formatVersionDisplay(draftVerNum),
          createdAt: p.created_at || null,
          updatedAt: p.updated_at,
          status: "Draft",
        });
      }
    }

    // 6. Gather genuine Failed Deployments
    const failedDeploymentsList: ReportData["failedDeployments"] = userDeployments
      .filter((d) => d.status === "failed")
      .map((d) => ({
        projectName: d.project_name,
        deploymentId: d.deployment_id,
        attemptedAt: d.created_at,
        attemptedVersion: d.source_version ? `v${d.source_version}` : "Version unavailable",
        status: "Failed",
        errorSummary: sanitizeErrorMessage(d.error_message),
        url: d.url || null,
      }));

    // 7. Calculate Executive Metrics
    const totalProjects = projects.length;
    const publishedProjectsCount = publishedProjectsList.length;
    const draftProjectsCount = draftProjectsList.length;
    const totalDeployments = userDeployments.length;
    const failedDeploymentsCount = failedDeploymentsList.length;
    const successfulDeploymentsCount = userDeployments.filter((d) => d.status === "success").length;
    const successRate =
      totalDeployments > 0
        ? `${Math.round((successfulDeploymentsCount / totalDeployments) * 100)}%`
        : "N/A";

    const reportData: ReportData = {
      user: {
        name: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || null,
        email: user.email || null,
      },
      generatedAt: new Date(),
      period: "All retained deployment history",
      summary: {
        totalProjects,
        publishedProjects: publishedProjectsCount,
        draftProjects: draftProjectsCount,
        totalDeployments,
        failedDeployments: failedDeploymentsCount,
        successfulDeployments: successfulDeploymentsCount,
        successRate,
      },
      publishedProjects: publishedProjectsList,
      draftProjects: draftProjectsList,
      failedDeployments: failedDeploymentsList,
    };

    // 8. Generate PDF binary buffer
    const pdfBuffer = await generateAnalyticsPdfReport(reportData);

    // 9. Format meaningful filename (e.g., Gajala-report-YYYY-MM-DD.pdf or Chat2Deploy-report-YYYY-MM-DD.pdf)
    const rawName =
      (user.user_metadata?.full_name as string) ||
      (user.email ? user.email.split("@")[0] : "User");

    const sanitizedName = rawName.replace(/[^a-zA-Z0-9_-]/g, "");
    const dateFormatted = new Date().toISOString().split("T")[0];
    const filename = `${sanitizedName || "Chat2Deploy"}-report-${dateFormatted}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: unknown) {
    console.error("[/api/dashboard/report] Generation error:", error);
    const msg = error instanceof Error ? error.message : "Failed to generate PDF report.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
