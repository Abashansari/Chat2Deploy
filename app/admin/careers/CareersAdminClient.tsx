"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import {
  Users,
  Search,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  ShieldCheck,
  XCircle,
  Loader2,
  Building,
  Calendar,
  AlertTriangle,
  Globe,
  Sparkles,
  LayoutDashboard,
  Check,
  MessageSquare,
  Filter,
  ArrowUpDown,
  X,
  Copy,
  GraduationCap,
} from "lucide-react";

function GithubIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
import type {
  CareerApplicationRecord,
  ApplicationStatus,
  ApplicationStats,
} from "@/lib/careers";
import type { CareerNotification } from "@/lib/notifications";

interface CareersAdminClientProps {
  initialAdminEmail?: string;
}

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Clock }
> = {
  Submitted: {
    label: "Submitted",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    icon: Clock,
  },
  "Under Review": {
    label: "Under Review",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    icon: Eye,
  },
  Selected: {
    label: "Selected",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    icon: CheckCircle2,
  },
  Rejected: {
    label: "Rejected",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    icon: XCircle,
  },
};

export default function CareersAdminClient({ initialAdminEmail }: CareersAdminClientProps) {
  // Data state
  const [applications, setApplications] = useState<CareerApplicationRecord[]>([]);
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    submittedCount: 0,
    underReviewCount: 0,
    selectedCount: 0,
    rejectedCount: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Notifications state
  const [adminNotifications, setAdminNotifications] = useState<CareerNotification[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);

  // Filters & Pagination state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState<"newest" | "oldest" | "name_asc" | "name_desc">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & Drawers
  const [inspectApp, setInspectApp] = useState<CareerApplicationRecord | null>(null);
  const [decisionModal, setDecisionModal] = useState<{
    app: CareerApplicationRecord;
    targetStatus: ApplicationStatus;
    notes: string;
  } | null>(null);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load applications data
  const loadApplications = useCallback(
    async (quiet = false) => {
      if (!quiet) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      try {
        const query = new URLSearchParams({
          page: String(currentPage),
          pageSize: String(pageSize),
          search: debouncedSearch,
          status: statusFilter,
          sort: sortOption,
        });

        const res = await fetch(`/api/admin/careers/applications?${query.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load applications.");
        }

        setApplications(data.applications || []);
        setStats(
          data.stats || {
            total: 0,
            submittedCount: 0,
            underReviewCount: 0,
            selectedCount: 0,
            rejectedCount: 0,
          }
        );
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error("[CareersAdmin] Error loading applications:", err);
        setError(err instanceof Error ? err.message : "Failed to load applications.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentPage, debouncedSearch, statusFilter, sortOption]
  );

  // Load admin notifications
  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAdminNotifications(data.notifications || []);
        setUnreadNotifCount(data.unreadCount || 0);
      }
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    loadApplications();
    loadNotifications();
  }, [loadApplications, loadNotifications]);

  const handleMarkNotifRead = async (notifId: string) => {
    try {
      await fetch(`/api/notifications/${notifId}/read`, { method: "PATCH" });
      setAdminNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
    } catch {
      // non-fatal
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
      setAdminNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch {
      // non-fatal
    }
  };

  // Execute confirmed decision
  const handleConfirmDecision = async () => {
    if (!decisionModal || isSubmittingDecision) return;

    setIsSubmittingDecision(true);
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/admin/careers/applications/${decisionModal.app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: decisionModal.targetStatus,
          adminNotes: decisionModal.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update application decision.");
      }

      setActionFeedback({
        type: "success",
        message: `Decision saved: ${decisionModal.app.fullName} is now "${decisionModal.targetStatus}". In-app notification delivered.`,
      });

      // Update local state
      setApplications((prev) =>
        prev.map((a) => (a.id === decisionModal.app.id ? data.application : a))
      );
      if (inspectApp && inspectApp.id === decisionModal.app.id) {
        setInspectApp(data.application);
      }

      setDecisionModal(null);
      loadApplications(true);
      loadNotifications();
    } catch (err) {
      console.error("[CareersAdmin] Error applying decision:", err);
      setActionFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Database update failed. Decision was not saved.",
      });
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck size={14} />
                  Authorized Administrator
                </span>
                {initialAdminEmail && (
                  <span className="text-xs text-muted-foreground">• {initialAdminEmail}</span>
                )}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                <LayoutDashboard className="text-primary" />
                Careers Application Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Review contributor applicants, manage review stages, and dispatch in-app notifications.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Center */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
                  className="relative p-2.5 rounded-xl bg-card border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground transition-colors"
                  title="In-App Notifications"
                >
                  <Bell size={18} />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-lg animate-pulse">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {showNotificationsPanel && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card border border-border shadow-2xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Bell size={16} className="text-primary" />
                        <h4 className="text-sm font-semibold text-foreground">Admin Notifications</h4>
                        {unreadNotifCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/20 text-primary">
                            {unreadNotifCount} unread
                          </span>
                        )}
                      </div>
                      {unreadNotifCount > 0 && (
                        <button
                          onClick={handleMarkAllNotifsRead}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {adminNotifications.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">
                          No notifications. New applicant submissions will appear here.
                        </p>
                      ) : (
                        adminNotifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 rounded-xl border text-xs transition-colors cursor-pointer ${
                              n.isRead
                                ? "bg-muted/20 border-border/60 text-muted-foreground"
                                : "bg-primary/5 border-primary/30 text-foreground"
                            }`}
                            onClick={() => {
                              handleMarkNotifRead(n.id);
                              if (n.relatedApplicationId) {
                                const found = applications.find((a) => a.id === n.relatedApplicationId);
                                if (found) setInspectApp(found);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between gap-1 font-semibold mb-1">
                              <span>{n.title}</span>
                              <span className="text-[10px] text-muted-foreground font-normal">
                                {new Date(n.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-muted-foreground">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Back to Dashboard */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-card border border-border hover:border-primary/40 text-sm font-medium text-foreground transition-colors"
              >
                <LayoutDashboard size={15} className="text-primary" />
                <span>Dashboard</span>
              </Link>

              {/* Refresh Button */}
              <button
                onClick={() => {
                  loadApplications(true);
                  loadNotifications();
                }}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:border-primary/40 text-sm font-medium text-foreground transition-colors disabled:opacity-50"
              >
                <RefreshCw size={15} className={isRefreshing ? "animate-spin text-primary" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Action Feedback Banner */}
          {actionFeedback && (
            <div
              className={`p-4 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in ${
                actionFeedback.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                {actionFeedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{actionFeedback.message}</span>
              </div>
              <button
                onClick={() => setActionFeedback(null)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Total Applications</span>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border space-y-1">
              <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                <Clock size={13} /> Submitted
              </span>
              <p className="text-2xl font-bold text-foreground">{stats.submittedCount}</p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border space-y-1">
              <span className="text-xs font-medium text-cyan-400 flex items-center gap-1.5">
                <Eye size={13} /> Under Review
              </span>
              <p className="text-2xl font-bold text-foreground">{stats.underReviewCount}</p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border space-y-1">
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Selected
              </span>
              <p className="text-2xl font-bold text-foreground">{stats.selectedCount}</p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border space-y-1">
              <span className="text-xs font-medium text-rose-400 flex items-center gap-1.5">
                <XCircle size={13} /> Rejected
              </span>
              <p className="text-2xl font-bold text-foreground">{stats.rejectedCount}</p>
            </div>
          </div>

          {/* Search, Filter & Sort Controls */}
          <div className="p-4 rounded-2xl bg-card border border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by applicant name, email, or college..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-foreground"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <Filter size={14} className="text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown size={14} className="text-muted-foreground" />
                <select
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value as "newest" | "oldest" | "name_asc" | "name_desc");
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Applications Table */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Applicant</th>
                    <th className="py-3.5 px-4">College & Course</th>
                    <th className="py-3.5 px-4">Current Status</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                        <span>Loading applications...</span>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-rose-400">
                        {error}
                      </td>
                    </tr>
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        No applications found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => {
                      const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.Submitted;
                      const StatusIcon = config.icon;

                      return (
                        <tr key={app.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-semibold text-foreground">{app.fullName}</div>
                            <div className="text-xs text-muted-foreground">{app.email}</div>
                          </td>
                          <td className="py-4 px-4 text-xs">
                            <div className="text-foreground font-medium">{app.institution}</div>
                            <div className="text-muted-foreground">
                              {app.course} ({app.currentYear})
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bgColor} ${config.color} ${config.borderColor}`}
                            >
                              <StatusIcon size={12} />
                              {config.label}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs text-muted-foreground">
                            {new Date(app.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => setInspectApp(app)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors border border-primary/20"
                            >
                              <Eye size={13} />
                              <span>Review Candidate</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  Showing page {currentPage} of {totalPages} ({totalCount} total applicants)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Candidate Detail & Decision Drawer / Modal */}
        {inspectApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card border border-border w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-foreground">{inspectApp.fullName}</h3>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        STATUS_CONFIG[inspectApp.status]?.bgColor
                      } ${STATUS_CONFIG[inspectApp.status]?.color} ${
                        STATUS_CONFIG[inspectApp.status]?.borderColor
                      }`}
                    >
                      {inspectApp.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {inspectApp.email} • ID: {inspectApp.id.slice(0, 8)}...
                  </p>
                </div>
                <button
                  onClick={() => setInspectApp(null)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-sm">
                {/* Decision Actions Bar */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Administrative Decision Actions
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() =>
                        setDecisionModal({
                          app: inspectApp,
                          targetStatus: "Selected",
                          notes: inspectApp.adminNotes || "Welcome to Chat2Deploy! Onboarding links and repo access will be provided shortly.",
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-sm"
                    >
                      <CheckCircle2 size={14} />
                      <span>Select Applicant</span>
                    </button>
                    <button
                      onClick={() =>
                        setDecisionModal({
                          app: inspectApp,
                          targetStatus: "Under Review",
                          notes: inspectApp.adminNotes || "Your profile and project samples are currently being assessed.",
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/20 transition-colors"
                    >
                      <Eye size={14} />
                      <span>Move to Under Review</span>
                    </button>
                    <button
                      onClick={() =>
                        setDecisionModal({
                          app: inspectApp,
                          targetStatus: "Rejected",
                          notes: inspectApp.adminNotes || "Thank you for applying. We are unable to offer you a position at this time.",
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
                    >
                      <XCircle size={14} />
                      <span>Reject Applicant</span>
                    </button>
                  </div>
                </div>

                {/* Current Decision Note if any */}
                {inspectApp.adminNotes && (
                  <div className="p-4 rounded-xl bg-card border border-primary/30 space-y-1">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <MessageSquare size={13} /> Current Administrator Note
                    </span>
                    <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">
                      {inspectApp.adminNotes}
                    </p>
                    {inspectApp.reviewedAt && (
                      <span className="text-[10px] text-muted-foreground block pt-1">
                        Reviewed by {inspectApp.reviewedBy || "Admin"} on{" "}
                        {new Date(inspectApp.reviewedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Academic & Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                      <Building size={13} /> Institution
                    </span>
                    <p className="font-semibold text-foreground">{inspectApp.institution}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                      <GraduationCap size={13} /> Course & Year
                    </span>
                    <p className="font-semibold text-foreground">
                      {inspectApp.course} ({inspectApp.currentYear})
                    </p>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Submitted Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectApp.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* External Links */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Profiles & Repositories
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {inspectApp.githubUrl && (
                      <a
                        href={inspectApp.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/80"
                      >
                        <GithubIcon size={14} />
                        <span>GitHub Profile</span>
                        <ExternalLink size={11} className="text-muted-foreground" />
                      </a>
                    )}
                    {inspectApp.linkedinUrl && (
                      <a
                        href={inspectApp.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/80"
                      >
                        <LinkedinIcon size={14} />
                        <span>LinkedIn</span>
                        <ExternalLink size={11} className="text-muted-foreground" />
                      </a>
                    )}
                    {inspectApp.portfolioUrl && (
                      <a
                        href={inspectApp.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/80"
                      >
                        <Globe size={14} />
                        <span>Portfolio</span>
                        <ExternalLink size={11} className="text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Motivation */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Statement of Motivation
                  </h4>
                  <div className="p-4 rounded-xl bg-muted/20 border border-border text-foreground text-xs leading-relaxed whitespace-pre-line">
                    {inspectApp.motivation}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border bg-card flex justify-end">
                <button
                  onClick={() => setInspectApp(null)}
                  className="px-5 py-2 rounded-xl bg-muted text-xs font-medium text-foreground hover:bg-muted/80"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog for Decision */}
        {decisionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  {decisionModal.targetStatus === "Selected" && (
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  )}
                  {decisionModal.targetStatus === "Rejected" && (
                    <XCircle size={20} className="text-rose-400" />
                  )}
                  {decisionModal.targetStatus === "Under Review" && (
                    <Eye size={20} className="text-cyan-400" />
                  )}
                  <h3 className="text-lg font-bold text-foreground">
                    Confirm Decision: {decisionModal.targetStatus}
                  </h3>
                </div>
                <button
                  onClick={() => setDecisionModal(null)}
                  className="p-1.5 text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground text-xs leading-relaxed">
                  You are changing the status of{" "}
                  <strong className="text-foreground">{decisionModal.app.fullName}</strong> to{" "}
                  <span
                    className={`font-semibold ${
                      decisionModal.targetStatus === "Selected"
                        ? "text-emerald-400"
                        : decisionModal.targetStatus === "Rejected"
                        ? "text-rose-400"
                        : "text-cyan-400"
                    }`}
                  >
                    &quot;{decisionModal.targetStatus}&quot;
                  </span>
                  . This will immediately trigger an in-app notification in the candidate&apos;s portal.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Optional Message / Next Steps / Feedback for Learner
                  </label>
                  <textarea
                    rows={4}
                    value={decisionModal.notes}
                    onChange={(e) =>
                      setDecisionModal({ ...decisionModal, notes: e.target.value })
                    }
                    placeholder="Enter any guidance, next steps, repository links, or feedback..."
                    className="w-full p-3 rounded-xl bg-background border border-border text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDecisionModal(null)}
                  disabled={isSubmittingDecision}
                  className="px-4 py-2 rounded-xl bg-muted text-xs font-medium text-foreground hover:bg-muted/80 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDecision}
                  disabled={isSubmittingDecision}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md disabled:opacity-50 ${
                    decisionModal.targetStatus === "Selected"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : decisionModal.targetStatus === "Rejected"
                      ? "bg-rose-600 hover:bg-rose-500"
                      : "bg-cyan-600 hover:bg-cyan-500"
                  }`}
                >
                  {isSubmittingDecision && <Loader2 size={13} className="animate-spin" />}
                  <span>Confirm Decision</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
