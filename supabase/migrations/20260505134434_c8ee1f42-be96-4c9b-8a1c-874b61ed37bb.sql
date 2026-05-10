
-- Events
CREATE TABLE public.events (
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

-- Team registrations
CREATE TABLE public.registrations (
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
CREATE INDEX idx_registrations_event ON public.registrations(event_id);

-- Budget items
CREATE TABLE public.budget_items (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  note TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_budget_event ON public.budget_items(event_id);

-- Donations
CREATE TABLE public.donations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  donor TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'cash',
  note TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_donations_event ON public.donations(event_id);

-- Matches
CREATE TABLE public.matches (
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
CREATE INDEX idx_matches_event ON public.matches(event_id);

-- Enable RLS — public access until auth is added
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Public policies (TEMPORARY — no auth yet)
CREATE POLICY "public all events" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all registrations" ON public.registrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all budget_items" ON public.budget_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all donations" ON public.donations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all matches" ON public.matches FOR ALL USING (true) WITH CHECK (true);
