-- Migration 002: Add deployments table and project deployment fields
-- Run this in your Supabase SQL Editor if you want to store full deployment history

CREATE TABLE IF NOT EXISTS public.deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deployment_id TEXT NOT NULL,
  url TEXT NOT NULL,
  environment TEXT DEFAULT 'production',
  status TEXT NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage deployments for their own projects"
  ON public.deployments
  FOR ALL
  USING (auth.uid() = user_id);

-- Optional: Add deployment_url to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deployment_url TEXT;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
