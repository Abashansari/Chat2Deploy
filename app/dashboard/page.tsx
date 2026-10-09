"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../components/ThemeToggle";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Rocket, 
  BookOpen, 
  Plus,
  MoreVertical,
  Globe,
  Clock,
  Menu,
  X,
  User as UserIcon,
  Home,
  LifeBuoy,
  LogOut,
  MoreHorizontal,
  Bell,
  Loader2
} from "lucide-react";
import { useAuth } from "../components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";

const PROJECT_STATS = [
  { name: 'Frontend', value: 2, color: '#0284c7' },
  { name: 'Fullstack', value: 1, color: '#e8633e' },
  { name: 'Backend', value: 0, color: '#10b981' },
];

const DEPLOYMENT_STATS = [
  { name: 'Mon', count: 1 },
  { name: 'Tue', count: 0 },
  { name: 'Wed', count: 2 },
  { name: 'Thu', count: 1 },
  { name: 'Fri', count: 3 },
  { name: 'Sat', count: 0 },
  { name: 'Sun', count: 1 },
];

export default function DashboardPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { logout, user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [projects, setProjects] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loadProjects = async () => {
    setIsLoading(true);
    
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
      
    if (!projectsError && projectsData) {
      setProjects(projectsData);
    }
    
    // For now deployments are just mock mapped, we'll fetch real ones if needed later
    setDeployments([]);

    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || isCreating) return;
    
    setIsCreating(true);
    
    const { data, error } = await supabase
      .from('projects')
      .insert([
        { 
          name: newProjectName.trim(), 
          description: "New AI Project",
          user_id: user?.id 
        }
      ])
      .select()
      .single();
      
    setIsCreating(false);
    
    if (error) {
      console.error(error);
      alert("Failed to create project");
    } else if (data) {
      setIsCreateModalOpen(false);
      router.push(`/workspace/${data.id}`);
    }
  };

  const navigation = [
    { name: "Dashboard", id: "dashboard", icon: LayoutDashboard },
    { name: "Projects", id: "projects", icon: FolderKanban },
    { name: "Deployments", id: "deployments", icon: Rocket },
    { name: "Resources", id: "resources", icon: BookOpen },
  ];

  if (isAuthLoading) {
    return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>;
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
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-background border-r border-subtle flex flex-col
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-subtle shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2L14 6V14H2V6L8 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
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

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeTab === item.id 
                  ? "bg-primary/10 text-primary" 
                  : "text-secondary hover:bg-surface hover:text-foreground"
                }
              `}
            >
              <item.icon size={18} />
              {item.name}
            </button>
          ))}
        </nav>

        {/* User Profile Area */}
        <div className="p-4 border-t border-subtle relative">
          {/* Popover Menu */}
          {isUserMenuOpen && (
            <>
              {/* Invisible overlay to close menu */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsUserMenuOpen(false)}
              ></div>
              
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-card border border-subtle rounded-xl shadow-lg z-50 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-subtle flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{(user as any)?.user_metadata?.full_name || user?.name || user?.email}</p>
                    <p className="text-xs text-muted">{user?.email}</p>
                  </div>
                </div>
                
                <div className="p-2 space-y-1 border-b border-subtle">
                  <div className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-secondary rounded-md">
                    <span>Theme</span>
                    <ThemeToggle />
                  </div>
                  <Link href="/" className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-secondary hover:text-foreground hover:bg-surface rounded-md transition-colors">
                    <span>Home Page</span>
                    <Home size={16} className="text-muted" />
                  </Link>
                  <button onClick={logout} className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-secondary hover:text-foreground hover:bg-surface rounded-md transition-colors">
                    <span>Log Out</span>
                    <LogOut size={16} className="text-muted" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* User Profile Button */}
          <div className="flex items-center justify-between">
            <button 
              className="flex items-center gap-3 hover:bg-surface p-2 rounded-lg transition-colors flex-1 min-w-0"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <div className="w-8 h-8 rounded-full bg-surface border border-subtle flex items-center justify-center shrink-0">
                <UserIcon size={16} className="text-muted" />
              </div>
              <p className="text-sm font-medium text-foreground truncate">{(user as any)?.user_metadata?.full_name || user?.name || user?.email}</p>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden h-16 border-b border-subtle bg-background flex items-center px-4 shrink-0">
          <button 
            className="p-2 -ml-2 text-muted hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
          <span className="ml-2 font-bold text-foreground">Dashboard</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
          <div className="max-w-5xl mx-auto space-y-12">
            
            {/* Header Section */}
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {((user as any)?.user_metadata?.full_name || user?.name || "there").split(' ')[0]}</h1>
                <p className="text-muted text-lg">Build, manage, and deploy your websites from one place.</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors shadow-sm shrink-0"
              >
                <Plus size={18} />
                Create New Project
              </button>
            </header>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <button onClick={() => setIsCreateModalOpen(true)} className="p-4 rounded-xl border border-subtle bg-card hover:border-primary/50 hover:shadow-sm transition-all group flex flex-col items-center text-center gap-2">
                 <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Plus size={20} />
                 </div>
                 <span className="text-sm font-medium text-foreground">New Site</span>
               </button>
               <button onClick={() => setActiveTab('projects')} className="p-4 rounded-xl border border-subtle bg-card hover:border-primary/50 hover:shadow-sm transition-all group flex flex-col items-center text-center gap-2">
                 <div className="w-10 h-10 rounded-full bg-surface text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                   <FolderKanban size={20} />
                 </div>
                 <span className="text-sm font-medium text-foreground">Projects</span>
               </button>
               <button onClick={() => setActiveTab('deployments')} className="p-4 rounded-xl border border-subtle bg-card hover:border-primary/50 hover:shadow-sm transition-all group flex flex-col items-center text-center gap-2">
                 <div className="w-10 h-10 rounded-full bg-surface text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Globe size={20} />
                 </div>
                 <span className="text-sm font-medium text-foreground">Deployments</span>
               </button>
               <Link href="/resources" className="p-4 rounded-xl border border-subtle bg-card hover:border-primary/50 hover:shadow-sm transition-all group flex flex-col items-center text-center gap-2">
                 <div className="w-10 h-10 rounded-full bg-surface text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                   <BookOpen size={20} />
                 </div>
                 <span className="text-sm font-medium text-foreground">Resources</span>
               </Link>
            </div>

            {/* Analytics & Summary Section */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="flex flex-col gap-4">
                <div className="bg-card border border-subtle rounded-xl p-5 shadow-sm flex items-center justify-between h-full">
                  <div>
                    <p className="text-sm font-medium text-muted mb-1">Total Projects</p>
                    <p className="text-3xl font-bold text-foreground">{isLoading ? "-" : projects.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <FolderKanban size={24} className="text-primary" />
                  </div>
                </div>
                <div className="bg-card border border-subtle rounded-xl p-5 shadow-sm flex items-center justify-between h-full">
                  <div>
                    <p className="text-sm font-medium text-muted mb-1">Total Deployments</p>
                    <p className="text-3xl font-bold text-foreground">{isLoading ? "-" : deployments.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <Rocket size={24} className="text-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Pie Chart: Project Types */}
              <div className="bg-card border border-subtle rounded-xl p-5 shadow-sm flex flex-col h-full">
                <h3 className="text-sm font-semibold text-foreground mb-4">Project Distribution</h3>
                <div className="flex-1 w-full min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={PROJECT_STATS}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {PROJECT_STATS.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--subtle)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart: Deployments Over Time */}
              <div className="bg-card border border-subtle rounded-xl p-5 shadow-sm flex flex-col h-full">
                <h3 className="text-sm font-semibold text-foreground mb-4">Deployments This Week</h3>
                <div className="flex-1 w-full min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={DEPLOYMENT_STATS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--subtle)" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: 'var(--muted)' }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: 'var(--muted)' }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'var(--subtle)', opacity: 0.4 }}
                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--subtle)', borderRadius: '8px' }}
                      />
                      <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Projects Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Your Projects</h2>
                <button onClick={() => setActiveTab('projects')} className="text-sm text-primary hover:underline font-medium">View all</button>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
              ) : projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <div key={project.id} className="bg-card border border-subtle rounded-xl p-5 hover:shadow-md hover:border-subtle transition-all group flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-subtle group-hover:bg-primary/5 transition-colors">
                           <Globe size={20} className="text-secondary group-hover:text-primary transition-colors" />
                        </div>
                        <button className="text-muted hover:text-foreground p-1"><MoreVertical size={16} /></button>
                      </div>
                      <h3 className="font-bold text-foreground text-lg mb-1">{project.name}</h3>
                      <p className="text-xs text-muted mb-6 flex-1">{project.description}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-subtle">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${project.status === 'Published' ? 'bg-emerald-500' : project.status === 'Building' ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                          <span className="text-xs font-medium text-secondary">{project.status}</span>
                        </div>
                        <span className="text-xs text-muted flex items-center gap-1"><Clock size={12}/> {new Date(project.updated_at).toLocaleDateString()}</span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-subtle">
                         <Link href={`/workspace/${project.id}`} className="block w-full py-2 text-center text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition-colors">
                           Open Workspace
                         </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-subtle border-dashed rounded-2xl p-12 text-center flex flex-col items-center">
                   <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 text-muted">
                     <FolderKanban size={32} />
                   </div>
                   <h3 className="text-lg font-bold text-foreground mb-2">Create your first project</h3>
                   <p className="text-muted text-sm max-w-sm mb-6">Create a project to start building websites with AI.</p>
                   <button onClick={() => setIsCreateModalOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">
                     <Plus size={18} />
                     Create New Project
                   </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-card border border-subtle rounded-2xl p-6 shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-2">Create New Project</h2>
            <p className="text-sm text-muted mb-6">Give your new website project a name to get started.</p>
            
            <form onSubmit={handleCreateProject}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">Project Name</label>
                <input 
                  type="text" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., Coffee Shop Website"
                  className="w-full bg-surface border border-subtle rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!newProjectName.trim() || isCreating}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-70"
                >
                  {isCreating ? <Loader2 size={16} className="animate-spin"/> : null}
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
