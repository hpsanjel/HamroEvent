-- Part 1: Core Tables
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  venue TEXT NOT NULL DEFAULT '',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  registration_deadline TIMESTAMPTZ NOT NULL,
  max_teams INT NOT NULL DEFAULT 16,
  entry_fee NUMERIC NOT NULL DEFAULT 0,
  prize_pool NUMERIC NOT NULL DEFAULT 0,
  payment_info TEXT NOT NULL DEFAULT '',
  payment_qr_data_url TEXT,
  currency TEXT,
  contact_name TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  cover_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  captain_name TEXT NOT NULL,
  captain_phone TEXT NOT NULL DEFAULT '',
  captain_email TEXT NOT NULL DEFAULT '',
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  payment_proof TEXT,
  payment_ref TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  checked_in BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON public.registrations(event_id);

CREATE TABLE IF NOT EXISTS public.budget_items (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  note TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_budget_event ON public.budget_items(event_id);

CREATE TABLE IF NOT EXISTS public.donations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  donor TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'cash',
  note TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_donations_event ON public.donations(event_id);

CREATE TABLE IF NOT EXISTS public.matches (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  round INT NOT NULL,
  match_no INT NOT NULL,
  team_a TEXT,
  team_b TEXT,
  score_a INT,
  score_b INT,
  winner TEXT,
  scheduled_at TIMESTAMPTZ,
  venue TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
);
CREATE INDEX IF NOT EXISTS idx_matches_event ON public.matches(event_id);
