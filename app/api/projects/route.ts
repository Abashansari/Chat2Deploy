import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cacheGet, cacheSet, cacheKeys, CACHE_TTL, invalidateUserDashboardAndProjects } from "@/lib/redis";

export async function GET() {
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

    // 2. Check Redis cache first
    const cacheKey = cacheKeys.userProjects(user.id);
    const cachedProjects = await cacheGet<Record<string, unknown>[]>(cacheKey);

    if (cachedProjects) {
      return NextResponse.json({
        success: true,
        projects: cachedProjects,
        cached: true,
      });
    }

    // 3. Cache miss: Query Supabase
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (projectsError) {
      console.error("[/api/projects] Supabase query error:", projectsError.message);
      return NextResponse.json(
        { error: "Failed to retrieve projects." },
        { status: 500 }
      );
    }

    let result = (projects || []) as Record<string, unknown>[];

    // 4. Enrich projects with genuine production and draft versions from database records
    if (result.length > 0) {
      const projectIds = result.map((p) => String(p.id));

      // 4a. Resolve active production versions from latest successful deployments
      try {
        const { data: deploys } = await supabase
          .from("deployments")
          .select("project_id, source_version, created_at, status")
          .eq("user_id", user.id)
          .eq("status", "success")
          .order("created_at", { ascending: false });

        if (deploys && deploys.length > 0) {
          const deployVerMap = new Map<string, number>();
          for (const d of deploys) {
            if (typeof d.source_version === "number" && d.source_version > 0 && !deployVerMap.has(d.project_id)) {
              deployVerMap.set(d.project_id, d.source_version);
            }
          }
          for (const p of result) {
            const pid = String(p.id);
            if (deployVerMap.has(pid)) {
              p.last_deployed_version = deployVerMap.get(pid);
            } else if (p.last_deployed_version === undefined) {
              p.last_deployed_version = null;
            }
          }
        }
      } catch {
        // Non-critical
      }

      // 4b. Resolve draft/working versions for projects with unpopulated current_version
      const needingDraft = result.filter((p) => p.current_version === undefined || p.current_version === null);
      if (needingDraft.length > 0) {
        const pids = needingDraft.map((p) => String(p.id));
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
          // Table may not exist; try generation_history fallback
        }

        if (verMap.size < needingDraft.length) {
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

        for (const p of needingDraft) {
          const pid = String(p.id);
          if (verMap.has(pid)) {
            p.current_version = verMap.get(pid);
          }
        }
      }
    }

    // 5. Save to Redis
    await cacheSet(cacheKey, result, CACHE_TTL.USER_PROJECTS);

    return NextResponse.json({
      success: true,
      projects: result,
      cached: false,
    });
  } catch (error: unknown) {
    console.error("[/api/projects] GET Error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch projects.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    // 2. Parse body
    let body: { name?: string; description?: string } | undefined;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const { name, description = "New AI Project" } = body || {};
    const trimmedName = typeof name === "string" ? name.trim() : "";

    if (!trimmedName) {
      return NextResponse.json({ error: "A valid project name is required." }, { status: 400 });
    }

    // 3. Insert project
    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert([
        {
          name: trimmedName,
          description,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (insertError || !project) {
      console.error("[/api/projects] Insert error:", insertError?.message);
      return NextResponse.json(
        { error: insertError?.message || "Failed to create project." },
        { status: 500 }
      );
    }

    // 4. Invalidate affected user cache in Redis
    await invalidateUserDashboardAndProjects(user.id);

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: unknown) {
    console.error("[/api/projects] POST Error:", error);
    const message = error instanceof Error ? error.message : "Failed to create project.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
