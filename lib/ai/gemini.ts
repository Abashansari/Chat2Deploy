import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

if (!apiKey) {
  console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set in the environment.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SYSTEM_INSTRUCTION = `You are an expert frontend web developer. When the user asks you to create a website, you MUST respond with a complete, self-contained, single HTML file that includes all HTML, CSS (in a <style> tag), and JavaScript (in a <script> tag).

CRITICAL RULES:
1. Generate ONLY a single, complete HTML file. Do NOT use React, JSX, TypeScript, or any framework that requires a build step.
2. The HTML file must be fully self-contained — all styles must be in a <style> tag, all scripts in a <script> tag.
3. Use modern CSS (flexbox, grid, custom properties, media queries for responsiveness).
4. Use vanilla JavaScript for interactivity (smooth scrolling, mobile menus, form validation, animations, etc.).
5. The design MUST be visually stunning, professional, and modern. Use:
   - Beautiful color palettes (not generic primary colors)
   - Proper typography with Google Fonts (import via <link> tag in the <head>)
   - Subtle shadows, gradients, and rounded corners
   - Smooth CSS transitions and animations
   - Responsive design for mobile, tablet, and desktop
6. Generate REAL, relevant content based on the user's prompt — not placeholder "Lorem ipsum" text.
7. Include a proper <!DOCTYPE html>, <html>, <head> with meta viewport, and <body>.
8. Include appropriate meta tags and a <title>.
9. Make the website interactive where appropriate (working navigation, smooth scroll, hover effects, mobile hamburger menu, etc.).
10. Do NOT include any markdown, explanations, or code fences. Output ONLY the raw HTML.
11. Do NOT reference external JS frameworks or CSS frameworks. Everything must be inline or from CDN links that are reliable (Google Fonts only).
12. The generated website should look like a real, production-quality website, not a demo or wireframe.

Your response must contain ONLY valid JSON matching the schema provided. Do NOT include any text outside the JSON.`;

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GenerationResult {
  title: string;
  description: string;
  html: string;
}

export async function generateWebsite(
  prompt: string
): Promise<GenerationResult> {
  if (!ai) {
    throw new Error(
      "Gemini API is not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY."
    );
  }

  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt cannot be empty.");
  }

  if (prompt.length > 10000) {
    throw new Error("Prompt is too long. Maximum 10,000 characters.");
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "The title of the generated website",
          },
          description: {
            type: Type.STRING,
            description: "A brief one-sentence description of the website",
          },
          html: {
            type: Type.STRING,
            description:
              "The complete, self-contained HTML document with inline CSS and JS",
          },
        },
        required: ["title", "description", "html"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  let parsed: GenerationResult;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned invalid JSON. Please try again.");
  }

  if (!parsed.html || typeof parsed.html !== "string") {
    throw new Error("Generated response is missing HTML content.");
  }

  if (!parsed.title) {
    parsed.title = "Generated Website";
  }
  if (!parsed.description) {
    parsed.description = "AI-generated website";
  }

  // Basic size validation
  if (parsed.html.length > 500000) {
    throw new Error("Generated HTML exceeds maximum allowed size.");
  }

  return parsed;
}
