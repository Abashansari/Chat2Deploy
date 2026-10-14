-- ==============================================================================
-- Combined Migration: Career Applications & In-App Notifications
-- Execute this script in your Supabase Project Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Create career_applications table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.career_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
  applied_position TEXT NOT NULL DEFAULT 'Learner Contributor',
  status TEXT NOT NULL DEFAULT 'Submitted',
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT career_applications_email_unique UNIQUE (email)
);

-- 2. Add columns if table already existed without them
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='career_applications' AND column_name='user_id') THEN
    ALTER TABLE public.career_applications ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='career_applications' AND column_name='applied_position') THEN
    ALTER TABLE public.career_applications ADD COLUMN applied_position TEXT NOT NULL DEFAULT 'Learner Contributor';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='career_applications' AND column_name='admin_notes') THEN
    ALTER TABLE public.career_applications ADD COLUMN admin_notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='career_applications' AND column_name='reviewed_at') THEN
    ALTER TABLE public.career_applications ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='career_applications' AND column_name='reviewed_by') THEN
    ALTER TABLE public.career_applications ADD COLUMN reviewed_by TEXT;
  END IF;
END $$;

-- 3. Create career_notifications table
CREATE TABLE IF NOT EXISTS public.career_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  related_application_id UUID REFERENCES public.career_applications(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'status_updated',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.career_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_notifications ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: career_applications
DROP POLICY IF EXISTS "Allow public career application submissions" ON public.career_applications;
CREATE POLICY "Allow public career application submissions"
  ON public.career_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Learners can read own applications" ON public.career_applications;
CREATE POLICY "Learners can read own applications"
  ON public.career_applications
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "Allow authenticated career application updates" ON public.career_applications;
CREATE POLICY "Allow authenticated career application updates"
  ON public.career_applications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. RLS Policies: career_notifications
DROP POLICY IF EXISTS "Learners can read own notifications" ON public.career_notifications;
CREATE POLICY "Learners can read own notifications"
  ON public.career_notifications
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = recipient_user_id
    OR LOWER(recipient_email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "Learners can update own notifications" ON public.career_notifications;
CREATE POLICY "Learners can update own notifications"
  ON public.career_notifications
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = recipient_user_id
    OR LOWER(recipient_email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
  )
  WITH CHECK (
    auth.uid() = recipient_user_id
    OR LOWER(recipient_email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "Allow notification creation" ON public.career_notifications;
CREATE POLICY "Allow notification creation"
  ON public.career_notifications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_career_applications_status ON public.career_applications (status);
CREATE INDEX IF NOT EXISTS idx_career_applications_created_at ON public.career_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_applications_email ON public.career_applications (email);
CREATE INDEX IF NOT EXISTS idx_career_applications_user_id ON public.career_applications (user_id);

CREATE INDEX IF NOT EXISTS idx_career_notifications_recipient_email ON public.career_notifications (LOWER(recipient_email));
CREATE INDEX IF NOT EXISTS idx_career_notifications_recipient_user_id ON public.career_notifications (recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_career_notifications_is_read ON public.career_notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_career_notifications_created_at ON public.career_notifications (created_at DESC);

-- 8. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
