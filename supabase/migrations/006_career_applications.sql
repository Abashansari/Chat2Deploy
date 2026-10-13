-- Migration 006: Career Applications Table
-- Stores applications from the Learner Contributor Program (Careers page).
-- Applications are independent of the authenticated user/project system.

CREATE TABLE IF NOT EXISTS public.career_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  institution TEXT,
  course TEXT,
  current_year TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  github_url TEXT NOT NULL,
  linkedin_url TEXT,
  portfolio_url TEXT,
  motivation TEXT NOT NULL,
  unpaid_acknowledged BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent exact duplicate applications by email
  CONSTRAINT career_applications_email_unique UNIQUE (email)
);

-- Enable RLS: no public reads, allow anonymous inserts via API route validation
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (the API route validates and sanitizes before insert)
DROP POLICY IF EXISTS "Allow public career application submissions" ON public.career_applications;
CREATE POLICY "Allow public career application submissions"
  ON public.career_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No SELECT, UPDATE, or DELETE policies for anon/authenticated roles directly.
-- Only service_role can read application data directly.
-- This ensures applicant PII is not exposed through the public Supabase client.

-- Secure function to update email dispatch status without exposing full UPDATE access
CREATE OR REPLACE FUNCTION public.record_career_application_email_status(
  app_id UUID,
  was_sent BOOLEAN,
  err_msg TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.career_applications
  SET email_sent = was_sent,
      email_error = err_msg,
      updated_at = NOW()
  WHERE id = app_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.record_career_application_email_status TO anon, authenticated;

-- Index for admin queries on status and submission date
CREATE INDEX IF NOT EXISTS idx_career_applications_status ON public.career_applications (status);
CREATE INDEX IF NOT EXISTS idx_career_applications_created_at ON public.career_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_applications_email ON public.career_applications (email);

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS career_applications_updated_at ON public.career_applications;

CREATE TRIGGER career_applications_updated_at
BEFORE UPDATE ON public.career_applications
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
