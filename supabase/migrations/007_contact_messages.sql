-- Migration 007: Contact Messages Table
-- Stores user feedback and inquiries from the Contact page (/contact).

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_error TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous & authenticated insertions from the server API route
DROP POLICY IF EXISTS "Allow public contact message submissions" ON public.contact_messages;
CREATE POLICY "Allow public contact message submissions"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No public SELECT/UPDATE/DELETE; only service_role or admin can read messages.

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages (email);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages (status);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
