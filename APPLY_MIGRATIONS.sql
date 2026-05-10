-- ============================================================================
-- PitchPro Database Migrations - Apply All at Once
-- ============================================================================
-- Instructions: Copy all this SQL and paste into Supabase SQL Editor
-- https://app.supabase.com → Select Project → SQL Editor → New Query
-- ============================================================================

-- 1. Create Core Tables (from migration 1)
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

-- 2. Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 3. Create Basic Policies (public access)
CREATE POLICY IF NOT EXISTS "public all events" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "public all registrations" ON public.registrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "public all budget_items" ON public.budget_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "public all donations" ON public.donations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "public all matches" ON public.matches FOR ALL USING (true) WITH CHECK (true);

-- 4. Add owner_id columns (from migration 2)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.budget_items ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS owner_id uuid;

CREATE INDEX IF NOT EXISTS events_owner_idx ON public.events(owner_id);
CREATE INDEX IF NOT EXISTS regs_owner_idx ON public.registrations(owner_id);
CREATE INDEX IF NOT EXISTS budget_owner_idx ON public.budget_items(owner_id);
CREATE INDEX IF NOT EXISTS donations_owner_idx ON public.donations(owner_id);
CREATE INDEX IF NOT EXISTS matches_owner_idx ON public.matches(owner_id);

-- 5. Create Tickets and Orders (from migration 2)
CREATE TABLE IF NOT EXISTS public.tickets (
  id text PRIMARY KEY,
  event_id text NOT NULL,
  owner_id uuid,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT -1,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tickets_event_idx ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS tickets_owner_idx ON public.tickets(owner_id);

CREATE TABLE IF NOT EXISTS public.ticket_orders (
  id text PRIMARY KEY,
  event_id text NOT NULL,
  ticket_id text NOT NULL,
  owner_id uuid,
  buyer_name text NOT NULL,
  buyer_email text DEFAULT '',
  buyer_phone text DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  total numeric NOT NULL DEFAULT 0,
  payment_proof text,
  payment_ref text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  checked_in boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ticket_orders_event_idx ON public.ticket_orders(event_id);
CREATE INDEX IF NOT EXISTS ticket_orders_owner_idx ON public.ticket_orders(owner_id);

-- 6. Enable RLS for new tables
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_orders ENABLE ROW LEVEL SECURITY;

-- 7. Create Policies for new tables
CREATE POLICY IF NOT EXISTS "public all tickets" ON public.tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "public all ticket_orders" ON public.ticket_orders FOR ALL USING (true) WITH CHECK (true);

-- 8. Setup Realtime (from migration 5)
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.registrations REPLICA IDENTITY FULL;
ALTER TABLE public.budget_items REPLICA IDENTITY FULL;
ALTER TABLE public.donations REPLICA IDENTITY FULL;
ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER TABLE public.tickets REPLICA IDENTITY FULL;
ALTER TABLE public.ticket_orders REPLICA IDENTITY FULL;

-- Add to realtime publication
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.events; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.budget_items; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.donations; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.matches; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_orders; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ============================================================================
-- All migrations complete! Your database is ready.
-- ============================================================================
