"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { FolderKanban, AlertCircle, RefreshCw } from "lucide-react";
import type { ProjectDistributionItem } from "@/lib/dashboard";

interface ProjectStatusChartProps {
  isLoading: boolean;
  error?: string | null;
  totalProjects: number;
  deployedProjects: number;
  draftProjects: number;
  distribution?: ProjectDistributionItem[];
  onRetry?: () => void;
}

interface CustomTooltipData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as CustomTooltipData;
    return (
      <div className="bg-card/95 backdrop-blur-md border border-subtle px-3.5 py-2.5 rounded-xl shadow-xl text-xs space-y-1.5 z-50">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: data.color }}
          />
          <span>{data.name}</span>
        </div>
        <div className="flex items-center justify-between gap-6 text-[11px] font-mono text-muted">
          <span>
            Count: <strong className="text-foreground">{data.value}</strong>
          </span>
          <span>
            Share: <strong className="text-foreground">{data.percentage}%</strong>
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export function ProjectStatusChart({
  isLoading,
  error,
  totalProjects,
  deployedProjects,
  draftProjects,
  distribution,
  onRetry,
}: ProjectStatusChartProps) {
  // Compute percentages and chart slices accurately
  const { slices, deployedPercent, draftPercent } = useMemo(() => {
    const total = totalProjects > 0 ? totalProjects : deployedProjects + draftProjects;

    const depPct =
      total > 0
        ? distribution?.find((d) => d.name === "Deployed")?.percentage ??
          Math.round((deployedProjects / total) * 100)
        : 0;

    const drfPct =
      total > 0
        ? distribution?.find((d) => d.name === "Draft")?.percentage ??
          (deployedProjects > 0 && draftProjects > 0 ? 100 - depPct : draftProjects > 0 ? 100 : 0)
        : 0;

    const allSlices: CustomTooltipData[] = [
      {
        name: "Deployed",
        value: deployedProjects,
        color: "#10b981", // Green for successfully deployed
        percentage: depPct,
      },
      {
        name: "Draft",
        value: draftProjects,
        color: "#f97316", // Orange/red for drafts
        percentage: drfPct,
      },
    ];

    // Only feed non-zero slices to Recharts Pie to avoid zero-arc overlap
    const activeSlices = allSlices.filter((s) => s.value > 0);

    return {
      slices: activeSlices,
      deployedPercent: depPct,
      draftPercent: drfPct,
    };
  }, [totalProjects, deployedProjects, draftProjects, distribution]);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="bg-card border border-subtle rounded-xl p-5 shadow-xs flex flex-col h-full min-h-[320px]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">Project Status Distribution</h2>
        </div>
        <div className="flex-1 w-full flex flex-col items-center justify-center gap-3 py-10 animate-pulse">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <div className="w-36 h-36 rounded-full border-4 border-subtle/40 border-t-primary/70 animate-spin" />
            <div className="w-20 h-20 rounded-full bg-surface/50 border border-subtle/30" />
          </div>
          <span className="text-xs text-muted">Calculating project metrics…</span>
        </div>
        <div className="flex justify-center gap-6 text-xs text-muted pt-3 border-t border-subtle">
          <div className="h-4 w-24 bg-surface rounded animate-pulse" />
          <div className="h-4 w-24 bg-surface rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="bg-card border border-subtle rounded-xl p-5 shadow-xs flex flex-col h-full min-h-[320px]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">Project Status Distribution</h2>
        </div>
        <div className="flex-1 w-full flex flex-col items-center justify-center gap-2 text-center p-6">
          <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-1">
            <AlertCircle size={20} />
          </div>
          <p className="text-sm font-semibold text-foreground">Unable to load project status</p>
          <p className="text-xs text-muted max-w-xs">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-surface hover:bg-subtle/60 border border-subtle transition-colors shadow-2xs"
            >
              <RefreshCw size={13} />
              Retry
            </button>
          )}
        </div>
        <div className="pt-3 border-t border-subtle text-center text-[11px] text-muted">
          Failed to synchronize with Supabase database
        </div>
      </div>
    );
  }

  // 3. Genuine Empty State (user has 0 projects in Supabase)
  if (totalProjects === 0) {
    return (
      <div className="bg-card border border-subtle rounded-xl p-5 shadow-xs flex flex-col h-full min-h-[320px]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">Project Status Distribution</h2>
        </div>
        <div className="flex-1 w-full flex flex-col items-center justify-center text-center p-6 py-12">
          <FolderKanban size={32} className="text-muted/40 mb-2.5" />
          <p className="text-sm font-semibold text-foreground">No projects created yet</p>
          <p className="text-xs text-muted max-w-xs mt-1">
            Create your first website project to view live status distribution.
          </p>
        </div>
        <div className="flex justify-center gap-6 text-xs text-muted pt-3 border-t border-subtle">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" /> Deployed (0 • 0%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500/40" /> Drafts (0 • 0%)
          </span>
        </div>
      </div>
    );
  }

  // 4. Normal Data-Driven Chart State
  return (
    <div className="bg-card border border-subtle rounded-xl p-5 shadow-xs flex flex-col h-full min-h-[320px]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-foreground">Project Status Distribution</h2>
        <span className="text-[11px] font-mono text-muted px-2 py-0.5 rounded-full bg-surface border border-subtle">
          {totalProjects} {totalProjects === 1 ? "project" : "projects"}
        </span>
      </div>

      {/* Doughnut Chart with Centered Total Count Label */}
      <div className="flex-1 w-full min-h-[220px] relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={slices}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={84}
              paddingAngle={slices.length > 1 ? 4 : 0}
              dataKey="value"
              stroke="var(--card)"
              strokeWidth={2}
            >
              {slices.map((entry, index) => (
                <Cell key={`status-slice-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label inside Doughnut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="text-3xl font-extrabold font-mono text-foreground leading-none tracking-tight">
            {totalProjects}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted mt-1">
            {totalProjects === 1 ? "Total Project" : "Total Projects"}
          </span>
        </div>
      </div>

      {/* Status Legend with Count & Percentage */}
      <div className="flex justify-center items-center gap-6 text-xs pt-3 border-t border-subtle">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
          <span className="text-muted font-medium">Deployed</span>
          <span className="font-semibold text-foreground font-mono">{deployedProjects}</span>
          <span className="text-muted text-[11px] font-mono">({deployedPercent}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0 shadow-xs" />
          <span className="text-muted font-medium">Drafts</span>
          <span className="font-semibold text-foreground font-mono">{draftProjects}</span>
          <span className="text-muted text-[11px] font-mono">({draftPercent}%)</span>
        </div>
      </div>
    </div>
  );
}
