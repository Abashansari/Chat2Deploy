"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  LayoutDashboard,
  FolderKanban,
  Rocket,
  BarChart3,
  Settings,
  BookOpen,
  Plus,
  Globe,
  Clock,
  Menu,
  X,
  User as UserIcon,
  Home,
  LogOut,
  Loader2,
  ExternalLink,
  Trash2,
  Edit2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
  History,
} from "lucide-react";
import { useAuth } from "../components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { DeploymentRecord, DashboardStats } from "@/lib/dashboard";

type DashboardTab = "overview" | "projects" | "deployments" | "analytics" | "settings" | "resources";

export default function DashboardPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const { logout, user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  // Core Data States
  const [projects, setProjects] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals & Dialogs
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Rename Dialog
  const [renameTarget, setRenameTarget] = useState<any | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete Project Dialog
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Remove from Deployments Dialog
  const [removeDeployTarget, setRemoveDeployTarget] = useState<DeploymentRecord | null>(null);
  const [isRemovingDeploy, setIsRemovingDeploy] = useState(false);
  const [removeDeployError, setRemoveDeployError] = useState<string | null>(null);

  // Inline Deploy Action State (e.g. triggering redeploy from dashboard)
  const [deployingProjectId, setDeployingProjectId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filter & Search States
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [deploymentSearch, setDeploymentSearch] = useState("");
  const [deploymentStatusFilter, setDeploymentStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [deploymentSort, setDeploymentSort] = useState<"newest" | "oldest" | "name">("newest");

  // Load All User Dashboard Data
  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // 1. Fetch Projects from Supabase
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (!projectsError && projectsData) {
        setProjects(projectsData);
      }

      // 2. Fetch Deployments from API
      const depRes = await fetch("/api/deployments");
      if (depRes.ok) {
        const depData = await depRes.json();
        setDeployments(depData.deployments || []);
      }

      // 3. Fetch Real Aggregated Dashboard Stats
      const statsRes = await fetch("/api/dashboard/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || null);
      }
    } catch (err) {
      console.error("[Dashboard] Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, refreshTrigger, loadDashboardData]);

  // Temporary Toast Helper
  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setActionNotice({ message, type });
    setTimeout(() => {
      setActionNotice(null);
    }, 4500);
  };

  // Create Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || isCreating || !user) return;

    setIsCreating(true);
    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          name: newProjectName.trim(),
          description: "New AI Project",
          user_id: user.id,
        },
      ])
      .select()
      .single();

    setIsCreating(false);

    if (error) {
      showNotification("Failed to create project: " + error.message, "error");
    } else if (data) {
      setIsCreateModalOpen(false);
      setNewProjectName("");
      router.push(`/workspace/${data.id}`);
    }
  };

  // Rename Project
  const handleExecuteRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim() || isRenaming) return;

    setIsRenaming(true);
    try {
      const res = await fetch(`/api/projects/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to rename project.");
      }

      showNotification(`Renamed project to "${data.name}".`);
      setRenameTarget(null);
      setRefreshTrigger((t) => t + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Rename failed.";
      showNotification(msg, "error");
    } finally {
      setIsRenaming(false);
    }
  };

  // Permanently Delete Project
  const handleExecuteDeleteProject = async () => {
    if (!deleteTarget || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/projects/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete project.");
      }

      showNotification(data.message || `Deleted project "${deleteTarget.name}".`);
      setDeleteTarget(null);
      setRefreshTrigger((t) => t + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deletion failed.";
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Remove from Deployments (Unpublish without deleting project)
  const handleExecuteRemoveDeployment = async () => {
    if (!removeDeployTarget || isRemovingDeploy) return;

    setIsRemovingDeploy(true);
    setRemoveDeployError(null);

    try {
      const res = await fetch("/api/deployments/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: removeDeployTarget.project_id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to unpublish project.");
      }

      showNotification(data.message || "Project removed from Deployments.");
      setRemoveDeployTarget(null);
      setRefreshTrigger((t) => t + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove deployment.";
      setRemoveDeployError(msg);
    } finally {
      setIsRemovingDeploy(false);
    }
  };

  // Inline Re-Deploy Action
  const handleDeployProject = async (projectId: string, projectName: string) => {
    if (deployingProjectId) return;
    setDeployingProjectId(projectId);

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Deployment failed.");
      }

      showNotification(`Successfully deployed "${projectName}"!`);
      setRefreshTrigger((t) => t + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deployment failed.";
      showNotification(msg, "error");
    } finally {
      setDeployingProjectId(null);
    }
  };

  // Filtered Projects List
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(projectSearch.toLowerCase());

      const isPublished = p.status?.toLowerCase() === "published" || !!p.deployment_url;
      const matchesStatus =
        projectStatusFilter === "all"
          ? true
          : projectStatusFilter === "published"
          ? isPublished
          : !isPublished;

      return matchesSearch && matchesStatus;
    });
  }, [projects, projectSearch, projectStatusFilter]);

  // Filtered Deployments List
  const filteredDeployments = useMemo(() => {
    return deployments.filter((d) => {
      const matchesSearch =
        d.project_name.toLowerCase().includes(deploymentSearch.toLowerCase()) ||
        d.url.toLowerCase().includes(deploymentSearch.toLowerCase()) ||
        d.deployment_id.toLowerCase().includes(deploymentSearch.toLowerCase());

      const matchesStatus =
        deploymentStatusFilter === "all" ? true : d.status === deploymentStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [deployments, deploymentSearch, deploymentStatusFilter]);

  const navigation = [
    { name: "Overview", id: "overview" as DashboardTab, icon: LayoutDashboard },
    { name: "Projects", id: "projects" as DashboardTab, icon: FolderKanban, count: projects.length },
    { name: "Deployments", id: "deployments" as DashboardTab, icon: Rocket, count: deployments.length },
    { name: "Analytics", id: "analytics" as DashboardTab, icon: BarChart3 },
    { name: "Settings", id: "settings" as DashboardTab, icon: Settings },
    { name: "Resources", id: "resources" as DashboardTab, icon: BookOpen },
  ];

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-surface">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-background border-r border-subtle flex flex-col transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-subtle shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2L14 6V14H2V6L8 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                <rect x="6" y="9" width="4" height="5" rx="0.5" fill="white" />
              </svg>
            </div>
            <span className="text-lg font-bold text-foreground">Chat2Deploy</span>
          </Link>
          <button
            className="ml-auto md:hidden text-muted hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-secondary hover:bg-surface hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                <span>{item.name}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface border border-subtle text-muted">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-subtle relative">
          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-card border border-subtle rounded-xl shadow-lg z-50 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-subtle">
                  <p className="text-sm font-medium text-foreground truncate">
                    {(user as any)?.user_metadata?.full_name || user?.name || user?.email}
                  </p>
                  <p className="text-xs text-muted truncate">{user?.email}</p>
                </div>
                <div className="p-2 space-y-1">
                  <div className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-secondary rounded-md">
                    <span>Theme</span>
                    <ThemeToggle />
                  </div>
                  <Link
                    href="/"
                    className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-secondary hover:text-foreground hover:bg-surface rounded-md transition-colors"
                  >
                    <span>Home Page</span>
                    <Home size={16} className="text-muted" />
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-red-600 hover:bg-red-500/10 rounded-md transition-colors"
                  >
                    <span>Log Out</span>
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <button
              className="flex items-center gap-3 hover:bg-surface p-2 rounded-lg transition-colors flex-1 min-w-0"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <div className="w-8 h-8 rounded-full bg-surface border border-subtle flex items-center justify-center shrink-0">
                <UserIcon size={16} className="text-muted" />
              </div>
              <p className="text-sm font-medium text-foreground truncate">
                {(user as any)?.user_metadata?.full_name || user?.name || user?.email}
              </p>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden h-16 border-b border-subtle bg-background flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button className="p-2 -ml-2 text-muted hover:text-foreground" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <span className="font-bold text-foreground capitalize">{activeTab}</span>
          </div>
          <ThemeToggle />
        </div>

        {/* Action Notification Toast */}
        {actionNotice && (
          <div className="fixed top-5 right-5 z-50 max-w-md bg-card border border-subtle rounded-xl p-4 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            {actionNotice.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-500 shrink-0" />
            )}
            <p className="text-sm font-medium text-foreground flex-1">{actionNotice.message}</p>
            <button onClick={() => setActionNotice(null)} className="text-muted hover:text-foreground">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Top Header */}
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground capitalize">
                  {activeTab === "overview" ? "Dashboard Overview" : activeTab}
                </h1>
                <p className="text-muted text-sm md:text-base mt-1">
                  {activeTab === "overview" && "Live metrics, project management, and edge deployments."}
                  {activeTab === "projects" && "Manage, rename, deploy, and inspect your AI-generated websites."}
                  {activeTab === "deployments" && "Monitor live edge websites, deployment outcomes, and URLs."}
                  {activeTab === "analytics" && "Real application statistics derived from your project database."}
                  {activeTab === "settings" && "Account configuration and hosting infrastructure overview."}
                  {activeTab === "resources" && "Guides, tutorials, and documentation to build faster."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRefreshTrigger((t) => t + 1)}
                  disabled={isLoading}
                  title="Refresh dashboard"
                  className="p-2.5 rounded-lg border border-subtle bg-card hover:bg-surface text-muted hover:text-foreground transition-colors"
                >
                  <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors shadow-sm shrink-0"
                >
                  <Plus size={16} />
                  New Project
                </button>
              </div>
            </header>

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-card border border-subtle rounded-xl p-5 shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Total Projects</p>
                      <p className="text-2xl font-bold text-foreground">{isLoading ? "-" : projects.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <FolderKanban size={20} />
                    </div>
                  </div>

                  <div className="bg-card border border-subtle rounded-xl p-5 shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Live Deployed</p>
                      <p className="text-2xl font-bold text-foreground">{isLoading ? "-" : stats?.deployedProjects ?? 0}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Rocket size={20} />
                    </div>
                  </div>

                  <div className="bg-card border border-subtle rounded-xl p-5 shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Drafts (Undeployed)</p>
                      <p className="text-2xl font-bold text-foreground">{isLoading ? "-" : stats?.draftProjects ?? 0}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center">
                      <Edit2 size={20} />
                    </div>
                  </div>

                  <div className="bg-card border border-subtle rounded-xl p-5 shadow-xs flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Failed Deploys</p>
                      <p className="text-2xl font-bold text-foreground">{isLoading ? "-" : stats?.failedDeployments ?? 0}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                      <AlertTriangle size={20} />
                    </div>
                  </div>
                </div>

                {/* Real Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chart 1: Project Distribution */}
                  <div className="bg-card border border-subtle rounded-xl p-5 shadow-xs flex flex-col">
                    <h2 className="text-sm font-semibold text-foreground mb-4">Project Status Distribution</h2>
                    <div className="flex-1 w-full min-h-[220px] flex items-center justify-center">
                      {stats && stats.projectDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={stats.projectDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {stats.projectDistribution.map((entry, index) => (
                                <Cell key={`pie-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--subtle)", borderRadius: "8px" }}
                              itemStyle={{ color: "var(--foreground)" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center text-xs text-muted">No projects created yet</div>
                      )}
                    </div>
                    <div className="flex justify-center gap-4 text-xs text-muted pt-2 border-t border-subtle">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Deployed ({stats?.deployedProjects || 0})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Drafts ({stats?.draftProjects || 0})
                      </span>
                    </div>
                  </div>

                  {/* Chart 2: Real Weekly Deployments Bar Chart */}
                  <div className="bg-card border border-subtle rounded-xl p-5 shadow-xs flex flex-col lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">Deployments Activity (Past 7 Days)</h2>
                        <p className="text-[11px] text-muted">Daily deployment attempts from Supabase records</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface border border-subtle text-muted">
                        Real Stored Data
                      </span>
                    </div>

                    <div className="flex-1 w-full min-h-[220px] flex items-center justify-center">
                      {stats && stats.deploymentsTimeline.some((t) => t.success > 0 || t.failed > 0) ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={stats.deploymentsTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--subtle)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} allowDecimals={false} />
                            <Tooltip
                              cursor={{ fill: "var(--subtle)", opacity: 0.4 }}
                              contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--subtle)", borderRadius: "8px" }}
                            />
                            <Bar dataKey="success" fill="#10b981" radius={[4, 4, 0, 0]} name="Successful" />
                            <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-10 space-y-1">
                          <Rocket size={24} className="mx-auto text-muted/50 mb-2" />
                          <p className="text-sm font-semibold text-foreground">No deployment activity this week</p>
                          <p className="text-xs text-muted max-w-xs">Deploy your websites to view daily live metrics.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Projects Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">Recent Projects</h2>
                    <button onClick={() => setActiveTab("projects")} className="text-xs font-semibold text-primary hover:underline">
                      View all projects →
                    </button>
                  </div>

                  {projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {projects.slice(0, 3).map((p) => {
                        const isDeployed = p.status?.toLowerCase() === "published" || !!p.deployment_url;
                        return (
                          <div key={p.id} className="bg-card border border-subtle rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition-shadow">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  isDeployed ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-surface text-muted border border-subtle"
                                }`}>
                                  {isDeployed ? "Published" : "Draft"}
                                </span>
                                <span className="text-[11px] text-muted flex items-center gap-1 font-mono">
                                  v{p.current_version || 1}
                                </span>
                              </div>
                              <h3 className="font-bold text-foreground text-base truncate">{p.name}</h3>
                              <p className="text-xs text-muted line-clamp-2 mt-1">{p.description || "Website project"}</p>
                            </div>

                            <div className="pt-4 mt-3 border-t border-subtle flex items-center gap-2">
                              <Link
                                href={`/workspace/${p.id}`}
                                className="flex-1 py-1.5 text-center text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-md transition-colors border border-primary/20"
                              >
                                Workspace
                              </Link>
                              {isDeployed && p.deployment_url && (
                                <a
                                  href={p.deployment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-muted hover:text-emerald-500 hover:bg-surface rounded-md transition-colors"
                                  title="Open live site"
                                >
                                  <ExternalLink size={15} />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 border border-subtle border-dashed rounded-xl text-center text-muted text-xs">
                      No projects found. Click &quot;New Project&quot; to get started.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PROJECTS */}
            {activeTab === "projects" && (
              <div className="space-y-6">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-subtle rounded-xl p-3">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      placeholder="Search projects by name..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="w-full bg-surface border border-subtle rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border border-subtle rounded-lg p-1 bg-surface text-xs">
                      <button
                        onClick={() => setProjectStatusFilter("all")}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                          projectStatusFilter === "all" ? "bg-background text-primary shadow-xs" : "text-muted hover:text-foreground"
                        }`}
                      >
                        All ({projects.length})
                      </button>
                      <button
                        onClick={() => setProjectStatusFilter("published")}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                          projectStatusFilter === "published" ? "bg-background text-primary shadow-xs" : "text-muted hover:text-foreground"
                        }`}
                      >
                        Published
                      </button>
                      <button
                        onClick={() => setProjectStatusFilter("draft")}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                          projectStatusFilter === "draft" ? "bg-background text-primary shadow-xs" : "text-muted hover:text-foreground"
                        }`}
                      >
                        Drafts
                      </button>
                    </div>
                  </div>
                </div>

                {/* Projects Grid */}
                {isLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin text-primary w-8 h-8" />
                  </div>
                ) : filteredProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((p) => {
                      const isDeployed = p.status?.toLowerCase() === "published" || !!p.deployment_url;
                      const isDeployingThis = deployingProjectId === p.id;

                      return (
                        <div key={p.id} className="bg-card border border-subtle rounded-xl p-5 hover:border-subtle/80 hover:shadow-xs transition-all flex flex-col justify-between">
                          <div>
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isDeployed ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-surface text-muted border border-subtle"
                              }`}>
                                {isDeployed ? "Published" : "Draft"}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setRenameTarget(p);
                                    setRenameValue(p.name);
                                  }}
                                  title="Rename project"
                                  className="p-1.5 text-muted hover:text-foreground rounded-md hover:bg-surface transition-colors"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteTarget(p);
                                    setDeleteError(null);
                                  }}
                                  title="Delete project"
                                  className="p-1.5 text-muted hover:text-red-500 rounded-md hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            <h3 className="font-bold text-foreground text-lg mb-1 truncate">{p.name}</h3>
                            <p className="text-xs text-muted mb-4 line-clamp-2">{p.description || "AI Website"}</p>

                            {/* Metadata */}
                            <div className="space-y-1.5 text-[11px] text-muted pt-3 border-t border-subtle">
                              <div className="flex items-center justify-between">
                                <span>Version:</span>
                                <span className="font-mono font-semibold text-foreground">v{p.current_version || 1}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Updated:</span>
                                <span>{new Date(p.updated_at).toLocaleDateString()}</span>
                              </div>
                              {p.deployment_url && (
                                <div className="flex items-center justify-between truncate pt-1">
                                  <span>URL:</span>
                                  <a
                                    href={p.deployment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline font-mono truncate max-w-[170px]"
                                  >
                                    {p.deployment_url.replace(/^https?:\/\//, "")}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="mt-5 pt-4 border-t border-subtle flex items-center gap-2">
                            <Link
                              href={`/workspace/${p.id}`}
                              className="flex-1 py-2 text-center text-xs font-semibold text-primary hover:bg-primary/5 rounded-md transition-colors border border-primary/20"
                            >
                              Workspace
                            </Link>

                            <button
                              onClick={() => handleDeployProject(p.id, p.name)}
                              disabled={isDeployingThis}
                              className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 text-white shadow-2xs ${
                                isDeployed ? "bg-emerald-600 hover:bg-emerald-700" : "bg-primary hover:bg-primary-dark"
                              }`}
                              title={isDeployed ? "Re-Deploy latest version" : "Deploy website"}
                            >
                              {isDeployingThis ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Rocket size={13} />
                              )}
                              <span>{isDeployed ? "Re-Deploy" : "Deploy"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-card border border-subtle rounded-2xl p-12 text-center flex flex-col items-center">
                    <FolderKanban size={36} className="text-muted/60 mb-3" />
                    <h3 className="text-base font-bold text-foreground mb-1">No Projects Found</h3>
                    <p className="text-xs text-muted max-w-xs mb-4">
                      {projectSearch ? "No projects match your search term." : "Create your first AI website project to get started."}
                    </p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      <Plus size={14} /> Create New Project
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: DEPLOYMENTS */}
            {activeTab === "deployments" && (
              <div className="space-y-6">
                {/* Search & Sort Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-subtle rounded-xl p-3">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      placeholder="Search deployments by project, domain, or ID..."
                      value={deploymentSearch}
                      onChange={(e) => setDeploymentSearch(e.target.value)}
                      className="w-full bg-surface border border-subtle rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Filter */}
                    <div className="flex items-center gap-1 border border-subtle rounded-lg p-1 bg-surface text-xs">
                      <button
                        onClick={() => setDeploymentStatusFilter("all")}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                          deploymentStatusFilter === "all" ? "bg-background text-primary shadow-xs" : "text-muted hover:text-foreground"
                        }`}
                      >
                        All ({deployments.length})
                      </button>
                      <button
                        onClick={() => setDeploymentStatusFilter("success")}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                          deploymentStatusFilter === "success" ? "bg-background text-primary shadow-xs" : "text-muted hover:text-foreground"
                        }`}
                      >
                        Success
                      </button>
                      <button
                        onClick={() => setDeploymentStatusFilter("failed")}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                          deploymentStatusFilter === "failed" ? "bg-background text-primary shadow-xs" : "text-muted hover:text-foreground"
                        }`}
                      >
                        Failed
                      </button>
                    </div>

                    {/* Sort Dropdown */}
                    <select
                      value={deploymentSort}
                      onChange={(e) => setDeploymentSort(e.target.value as any)}
                      className="bg-surface border border-subtle rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name">Project Name</option>
                    </select>
                  </div>
                </div>

                {/* Deployments Table / Cards */}
                {isLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin text-primary w-8 h-8" />
                  </div>
                ) : filteredDeployments.length > 0 ? (
                  <div className="bg-card border border-subtle rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface border-b border-subtle text-muted font-semibold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-3 px-4">Project</th>
                            <th className="py-3 px-4">Live URL</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Source Version</th>
                            <th className="py-3 px-4">Build Duration</th>
                            <th className="py-3 px-4">Deployed At</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-subtle/60 text-foreground">
                          {filteredDeployments.map((d) => {
                            const isDeployingThis = deployingProjectId === d.project_id;
                            const isFailed = d.status === "failed";

                            return (
                              <tr key={d.id} className="hover:bg-surface/50 transition-colors">
                                <td className="py-3.5 px-4 font-semibold">
                                  <Link href={`/workspace/${d.project_id}`} className="hover:text-primary transition-colors">
                                    {d.project_name}
                                  </Link>
                                </td>

                                <td className="py-3.5 px-4">
                                  {d.url ? (
                                    <a
                                      href={d.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline flex items-center gap-1 font-mono text-[11px]"
                                    >
                                      <span>{d.url.replace(/^https?:\/\//, "")}</span>
                                      <ExternalLink size={11} className="shrink-0" />
                                    </a>
                                  ) : (
                                    <span className="text-muted italic">Undeployed</span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4">
                                  {isFailed ? (
                                    <span
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 cursor-help"
                                      title={d.error_message || "Deployment failed"}
                                    >
                                      <AlertTriangle size={10} />
                                      Failed
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      Success
                                    </span>
                                  )}
                                </td>

                                <td className="py-3.5 px-4 font-mono text-muted">
                                  {d.source_version ? `v${d.source_version}` : "-"}
                                </td>

                                <td className="py-3.5 px-4 font-mono text-muted">
                                  {d.duration_ms ? `${(d.duration_ms / 1000).toFixed(1)}s` : "-"}
                                </td>

                                <td className="py-3.5 px-4 text-muted">
                                  {new Date(d.created_at).toLocaleString()}
                                </td>

                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {d.url && (
                                      <a
                                        href={d.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded hover:bg-surface text-muted hover:text-foreground"
                                        title="Open Website"
                                      >
                                        <ArrowUpRight size={14} />
                                      </a>
                                    )}

                                    <button
                                      onClick={() => handleDeployProject(d.project_id, d.project_name)}
                                      disabled={isDeployingThis}
                                      className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors"
                                      title="Re-Deploy latest version"
                                    >
                                      {isDeployingThis ? (
                                        <Loader2 size={14} className="animate-spin" />
                                      ) : (
                                        <RotateCcw size={14} />
                                      )}
                                    </button>

                                    <button
                                      onClick={() => {
                                        setRemoveDeployTarget(d);
                                        setRemoveDeployError(null);
                                      }}
                                      className="p-1.5 rounded hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors"
                                      title="Remove from Deployments"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card border border-subtle rounded-2xl p-12 text-center flex flex-col items-center">
                    <Rocket size={36} className="text-muted/60 mb-3" />
                    <h3 className="text-base font-bold text-foreground mb-1">No Deployments Found</h3>
                    <p className="text-xs text-muted max-w-sm mb-4">
                      {deploymentSearch ? "No deployments match your search." : "Deploy your websites from the project workspace to host them on global edge delivery."}
                    </p>
                    <button
                      onClick={() => setActiveTab("projects")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      Go to Projects
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: ANALYTICS */}
            {activeTab === "analytics" && (
              <div className="space-y-8">
                {/* Real Summary Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-card border border-subtle rounded-xl p-5 shadow-xs">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Total Deployments Run</p>
                    <p className="text-3xl font-bold text-foreground">{deployments.length}</p>
                    <p className="text-[11px] text-muted mt-1">Recorded in Supabase database</p>
                  </div>
                  <div className="bg-card border border-subtle rounded-xl p-5 shadow-xs">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Deployment Success Rate</p>
                    <p className="text-3xl font-bold text-emerald-500">
                      {deployments.length > 0
                        ? `${Math.round(
                            (deployments.filter((d) => d.status === "success").length / deployments.length) * 100
                          )}%`
                        : "N/A"}
                    </p>
                    <p className="text-[11px] text-muted mt-1">
                      {deployments.filter((d) => d.status === "success").length} successful runs
                    </p>
                  </div>
                  <div className="bg-card border border-subtle rounded-xl p-5 shadow-xs">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Average Edge Build Duration</p>
                    <p className="text-3xl font-bold text-foreground">
                      {(() => {
                        const durations = deployments.filter((d) => d.duration_ms).map((d) => d.duration_ms!);
                        if (durations.length === 0) return "N/A";
                        const avgMs = durations.reduce((a, b) => a + b, 0) / durations.length;
                        return `${(avgMs / 1000).toFixed(1)}s`;
                      })()}
                    </p>
                    <p className="text-[11px] text-muted mt-1">Cloudflare Pages asset synchronization</p>
                  </div>
                </div>

                {/* Big Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily Deployment Velocity */}
                  <div className="bg-card border border-subtle rounded-xl p-6 shadow-xs flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-bold text-foreground">Deployment Velocity (Last 7 Days)</h2>
                        <p className="text-xs text-muted">Daily deployment attempts</p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Live Database
                      </span>
                    </div>

                    <div className="flex-1 w-full min-h-[260px] flex items-center justify-center">
                      {stats && stats.deploymentsTimeline.some((t) => t.success > 0 || t.failed > 0) ? (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={stats.deploymentsTimeline}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--subtle)" />
                            <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} tickLine={false} />
                            <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} allowDecimals={false} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--subtle)", borderRadius: "8px" }}
                            />
                            <Bar dataKey="success" fill="#10b981" radius={[4, 4, 0, 0]} name="Success" />
                            <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-12 text-xs text-muted space-y-1">
                          <BarChart3 size={28} className="mx-auto text-muted/50 mb-2" />
                          <p className="font-semibold text-foreground">No historical deployments in the last 7 days</p>
                          <p>Deploy your projects to populate real deployment velocity metrics.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Composition */}
                  <div className="bg-card border border-subtle rounded-xl p-6 shadow-xs flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-sm font-bold text-foreground">Hosting Status Breakdown</h2>
                        <p className="text-xs text-muted">Published vs Draft projects</p>
                      </div>
                    </div>

                    <div className="flex-1 w-full min-h-[260px] flex items-center justify-center">
                      {stats && stats.projectDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={stats.projectDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={95}
                              paddingAngle={6}
                              dataKey="value"
                            >
                              {stats.projectDistribution.map((entry, index) => (
                                <Cell key={`pie-dist-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--subtle)", borderRadius: "8px" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center py-12 text-xs text-muted">No projects created yet</div>
                      )}
                    </div>

                    <div className="flex justify-center gap-6 text-xs text-muted pt-3 border-t border-subtle">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Live Edge Published ({stats?.deployedProjects || 0})
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-primary"></span> Draft Workspace ({stats?.draftProjects || 0})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SETTINGS */}
            {activeTab === "settings" && (
              <div className="space-y-6 max-w-3xl">
                <div className="bg-card border border-subtle rounded-xl p-6 shadow-xs space-y-4">
                  <h2 className="text-base font-bold text-foreground">User Profile & Account</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-surface border border-subtle rounded-lg">
                      <p className="text-muted mb-0.5">Full Name</p>
                      <p className="font-semibold text-foreground">
                        {(user as any)?.user_metadata?.full_name || user?.name || "Not configured"}
                      </p>
                    </div>
                    <div className="p-3 bg-surface border border-subtle rounded-lg">
                      <p className="text-muted mb-0.5">Email Address</p>
                      <p className="font-semibold text-foreground">{user?.email}</p>
                    </div>
                    <div className="p-3 bg-surface border border-subtle rounded-lg">
                      <p className="text-muted mb-0.5">User ID</p>
                      <p className="font-mono text-muted truncate">{user?.id}</p>
                    </div>
                    <div className="p-3 bg-surface border border-subtle rounded-lg">
                      <p className="text-muted mb-0.5">Account Status</p>
                      <p className="font-semibold text-emerald-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-subtle rounded-xl p-6 shadow-xs space-y-3">
                  <h2 className="text-base font-bold text-foreground">Hosting Infrastructure</h2>
                  <p className="text-xs text-muted">
                    Static web assets generated by Chat2Deploy are stored in your Supabase database and distributed via Cloudflare Pages edge delivery.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                    <div className="p-3 bg-surface border border-subtle rounded-lg">
                      <p className="font-semibold text-foreground">Supabase Database</p>
                      <p className="text-muted text-[11px] mt-0.5">PostgreSQL with Row Level Security</p>
                    </div>
                    <div className="p-3 bg-surface border border-subtle rounded-lg">
                      <p className="font-semibold text-foreground">Cloudflare Pages Edge</p>
                      <p className="text-muted text-[11px] mt-0.5">Global CDN with SSL certificates</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: RESOURCES */}
            {activeTab === "resources" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      title: "Prompt Engineering Guide",
                      description: "Learn how to effectively prompt Gemini to generate responsive websites with modern design tokens.",
                      tag: "Guide",
                    },
                    {
                      title: "Version Control & Rollback",
                      description: "Understand how snapshots are automatically created and how to roll back to any historical version seamlessly.",
                      tag: "Documentation",
                    },
                    {
                      title: "Cloudflare Pages Edge Hosting",
                      description: "Discover how your sites are deployed to Cloudflare's global edge network in under 10 seconds.",
                      tag: "Infrastructure",
                    },
                    {
                      title: "FAQ & Troubleshooting",
                      description: "Answers to common questions regarding deployment URLs, domain names, and AI rate-limit recovery.",
                      tag: "FAQ",
                    },
                  ].map((res, i) => (
                    <div key={i} className="bg-card border border-subtle rounded-xl p-5 hover:border-primary/50 transition-colors space-y-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {res.tag}
                      </span>
                      <h3 className="text-base font-bold text-foreground">{res.title}</h3>
                      <p className="text-xs text-muted leading-relaxed">{res.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL 1: CREATE PROJECT */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-card border border-subtle rounded-2xl p-6 shadow-xl w-full max-w-md animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-foreground mb-1">Create New Project</h2>
            <p className="text-xs text-muted mb-5">Give your new website project a name to get started.</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Minimalist SaaS Landing"
                  className="w-full bg-surface border border-subtle rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  autoFocus
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim() || isCreating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-70 shadow-sm"
                >
                  {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RENAME PROJECT */}
      {renameTarget && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-card border border-subtle rounded-2xl p-6 shadow-xl w-full max-w-md animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-foreground mb-1">Rename Project</h2>
            <p className="text-xs text-muted mb-4">Update the name for &ldquo;{renameTarget.name}&rdquo;.</p>

            <form onSubmit={handleExecuteRename} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full bg-surface border border-subtle rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  autoFocus
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  disabled={isRenaming}
                  className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!renameValue.trim() || isRenaming}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-70"
                >
                  {isRenaming ? <Loader2 size={14} className="animate-spin" /> : null}
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PERMANENTLY DELETE PROJECT CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-card border border-subtle rounded-2xl p-6 shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Delete Project Permanently?</h2>
                <p className="text-xs text-muted">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2 text-xs text-red-700 dark:text-red-300">
              <p className="font-semibold">
                Are you sure you want to delete &ldquo;{deleteTarget.name}&rdquo;?
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90">
                <li>All website code files and source snapshots will be erased.</li>
                <li>Full version history and chat conversations will be deleted.</li>
                <li>Associated Cloudflare Pages live website will be taken down.</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-500/10 text-red-600 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteProject}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-70 shadow-sm"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: REMOVE FROM DEPLOYMENTS CONFIRMATION */}
      {removeDeployTarget && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-card border border-subtle rounded-2xl p-6 shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Remove from Deployments?</h2>
                <p className="text-xs text-muted">Unpublish website from the public edge network.</p>
              </div>
            </div>

            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2 text-xs text-foreground">
              <p className="font-semibold text-primary">
                Project: &ldquo;{removeDeployTarget.project_name}&rdquo;
              </p>
              <p className="text-muted leading-relaxed">
                This will unpublish the live website at{" "}
                <span className="font-mono text-[11px] text-foreground">{removeDeployTarget.url}</span>.
              </p>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <p>
                <strong>Your source code is safe!</strong> This action will NOT delete your project files or version history. You can redeploy it at any time.
              </p>
            </div>

            {removeDeployError && (
              <div className="p-3 bg-red-500/10 text-red-600 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{removeDeployError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRemoveDeployTarget(null)}
                disabled={isRemovingDeploy}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRemoveDeployment}
                disabled={isRemovingDeploy}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-70 shadow-sm"
              >
                {isRemovingDeploy ? <Loader2 size={14} className="animate-spin" /> : null}
                Remove Deployment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
