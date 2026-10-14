import { createClient } from "@/lib/supabase/server";
import { getRedisClient } from "@/lib/redis";

export type NotificationType =
  | "application_submitted"
  | "status_updated"
  | "applicant_selected"
  | "applicant_rejected"
  | "application_under_review";

export interface CareerNotification {
  id: string;
  recipientUserId?: string | null;
  recipientEmail: string;
  relatedApplicationId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export interface CreateNotificationParams {
  recipientUserId?: string | null;
  recipientEmail: string;
  relatedApplicationId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
}

function normalizeNotificationRecord(raw: Record<string, unknown>): CareerNotification {
  return {
    id: String(raw.id || crypto.randomUUID()),
    recipientUserId: (raw.recipientUserId as string | null) || (raw.recipient_user_id as string | null) || null,
    recipientEmail: String(raw.recipientEmail || raw.recipient_email || "").toLowerCase().trim(),
    relatedApplicationId:
      (raw.relatedApplicationId as string | null) || (raw.related_application_id as string | null) || null,
    type: (raw.type as NotificationType) || "status_updated",
    title: String(raw.title || "Notification"),
    message: String(raw.message || ""),
    isRead: Boolean(raw.isRead ?? raw.is_read ?? false),
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    readAt: (raw.readAt as string | null) || (raw.read_at as string | null) || null,
  };
}

/**
 * Creates and persists an in-app notification in Supabase and Upstash Redis.
 */
export async function createNotification(params: CreateNotificationParams): Promise<CareerNotification> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const normalizedEmail = params.recipientEmail.toLowerCase().trim();

  const record: CareerNotification = {
    id,
    recipientUserId: params.recipientUserId || null,
    recipientEmail: normalizedEmail,
    relatedApplicationId: params.relatedApplicationId || null,
    type: params.type,
    title: params.title,
    message: params.message,
    isRead: false,
    createdAt,
    readAt: null,
  };

  // 1. Try Supabase
  try {
    const supabase = await createClient();
    await supabase.from("career_notifications").insert({
      id,
      recipient_user_id: record.recipientUserId,
      recipient_email: record.recipientEmail,
      related_application_id: record.relatedApplicationId,
      type: record.type,
      title: record.title,
      message: record.message,
      is_read: false,
      created_at: createdAt,
    });
  } catch (err) {
    console.warn("[Notifications] Supabase insert skipped or table missing, using Redis:", err);
  }

  // 2. Persist to Redis
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(`career_notification:${id}`, JSON.stringify(record));
      // User-specific or admin-specific list
      await redis.lpush(`career_notifications_list:${normalizedEmail}`, id);
      if (params.recipientUserId) {
        await redis.lpush(`career_notifications_user:${params.recipientUserId}`, id);
      }
    } catch (redisErr) {
      console.error("[Notifications] Redis persist error:", redisErr);
    }
  }

  return record;
}

/**
 * Fetches notifications for a user or admin.
 */
export async function getNotifications(params: {
  email: string;
  userId?: string | null;
  isAdmin?: boolean;
}): Promise<{ notifications: CareerNotification[]; unreadCount: number }> {
  const normalizedEmail = params.email.toLowerCase().trim();

  // 1. Try Supabase
  try {
    const supabase = await createClient();
    let query = supabase
      .from("career_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (params.userId) {
      query = query.or(`recipient_email.ilike.${normalizedEmail},recipient_user_id.eq.${params.userId}`);
    } else {
      query = query.ilike("recipient_email", normalizedEmail);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      const records = data.map(normalizeNotificationRecord);
      const unreadCount = records.filter((n) => !n.isRead).length;
      return { notifications: records, unreadCount };
    }
  } catch {
    // Continue to Redis fallback
  }

  // 2. Fallback to Redis
  const redis = getRedisClient();
  if (!redis) {
    return { notifications: [], unreadCount: 0 };
  }

  try {
    const idsFromEmail = (await redis.lrange(`career_notifications_list:${normalizedEmail}`, 0, 50)) || [];
    let idsFromUser: string[] = [];
    if (params.userId) {
      idsFromUser = (await redis.lrange(`career_notifications_user:${params.userId}`, 0, 50)) || [];
    }

    const uniqueIds = Array.from(new Set([...idsFromEmail, ...idsFromUser].filter(Boolean)));
    const notifications: CareerNotification[] = [];

    for (const id of uniqueIds) {
      try {
        const raw = await redis.get<Record<string, unknown> | string>(`career_notification:${id}`);
        if (raw) {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          notifications.push(normalizeNotificationRecord(parsed));
        }
      } catch {
        // ignore parse error
      }
    }

    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return { notifications, unreadCount };
  } catch (error) {
    console.error("[Notifications] Redis fetch error:", error);
    return { notifications: [], unreadCount: 0 };
  }
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(id: string, userEmail: string): Promise<boolean> {
  const readAt = new Date().toISOString();
  const normalizedEmail = userEmail.toLowerCase().trim();

  // 1. Update Supabase
  try {
    const supabase = await createClient();
    await supabase
      .from("career_notifications")
      .update({ is_read: true, read_at: readAt })
      .eq("id", id);
  } catch {
    // Non-fatal
  }

  // 2. Update Redis
  const redis = getRedisClient();
  if (redis) {
    try {
      const raw = await redis.get<Record<string, unknown> | string>(`career_notification:${id}`);
      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        // Verify ownership if needed
        if (
          !parsed.recipient_email ||
          parsed.recipient_email.toLowerCase().trim() === normalizedEmail ||
          parsed.recipientEmail?.toLowerCase().trim() === normalizedEmail
        ) {
          const updated = {
            ...parsed,
            isRead: true,
            is_read: true,
            readAt,
            read_at: readAt,
          };
          await redis.set(`career_notification:${id}`, JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.error("[Notifications] Redis mark read error:", err);
    }
  }

  return true;
}

/**
 * Marks all notifications for a user/admin as read.
 */
export async function markAllNotificationsAsRead(userEmail: string, userId?: string | null): Promise<boolean> {
  const readAt = new Date().toISOString();
  const normalizedEmail = userEmail.toLowerCase().trim();

  // 1. Update Supabase
  try {
    const supabase = await createClient();
    let query = supabase.from("career_notifications").update({ is_read: true, read_at: readAt });
    if (userId) {
      query = query.or(`recipient_email.ilike.${normalizedEmail},recipient_user_id.eq.${userId}`);
    } else {
      query = query.ilike("recipient_email", normalizedEmail);
    }
    await query;
  } catch {
    // Non-fatal
  }

  // 2. Update Redis
  const redis = getRedisClient();
  if (redis) {
    try {
      const idsFromEmail = (await redis.lrange(`career_notifications_list:${normalizedEmail}`, 0, 100)) || [];
      let idsFromUser: string[] = [];
      if (userId) {
        idsFromUser = (await redis.lrange(`career_notifications_user:${userId}`, 0, 100)) || [];
      }
      const uniqueIds = Array.from(new Set([...idsFromEmail, ...idsFromUser].filter(Boolean)));

      for (const id of uniqueIds) {
        const raw = await redis.get<Record<string, unknown> | string>(`career_notification:${id}`);
        if (raw) {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          const updated = { ...parsed, isRead: true, is_read: true, readAt, read_at: readAt };
          await redis.set(`career_notification:${id}`, JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.error("[Notifications] Redis mark all read error:", err);
    }
  }

  return true;
}
