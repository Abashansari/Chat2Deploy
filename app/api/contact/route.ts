import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRedisClient } from "@/lib/redis";
import { sendContactEmail, type ContactMessageData } from "@/lib/contact-email";

export const runtime = "nodejs";

const MAX_NAME_LENGTH = 200;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 3000;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
}

function sanitizeText(text: string, maxLen: number): string {
  return text.trim().slice(0, maxLen);
}

// In-memory sliding rate limiter per IP
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
  const globalKey = "__contactRateLimitCleanup";
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

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many messages sent recently. Please wait a few minutes before submitting again." },
        { status: 429 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const errors: string[] = [];

    // Full name
    const fullName = typeof body.fullName === "string" ? sanitizeText(body.fullName, MAX_NAME_LENGTH) : "";
    if (!fullName || fullName.length < 2) {
      errors.push("Full name is required (minimum 2 characters).");
    }

    // Email
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !isValidEmail(email)) {
      errors.push("A valid email address is required.");
    }

    // Subject
    const subject = typeof body.subject === "string" ? sanitizeText(body.subject, MAX_SUBJECT_LENGTH) : "";
    if (!subject || subject.length < 3) {
      errors.push("Subject is required (minimum 3 characters).");
    }

    // Message
    const message = typeof body.message === "string" ? sanitizeText(body.message, MAX_MESSAGE_LENGTH) : "";
    if (!message || message.length < 10) {
      errors.push("Message is required (minimum 10 characters).");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed.", details: errors },
        { status: 400 }
      );
    }

    const messageId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const record: ContactMessageData = {
      id: messageId,
      fullName,
      email,
      subject,
      message,
      createdAt,
    };

    let persistedLocation: "supabase" | "redis" = "supabase";
    const supabase = await createClient();

    // 1. Attempt Supabase persistence
    const { error: dbError } = await supabase
      .from("contact_messages")
      .insert({
        id: messageId,
        full_name: fullName,
        email,
        subject,
        message,
        ip_address: ip,
        status: "unread",
        email_sent: false,
      });

    if (dbError) {
      const isTableMissing =
        dbError.code === "PGRST205" ||
        dbError.message?.includes("Could not find the table") ||
        dbError.message?.includes("relation \"public.contact_messages\" does not exist");

      if (isTableMissing) {
        console.warn(
          "[/api/contact] Supabase table 'contact_messages' not yet created. Gracefully falling back to Upstash Redis."
        );
        const redis = getRedisClient();
        if (redis) {
          await redis.set(`contact_message:${messageId}`, JSON.stringify(record));
          await redis.lpush("contact_messages_queue", messageId);
          persistedLocation = "redis";
        }
      } else {
        console.error("[/api/contact] Supabase error:", dbError.message);
      }
    }

    // 2. Dispatch email notification
    const emailResult = await sendContactEmail(record);

    if (persistedLocation === "supabase" && emailResult.sent) {
      try {
        await supabase
          .from("contact_messages")
          .update({ email_sent: true })
          .eq("id", messageId);
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for reaching out! Your message has been received and our team will get back to you shortly.",
        emailWarning: emailResult.sent ? null : "Message saved, notification delivery is queued.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[/api/contact] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your message. Please try again later." },
      { status: 500 }
    );
  }
}
