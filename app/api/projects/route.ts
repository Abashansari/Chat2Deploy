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

    const result = projects || [];

    // 4. Save to Redis
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
