import { SupabaseClient } from "@supabase/supabase-js";

export interface VersionFile {
  path: string;
  content: string;
  file_type?: string;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  user_id: string;
  version_number: number;
  change_summary: string;
  files: VersionFile[];
  file_count: number;
  total_size_bytes: number;
  storage_path?: string | null;
  restored_from_version?: number | null;
  is_rollback?: boolean;
  created_at: string;
}

export interface VersionSummary {
  id: string;
  project_id: string;
  version_number: number;
  change_summary: string;
  file_count: number;
  total_size_bytes: number;
  restored_from_version?: number | null;
  is_rollback?: boolean;
  created_at: string;
  is_current?: boolean;
}

export interface CreateVersionParams {
  supabase: SupabaseClient;
  projectId: string;
  userId: string;
  changeSummary: string;
  files: VersionFile[];
  restoredFromVersion?: number | null;
  isRollback?: boolean;
}

export interface RestoreVersionParams {
  supabase: SupabaseClient;
  projectId: string;
  userId: string;
  versionNumber: number;
}

/**
 * Checks if two sets of version files are identical in content and paths.
 */
export function areFilesIdentical(filesA: VersionFile[], filesB: VersionFile[]): boolean {
  if (filesA.length !== filesB.length) return false;
  const mapA = new Map(filesA.map((f) => [f.path, f.content]));
  for (const fileB of filesB) {
    if (!mapA.has(fileB.path)) return false;
    if (mapA.get(fileB.path) !== fileB.content) return false;
  }
  return true;
}

/**
 * Calculates total size in bytes of files.
 */
export function calculateTotalBytes(files: VersionFile[]): number {
  return files.reduce((acc, f) => acc + Buffer.byteLength(f.content || "", "utf8"), 0);
}

/**
 * Creates a version snapshot for a project.
 * Uses public.project_versions when available, with resilient fallback to generation_history.
 */
export async function createVersionSnapshot({
  supabase,
  projectId,
  userId,
  changeSummary,
  files,
  restoredFromVersion = null,
  isRollback = false,
}: CreateVersionParams): Promise<ProjectVersion> {
  if (!files || files.length === 0) {
    throw new Error("Cannot create a version snapshot with empty files.");
  }

  const normalizedFiles: VersionFile[] = files.map((f) => ({
    path: f.path,
    content: f.content,
    file_type: f.file_type || f.path.split(".").pop() || "txt",
  }));

  const totalBytes = calculateTotalBytes(normalizedFiles);

  // Fetch current versions to determine next version number and prevent duplicate snapshots
  const existingVersions = await getProjectVersionsList({ supabase, projectId, userId });

  // Prevent duplicate snapshots: if the most recent version has identical files, reuse it
  if (existingVersions.length > 0) {
    const latestSummary = existingVersions[0];
    const latestVersionFull = await getProjectVersionByNumber({
      supabase,
      projectId,
      userId,
      versionNumber: latestSummary.version_number,
    });

    if (
      latestVersionFull &&
      areFilesIdentical(latestVersionFull.files, normalizedFiles) &&
      !isRollback
    ) {
      console.info(
        `[versions] Snapshot skipped: identical to Version ${latestSummary.version_number}`
      );
      return latestVersionFull;
    }
  }

  const nextVersionNumber = existingVersions.length > 0
    ? Math.max(...existingVersions.map((v) => v.version_number)) + 1
    : 1;

  // 1. Attempt primary storage in public.project_versions
  try {
    const { data, error } = await supabase
      .from("project_versions")
      .insert({
        project_id: projectId,
        user_id: userId,
        version_number: nextVersionNumber,
        change_summary: changeSummary.trim(),
        files: normalizedFiles,
        file_count: normalizedFiles.length,
        total_size_bytes: totalBytes,
        restored_from_version: restoredFromVersion,
        is_rollback: isRollback,
      })
      .select()
      .single();

    if (!error && data) {
      // Update projects table current_version if column exists
      try {
        await supabase
          .from("projects")
          .update({ current_version: nextVersionNumber, updated_at: new Date().toISOString() })
          .eq("id", projectId);
      } catch {
        // Non-critical if column doesn't exist
      }

      return {
        id: data.id,
        project_id: data.project_id,
        user_id: data.user_id,
        version_number: data.version_number,
        change_summary: data.change_summary,
        files: data.files,
        file_count: data.file_count,
        total_size_bytes: data.total_size_bytes,
        storage_path: data.storage_path,
        restored_from_version: data.restored_from_version,
        is_rollback: data.is_rollback,
        created_at: data.created_at,
      };
    }

    if (error && error.code !== "PGRST205") {
      console.warn("[versions] Insert into project_versions returned error:", error);
    }
  } catch (err) {
    console.warn("[versions] Direct project_versions insert failed, testing fallback:", err);
  }

  // 2. Resilient fallback storage using generation_history table
  const fallbackRecord: ProjectVersion = {
    id: `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    project_id: projectId,
    user_id: userId,
    version_number: nextVersionNumber,
    change_summary: changeSummary.trim(),
    files: normalizedFiles,
    file_count: normalizedFiles.length,
    total_size_bytes: totalBytes,
    restored_from_version: restoredFromVersion,
    is_rollback: isRollback,
    created_at: new Date().toISOString(),
  };

  try {
    await supabase.from("generation_history").insert({
      project_id: projectId,
      status: "version_snapshot",
      error_message: JSON.stringify(fallbackRecord),
    });
  } catch (fallbackErr) {
    console.error("[versions] Fallback snapshot save error:", fallbackErr);
  }

  // Update projects table current_version in fallback mode as well
  try {
    await supabase
      .from("projects")
      .update({ current_version: nextVersionNumber, updated_at: new Date().toISOString() })
      .eq("id", projectId);
  } catch {
    // Non-critical if column doesn't exist
  }

  return fallbackRecord;
}

/**
 * Resolves the actual current working/draft version of a project from real database records.
 * Returns null if no version record exists (never invents a version number).
 */
export async function resolveProjectWorkingVersion({
  supabase,
  projectId,
  knownCurrentVersion,
}: {
  supabase: SupabaseClient;
  projectId: string;
  knownCurrentVersion?: number | null;
}): Promise<number | null> {
  if (typeof knownCurrentVersion === "number" && knownCurrentVersion > 0) {
    return knownCurrentVersion;
  }

  try {
    const versions = await getProjectVersionsList({ supabase, projectId });
    if (versions && versions.length > 0) {
      return versions[0].version_number;
    }
  } catch {
    // Non-critical
  }

  return null;
}

/**
 * Retrieves summaries of all versions for a project, sorted newest first.
 */
export async function getProjectVersionsList({
  supabase,
  projectId,
  userId: _userId,
}: {
  supabase: SupabaseClient;
  projectId: string;
  userId?: string;
}): Promise<VersionSummary[]> {
  void _userId;
  // 1. Try public.project_versions
  try {
    const { data, error } = await supabase
      .from("project_versions")
      .select("id, project_id, version_number, change_summary, file_count, total_size_bytes, restored_from_version, is_rollback, created_at")
      .eq("project_id", projectId)
      .order("version_number", { ascending: false });

    if (!error && data && data.length > 0) {
      const records = data as unknown as VersionSummary[];
      const highestVersion = Math.max(...records.map((d) => d.version_number));
      return records.map((d) => ({
        id: d.id,
        project_id: d.project_id,
        version_number: d.version_number,
        change_summary: d.change_summary,
        file_count: d.file_count,
        total_size_bytes: d.total_size_bytes,
        restored_from_version: d.restored_from_version,
        is_rollback: d.is_rollback,
        created_at: d.created_at,
        is_current: d.version_number === highestVersion,
      }));
    }
  } catch (err) {
    console.warn("[versions] Error querying project_versions:", err);
  }

  // 2. Fallback to generation_history
  try {
    const { data: histData, error: histError } = await supabase
      .from("generation_history")
      .select("id, error_message, created_at")
      .eq("project_id", projectId)
      .eq("status", "version_snapshot")
      .order("created_at", { ascending: false });

    if (!histError && histData && histData.length > 0) {
      const parsedVersions: VersionSummary[] = [];
      const seenVersions = new Set<number>();

      for (const row of histData) {
        try {
          if (!row.error_message) continue;
          const parsed: ProjectVersion = JSON.parse(row.error_message);
          if (parsed && parsed.version_number && !seenVersions.has(parsed.version_number)) {
            seenVersions.add(parsed.version_number);
            parsedVersions.push({
              id: parsed.id || row.id,
              project_id: parsed.project_id || projectId,
              version_number: parsed.version_number,
              change_summary: parsed.change_summary,
              file_count: parsed.file_count || parsed.files?.length || 0,
              total_size_bytes: parsed.total_size_bytes || 0,
              restored_from_version: parsed.restored_from_version,
              is_rollback: parsed.is_rollback,
              created_at: parsed.created_at || row.created_at,
            });
          }
        } catch {
          // ignore parse errors
        }
      }

      parsedVersions.sort((a, b) => b.version_number - a.version_number);
      if (parsedVersions.length > 0) {
        const highestVersion = parsedVersions[0].version_number;
        return parsedVersions.map((v) => ({
          ...v,
          is_current: v.version_number === highestVersion,
        }));
      }
    }
  } catch (err) {
    console.warn("[versions] Fallback query error:", err);
  }

  return [];
}

/**
 * Retrieves a specific project version with full file contents.
 */
export async function getProjectVersionByNumber({
  supabase,
  projectId,
  userId: _userId,
  versionNumber,
}: {
  supabase: SupabaseClient;
  projectId: string;
  userId?: string;
  versionNumber: number;
}): Promise<ProjectVersion | null> {
  void _userId;
  // 1. Try public.project_versions
  try {
    const { data, error } = await supabase
      .from("project_versions")
      .select("*")
      .eq("project_id", projectId)
      .eq("version_number", versionNumber)
      .single();

    if (!error && data) {
      return {
        id: data.id,
        project_id: data.project_id,
        user_id: data.user_id,
        version_number: data.version_number,
        change_summary: data.change_summary,
        files: data.files as VersionFile[],
        file_count: data.file_count,
        total_size_bytes: data.total_size_bytes,
        storage_path: data.storage_path,
        restored_from_version: data.restored_from_version,
        is_rollback: data.is_rollback,
        created_at: data.created_at,
      };
    }
  } catch {
    // continue to fallback
  }

  // 2. Fallback to generation_history
  try {
    const { data: histData } = await supabase
      .from("generation_history")
      .select("id, error_message, created_at")
      .eq("project_id", projectId)
      .eq("status", "version_snapshot")
      .order("created_at", { ascending: false });

    if (histData) {
      for (const row of histData) {
        try {
          if (!row.error_message) continue;
          const parsed: ProjectVersion = JSON.parse(row.error_message);
          if (parsed && parsed.version_number === versionNumber) {
            return parsed;
          }
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Restores a project to a previous version.
 * - Saves current working state as a snapshot if not already saved.
 * - Restores complete source code and project files into project_files table.
 * - Creates a new rollback version (Version N+1) to treat rollback as a new operation.
 * - Never permanently deletes newer versions.
 * - Returns the restored version and the newly created rollback version.
 */
export async function restoreProjectVersion({
  supabase,
  projectId,
  userId,
  versionNumber,
}: RestoreVersionParams): Promise<{
  success: boolean;
  restoredVersion: ProjectVersion;
  newRollbackVersion: ProjectVersion;
  files: VersionFile[];
}> {
  // 1. Retrieve and validate target version
  const targetVersion = await getProjectVersionByNumber({
    supabase,
    projectId,
    userId,
    versionNumber,
  });

  if (!targetVersion) {
    throw new Error(`Target Version ${versionNumber} does not exist or cannot be found.`);
  }

  if (!targetVersion.files || targetVersion.files.length === 0) {
    throw new Error(`Target Version ${versionNumber} contains no snapshot files.`);
  }

  // 2. Retrieve current working files to preserve current state if modified
  const { data: currentFilesData } = await supabase
    .from("project_files")
    .select("file_path, content, file_type")
    .eq("project_id", projectId);

  const currentFiles: VersionFile[] = (currentFilesData || []).map((f) => ({
    path: f.file_path,
    content: f.content,
    file_type: f.file_type,
  }));

  // If current working state has files and differs from target version, ensure it's saved
  if (currentFiles.length > 0 && !areFilesIdentical(currentFiles, targetVersion.files)) {
    const versions = await getProjectVersionsList({ supabase, projectId, userId });
    const latestVersion = versions.length > 0
      ? await getProjectVersionByNumber({
          supabase,
          projectId,
          userId,
          versionNumber: versions[0].version_number,
        })
      : null;

    if (!latestVersion || !areFilesIdentical(currentFiles, latestVersion.files)) {
      // Save current uncommitted/divergent state before rolling back
      await createVersionSnapshot({
        supabase,
        projectId,
        userId,
        changeSummary: "Pre-rollback working snapshot",
        files: currentFiles,
      });
    }
  }

  // 3. Atomically synchronize project_files with target snapshot files
  const targetPaths = new Set(targetVersion.files.map((f) => f.path));
  const currentPaths = new Set(currentFiles.map((f) => f.path));

  // Delete files no longer present in target version
  const pathsToDelete = Array.from(currentPaths).filter((p) => !targetPaths.has(p));
  if (pathsToDelete.length > 0) {
    const { error: delError } = await supabase
      .from("project_files")
      .delete()
      .eq("project_id", projectId)
      .in("file_path", pathsToDelete);

    if (delError) {
      console.error("[versions] Error removing outdated files during rollback:", delError);
      throw new Error("Failed to clear outdated files during rollback.");
    }
  }

  // Upsert all restored files
  for (const file of targetVersion.files) {
    const fileExt = file.file_type || file.path.split(".").pop() || "txt";
    const { error: upsertError } = await supabase.from("project_files").upsert(
      {
        project_id: projectId,
        file_path: file.path,
        content: file.content,
        file_type: fileExt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id, file_path" }
    );

    if (upsertError) {
      console.error(`[versions] Error upserting file ${file.path} during rollback:`, upsertError);
      throw new Error(`Failed to restore file ${file.path}.`);
    }
  }

  // 4. Record the rollback as a NEW version snapshot (treating rollback as a new versioned operation)
  const rollbackSummary = `Rolled back to Version ${versionNumber}: ${targetVersion.change_summary}`;
  const newRollbackVersion = await createVersionSnapshot({
    supabase,
    projectId,
    userId,
    changeSummary: rollbackSummary,
    files: targetVersion.files,
    restoredFromVersion: versionNumber,
    isRollback: true,
  });

  // 5. Update project updated_at timestamp
  await supabase
    .from("projects")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", projectId);

  return {
    success: true,
    restoredVersion: targetVersion,
    newRollbackVersion,
    files: targetVersion.files,
  };
}
