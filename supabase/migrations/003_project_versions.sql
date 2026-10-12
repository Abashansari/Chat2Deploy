-- Migration 003: Project Version Control and Rollback System
-- This migration creates the tables, functions, indexes, and RLS policies
-- needed for automatic snapshots, version tracking, and rollback operations.

-- 1. Create project_versions table
CREATE TABLE IF NOT EXISTS public.project_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  change_summary TEXT NOT NULL,
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_count INTEGER NOT NULL DEFAULT 0,
  total_size_bytes INTEGER DEFAULT 0,
  storage_path TEXT,
  restored_from_version INTEGER,
  is_rollback BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_project_version UNIQUE (project_id, version_number)
);

-- 2. Indexes for fast lookup and ordering
CREATE INDEX IF NOT EXISTS idx_project_versions_project_id_ver 
  ON public.project_versions (project_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_project_versions_user_id 
  ON public.project_versions (user_id);

CREATE INDEX IF NOT EXISTS idx_project_versions_created_at 
  ON public.project_versions (created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Users can select, insert, and view versions for projects they own
CREATE POLICY "Users can manage versions for their own projects"
  ON public.project_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_versions.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- 5. Add current_version tracking to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1;

-- 6. Atomic function to create a new project version safely against concurrency
CREATE OR REPLACE FUNCTION public.create_project_version(
  p_project_id UUID,
  p_user_id UUID,
  p_change_summary TEXT,
  p_files JSONB,
  p_restored_from INTEGER DEFAULT NULL,
  p_is_rollback BOOLEAN DEFAULT FALSE
)
RETURNS public.project_versions AS $$
DECLARE
  v_next_version INTEGER;
  v_new_version public.project_versions;
BEGIN
  -- Row-level lock on project record to serialize concurrent version creations
  PERFORM 1 FROM public.projects WHERE id = p_project_id AND user_id = p_user_id FOR UPDATE;

  -- Determine next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM public.project_versions
  WHERE project_id = p_project_id;

  -- Insert snapshot record
  INSERT INTO public.project_versions (
    project_id,
    user_id,
    version_number,
    change_summary,
    files,
    file_count,
    total_size_bytes,
    restored_from_version,
    is_rollback
  ) VALUES (
    p_project_id,
    p_user_id,
    v_next_version,
    p_change_summary,
    p_files,
    jsonb_array_length(p_files),
    octet_length(p_files::text),
    p_restored_from,
    p_is_rollback
  ) RETURNING * INTO v_new_version;

  -- Update current version on project
  UPDATE public.projects
  SET current_version = v_next_version, updated_at = NOW()
  WHERE id = p_project_id;

  RETURN v_new_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
