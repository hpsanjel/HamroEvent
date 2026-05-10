
-- 1. Add owner_id columns
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

-- 2. Tickets (ticket types defined per event)
CREATE TABLE IF NOT EXISTS public.tickets (
  id text PRIMARY KEY,
  event_id text NOT NULL,
  owner_id uuid,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT -1, -- -1 = unlimited
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tickets_event_idx ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS tickets_owner_idx ON public.tickets(owner_id);

-- 3. Ticket orders (public purchases)
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

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_orders ENABLE ROW LEVEL SECURITY;

-- 4. Claim-existing-data trigger: on first user signup, assign NULL owner_id rows to them
CREATE OR REPLACE FUNCTION public.claim_orphan_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM auth.users) = 1 THEN
    UPDATE public.events SET owner_id = NEW.id WHERE owner_id IS NULL;
    UPDATE public.registrations SET owner_id = NEW.id WHERE owner_id IS NULL;
    UPDATE public.budget_items SET owner_id = NEW.id WHERE owner_id IS NULL;
    UPDATE public.donations SET owner_id = NEW.id WHERE owner_id IS NULL;
    UPDATE public.matches SET owner_id = NEW.id WHERE owner_id IS NULL;
    UPDATE public.tickets SET owner_id = NEW.id WHERE owner_id IS NULL;
    UPDATE public.ticket_orders SET owner_id = NEW.id WHERE owner_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_claim ON auth.users;
CREATE TRIGGER on_auth_user_created_claim
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.claim_orphan_data();

-- 5. Auto-fill owner_id from the event for public registrations / ticket orders
CREATE OR REPLACE FUNCTION public.set_owner_from_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_id IS NULL THEN
    SELECT owner_id INTO NEW.owner_id FROM public.events WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reg_set_owner ON public.registrations;
CREATE TRIGGER reg_set_owner
  BEFORE INSERT ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_from_event();

DROP TRIGGER IF EXISTS order_set_owner ON public.ticket_orders;
CREATE TRIGGER order_set_owner
  BEFORE INSERT ON public.ticket_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_from_event();

-- 6. Replace permissive policies with auth-aware ones
-- Drop old policies
DROP POLICY IF EXISTS "public all events" ON public.events;
DROP POLICY IF EXISTS "public all registrations" ON public.registrations;
DROP POLICY IF EXISTS "public all budget_items" ON public.budget_items;
DROP POLICY IF EXISTS "public all donations" ON public.donations;
DROP POLICY IF EXISTS "public all matches" ON public.matches;

-- EVENTS: anyone can view, only owner manages
CREATE POLICY "events_public_read" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_owner_insert" ON public.events FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "events_owner_update" ON public.events FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "events_owner_delete" ON public.events FOR DELETE USING (owner_id = auth.uid());

-- REGISTRATIONS: only owner can read; anyone can insert; only owner updates/deletes
CREATE POLICY "regs_owner_read" ON public.registrations FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "regs_public_insert" ON public.registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "regs_owner_update" ON public.registrations FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "regs_owner_delete" ON public.registrations FOR DELETE USING (owner_id = auth.uid());

-- BUDGET / DONATIONS: owner only
CREATE POLICY "budget_owner_all" ON public.budget_items FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "donations_owner_all" ON public.donations FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- MATCHES: public read (for live scoreboard on event page), owner manages
CREATE POLICY "matches_public_read" ON public.matches FOR SELECT USING (true);
CREATE POLICY "matches_owner_insert" ON public.matches FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "matches_owner_update" ON public.matches FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "matches_owner_delete" ON public.matches FOR DELETE USING (owner_id = auth.uid());

-- TICKETS: public read (so visitors can see ticket types), owner manages
CREATE POLICY "tickets_public_read" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "tickets_owner_insert" ON public.tickets FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "tickets_owner_update" ON public.tickets FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "tickets_owner_delete" ON public.tickets FOR DELETE USING (owner_id = auth.uid());

-- TICKET ORDERS: owner reads/updates; public inserts
CREATE POLICY "orders_owner_read" ON public.ticket_orders FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "orders_public_insert" ON public.ticket_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_owner_update" ON public.ticket_orders FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "orders_owner_delete" ON public.ticket_orders FOR DELETE USING (owner_id = auth.uid());

-- 7. Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.budget_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_orders;

-- Set REPLICA IDENTITY FULL so updates/deletes contain prior row data
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.registrations REPLICA IDENTITY FULL;
ALTER TABLE public.budget_items REPLICA IDENTITY FULL;
ALTER TABLE public.donations REPLICA IDENTITY FULL;
ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER TABLE public.tickets REPLICA IDENTITY FULL;
ALTER TABLE public.ticket_orders REPLICA IDENTITY FULL;

-- 8. Storage bucket for payment proof images
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "proofs_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs');
CREATE POLICY "proofs_public_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');
