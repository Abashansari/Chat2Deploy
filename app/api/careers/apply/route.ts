import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRedisClient } from "@/lib/redis";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

// ---------- Validation Helpers ----------

const MAX_TEXT_LENGTH = 500;
const MAX_MOTIVATION_LENGTH = 2000;
const MAX_SKILLS = 30;

const VALID_SKILLS = new Set([
  // Project Management & Collaboration
  "Git", "Jira",
  // Programming Languages
  "Python", "JavaScript",
  // Frameworks, Libraries & Platforms
  "FastAPI", "Express.js", "React", "Vue.js", "Next.js", "Tailwind CSS", "Supabase",
  // Databases
  "MongoDB", "PostgreSQL", "MySQL",
  // Preferred Skills (Optional / Added Advantage)
  "AWS & Cloud Computing", "AI & Machine Learning",
]);

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
}

function isValidUrl(url: string, host?: string): boolean {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    if (host && parsed.hostname !== host && !parsed.hostname.endsWith(`.${host}`)) return false;
    return url.length <= 500;
  } catch {
    return false;
  }
}

function sanitizeText(text: string, maxLen: number = MAX_TEXT_LENGTH): string {
  return text.trim().slice(0, maxLen);
}

// ---------- Simple in-memory rate limiter ----------
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_WINDOW = 5;
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= MAX_PER_WINDOW) {
    return true;
  }

  entry.count++;
  return false;
}

// Periodic cleanup
if (typeof globalThis !== "undefined") {
  const CLEANUP_INTERVAL = 30 * 60 * 1000;
  const globalKey = "__careerRateLimitCleanup";
  if (!(globalThis as Record<string, unknown>)[globalKey]) {
    (globalThis as Record<string, unknown>)[globalKey] = true;
    setInterval(() => {
      const now = Date.now();
      for (const [key, val] of rateLimitMap.entries()) {
        if (now - val.windowStart > RATE_WINDOW_MS) {
          rateLimitMap.delete(key);
        }
      }
    }, CLEANUP_INTERVAL);
  }
}

// ---------- POST Handler ----------

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

    // Parse body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    // ---------- Field Validation ----------

    const errors: string[] = [];

    // Full name (required)
    const fullName = typeof body.fullName === "string" ? sanitizeText(body.fullName) : "";
    if (!fullName || fullName.length < 2) {
      errors.push("Full name is required (minimum 2 characters).");
    }

    // Email (required)
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !isValidEmail(email)) {
      errors.push("A valid email address is required.");
    }

    // Phone (optional)
    const phone = typeof body.phone === "string" ? sanitizeText(body.phone, 20) : null;

    // Institution (required)
    const institution = typeof body.institution === "string" ? sanitizeText(body.institution) : "";
    if (!institution || institution.length < 2) {
      errors.push("College or institution is required.");
    }

    // Course (required)
    const course = typeof body.course === "string" ? sanitizeText(body.course) : "";
    if (!course || course.length < 2) {
      errors.push("Current course or degree is required.");
    }

    // Current year/semester (required)
    const currentYear = typeof body.currentYear === "string" ? sanitizeText(body.currentYear, 50) : "";
    if (!currentYear) {
      errors.push("Current year or semester is required.");
    }

    // Skills (required, array of valid skill strings)
    let skills: string[] = [];
    if (Array.isArray(body.skills)) {
      skills = body.skills
        .filter((s): s is string => typeof s === "string" && VALID_SKILLS.has(s))
        .slice(0, MAX_SKILLS);
    }
    if (skills.length === 0) {
      errors.push("Please select at least one skill or technology.");
    }

    // GitHub URL (required)
    const githubUrl = typeof body.githubUrl === "string" ? body.githubUrl.trim() : "";
    if (!githubUrl || !isValidUrl(githubUrl, "github.com")) {
      errors.push("A valid GitHub profile URL is required (must include github.com).");
    }

    // LinkedIn URL (optional)
    const linkedinUrl = typeof body.linkedinUrl === "string" && body.linkedinUrl.trim()
      ? body.linkedinUrl.trim()
      : null;
    if (linkedinUrl && !isValidUrl(linkedinUrl, "linkedin.com")) {
      errors.push("LinkedIn URL must be a valid linkedin.com URL.");
    }

    // Portfolio URL (optional)
    const portfolioUrl = typeof body.portfolioUrl === "string" && body.portfolioUrl.trim()
      ? body.portfolioUrl.trim()
      : null;
    if (portfolioUrl && !isValidUrl(portfolioUrl)) {
      errors.push("Portfolio URL must be a valid URL.");
    }

    // Motivation (required)
    const motivation = typeof body.motivation === "string"
      ? sanitizeText(body.motivation, MAX_MOTIVATION_LENGTH)
      : "";
    if (!motivation || motivation.length < 20) {
      errors.push("Please write at least 20 characters about why you want to join.");
    }

    // Unpaid acknowledgment (required)
    const unpaidAcknowledged = body.unpaidAcknowledged === true;
    if (!unpaidAcknowledged) {
      errors.push("You must acknowledge that this is an unpaid opportunity.");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed.", details: errors },
        { status: 400 }
      );
    }

    // Check authenticated session if user is logged in
    const supabase = await createClient();
    let authUserId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        authUserId = user.id;
      }
    } catch {
      // non-blocking
    }

    // ---------- Prepare Application Record ----------
    const applicationId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const appliedPosition = "Learner Contributor";

    const applicationRecord = {
      id: applicationId,
      userId: authUserId,
      fullName,
      email,
      phone: phone || null,
      institution,
      course,
      currentYear,
      skills,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
      motivation,
      unpaidAcknowledged,
      appliedPosition,
      status: "Submitted",
      adminNotes: null,
      reviewedAt: null,
      reviewedBy: null,
      createdAt,
      updatedAt: createdAt,
    };

    // 1. Attempt insert into Supabase
    const { error: dbError } = await supabase
      .from("career_applications")
      .insert({
        id: applicationId,
        user_id: authUserId,
        full_name: fullName,
        email,
        phone: phone || null,
        institution,
        course,
        current_year: currentYear,
        skills,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        motivation,
        unpaid_acknowledged: unpaidAcknowledged,
        applied_position: appliedPosition,
        status: "Submitted",
      });

    if (dbError) {
      // Duplicate email in Supabase
      if (dbError.code === "23505" || dbError.message?.includes("duplicate")) {
        return NextResponse.json(
          {
            error: "An application with this email address already exists. You can view your status under My Applications.",
          },
          { status: 409 }
        );
      }

      // Check for missing table
      const isTableMissing =
        dbError.code === "PGRST205" ||
        dbError.message?.includes("Could not find the table") ||
        dbError.message?.includes("relation \"public.career_applications\" does not exist");

      if (isTableMissing) {
        console.warn(
          "[/api/careers/apply] Supabase table 'career_applications' not yet created. Gracefully persisting to Upstash Redis."
        );
      } else {
        console.warn("[/api/careers/apply] Supabase insert error, persisting to Redis:", dbError.message);
      }
    }

    // 2. Always persist to Upstash Redis for instant retrieval & resilience
    const redis = getRedisClient();
    if (redis) {
      const existingId = await redis.get(`career_app_by_email:${email}`).catch(() => null);
      if (existingId) {
        return NextResponse.json(
          {
            error: "An application with this email address already exists. You can view your status under My Applications.",
          },
          { status: 409 }
        );
      }

      await redis.set(`career_app:${applicationId}`, JSON.stringify(applicationRecord));
      await redis.set(`career_app_by_email:${email}`, applicationId);
      await redis.lpush("career_applications_queue", applicationId);
    }

    // ---------- Persistent In-App Notifications (No Emails) ----------
    try {
      // 1. Admin Notification
      const adminEmail = process.env.CAREERS_ADMIN_EMAIL?.trim();
      if (adminEmail) {
        await createNotification({
          recipientEmail: adminEmail,
          relatedApplicationId: applicationId,
          type: "application_submitted",
          title: `New Application: ${fullName}`,
          message: `${fullName} has submitted an application for ${appliedPosition}. Institution: ${institution}, Course: ${course}.`,
        });
      }

      // 2. Learner Confirmation Notification
      await createNotification({
        recipientUserId: authUserId,
        recipientEmail: email,
        relatedApplicationId: applicationId,
        type: "application_submitted",
        title: "Application Submitted Successfully",
        message: "Your application has been submitted successfully. You can track your application status anytime under My Applications.",
      });
    } catch (notifErr) {
      console.warn("[/api/careers/apply] In-app notification creation non-fatal error:", notifErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your application has been received! You can track your application status anytime under My Applications.",
        applicationId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[/api/careers/apply] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
