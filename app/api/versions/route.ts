import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProjectVersionsList, VersionSummary } from "@/lib/versions";
import { cacheGet, cacheSet, cacheKeys, CACHE_TTL } from "@/lib/redis";

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

    // 3. Check Redis cache first
    const cacheKey = cacheKeys.projectVersions(user.id, projectId);
    const cachedVersions = await cacheGet<VersionSummary[]>(cacheKey);
    if (cachedVersions) {
      return NextResponse.json({
        success: true,
        projectId,
        versions: cachedVersions,
        cached: true,
      });
    }

    // 4. Verify project ownership in Supabase
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

    // 5. Retrieve version list from DB
    const versions = await getProjectVersionsList({
      supabase,
      projectId,
      userId: user.id,
    });

    // 6. Cache in Redis
    await cacheSet(cacheKey, versions, CACHE_TTL.PROJECT_VERSIONS);

    return NextResponse.json({
      success: true,
      projectId,
      versions,
      cached: false,
    });
  } catch (error: unknown) {
    console.error("[/api/versions] Error fetching versions:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch versions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

