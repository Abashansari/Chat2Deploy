"use client";

import { useState } from "react";
import Link from "next/link";
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
  MessageSquarePlus,
  Home,
  Edit3,
  LifeBuoy,
  LogOut,
  MoreHorizontal,
  Bell,
  Sun,
  Moon
} from "lucide-react";

// Mock Data
const MOCK_PROJECTS = [
  { id: "1", name: "Portfolio Website", status: "Published", updated: "2 hours ago", type: "Frontend" },
  { id: "2", name: "E-commerce Store", status: "Building", updated: "1 day ago", type: "Fullstack" },
  { id: "3", name: "Developer Landing Page", status: "Draft", updated: "3 days ago", type: "Frontend" },
];

const MOCK_DEPLOYMENTS = [
  { id: "1", project: "Portfolio Website", env: "Production", status: "Success", time: "2 hours ago" },
  { id: "2", project: "Landing Page", env: "Production", status: "Success", time: "Yesterday" },
  { id: "3", project: "E-commerce Store", env: "Preview", status: "Building", time: "5 minutes ago" },
];

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

import { useAuth } from "../components/auth/AuthProvider";

export default function DashboardPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { logout, user } = useAuth();

  const navigation = [
    { name: "Dashboard", id: "dashboard", icon: LayoutDashboard },
    { name: "Projects", id: "projects", icon: FolderKanban },
    { name: "Deployments", id: "deployments", icon: Rocket },
    { name: "Resources", id: "resources", icon: BookOpen },
  ];

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
                    <p className="text-sm font-medium text-foreground">{user?.name || "abashansari"}</p>
                    <p className="text-xs text-muted">{user?.email || "ansariabash2004@gmail.com"}</p>
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
                  <button className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-secondary hover:text-foreground hover:bg-surface rounded-md transition-colors">
                    <span>Help</span>
                    <LifeBuoy size={16} className="text-muted" />
                  </button>
                  <Link href="/resources" className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-secondary hover:text-foreground hover:bg-surface rounded-md transition-colors">
                    <span>Docs</span>
                    <BookOpen size={16} className="text-muted" />
                  </Link>
                  <button 
                    onClick={logout}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-secondary hover:text-foreground hover:bg-surface rounded-md transition-colors"
                  >
                    <span>Log Out</span>
                    <LogOut size={16} className="text-muted" />
                  </button>
                </div>

                <div className="p-2 border-b border-subtle">
                  <Link href="/pricing" className="block w-full py-1.5 text-center text-sm font-medium text-foreground bg-surface border border-subtle hover:bg-subtle rounded-md transition-colors">
                    Upgrade to Pro
                  </Link>
                </div>
                
                <div className="p-3 bg-surface/50 flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">All systems normal.</span>
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
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
              <p className="text-sm font-medium text-foreground truncate">{user?.name || "abashansari"}</p>
            </button>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-1.5 text-muted hover:text-foreground hover:bg-surface rounded-md transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
              <button className="p-1.5 text-muted hover:text-foreground hover:bg-surface rounded-md transition-colors relative">
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-background"></span>
              </button>
            </div>
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
                <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, Alex</h1>
                <p className="text-muted text-lg">Build, manage, and deploy your websites from one place.</p>
              </div>
              <Link 
                href="/workspace"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors shadow-sm shrink-0"
              >
                <Plus size={18} />
                Create New Project
              </Link>
            </header>

            {/* Quick Actions (Optional, but good for UX) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <Link href="/workspace" className="p-4 rounded-xl border border-subtle bg-card hover:border-primary/50 hover:shadow-sm transition-all group flex flex-col items-center text-center gap-2">
                 <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Plus size={20} />
                 </div>
                 <span className="text-sm font-medium text-foreground">New Site</span>
               </Link>
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
              {/* Summary Cards */}
              <div className="flex flex-col gap-4">
                <div className="bg-card border border-subtle rounded-xl p-5 shadow-sm flex items-center justify-between h-full">
                  <div>
                    <p className="text-sm font-medium text-muted mb-1">Total Projects</p>
                    <p className="text-3xl font-bold text-foreground">{MOCK_PROJECTS.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <FolderKanban size={24} className="text-primary" />
                  </div>
                </div>
                <div className="bg-card border border-subtle rounded-xl p-5 shadow-sm flex items-center justify-between h-full">
                  <div>
                    <p className="text-sm font-medium text-muted mb-1">Total Deployments</p>
                    <p className="text-3xl font-bold text-foreground">12</p>
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
                <h2 className="text-xl font-bold text-foreground">Recent Projects</h2>
                <button onClick={() => setActiveTab('projects')} className="text-sm text-primary hover:underline font-medium">View all</button>
              </div>

              {MOCK_PROJECTS.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {MOCK_PROJECTS.map((project) => (
                    <div key={project.id} className="bg-card border border-subtle rounded-xl p-5 hover:shadow-md hover:border-subtle transition-all group flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-subtle group-hover:bg-primary/5 transition-colors">
                           <Globe size={20} className="text-secondary group-hover:text-primary transition-colors" />
                        </div>
                        <button className="text-muted hover:text-foreground p-1"><MoreVertical size={16} /></button>
                      </div>
                      <h3 className="font-bold text-foreground text-lg mb-1">{project.name}</h3>
                      <p className="text-xs text-muted mb-6 flex-1">{project.type}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-subtle">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${project.status === 'Published' ? 'bg-emerald-500' : project.status === 'Building' ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                          <span className="text-xs font-medium text-secondary">{project.status}</span>
                        </div>
                        <span className="text-xs text-muted flex items-center gap-1"><Clock size={12}/> {project.updated}</span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-subtle">
                         <Link href="/workspace" className="block w-full py-2 text-center text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition-colors">
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
                   <h3 className="text-lg font-bold text-foreground mb-2">Create your first website</h3>
                   <p className="text-muted text-sm max-w-sm mb-6">Describe what you want to build and let AI create the foundation for you.</p>
                   <Link href="/workspace" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">
                     <Plus size={18} />
                     Create New Project
                   </Link>
                </div>
              )}
            </section>

            {/* Deployments Overview */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-6">Recent Deployments</h2>
              <div className="bg-card border border-subtle rounded-xl overflow-hidden">
                <div className="divide-y divide-subtle">
                  {MOCK_DEPLOYMENTS.map((deploy) => (
                    <div key={deploy.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-surface/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          deploy.status === 'Success' ? 'bg-emerald-500/10 text-emerald-500' : 
                          deploy.status === 'Building' ? 'bg-yellow-500/10 text-yellow-500' : 
                          'bg-red-500/10 text-red-500'
                        }`}>
                           <Rocket size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{deploy.project}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-surface border border-subtle text-secondary">{deploy.env}</span>
                             <span className="text-xs text-muted flex items-center gap-1"><Clock size={12}/> {deploy.time}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Link href="/workspace" className="text-sm font-medium text-primary hover:underline">View</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
