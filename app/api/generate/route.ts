import { NextResponse } from "next/server";
import { generateWebsite, modifyWebsite, GeneratedFile, GeminiServiceError, classifyGeminiError } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const { prompt, projectId } = body || {};

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

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "A valid project ID is required." },
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

    // 1. Fetch ALL existing project files and chat history BEFORE saving the current prompt
    const { data: existingFilesData } = await supabase
      .from("project_files")
      .select("file_path, content")
      .eq("project_id", projectId);

    const existingFiles: GeneratedFile[] = (existingFilesData || []).map(f => ({
      path: f.file_path,
      content: f.content
    }));

    const isModification = existingFiles.length > 0;

    let chatHistoryContext: { role: string; content: string }[] = [];
    if (isModification) {
      const { data: historyData } = await supabase
        .from("chat_history")
        .select("role, content")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })
        .limit(20);
      
      if (historyData) {
        chatHistoryContext = historyData;
      }
    }

    // 1.5 NOW save the user prompt to chat history (after fetching context)
    await supabase.from("chat_history").insert({
      project_id: projectId,
      role: "user",
      content: prompt.trim()
    });

    // 2. Generate or modify website
    let result;
    try {
      if (isModification) {
        result = await modifyWebsite(prompt.trim(), {
          currentFiles: existingFiles,
          chatHistory: chatHistoryContext,
        });
      } else {
        result = await generateWebsite(prompt.trim());
      }
    } catch (error: any) {
      // Save generation error in database for telemetry / history
      const safeLogMsg = error instanceof GeminiServiceError ? error.message : (error?.message || "Generation failed");
      await supabase.from("generation_history").insert({
        project_id: projectId,
        status: "error",
        error_message: safeLogMsg,
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

    // 4. Update the project files in the database
    // We determine what to insert/update and what to delete based on the new file list.
    const newPaths = new Set(result.files.map(f => f.path));
    const oldPaths = new Set(existingFiles.map(f => f.path));

    // Delete files that are no longer present
    const pathsToDelete = Array.from(oldPaths).filter(p => !newPaths.has(p));
    if (pathsToDelete.length > 0) {
      await supabase
        .from("project_files")
        .delete()
        .eq("project_id", projectId)
        .in("file_path", pathsToDelete);
    }

    // Upsert the current files
    for (const file of result.files) {
      const fileExt = file.path.split('.').pop() || 'txt';
      const { error: upsertError } = await supabase.from("project_files").upsert({
        project_id: projectId,
        file_path: file.path,
        content: file.content,
        file_type: fileExt
      }, { onConflict: "project_id, file_path" });

      if (upsertError) {
        console.error(`Failed to save project file: ${file.path}`, upsertError);
        throw new Error(`Failed to save file ${file.path}`);
      }
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

    const classified = classifyGeminiError(error);
    const headers: Record<string, string> = {};

    if (classified.retryAfterSeconds) {
      headers["Retry-After"] = String(classified.retryAfterSeconds);
    }

    // Return safe, sanitized errors to the client without exposing keys or raw stack traces
    return NextResponse.json(
      {
        error: classified.message,
        retryable: classified.retryable,
        ...(classified.retryAfterSeconds ? { retryAfter: classified.retryAfterSeconds } : {}),
      },
      {
        status: classified.status,
        headers,
      }
    );
  }
}
