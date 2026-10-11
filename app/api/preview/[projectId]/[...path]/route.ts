import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import mime from "mime";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const { projectId, path } = resolvedParams;
    const filePath = path.join("/");

    const supabase = await createClient();

    // Optionally check if the user is authorized to view this project's files.
    // For now, if the project is public or they are logged in, we let them view.
    // Assuming the RLS handles read access for project_files correctly.

    const { data: file, error } = await supabase
      .from("project_files")
      .select("content")
      .eq("project_id", projectId)
      .eq("file_path", filePath)
      .single();

    if (error || !file) {
      return new NextResponse("File not found", { status: 404 });
    }

    const contentType = mime.getType(filePath) || "text/plain";

    return new NextResponse(file.content, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[/api/preview] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
