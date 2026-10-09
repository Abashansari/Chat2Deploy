import { NextResponse } from "next/server";
import { generateWebsite } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, projectId } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "A prompt is required." },
        { status: 400 }
      );
    }

    if (prompt.length > 10000) {
      return NextResponse.json(
        { error: "Prompt is too long. Maximum 10,000 characters." },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "A project ID is required." },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized." },
        { status: 404 }
      );
    }

    // 1. Save user prompt to chat history
    await supabase.from("chat_history").insert({
      project_id: projectId,
      role: "user",
      content: prompt.trim()
    });

    // 2. Generate website
    let result;
    try {
      result = await generateWebsite(prompt.trim());
    } catch (error: any) {
      // Save generation error
      await supabase.from("generation_history").insert({
        project_id: projectId,
        status: "error",
        error_message: error.message || "Generation failed"
      });
      throw error;
    }

    // 3. Save AI response to chat history
    const aiResponse = `Generated "${result.title}" — ${result.description}`;
    await supabase.from("chat_history").insert({
      project_id: projectId,
      role: "assistant",
      content: aiResponse
    });

    // 4. Save generated file
    // First try to check if it exists (using upsert or just normal update)
    // Supabase JS upsert requires all unique keys
    const { error: upsertError } = await supabase.from("project_files").upsert({
      project_id: projectId,
      file_path: "index.html",
      content: result.html,
      file_type: "html"
    }, { onConflict: "project_id, file_path" });

    if (upsertError) {
      console.error("Failed to save project file", upsertError);
      // fallback in case of conflict issues
      await supabase.from("project_files").insert({
        project_id: projectId,
        file_path: `index-${Date.now()}.html`,
        content: result.html,
        file_type: "html"
      });
    }
    
    // 5. Update project updated_at
    await supabase.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);

    // Save generation success
    await supabase.from("generation_history").insert({
      project_id: projectId,
      status: "success"
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[/api/generate] Error:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    if (message.includes("429") || message.toLowerCase().includes("rate")) {
      return NextResponse.json(
        { error: "API rate limit reached. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    if (message.includes("API key") || message.includes("not configured")) {
      return NextResponse.json(
        { error: "AI service is not properly configured." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
