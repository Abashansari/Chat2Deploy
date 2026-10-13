import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserDeployments } from "@/lib/dashboard";

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

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const sort = (searchParams.get("sort") as "newest" | "oldest" | "name") || "newest";

    // 3. Fetch user deployments
    const deployments = await getUserDeployments(supabase, user.id, {
      search,
      status,
      sort,
    });

    return NextResponse.json({
      success: true,
      deployments,
    });
  } catch (error: unknown) {
    console.error("[/api/deployments] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch deployments.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
