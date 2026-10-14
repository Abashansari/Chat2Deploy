-- Migration 008: Career Applications — Admin Dashboard Columns & RLS Policies
-- Adds columns required for admin status management and selection email tracking.
-- Adds RLS policies allowing authenticated admin users to read and update applications.

-- 1. Add missing columns (IF NOT EXISTS pattern for idempotency)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='career_applications' AND column_name='applied_position') THEN
    ALTER TABLE public.career_applications ADD COLUMN applied_position TEXT NOT NULL DEFAULT 'Learner Contributor';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='career_applications' AND column_name='selection_email_sent') THEN
    ALTER TABLE public.career_applications ADD COLUMN selection_email_sent BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='career_applications' AND column_name='selection_email_sent_at') THEN
    ALTER TABLE public.career_applications ADD COLUMN selection_email_sent_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='career_applications' AND column_name='selection_email_error') THEN
    ALTER TABLE public.career_applications ADD COLUMN selection_email_error TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='career_applications' AND column_name='selection_email_subject') THEN
    ALTER TABLE public.career_applications ADD COLUMN selection_email_subject TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='career_applications' AND column_name='selection_email_body') THEN
    ALTER TABLE public.career_applications ADD COLUMN selection_email_body TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='career_applications' AND column_name='reviewed_at') THEN
    ALTER TABLE public.career_applications ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='career_applications' AND column_name='reviewed_by') THEN
    ALTER TABLE public.career_applications ADD COLUMN reviewed_by TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='career_applications' AND column_name='admin_notes') THEN
    ALTER TABLE public.career_applications ADD COLUMN admin_notes TEXT;
  END IF;
END $$;

-- 2. RLS Policies for authenticated admin access (SELECT and UPDATE)
-- These policies allow any authenticated user to read/update.
-- Server-side verifyCareersAdmin() is the primary authorization check.
-- RLS acts as defense-in-depth: only authenticated users can access.

DROP POLICY IF EXISTS "Allow authenticated career application reads" ON public.career_applications;
CREATE POLICY "Allow authenticated career application reads"
  ON public.career_applications
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated career application updates" ON public.career_applications;
CREATE POLICY "Allow authenticated career application updates"
  ON public.career_applications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Index for selection email queries
CREATE INDEX IF NOT EXISTS idx_career_applications_selection_email_sent
  ON public.career_applications (selection_email_sent);

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
