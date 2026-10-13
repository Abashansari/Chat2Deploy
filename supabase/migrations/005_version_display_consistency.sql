-- Migration 005: Version Display Consistency for Projects and Deployments
-- Ensures projects table has current_version and last_deployed_version columns,
-- and establishes clean data consistency between projects and deployments.

-- 1. Ensure current_version exists on projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS current_version INTEGER;

-- 2. Ensure last_deployed_version exists on projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS last_deployed_version INTEGER;

-- 3. Ensure deployments table has source_version
ALTER TABLE public.deployments ADD COLUMN IF NOT EXISTS source_version INTEGER;

-- 4. Sync projects.last_deployed_version from the latest successful deployment
UPDATE public.projects p
SET last_deployed_version = sub.source_version
FROM (
  SELECT DISTINCT ON (project_id) project_id, source_version
  FROM public.deployments
  WHERE status = 'success' AND source_version IS NOT NULL
  ORDER BY project_id, created_at DESC
) sub
WHERE p.id = sub.project_id AND p.last_deployed_version IS NULL;

-- 5. Sync projects.current_version from project_versions table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'project_versions') THEN
    UPDATE public.projects p
    SET current_version = sub.max_ver
    FROM (
      SELECT project_id, MAX(version_number) AS max_ver
      FROM public.project_versions
      GROUP BY project_id
    ) sub
    WHERE p.id = sub.project_id AND p.current_version IS NULL;
  END IF;
END $$;

-- 6. Indexes for high performance version lookups
CREATE INDEX IF NOT EXISTS idx_deployments_project_success_ver 
  ON public.deployments (project_id, created_at DESC) 
  WHERE status = 'success';

-- 7. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
