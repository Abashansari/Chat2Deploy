-- Migration 004: Deployment Management & Analytics
-- Adds full deployment tracking, hosting project persistence, durations, errors, and RLS policies

-- 1. Ensure projects table has stable hosting & deployment tracking columns
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deployment_url TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS hosting_project_name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS last_deployed_at TIMESTAMPTZ;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS last_deployment_status TEXT DEFAULT 'draft';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS last_deployed_version INTEGER;

-- 2. Create or update deployments table
CREATE TABLE IF NOT EXISTS public.deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deployment_id TEXT NOT NULL,
  hosting_project_name TEXT,
  url TEXT NOT NULL,
  environment TEXT DEFAULT 'production',
  status TEXT NOT NULL DEFAULT 'success',
  source_version INTEGER,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if deployments table previously existed from migration 002
ALTER TABLE public.deployments ADD COLUMN IF NOT EXISTS hosting_project_name TEXT;
ALTER TABLE public.deployments ADD COLUMN IF NOT EXISTS source_version INTEGER;
ALTER TABLE public.deployments ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
ALTER TABLE public.deployments ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 3. Indexes for fast dashboard and project lookups
CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON public.deployments(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON public.deployments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON public.deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON public.deployments(created_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Users can manage deployments for their own projects" ON public.deployments;
DROP POLICY IF EXISTS "Users can read own deployments" ON public.deployments;
DROP POLICY IF EXISTS "Users can insert own deployments" ON public.deployments;
DROP POLICY IF EXISTS "Users can update own deployments" ON public.deployments;
DROP POLICY IF EXISTS "Users can delete own deployments" ON public.deployments;

CREATE POLICY "Users can manage deployments for their own projects"
  ON public.deployments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Reload schema cache in PostgREST
NOTIFY pgrst, 'reload schema';
