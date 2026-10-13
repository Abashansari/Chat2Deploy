"use client";

import { useState, useEffect, useCallback } from "react";
import {
  History,
  RotateCcw,
  Clock,
  FileCode,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Eye,
  GitBranch,
  ShieldAlert,
} from "lucide-react";
import type { VersionSummary, ProjectVersionDetail, VersionFile } from "./types";

interface VersionHistoryPanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onVersionRestored: (newVersionNumber: number, restoredFromNumber: number) => void;
  refreshTrigger?: number;
}

export default function VersionHistoryPanel({
  projectId,
  isOpen,
  onClose,
  onVersionRestored,
  refreshTrigger = 0,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersionNum, setExpandedVersionNum] = useState<number | null>(null);
  const [versionDetailsCache, setVersionDetailsCache] = useState<Record<number, ProjectVersionDetail>>({});
  const [loadingDetailNum, setLoadingDetailNum] = useState<number | null>(null);
  const [selectedFileForInspection, setSelectedFileForInspection] = useState<VersionFile | null>(null);

  // Rollback confirmation dialog state
  const [rollbackConfirmTarget, setRollbackConfirmTarget] = useState<VersionSummary | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/versions?projectId=${encodeURIComponent(projectId)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch versions (${res.status})`);
      }
      const data = await res.json();
      setVersions(data.versions || []);
    } catch (err: unknown) {
      console.error("[VersionHistoryPanel] Error loading versions:", err);
      const msg = err instanceof Error ? err.message : "Failed to load version history.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      fetchVersions(); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [isOpen, refreshTrigger, fetchVersions]);

  // Fetch full details (files) for inspecting a specific version
  const handleToggleExpand = async (version: VersionSummary) => {
    const vNum = version.version_number;
    if (expandedVersionNum === vNum) {
      setExpandedVersionNum(null);
      setSelectedFileForInspection(null);
      return;
    }

    setExpandedVersionNum(vNum);
    setSelectedFileForInspection(null);

    if (versionDetailsCache[vNum]) {
      return;
    }

    setLoadingDetailNum(vNum);
    try {
      const res = await fetch(
        `/api/versions/${vNum}?projectId=${encodeURIComponent(projectId)}`
      );
      if (!res.ok) {
        throw new Error("Failed to load version files.");
      }
      const data = await res.json();
      if (data.version) {
        setVersionDetailsCache((prev) => ({
          ...prev,
          [vNum]: data.version,
        }));
      }
    } catch (err) {
      console.error("Error fetching version detail:", err);
    } finally {
      setLoadingDetailNum(null);
    }
  };

  // Perform confirmed rollback
  const handleExecuteRestore = async () => {
    if (!rollbackConfirmTarget) return;

    setIsRestoring(true);
    setRestoreError(null);

    try {
      const res = await fetch("/api/versions/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          versionNumber: rollbackConfirmTarget.version_number,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Rollback failed.");
      }

      setSuccessToast(
        `Successfully restored Version ${rollbackConfirmTarget.version_number}! Created Version ${data.newVersionNumber}.`
      );

      // Notify parent to refresh preview and state
      onVersionRestored(data.newVersionNumber, rollbackConfirmTarget.version_number);

      // Close confirm dialog and refresh version list
      setRollbackConfirmTarget(null);
      await fetchVersions();

      setTimeout(() => {
        setSuccessToast(null);
      }, 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Rollback failed.";
      setRestoreError(msg);
    } finally {
      setIsRestoring(false);
    }
  };

  const formatTimestamp = (isoDate: string) => {
    try {
      const date = new Date(isoDate);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return isoDate;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md sm:max-w-lg bg-card border-l border-subtle shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out"
        role="dialog"
        aria-label="Version History Panel"
      >
        {/* Drawer Header */}
        <div className="h-14 border-b border-subtle px-4 flex items-center justify-between bg-surface shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <History size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">Version History</h2>
                {versions.length > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full">
                    {versions.length} {versions.length === 1 ? "version" : "versions"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted">Automatic snapshots & rollback</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchVersions}
              disabled={isLoading}
              title="Refresh version list"
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors disabled:opacity-50"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              title="Close panel"
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="m-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast(null)} className="hover:opacity-75">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 workspace-scroll">
          {isLoading && versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-xs font-medium">Loading version history…</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center space-y-2">
              <AlertCircle size={20} className="mx-auto text-red-500" />
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
              <button
                onClick={fetchVersions}
                className="text-xs text-primary font-semibold underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                <GitBranch size={22} />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">No Versions Saved Yet</h3>
              <p className="text-xs text-muted max-w-xs">
                Snapshots are automatically created every time you generate or update your website.
              </p>
            </div>
          ) : (
            versions.map((ver, idx) => {
              const isCurrent = idx === 0 || ver.is_current;
              const isExpanded = expandedVersionNum === ver.version_number;
              const details = versionDetailsCache[ver.version_number];
              const isLoadingDetails = loadingDetailNum === ver.version_number;

              return (
                <div
                  key={ver.id || ver.version_number}
                  className={`rounded-xl border transition-all ${
                    isCurrent
                      ? "bg-primary/5 border-primary/30 shadow-xs"
                      : "bg-surface border-subtle hover:border-subtle/80"
                  }`}
                >
                  {/* Version Item Card */}
                  <div className="p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-foreground bg-background px-2 py-0.5 rounded border border-subtle">
                          v{ver.version_number}
                        </span>

                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Current Version
                          </span>
                        )}

                        {ver.is_rollback && ver.restored_from_version && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                            <RotateCcw size={10} />
                            Restored from v{ver.restored_from_version}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-muted shrink-0">
                        <Clock size={11} />
                        <span>{formatTimestamp(ver.created_at)}</span>
                      </div>
                    </div>

                    {/* Change Summary */}
                    <p className="text-xs text-foreground font-medium line-clamp-2 leading-relaxed">
                      {ver.change_summary || "Project update"}
                    </p>

                    {/* Metadata Footer */}
                    <div className="flex items-center justify-between pt-1 border-t border-subtle/60 text-[11px] text-muted">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <FileCode size={12} />
                          {ver.file_count || 1} files
                        </span>
                        {ver.total_size_bytes > 0 && (
                          <span>{formatFileSize(ver.total_size_bytes)}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleExpand(ver)}
                          className="px-2 py-1 text-[11px] font-medium text-muted hover:text-foreground hover:bg-background rounded flex items-center gap-1 transition-colors"
                          title="Inspect files in this snapshot"
                        >
                          <Eye size={12} />
                          {isExpanded ? "Hide" : "Inspect"}
                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>

                        {!isCurrent && (
                          <button
                            onClick={() => {
                              setRestoreError(null);
                              setRollbackConfirmTarget(ver);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-primary hover:bg-primary-dark rounded transition-colors shadow-xs"
                            title={`Restore project to Version ${ver.version_number}`}
                          >
                            <RotateCcw size={11} />
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Inspection Area */}
                  {isExpanded && (
                    <div className="border-t border-subtle bg-background/60 p-3 rounded-b-xl space-y-2 text-xs animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-muted text-[11px] font-semibold uppercase tracking-wider">
                        <span>Snapshot Files</span>
                        {isLoadingDetails && (
                          <span className="flex items-center gap-1 text-primary">
                            <Loader2 size={10} className="animate-spin" />
                            Loading files…
                          </span>
                        )}
                      </div>

                      {details?.files && details.files.length > 0 ? (
                        <div className="space-y-1">
                          {details.files.map((file) => (
                            <div
                              key={file.path}
                              onClick={() =>
                                setSelectedFileForInspection(
                                  selectedFileForInspection?.path === file.path ? null : file
                                )
                              }
                              className={`p-2 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${
                                selectedFileForInspection?.path === file.path
                                  ? "bg-primary/10 border-primary/40 text-primary"
                                  : "bg-surface border-subtle hover:border-primary/30 text-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileCode size={13} className="shrink-0 text-muted" />
                                <span className="font-mono text-xs truncate">{file.path}</span>
                              </div>
                              <span className="text-[10px] text-muted shrink-0 ml-2">
                                {formatFileSize(file.content?.length || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : !isLoadingDetails ? (
                        <p className="text-[11px] text-muted italic">No file records found.</p>
                      ) : null}

                      {/* File Code Preview */}
                      {selectedFileForInspection && (
                        <div className="mt-2 p-2.5 bg-slate-950 text-slate-100 rounded-lg border border-slate-800 space-y-1.5 animate-in fade-in">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                            <span>{selectedFileForInspection.path}</span>
                            <button
                              onClick={() => setSelectedFileForInspection(null)}
                              className="hover:text-white"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <pre className="max-h-48 overflow-auto font-mono text-[10px] text-slate-200 leading-relaxed p-1.5 bg-black/40 rounded">
                            {selectedFileForInspection.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Confirmation Dialog Before Restoring */}
      {rollbackConfirmTarget && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-subtle rounded-2xl p-6 shadow-2xl max-w-md w-full relative animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <button
              onClick={() => {
                if (!isRestoring) setRollbackConfirmTarget(null);
              }}
              disabled={isRestoring}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors p-1 rounded-lg"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <RotateCcw size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Restore Version {rollbackConfirmTarget.version_number}?
                </h3>
                <p className="text-xs text-muted">
                  Rollback to snapshot from {formatTimestamp(rollbackConfirmTarget.created_at)}
                </p>
              </div>
            </div>

            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2 text-xs text-foreground leading-relaxed">
              <p className="font-semibold text-primary">
                Summary: &ldquo;{rollbackConfirmTarget.change_summary}&rdquo;
              </p>
              <p className="text-muted">
                Restoring will replace the current working files with the files from Version{" "}
                {rollbackConfirmTarget.version_number}.
              </p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <p>
                <strong>No work will be lost.</strong> Your current workspace files will be
                automatically saved as a new version before rolling back, and this rollback will be
                recorded as a new version.
              </p>
            </div>

            {restoreError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRollbackConfirmTarget(null)}
                disabled={isRestoring}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-dark transition-colors rounded-lg shadow-sm disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Restoring…</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    <span>Confirm & Restore</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
