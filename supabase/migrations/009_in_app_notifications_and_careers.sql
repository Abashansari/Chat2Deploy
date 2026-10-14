-- ==============================================================================
-- Migration 009: In-App Notifications & Learner Application Management
-- ==============================================================================

-- 1. Ensure user_id column exists on career_applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='career_applications' AND column_name='user_id'
  ) THEN
    ALTER TABLE public.career_applications ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Create career_notifications table
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

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.career_notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for career_notifications
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

-- 5. RLS Policy for career_applications learner reads
DROP POLICY IF EXISTS "Learners can read own applications" ON public.career_applications;
CREATE POLICY "Learners can read own applications"
  ON public.career_applications
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
  );

-- 6. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_career_notifications_recipient_email 
  ON public.career_notifications (LOWER(recipient_email));

CREATE INDEX IF NOT EXISTS idx_career_notifications_recipient_user_id 
  ON public.career_notifications (recipient_user_id);

CREATE INDEX IF NOT EXISTS idx_career_notifications_is_read 
  ON public.career_notifications (is_read);

CREATE INDEX IF NOT EXISTS idx_career_notifications_created_at 
  ON public.career_notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_career_applications_user_id 
  ON public.career_applications (user_id);

-- 7. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
