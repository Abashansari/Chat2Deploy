"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
  Bell,
  Check,
  ChevronRight,
  ExternalLink,
  Globe,
  RefreshCw,
  Sparkles,
  AlertCircle,
  FileText,
  Building,
  GraduationCap,
  Calendar,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  X,
  Copy,
  LayoutDashboard,
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
import type { CareerApplicationRecord, ApplicationStatus } from "@/lib/careers";
import type { CareerNotification } from "@/lib/notifications";

interface MyApplicationsClientProps {
  initialUser: {
    id: string;
    email: string;
  };
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

export default function MyApplicationsClient({ initialUser }: MyApplicationsClientProps) {
  const [applications, setApplications] = useState<CareerApplicationRecord[]>([]);
  const [notifications, setNotifications] = useState<CareerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals & Panels
  const [selectedApp, setSelectedApp] = useState<CareerApplicationRecord | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchApplicationsData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await fetch("/api/my-applications", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load applications.");
      }

      setApplications(data.applications || []);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadNotificationsCount || 0);
    } catch (err) {
      console.error("[MyApplications] Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to load application data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchApplicationsData();
  }, [fetchApplicationsData]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
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
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  <Briefcase size={13} />
                  Learner Portal
                </span>
                <span className="text-xs text-muted-foreground">• {initialUser.email}</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                My Applications
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track your real-time application status, review admin feedback, and view official decisions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Button */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 rounded-xl bg-card border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="View notifications"
                  title="In-App Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-lg animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card border border-border shadow-2xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Bell size={16} className="text-primary" />
                        <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/20 text-primary">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">
                          No notifications yet. Updates will appear here.
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 rounded-xl border transition-colors ${
                              n.isRead
                                ? "bg-muted/20 border-border/60 text-muted-foreground"
                                : "bg-primary/5 border-primary/30 text-foreground"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-xs font-semibold">{n.title}</h5>
                              {!n.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(n.id)}
                                  className="text-[10px] text-primary hover:text-primary-dark whitespace-nowrap"
                                  title="Mark as read"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                            <p className="text-xs mt-1 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-muted-foreground mt-2 block">
                              {new Date(n.createdAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
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
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border hover:border-primary/40 text-sm font-medium text-foreground transition-colors"
              >
                <LayoutDashboard size={15} className="text-primary" />
                <span>Dashboard</span>
              </Link>

              {/* Refresh Button */}
              <button
                onClick={() => fetchApplicationsData(true)}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border hover:border-primary/40 text-sm font-medium text-foreground transition-colors disabled:opacity-50"
              >
                <RefreshCw size={15} className={isRefreshing ? "animate-spin text-primary" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-2xl bg-card/50 border border-border/60 animate-pulse p-6"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-4">
              <AlertCircle size={32} className="text-rose-400 mx-auto" />
              <h3 className="text-lg font-semibold text-foreground">Unable to Load Applications</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">{error}</p>
              <button
                onClick={() => fetchApplicationsData()}
                className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          ) : applications.length === 0 ? (
            /* Empty State */
            <div className="p-12 rounded-3xl bg-card border border-border text-center space-y-5 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                <Briefcase size={32} />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-foreground">No Applications Found</h3>
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t submitted any contributor applications under{" "}
                  <strong className="text-foreground">{initialUser.email}</strong> yet.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/careers"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-all shadow-lg shadow-primary/25"
                >
                  <span>Explore Learner Contributor Program</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            /* Applications List */
            <div className="space-y-6">
              {applications.map((app) => {
                const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.Submitted;
                const StatusIcon = config.icon;

                return (
                  <div
                    key={app.id}
                    className="rounded-2xl bg-card border border-border hover:border-primary/40 transition-all overflow-hidden shadow-sm"
                  >
                    {/* Top Status Bar */}
                    <div className="p-6 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold text-foreground">
                            {app.appliedPosition}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bgColor} ${config.color} ${config.borderColor}`}
                          >
                            <StatusIcon size={13} />
                            {config.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Application ID:</span>
                          <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px] text-foreground">
                            {app.id.slice(0, 8)}...{app.id.slice(-4)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(app.id)}
                            className="p-1 text-muted-foreground hover:text-foreground"
                            title="Copy full Application ID"
                          >
                            {copiedId === app.id ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted text-xs font-medium text-foreground transition-colors"
                        >
                          <FileText size={14} className="text-primary" />
                          <span>View Submitted Details</span>
                        </button>
                      </div>
                    </div>

                    {/* Status Experience Message Banner */}
                    <div className="p-6 space-y-4">
                      {app.status === "Selected" && (
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 space-y-3">
                          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                            <Sparkles size={18} />
                            <span>Official Selection Decision</span>
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                            Congratulations! You&apos;ve been selected to join our organization. Please check
                            your application details for any additional information or next steps.
                          </p>
                        </div>
                      )}

                      {app.status === "Rejected" && (
                        <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                            <XCircle size={15} />
                            <span>Application Status Update</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Thank you for your interest in joining our organization. Unfortunately, your
                            application has not been selected at this time. We appreciate the time and effort
                            you invested in applying.
                          </p>
                        </div>
                      )}

                      {app.status === "Under Review" && (
                        <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-2">
                          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                            <Eye size={15} />
                            <span>Review in Progress</span>
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed">
                            Your application is currently under review. We will update your application status
                            when a decision has been made.
                          </p>
                        </div>
                      )}

                      {app.status === "Submitted" && (
                        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                            <Clock size={15} />
                            <span>Application Received</span>
                          </div>
                          <p className="text-sm text-foreground/90 leading-relaxed">
                            Your application has been submitted successfully. You can check this page for future
                            updates.
                          </p>
                        </div>
                      )}

                      {/* Administrator Decision Notes / Next Steps */}
                      {app.adminNotes && (
                        <div className="p-4 rounded-xl bg-card border border-primary/30 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                            <MessageSquare size={13} />
                            <span>Administrator Message & Next Steps</span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-line leading-relaxed pl-5">
                            {app.adminNotes}
                          </p>
                          {app.reviewedAt && (
                            <span className="text-[10px] text-muted-foreground block pl-5 pt-1">
                              Updated on {new Date(app.reviewedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Timeline summary */}
                      <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-muted-foreground border-t border-border/50">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-primary" />
                          <span>
                            Submitted: {new Date(app.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                          </span>
                        </div>
                        {app.updatedAt && (
                          <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-primary" />
                            <span>
                              Last update: {new Date(app.updatedAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Building size={13} className="text-primary" />
                          <span>{app.institution}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Candidate Detail Modal */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card border border-border w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Submitted Application Details</h3>
                  <p className="text-xs text-muted-foreground">
                    Role: {selectedApp.appliedPosition} • Submitted on{" "}
                    {new Date(selectedApp.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-sm">
                {/* Academic Profile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                      <Building size={13} /> College / Institution
                    </span>
                    <p className="font-semibold text-foreground">{selectedApp.institution}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                      <GraduationCap size={13} /> Course & Year
                    </span>
                    <p className="font-semibold text-foreground">
                      {selectedApp.course} ({selectedApp.currentYear})
                    </p>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Submitted Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApp.skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Profiles & Links
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {selectedApp.githubUrl && (
                      <a
                        href={selectedApp.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/80"
                      >
                        <GithubIcon size={14} />
                        <span>GitHub</span>
                        <ExternalLink size={11} className="text-muted-foreground" />
                      </a>
                    )}
                    {selectedApp.linkedinUrl && (
                      <a
                        href={selectedApp.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/80"
                      >
                        <LinkedinIcon size={14} />
                        <span>LinkedIn</span>
                        <ExternalLink size={11} className="text-muted-foreground" />
                      </a>
                    )}
                    {selectedApp.portfolioUrl && (
                      <a
                        href={selectedApp.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-muted/80"
                      >
                        <Globe size={14} />
                        <span>Portfolio</span>
                        <ExternalLink size={11} className="text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Statement of Motivation */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Statement of Motivation
                  </h4>
                  <div className="p-4 rounded-xl bg-muted/20 border border-border text-foreground text-xs leading-relaxed whitespace-pre-line">
                    {selectedApp.motivation}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border bg-card flex justify-end">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-5 py-2 rounded-xl bg-muted text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                >
                  Close
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
