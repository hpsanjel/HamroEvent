// Supabase-backed data layer for PitchPro.
// Synchronous in-memory cache. Writes are optimistic + realtime-synced.

import { supabase } from "@/integrations/supabase/client";
import { deleteEventBannerByUrl } from "@/lib/image-upload";

export type SportType =
  | "football"
  | "cricket"
  | "basketball"
  | "volleyball"
  | "badminton"
  | "kabaddi"
  | "other";
export type EventType = "sport" | "non-sport";
export type EventStatus = "draft" | "published" | "live" | "completed";

export interface SportsEvent {
  id: string;
  ownerId?: string | null;
  name: string;
  sport: SportType;
  type: EventType;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeams: number;
  entryFee: number;
  prizePool: number;
  paymentInfo: string;
  paymentQrDataUrl?: string;
  currency?: string;
  contactName: string;
  contactPhone: string;
  status: EventStatus;
  coverImage?: string;
  bannerUrl?: string;
  createdAt: string;
}

export type RegStatus = "pending" | "approved" | "rejected";

export interface Player {
  name: string;
  jersey?: string;
  phone?: string;
}

export interface TeamRegistration {
  id: string;
  eventId: string;
  ownerId?: string | null;
  teamName: string;
  captainName: string;
  captainPhone: string;
  captainEmail: string;
  players: Player[];
  paymentProof?: string;
  paymentRef?: string;
  notes?: string;
  status: RegStatus;
  checkedIn: boolean;
  submittedAt: string;
}

export interface BudgetItem {
  id: string;
  eventId: string;
  ownerId?: string | null;
  type: "income" | "expense";
  category: string;
  amount: number;
  note?: string;
  date: string;
}

export interface Donation {
  id: string;
  eventId: string;
  ownerId?: string | null;
  donorName?: string;
  donor: string;
  amount: number;
  type: "cash" | "kind" | "sponsorship";
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  eventId: string;
  ownerId?: string | null;
  round: number;
  matchNo: number;
  teamA: string | null;
  teamB: string | null;
  scoreA?: number;
  scoreB?: number;
  winner?: string | null;
  scheduledAt?: string;
  venue?: string;
  status: "scheduled" | "live" | "done";
}

export interface TicketType {
  id: string;
  eventId: string;
  ownerId?: string | null;
  name: string;
  description: string;
  price: number;
  quantity: number; // -1 = unlimited
  sortOrder: number;
  createdAt: string;
}

export type OrderStatus = "pending" | "approved" | "rejected";

export interface TicketOrder {
  id: string;
  eventId: string;
  ticketId: string;
  ownerId?: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  quantity: number;
  total: number;
  paymentProof?: string;
  paymentRef?: string;
  notes?: string;
  status: OrderStatus;
  checkedIn: boolean;
  submittedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: "organizer" | "superadmin";
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

// ---------- Cache ----------
const cache = {
  events: [] as SportsEvent[],
  regs: [] as TeamRegistration[],
  budget: [] as BudgetItem[],
  donations: [] as Donation[],
  matches: [] as Match[],
  tickets: [] as TicketType[],
  orders: [] as TicketOrder[],
  profiles: [] as Profile[],
};

let hydrated = false;
let hydrating: Promise<void> | null = null;
let currentUserId: string | null = null;
let realtimeChannel: any = null;

function emit(key: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("pp:store", { detail: { key } }));
}

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ---------- Mappers ----------
function eventFromRow(r: any): SportsEvent {
  return {
    id: r.id,
    ownerId: r.owner_id ?? null,
    name: r.name,
    sport: r.sport,
    type: r.event_type ?? "sport",
    description: r.description ?? "",
    venue: r.venue ?? "",
    startDate: r.start_date,
    endDate: r.end_date,
    registrationDeadline: r.registration_deadline,
    maxTeams: r.max_teams,
    entryFee: Number(r.entry_fee),
    prizePool: Number(r.prize_pool),
    paymentInfo: r.payment_info ?? "",
    paymentQrDataUrl: r.payment_qr_data_url ?? undefined,
    currency: r.currency ?? undefined,
    contactName: r.contact_name ?? "",
    contactPhone: r.contact_phone ?? "",
    status: r.status,
    coverImage: r.cover_image ?? undefined,
    bannerUrl: r.banner_url ?? undefined,
    createdAt: r.created_at,
  };
}
function eventToRow(e: SportsEvent) {
  return {
    id: e.id,
    owner_id: e.ownerId ?? currentUserId,
    name: e.name,
    sport: e.sport,
    event_type: e.type,
    description: e.description,
    venue: e.venue,
    start_date: e.startDate,
    end_date: e.endDate,
    registration_deadline: e.registrationDeadline,
    max_teams: e.maxTeams,
    entry_fee: e.entryFee,
    prize_pool: e.prizePool,
    payment_info: e.paymentInfo,
    payment_qr_data_url: e.paymentQrDataUrl ?? null,
    currency: e.currency ?? null,
    contact_name: e.contactName,
    contact_phone: e.contactPhone,
    status: e.status,
    cover_image: e.coverImage ?? null,
    banner_url: e.bannerUrl ?? null,
    created_at: e.createdAt,
  };
}

function regFromRow(r: any): TeamRegistration {
  return {
    id: r.id,
    eventId: r.event_id,
    ownerId: r.owner_id ?? null,
    teamName: r.team_name,
    captainName: r.captain_name,
    captainPhone: r.captain_phone ?? "",
    captainEmail: r.captain_email ?? "",
    players: Array.isArray(r.players) ? r.players : [],
    paymentProof: r.payment_proof ?? undefined,
    paymentRef: r.payment_ref ?? undefined,
    notes: r.notes ?? undefined,
    status: r.status,
    checkedIn: !!r.checked_in,
    submittedAt: r.submitted_at,
  };
}
function regToRow(r: TeamRegistration): any {
  return {
    id: r.id,
    event_id: r.eventId,
    owner_id: r.ownerId ?? null,
    team_name: r.teamName,
    captain_name: r.captainName,
    captain_phone: r.captainPhone,
    captain_email: r.captainEmail,
    players: r.players,
    payment_proof: r.paymentProof ?? null,
    payment_ref: r.paymentRef ?? null,
    notes: r.notes ?? null,
    status: r.status,
    checked_in: r.checkedIn,
    submitted_at: r.submittedAt,
  };
}

function budgetFromRow(r: any): BudgetItem {
  return {
    id: r.id,
    eventId: r.event_id,
    ownerId: r.owner_id,
    type: r.type,
    category: r.category,
    amount: Number(r.amount),
    note: r.note ?? undefined,
    date: r.date,
  };
}
function budgetToRow(b: BudgetItem) {
  return {
    id: b.id,
    event_id: b.eventId,
    owner_id: b.ownerId ?? currentUserId,
    type: b.type,
    category: b.category,
    amount: b.amount,
    note: b.note ?? null,
    date: b.date,
  };
}
function donationFromRow(r: any): Donation {
  return {
    id: r.id,
    eventId: r.event_id,
    ownerId: r.owner_id,
    donor: r.donor,
    amount: Number(r.amount),
    type: r.type,
    note: r.note ?? undefined,
    date: r.date,
    createdAt: r.created_at ?? r.date,
    updatedAt: r.updated_at ?? r.date,
  };
}
function donationToRow(d: Donation) {
  return {
    id: d.id,
    event_id: d.eventId,
    owner_id: d.ownerId ?? currentUserId,
    donor: d.donor,
    amount: d.amount,
    type: d.type,
    note: d.note ?? null,
    date: d.date,
  };
}
function matchFromRow(r: any): Match {
  return {
    id: r.id,
    eventId: r.event_id,
    ownerId: r.owner_id,
    round: r.round,
    matchNo: r.match_no,
    teamA: r.team_a,
    teamB: r.team_b,
    scoreA: r.score_a ?? undefined,
    scoreB: r.score_b ?? undefined,
    winner: r.winner ?? undefined,
    scheduledAt: r.scheduled_at ?? undefined,
    venue: r.venue ?? undefined,
    status: r.status,
  };
}
function matchToRow(m: Match) {
  return {
    id: m.id,
    event_id: m.eventId,
    owner_id: m.ownerId ?? currentUserId,
    round: m.round,
    match_no: m.matchNo,
    team_a: m.teamA,
    team_b: m.teamB,
    score_a: m.scoreA ?? null,
    score_b: m.scoreB ?? null,
    winner: m.winner ?? null,
    scheduled_at: m.scheduledAt ?? null,
    venue: m.venue ?? null,
    status: m.status,
  };
}
function ticketFromRow(r: any): TicketType {
  return {
    id: r.id,
    eventId: r.event_id,
    ownerId: r.owner_id,
    name: r.name,
    description: r.description ?? "",
    price: Number(r.price),
    quantity: Number(r.quantity ?? -1),
    sortOrder: Number(r.sort_order ?? 0),
    createdAt: r.created_at,
  };
}
function ticketToRow(t: TicketType) {
  return {
    id: t.id,
    event_id: t.eventId,
    owner_id: t.ownerId ?? currentUserId,
    name: t.name,
    description: t.description,
    price: t.price,
    quantity: t.quantity,
    sort_order: t.sortOrder,
    created_at: t.createdAt,
  };
}
function orderFromRow(r: any): TicketOrder {
  return {
    id: r.id,
    eventId: r.event_id,
    ticketId: r.ticket_id,
    ownerId: r.owner_id,
    buyerName: r.buyer_name,
    buyerEmail: r.buyer_email ?? "",
    buyerPhone: r.buyer_phone ?? "",
    quantity: Number(r.quantity),
    total: Number(r.total),
    paymentProof: r.payment_proof ?? undefined,
    paymentRef: r.payment_ref ?? undefined,
    notes: r.notes ?? undefined,
    status: r.status,
    checkedIn: !!r.checked_in,
    submittedAt: r.submitted_at,
  };
}
function orderToRow(o: TicketOrder) {
  return {
    id: o.id,
    event_id: o.eventId,
    ticket_id: o.ticketId,
    owner_id: o.ownerId ?? null,
    buyer_name: o.buyerName,
    buyer_email: o.buyerEmail,
    buyer_phone: o.buyerPhone,
    quantity: o.quantity,
    total: o.total,
    payment_proof: o.paymentProof ?? null,
    payment_ref: o.paymentRef ?? null,
    notes: o.notes ?? null,
    status: o.status,
    checked_in: o.checkedIn,
    submitted_at: o.submittedAt,
  };
}

function profileFromRow(r: any): Profile {
  return {
    id: r.id,
    email: r.email ?? "",
    name: r.name ?? "",
    role: r.role ?? "organizer",
    isActive: !!r.is_active,
    createdAt: r.created_at ?? "",
    lastLogin: r.last_login ?? undefined,
  };
}
function profileToRow(p: Profile) {
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    role: p.role,
    is_active: p.isActive,
    created_at: p.createdAt,
    last_login: p.lastLogin ?? null,
  };
}

// ---------- Hydrate ----------
export async function hydrateStore() {
  console.log('[Store] hydrateStore called, hydrated:', hydrated, 'hydrating:', !!hydrating);
  if (hydrated) {
    console.log('[Store] Already hydrated, returning');
    return;
  }
  if (hydrating) {
    console.log('[Store] Hydration already in progress, returning existing promise');
    return hydrating;
  }
  
  // Prevent concurrent hydrations
  hydrating = (async () => {
    console.log('[Store] Starting hydration process');
    try {
      const { data: sess } = await supabase.auth.getSession();
      currentUserId = sess.session?.user?.id ?? null;
      console.log('[Store] Current user ID set to:', currentUserId);
    } catch (err) {
      console.error("[pp] Failed to get session:", err);
      // Don't set hydrated to true on error
      return;
    }

    try {
      console.log('[Store] Fetching data from Supabase...');
      // Reduced timeout for faster loading
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Hydration timeout")), 5000), // Reduced from 10s to 5s
      );

      const [ev, rg, bg, dn, mt, tk, od, pr] = await Promise.race([
        Promise.allSettled([
          supabase.from("events").select("*"),
          supabase.from("registrations").select("*"),
          supabase.from("budget_items").select("*"),
          supabase.from("donations").select("*"),
          supabase.from("matches").select("*"),
          supabase.from("tickets").select("*"),
          supabase.from("ticket_orders").select("*"),
          supabase.from("profiles").select("*"),
        ]),
        timeout as any,
      ]);

      console.log('[Store] Data fetched, processing results...');
      cache.events = (ev.status === "fulfilled" ? (ev.value.data ?? []) : []).map(eventFromRow);
      cache.regs = (rg.status === "fulfilled" ? (rg.value.data ?? []) : []).map(regFromRow);
      cache.budget = (bg.status === "fulfilled" ? (bg.value.data ?? []) : []).map(budgetFromRow);
      cache.donations = (dn.status === "fulfilled" ? (dn.value.data ?? []) : []).map(
        donationFromRow,
      );
      cache.matches = (mt.status === "fulfilled" ? (mt.value.data ?? []) : []).map(matchFromRow);
      cache.tickets = (tk.status === "fulfilled" ? (tk.value.data ?? []) : []).map(ticketFromRow);
      cache.orders = (od.status === "fulfilled" ? (od.value.data ?? []) : []).map(orderFromRow);
      cache.profiles = (pr.status === "fulfilled" ? (pr.value.data ?? []) : []).map(profileFromRow);

      console.log('[Store] Cache populated - Events:', cache.events.length, 'Regs:', cache.regs.length);

      if (ev.status === "rejected") console.error("[pp] events query failed:", ev.reason);
      if (rg.status === "rejected") console.error("[pp] registrations query failed:", rg.reason);
      if (bg.status === "rejected") console.error("[pp] budget query failed:", bg.reason);
      if (dn.status === "rejected") console.error("[pp] donations query failed:", dn.reason);
      if (mt.status === "rejected") console.error("[pp] matches query failed:", mt.reason);
      if (tk.status === "rejected") console.error("[pp] tickets query failed:", tk.reason);
      if (od.status === "rejected") console.error("[pp] orders query failed:", od.reason);
      
      // Only set hydrated to true on success
      hydrated = true;
      setupRealtime();
      
      // Set global flag for hydration tracking
      if (typeof window !== "undefined") {
        window.__PP_HYDRATED__ = true;
        console.log('[Store] Hydration completed, global flag set');
      }
      
      emit("hydrated");
      console.log('[Store] Hydration process finished');
    } catch (err) {
      console.error("[pp] Failed to hydrate store:", err);
      // Reset hydration state on error to allow retry
      hydrated = false;
      hydrating = null;
    }
  })();
  return hydrating;
}

function applyChange(table: string, payload: any) {
  const eventType = payload.eventType;
  const rowNew = payload.new;
  const rowOld = payload.old;
  const apply = <T extends { id: string }>(arr: T[], mapped: T | null, oldId?: string): T[] => {
    if (eventType === "DELETE") return arr.filter((x) => x.id !== (oldId ?? mapped?.id));
    if (!mapped) return arr;
    const filtered = arr.filter((x) => x.id !== mapped.id);
    return [...filtered, mapped];
  };
  switch (table) {
    case "events":
      cache.events = apply(cache.events, rowNew ? eventFromRow(rowNew) : null, rowOld?.id);
      emit("events");
      break;
    case "registrations":
      cache.regs = apply(cache.regs, rowNew ? regFromRow(rowNew) : null, rowOld?.id);
      emit("regs");
      break;
    case "budget_items":
      cache.budget = apply(cache.budget, rowNew ? budgetFromRow(rowNew) : null, rowOld?.id);
      emit("budget");
      break;
    case "donations":
      cache.donations = apply(cache.donations, rowNew ? donationFromRow(rowNew) : null, rowOld?.id);
      emit("donations");
      break;
    case "matches":
      cache.matches = apply(cache.matches, rowNew ? matchFromRow(rowNew) : null, rowOld?.id);
      emit("matches");
      break;
    case "tickets":
      cache.tickets = apply(cache.tickets, rowNew ? ticketFromRow(rowNew) : null, rowOld?.id);
      emit("tickets");
      break;
    case "ticket_orders":
      cache.orders = apply(cache.orders, rowNew ? orderFromRow(rowNew) : null, rowOld?.id);
      emit("orders");
      break;
    case "profiles":
      cache.profiles = apply(cache.profiles, rowNew ? profileFromRow(rowNew) : null, rowOld?.id);
      emit("profiles");
      break;
  }
}

function setupRealtime() {
  // TODO: Realtime subscriptions disabled due to Supabase API issues
  // Will be re-enabled after fixing channel setup
  if (typeof window === "undefined") return;
  console.log("[pp] Realtime subscriptions temporarily disabled");
}

// React to auth changes — re-hydrate so policies kick in for the new user
if (typeof window !== "undefined") {
  console.log('[Store] Setting up auth state listener');
  supabase.auth.onAuthStateChange((_e, sess) => {
    console.log('[Store] Auth state change detected:', _e, sess?.user?.id);
    const newId = sess?.user?.id ?? null;
    if (newId !== currentUserId) {
      console.log('[Store] User ID changed, rehydrating store');
      currentUserId = newId;
      hydrated = false;
      hydrating = null;
      // Don't auto-hydrate here - let components handle it
    }
  });
}

function fireAndForget<T>(p: PromiseLike<T>, label: string) {
  Promise.resolve(p).then((r: any) => {
    if (r?.error) {
      console.error(`[pp] ${label}:`, r.error);
      console.warn(`[pp] ${label} failed — data may not be synced to Supabase`);
    }
  }).catch((err) => {
    console.error(`[pp] ${label} rejected:`, err);
  });
}

// ---------- APIs ----------
export const eventsApi = {
  list: (): SportsEvent[] => {
    console.log('[eventsApi] list() called, currentUserId:', currentUserId, 'cache.events.length:', cache.events.length);
    // When authed, only show owner's events (UI scoping; RLS already enforced server-side for writes)
    const arr = currentUserId
      ? cache.events.filter((e) => e.ownerId === currentUserId)
      : cache.events;
    console.log('[eventsApi] Filtered events:', arr.length);
    return [...arr].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  listAll: (): SportsEvent[] =>
    [...cache.events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  get: (id: string) => cache.events.find((e) => e.id === id),
  upsert: (e: SportsEvent) => {
    const withOwner = { ...e, ownerId: e.ownerId ?? currentUserId };
    cache.events = [...cache.events.filter((x) => x.id !== e.id), withOwner];
    emit("events");
    fireAndForget(supabase.from("events").upsert(eventToRow(withOwner)), "events.upsert");
  },
  remove: (id: string) => {
    // Get the event before removing to clean up banner
    const event = cache.events.find((e) => e.id === id);
    
    cache.events = cache.events.filter((e) => e.id !== id);
    cache.regs = cache.regs.filter((r) => r.eventId !== id);
    cache.budget = cache.budget.filter((b) => b.eventId !== id);
    cache.donations = cache.donations.filter((d) => d.eventId !== id);
    cache.matches = cache.matches.filter((m) => m.eventId !== id);
    cache.tickets = cache.tickets.filter((t) => t.eventId !== id);
    cache.orders = cache.orders.filter((o) => o.eventId !== id);
    emit("events");
    
    // Clean up banner if it exists
    if (event?.bannerUrl) {
      fireAndForget(
        deleteEventBannerByUrl(event.bannerUrl).catch(err => 
          console.error("Failed to delete event banner:", err)
        ),
        "events.deleteBanner"
      );
    }
    
    fireAndForget(supabase.from("events").delete().eq("id", id), "events.remove");
  },
};

export const regsApi = {
  list: (eventId?: string): TeamRegistration[] => {
    console.log('[regsApi] list() called, eventId:', eventId, 'cache.regs.length:', cache.regs.length);
    const all = [...cache.regs].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    
    // Filter by event ID if provided
    let filtered = eventId ? all.filter((r) => r.eventId === eventId) : all;
    
    // When authed, only show registrations for events owned by current user
    if (currentUserId) {
      filtered = filtered.filter((r) => {
        // If events are loaded, check ownership
        if (cache.events.length > 0) {
          const event = cache.events.find((e) => e.id === r.eventId);
          return event?.ownerId === currentUserId;
        }
        // If events aren't loaded yet, show all registrations temporarily
        // This prevents blank page during initial hydration
        return true;
      });
    }
    
    console.log('[regsApi] Filtered registrations:', filtered.length);
    return filtered;
  },
  get: (id: string) => cache.regs.find((r) => r.id === id),
  upsert: (r: TeamRegistration) => {
    cache.regs = [...cache.regs.filter((x) => x.id !== r.id), r];
    emit("regs");
    fireAndForget(supabase.from("registrations").upsert(regToRow(r)), "regs.upsert");
  },
  remove: (id: string) => {
    cache.regs = cache.regs.filter((r) => r.id !== id);
    emit("regs");
    fireAndForget(supabase.from("registrations").delete().eq("id", id), "regs.remove");
  },
};

export const budgetApi = {
  list: (eventId: string) => {
    console.log('[budgetApi] list() called, eventId:', eventId, 'cache.budget.length:', cache.budget.length);
    // Get budget items for this event
    const budgetItems = cache.budget.filter((b) => b.eventId === eventId);
    
    // Get donations for this event and calculate total
    const donations = cache.donations.filter((d) => d.eventId === eventId);
    const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    
    console.log('[budgetApi] Found donations:', donations.length, 'Total:', totalDonations);
    
    // Create combined income items from budget items + donations
    const combinedIncomeItems = [...budgetItems];
    
    // Add donation amounts as income items
    donations.forEach(donation => {
      combinedIncomeItems.push({
        id: `donation-${donation.id}`,
        eventId: donation.eventId,
        ownerId: donation.ownerId,
        type: 'income' as const,
        category: `Donation from ${donation.donor || 'Anonymous'}`,
        amount: donation.amount,
        note: donation.note,
        date: donation.date,
      });
    });
    
    console.log('[budgetApi] Combined income items:', combinedIncomeItems.length);
    return combinedIncomeItems;
  },
  upsert: (b: BudgetItem) => {
    const wo = { ...b, ownerId: b.ownerId ?? currentUserId };
    cache.budget = [...cache.budget.filter((x) => x.id !== b.id), wo];
    emit("budget");
    fireAndForget(supabase.from("budget_items").upsert(budgetToRow(wo)), "budget.upsert");
  },
  remove: (id: string) => {
    cache.budget = cache.budget.filter((b) => b.id !== id);
    emit("budget");
    fireAndForget(supabase.from("budget_items").delete().eq("id", id), "budget.remove");
  },
};

export const donationsApi = {
  list: (eventId: string) => cache.donations.filter((d) => d.eventId === eventId),
  upsert: (d: Donation) => {
    const wo = { ...d, ownerId: d.ownerId ?? currentUserId };
    cache.donations = [...cache.donations.filter((x) => x.id !== d.id), wo];
    emit("donations");
    fireAndForget(supabase.from("donations").upsert(donationToRow(wo)), "donations.upsert");
  },
  remove: (id: string) => {
    cache.donations = cache.donations.filter((d) => d.id !== id);
    emit("donations");
    fireAndForget(supabase.from("donations").delete().eq("id", id), "donations.remove");
  },
};

export const matchesApi = {
  list: (eventId: string) =>
    cache.matches
      .filter((m) => m.eventId === eventId)
      .sort((a, b) => a.round - b.round || a.matchNo - b.matchNo),
  liveFor: (eventId: string) =>
    cache.matches.find((m) => m.eventId === eventId && m.status === "live") ?? null,
  upsert: (m: Match) => {
    const wo = { ...m, ownerId: m.ownerId ?? currentUserId };
    cache.matches = [...cache.matches.filter((x) => x.id !== m.id), wo];
    emit("matches");
    fireAndForget(supabase.from("matches").upsert(matchToRow(wo)), "matches.upsert");
  },
  removeForEvent: (eventId: string) => {
    cache.matches = cache.matches.filter((m) => m.eventId !== eventId);
    emit("matches");
    fireAndForget(
      supabase.from("matches").delete().eq("event_id", eventId),
      "matches.removeForEvent",
    );
  },
};

export const ticketsApi = {
  list: (eventId: string) =>
    cache.tickets
      .filter((t) => t.eventId === eventId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)),
  get: (id: string) => cache.tickets.find((t) => t.id === id),
  upsert: (t: TicketType) => {
    const wo = { ...t, ownerId: t.ownerId ?? currentUserId };
    cache.tickets = [...cache.tickets.filter((x) => x.id !== t.id), wo];
    emit("tickets");
    fireAndForget(supabase.from("tickets").upsert(ticketToRow(wo)), "tickets.upsert");
  },
  remove: (id: string) => {
    cache.tickets = cache.tickets.filter((t) => t.id !== id);
    emit("tickets");
    fireAndForget(supabase.from("tickets").delete().eq("id", id), "tickets.remove");
  },
};

export const ordersApi = {
  list: (eventId?: string) => {
    const arr = [...cache.orders].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    let filtered = eventId ? arr.filter((o) => o.eventId === eventId) : arr;
    
    // When authed, only show orders for events owned by current user
    if (currentUserId) {
      filtered = filtered.filter((o) => {
        // If events are loaded, check ownership
        if (cache.events.length > 0) {
          const event = cache.events.find((e) => e.id === o.eventId);
          return event?.ownerId === currentUserId;
        }
        // If events aren't loaded yet, show all orders temporarily
        // This prevents blank page during initial hydration
        return true;
      });
    }
    
    return filtered;
  },
  countSold: (ticketId: string) =>
    cache.orders
      .filter((o) => o.ticketId === ticketId && o.status !== "rejected")
      .reduce((s, o) => s + o.quantity, 0),
  get: (id: string) => cache.orders.find((o) => o.id === id),
  upsert: (o: TicketOrder) => {
    cache.orders = [...cache.orders.filter((x) => x.id !== o.id), o];
    emit("orders");
    const promise = supabase.from("ticket_orders").upsert(orderToRow(o));
    return Promise.resolve(promise).then((r: any) => {
      if (r?.error) console.error(`[pp] orders.upsert:`, r.error);
      return r;
    }).catch((err: unknown) => {
      console.error(`[pp] orders.upsert rejected:`, err);
      return { error: err, data: null };
    });
  },
  remove: (id: string) => {
    cache.orders = cache.orders.filter((o) => o.id !== id);
    emit("orders");
    fireAndForget(supabase.from("ticket_orders").delete().eq("id", id), "orders.remove");
  },
};

export const profilesApi = {
  list: (): Profile[] => [...cache.profiles].sort((a, b) => a.email.localeCompare(b.email)),
  get: (id: string) => cache.profiles.find((p) => p.id === id),
  getByEmail: (email: string) => cache.profiles.find((p) => p.email === email),
};

// ---------- Superadmin APIs (access all data without user filtering) ----------
export const superAdminApi = {
  // Get all events without user filtering
  getAllEvents: (): SportsEvent[] => [...cache.events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  
  // Get all registrations without user filtering
  getAllRegistrations: (): TeamRegistration[] => [...cache.regs].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
  
  // Get all budget items without user filtering
  getAllBudgetItems: (): BudgetItem[] => [...cache.budget].sort((a, b) => b.date.localeCompare(a.date)),
  
  // Get all donations without user filtering
  getAllDonations: (): Donation[] => [...cache.donations].sort((a, b) => b.date.localeCompare(a.date)),
  
  // Get all tickets without user filtering
  getAllTickets: (): TicketType[] => [...cache.tickets].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)),
  
  // Get all orders without user filtering
  getAllOrders: (): TicketOrder[] => [...cache.orders].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
  
  // Get all matches without user filtering
  getAllMatches: (): Match[] => [...cache.matches].sort((a, b) => a.round - b.round || a.matchNo - b.matchNo),
  
  // Get all profiles without user filtering
  getAllProfiles: (): Profile[] => [...cache.profiles].sort((a, b) => a.email.localeCompare(b.email)),
};

export function generateBracket(eventId: string, teams: string[]): Match[] {
  matchesApi.removeForEvent(eventId);
  if (teams.length < 2) return [];
  const size = Math.pow(2, Math.ceil(Math.log2(teams.length)));
  const padded: (string | null)[] = [...teams];
  while (padded.length < size) padded.push(null);
  for (let i = padded.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [padded[i], padded[j]] = [padded[j], padded[i]];
  }
  const matches: Match[] = [];
  let round = 1,
    matchNo = 1;
  for (let i = 0; i < padded.length; i += 2) {
    const a = padded[i],
      b = padded[i + 1];
    matches.push({
      id: uid(),
      eventId,
      round,
      matchNo: matchNo++,
      teamA: a,
      teamB: b,
      winner: !a ? b : !b ? a : undefined,
      status: !a || !b ? "done" : "scheduled",
    });
  }
  let prevCount = matches.length;
  while (prevCount > 1) {
    round++;
    const cur = prevCount / 2;
    for (let i = 0; i < cur; i++) {
      matches.push({
        id: uid(),
        eventId,
        round,
        matchNo: matchNo++,
        teamA: null,
        teamB: null,
        status: "scheduled",
      });
    }
    prevCount = cur;
  }
  matches.forEach(matchesApi.upsert);
  return matches;
}
