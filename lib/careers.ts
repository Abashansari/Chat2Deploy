import { createClient } from "@/lib/supabase/server";
import { getRedisClient } from "@/lib/redis";
import { createNotification } from "@/lib/notifications";

export type ApplicationStatus = "Submitted" | "Under Review" | "Selected" | "Rejected";

export interface CareerApplicationRecord {
  id: string;
  userId?: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  institution: string;
  course: string;
  currentYear: string;
  skills: string[];
  githubUrl: string;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  motivation: string;
  unpaidAcknowledged: boolean;
  appliedPosition: string;
  status: ApplicationStatus;
  adminNotes?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationFilterOptions {
  search?: string;
  status?: string;
  sort?: "newest" | "oldest" | "name_asc" | "name_desc";
  page?: number;
  pageSize?: number;
}

export interface ApplicationStats {
  total: number;
  submittedCount: number;
  underReviewCount: number;
  selectedCount: number;
  rejectedCount: number;
}

export interface ApplicationsResponse {
  applications: CareerApplicationRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: ApplicationStats;
}

/**
 * Normalizes status strings from legacy/raw database values.
 */
export function normalizeStatus(rawStatus?: string | null): ApplicationStatus {
  if (!rawStatus) return "Submitted";
  const s = rawStatus.toLowerCase().trim();
  if (s === "pending" || s === "new" || s === "submitted") return "Submitted";
  if (s === "under review" || s === "under_review" || s === "reviewing") return "Under Review";
  if (s === "selected" || s === "accepted") return "Selected";
  if (s === "rejected" || s === "declined") return "Rejected";
  return "Submitted";
}

/**
 * Normalizes raw record from Supabase or Redis into strongly-typed CareerApplicationRecord.
 */
export function normalizeRecord(raw: Record<string, unknown>): CareerApplicationRecord {
  return {
    id: String(raw.id || raw.app_id || ""),
    userId: (raw.userId as string | null) || (raw.user_id as string | null) || null,
    fullName: String(raw.fullName || raw.full_name || "Applicant"),
    email: String(raw.email || "").toLowerCase().trim(),
    phone: (raw.phone as string | null) || null,
    institution: String(raw.institution || ""),
    course: String(raw.course || ""),
    currentYear: String(raw.currentYear || raw.current_year || ""),
    skills: Array.isArray(raw.skills) ? (raw.skills as string[]) : [],
    githubUrl: String(raw.githubUrl || raw.github_url || ""),
    linkedinUrl: (raw.linkedinUrl as string | null) || (raw.linkedin_url as string | null) || null,
    portfolioUrl: (raw.portfolioUrl as string | null) || (raw.portfolio_url as string | null) || null,
    motivation: String(raw.motivation || ""),
    unpaidAcknowledged: Boolean(raw.unpaidAcknowledged ?? raw.unpaid_acknowledged ?? true),
    appliedPosition: String(raw.appliedPosition || raw.applied_position || "Learner Contributor"),
    status: normalizeStatus((raw.status as string) || "Submitted"),
    adminNotes: (raw.adminNotes as string | null) || (raw.admin_notes as string | null) || null,
    reviewedAt: (raw.reviewedAt as string | null) || (raw.reviewed_at as string | null) || null,
    reviewedBy: (raw.reviewedBy as string | null) || (raw.reviewed_by as string | null) || null,
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || raw.updated_at || raw.createdAt || raw.created_at || new Date().toISOString()),
  };
}

/**
 * Fetches all applications from Redis storage.
 */
async function fetchFromRedis(): Promise<CareerApplicationRecord[]> {
  const redis = getRedisClient();
  if (!redis) return [];

  try {
    const queueIds = await redis.lrange("career_applications_queue", 0, 500);
    if (!queueIds || queueIds.length === 0) return [];

    const uniqueIds = Array.from(new Set(queueIds.filter(Boolean)));
    const records: CareerApplicationRecord[] = [];

    for (const id of uniqueIds) {
      try {
        const raw = await redis.get<Record<string, unknown> | string>(`career_app:${id}`);
        if (raw) {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          records.push(normalizeRecord(parsed));
        }
      } catch (err) {
        console.warn(`[Careers Data] Error parsing application record ${id}:`, err);
      }
    }

    return records;
  } catch (error) {
    console.error("[Careers Data] Error fetching from Redis:", error);
    return [];
  }
}

/**
 * Fetches all applications from Supabase database.
 */
async function fetchFromSupabase(): Promise<{ data: CareerApplicationRecord[] | null; isTableMissing: boolean }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("career_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      const isMissing =
        error.code === "PGRST205" ||
        error.message?.includes("Could not find the table") ||
        error.message?.includes('relation "public.career_applications" does not exist');
      return { data: null, isTableMissing: isMissing };
    }

    if (!data) return { data: [], isTableMissing: false };
    return { data: data.map(normalizeRecord), isTableMissing: false };
  } catch {
    return { data: null, isTableMissing: true };
  }
}

/**
 * Reads all applications from Supabase or Redis, merging if necessary.
 */
export async function getAllApplicationsRaw(): Promise<CareerApplicationRecord[]> {
  const { data: supabaseRecords, isTableMissing } = await fetchFromSupabase();

  if (!isTableMissing && supabaseRecords && supabaseRecords.length > 0) {
    const redisRecords = await fetchFromRedis();
    if (redisRecords.length === 0) return supabaseRecords;

    const mergedMap = new Map<string, CareerApplicationRecord>();
    for (const r of supabaseRecords) mergedMap.set(r.id, r);
    for (const r of redisRecords) {
      if (!mergedMap.has(r.id)) {
        mergedMap.set(r.id, r);
      }
    }
    return Array.from(mergedMap.values());
  }

  return await fetchFromRedis();
}

/**
 * Computes high-level statistics for the admin dashboard.
 */
function computeStats(all: CareerApplicationRecord[]): ApplicationStats {
  let submittedCount = 0;
  let underReviewCount = 0;
  let selectedCount = 0;
  let rejectedCount = 0;

  for (const app of all) {
    if (app.status === "Submitted") submittedCount++;
    else if (app.status === "Under Review") underReviewCount++;
    else if (app.status === "Selected") selectedCount++;
    else if (app.status === "Rejected") rejectedCount++;
  }

  return {
    total: all.length,
    submittedCount,
    underReviewCount,
    selectedCount,
    rejectedCount,
  };
}

/**
 * Retrieves a filtered, sorted, paginated list of career applications along with statistics for admin.
 */
export async function getCareerApplications(
  options: ApplicationFilterOptions = {}
): Promise<ApplicationsResponse> {
  const {
    search = "",
    status = "all",
    sort = "newest",
    page = 1,
    pageSize = 10,
  } = options;

  const allRecords = await getAllApplicationsRaw();
  const stats = computeStats(allRecords);

  // 1. Filtering
  const filtered = allRecords.filter((app) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const nameMatch = app.fullName.toLowerCase().includes(q);
      const emailMatch = app.email.toLowerCase().includes(q);
      const instMatch = app.institution.toLowerCase().includes(q);
      const courseMatch = app.course.toLowerCase().includes(q);
      const posMatch = app.appliedPosition.toLowerCase().includes(q);
      const skillMatch = app.skills.some((s) => s.toLowerCase().includes(q));

      if (!nameMatch && !emailMatch && !instMatch && !courseMatch && !posMatch && !skillMatch) {
        return false;
      }
    }

    if (status && status !== "all") {
      if (app.status.toLowerCase() !== status.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  // 2. Sorting
  filtered.sort((a, b) => {
    if (sort === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sort === "name_asc") {
      return a.fullName.localeCompare(b.fullName);
    }
    if (sort === "name_desc") {
      return b.fullName.localeCompare(a.fullName);
    }
    // Default newest
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // 3. Pagination
  const totalCount = filtered.length;
  const safePageSize = Math.max(1, Math.min(pageSize, 100));
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const startIndex = (currentPage - 1) * safePageSize;
  const paginated = filtered.slice(startIndex, startIndex + safePageSize);

  return {
    applications: paginated,
    totalCount,
    page: currentPage,
    pageSize: safePageSize,
    totalPages,
    stats,
  };
}

/**
 * Retrieves applications submitted by a specific learner (by user ID or email).
 */
export async function getLearnerApplications(
  userEmail: string,
  userId?: string | null
): Promise<CareerApplicationRecord[]> {
  const normalizedEmail = userEmail.toLowerCase().trim();

  // 1. Try Supabase
  try {
    const supabase = await createClient();
    let query = supabase.from("career_applications").select("*").order("created_at", { ascending: false });

    if (userId) {
      query = query.or(`email.ilike.${normalizedEmail},user_id.eq.${userId}`);
    } else {
      query = query.ilike("email", normalizedEmail);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map(normalizeRecord);
    }
  } catch {
    // Continue to Redis
  }

  // 2. Fetch all raw and filter by learner ownership
  const all = await getAllApplicationsRaw();
  return all
    .filter((app) => {
      const emailMatches = app.email.toLowerCase() === normalizedEmail;
      const userMatches = Boolean(userId && app.userId && app.userId === userId);
      return emailMatches || userMatches;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Retrieves a single application by its ID.
 */
export async function getCareerApplicationById(id: string): Promise<CareerApplicationRecord | null> {
  if (!id) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("career_applications")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      return normalizeRecord(data);
    }
  } catch {
    // Fallback to Redis
  }

  const redis = getRedisClient();
  if (redis) {
    try {
      const raw = await redis.get<Record<string, unknown> | string>(`career_app:${id}`);
      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return normalizeRecord(parsed);
      }
    } catch (err) {
      console.warn(`[Careers Data] Error finding record ${id} in Redis:`, err);
    }
  }

  return null;
}

/**
 * Updates application review status and admin notes, with automated persistent in-app notification.
 */
export async function updateCareerApplicationStatus(
  id: string,
  newStatus: ApplicationStatus,
  reviewerEmail?: string,
  notes?: string
): Promise<CareerApplicationRecord | null> {
  const current = await getCareerApplicationById(id);
  if (!current) return null;

  const previousStatus = current.status;
  const previousNotes = current.adminNotes || "";
  const trimmedNotes = notes !== undefined ? notes.trim() : previousNotes;
  const now = new Date().toISOString();

  const updated: CareerApplicationRecord = {
    ...current,
    status: newStatus,
    reviewedBy: reviewerEmail || current.reviewedBy,
    reviewedAt: now,
    adminNotes: trimmedNotes,
    updatedAt: now,
  };

  // 1. Update Supabase if available
  try {
    const supabase = await createClient();
    await supabase
      .from("career_applications")
      .update({
        status: newStatus,
        reviewed_by: updated.reviewedBy,
        reviewed_at: updated.reviewedAt,
        admin_notes: updated.adminNotes,
        updated_at: updated.updatedAt,
      })
      .eq("id", id);
  } catch {
    // Non-fatal
  }

  // 2. Update Redis
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(`career_app:${id}`, JSON.stringify(updated));
    } catch (err) {
      console.error("[Careers Data] Error updating Redis:", err);
    }
  }

  // 3. Prevent duplicate notifications: only send if status changed or new decision notes added
  const isStatusChanged = previousStatus !== newStatus;
  const areNotesAdded = trimmedNotes && trimmedNotes !== previousNotes;

  if (isStatusChanged || areNotesAdded) {
    let notifTitle = "Application Status Update";
    let notifType: "applicant_selected" | "applicant_rejected" | "application_under_review" | "status_updated" = "status_updated";
    let notifMessage = `Your application status has been updated to "${newStatus}".`;

    if (newStatus === "Selected") {
      notifType = "applicant_selected";
      notifTitle = "Congratulations! Application Selected 🎉";
      notifMessage =
        "Congratulations! You've been selected to join our organization. Please check your application details for any additional information or next steps." +
        (trimmedNotes ? ` Next Steps / Message: "${trimmedNotes}"` : "");
    } else if (newStatus === "Rejected") {
      notifType = "applicant_rejected";
      notifTitle = "Application Status Update";
      notifMessage =
        "Thank you for your interest in joining our organization. Unfortunately, your application has not been selected at this time. We appreciate the time and effort you invested in applying." +
        (trimmedNotes ? ` Feedback: "${trimmedNotes}"` : "");
    } else if (newStatus === "Under Review") {
      notifType = "application_under_review";
      notifTitle = "Application Under Review ⏳";
      notifMessage =
        "Your application is currently under review. We will update your application status when a decision has been made." +
        (trimmedNotes ? ` Note: "${trimmedNotes}"` : "");
    }

    try {
      await createNotification({
        recipientUserId: current.userId || null,
        recipientEmail: current.email,
        relatedApplicationId: current.id,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
      });
    } catch (notifErr) {
      console.error("[Careers] Error generating decision notification:", notifErr);
    }
  }

  return updated;
}
