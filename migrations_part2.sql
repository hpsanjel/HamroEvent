-- Part 2: Enable RLS and Policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "public all events" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "public all registrations" ON public.registrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "public all budget_items" ON public.budget_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "public all donations" ON public.donations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "public all matches" ON public.matches FOR ALL USING (true) WITH CHECK (true);
