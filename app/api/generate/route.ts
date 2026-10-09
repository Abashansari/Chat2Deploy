import { NextResponse } from "next/server";
import { generateWebsite } from "@/lib/ai/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;

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

    const result = await generateWebsite(prompt.trim());

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[/api/generate] Error:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    // Check for rate limit errors
    if (message.includes("429") || message.toLowerCase().includes("rate")) {
      return NextResponse.json(
        {
          error:
            "API rate limit reached. Please wait a moment and try again.",
        },
        { status: 429 }
      );
    }

    // Check for auth/config errors
    if (
      message.includes("API key") ||
      message.includes("not configured")
    ) {
      return NextResponse.json(
        { error: "AI service is not properly configured." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
