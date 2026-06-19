import { useState, useEffect, useMemo, useCallback } from "react";
import {
  superAdminApi, profilesApi, hydrateStore,
  type SportsEvent, type TeamRegistration, type BudgetItem,
  type Donation, type TicketType, type TicketOrder, type Match, type Profile,
} from "@/lib/store";
import { useStoreSignal } from "@/hooks/use-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Users, Trophy, DollarSign, Ticket, Calendar,
  Activity, Shield, AlertTriangle, CheckCircle,
  Download, Search, RefreshCw, HeartHandshake, Wallet,

} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { fmtMoney } from "@/lib/currency";
import { sportLabel } from "@/lib/sports";
import { getCurrentUser, isSuperAdmin } from "@/lib/auth";

type SortDir = "asc" | "desc";

function sortBy<T>(arr: T[], key: (t: T) => string | number, dir: SortDir): T[] {
  return [...arr].sort((a, b) => {
    const va = key(a), vb = key(b);
    return dir === "asc"
      ? va < vb ? -1 : va > vb ? 1 : 0
      : vb < va ? -1 : vb > va ? 1 : 0;
  });
}

export default function SuperAdminDashboard() {
  useStoreSignal();
  const [ready, setReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => { setReady(true); }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || !isSuperAdmin(user)) {
          toast.error("Access denied. Superadmin privileges required.");
          setLoading(false);
          return;
        }
        setCurrentUser(user);
        await hydrateStore();
      } catch (error) {
        console.error("Failed to initialize dashboard:", error);
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ---- Data ----
  const allEvents = superAdminApi.getAllEvents();
  const allRegs = superAdminApi.getAllRegistrations();
  const allBudget = superAdminApi.getAllBudgetItems();
  const allDonations = superAdminApi.getAllDonations();
  const allOrders = superAdminApi.getAllOrders();
  const allTickets = superAdminApi.getAllTickets();
  const allMatches = superAdminApi.getAllMatches();
  const allProfiles = superAdminApi.getAllProfiles();

  // ---- Derived stats ----
  // Build profile map from DB profiles table (may be empty if migration not applied)
  const profileMap = useMemo(() => {
    const m = new Map<string, Profile>();
    allProfiles.forEach((p) => m.set(p.id, p));
    return m;
  }, [allProfiles]);

  const eventOwnerIds = useMemo(() => {
    const s = new Set<string>();
    allEvents.forEach((e) => { if (e.ownerId) s.add(e.ownerId); });
    return s;
  }, [allEvents]);

  // Fallback map: extract organizer info from event contact fields when profiles table unavailable
  const fallbackProfileMap = useMemo(() => {
    const m = new Map<string, { name: string; email: string }>();
    allEvents.forEach((e) => {
      if (!e.ownerId) return;
      if (m.has(e.ownerId)) return;
      const email = e.contactName.includes("@") ? e.contactName : "";
      m.set(e.ownerId, {
        name: e.contactName || `User ${e.ownerId.slice(0, 6)}`,
        email: email || "",
      });
    });
    // Also try to extract emails from registration captain emails
    allRegs.forEach((r) => {
      const ev = allEvents.find((e) => e.id === r.eventId);
      if (!ev?.ownerId) return;
      if (m.has(ev.ownerId) && m.get(ev.ownerId)!.email) return;
      if (r.captainEmail) {
        m.set(ev.ownerId, {
          name: m.get(ev.ownerId)?.name || r.captainName || ev.contactName || `User ${ev.ownerId.slice(0, 6)}`,
          email: r.captainEmail,
        });
      }
    });
    return m;
  }, [allEvents, allRegs]);

  const getProfileName = useCallback((id?: string | null) => {
    if (!id) return "Unknown";
    return profileMap.get(id)?.name || fallbackProfileMap.get(id)?.name || id.slice(0, 8);
  }, [profileMap, fallbackProfileMap]);

  const getProfileEmail = useCallback((id?: string | null) => {
    if (!id) return "";
    return profileMap.get(id)?.email || fallbackProfileMap.get(id)?.email || "";
  }, [profileMap, fallbackProfileMap]);

  const totalIncome = allBudget.filter((b) => b.type === "income").reduce((s, i) => s + i.amount, 0);
  const totalExpense = allBudget.filter((b) => b.type === "expense").reduce((s, i) => s + i.amount, 0);
  const totalDonationAmt = allDonations.reduce((s, d) => s + d.amount, 0);
  const totalTicketRevenue = allOrders.filter((o) => o.status !== "rejected").reduce((s, o) => s + o.total, 0);
  const totalRegistrations = allRegs.length;

  const currencies = useMemo(() => {
    const s = new Set<string>();
    allEvents.forEach((e) => { if (e.currency) s.add(e.currency); });
    return Array.from(s);
  }, [allEvents]);
  const primaryCur = currencies[0] || "INR";

  // ---- Per-organizer stats ----
  const organizerStats = useMemo(() => {
    const map = new Map<string, {
      id: string;
      profile: Profile | undefined;
      totalEvents: number;
      activeEvents: number;
      completedEvents: number;
      totalRegistrations: number;
      totalIncome: number;
      totalDonations: number;
      totalTicketSales: number;
      totalPrizePool: number;
      lastActivity: string;
      events: SportsEvent[];
      currencies: Set<string>;
    }>();

    allEvents.forEach((event) => {
      const oid = event.ownerId || "unknown";
      if (!map.has(oid)) {
        map.set(oid, {
          id: oid,
          profile: profileMap.get(oid) || (fallbackProfileMap.has(oid) ? { id: oid, name: fallbackProfileMap.get(oid)!.name, email: fallbackProfileMap.get(oid)!.email, role: "organizer", isActive: true, createdAt: "", lastLogin: undefined } as Profile : undefined),
          totalEvents: 0,
          activeEvents: 0,
          completedEvents: 0,
          totalRegistrations: 0,
          totalIncome: 0,
          totalDonations: 0,
          totalTicketSales: 0,
          totalPrizePool: 0,
          lastActivity: event.createdAt,
          events: [],
          currencies: new Set(),
        });
      }
      const s = map.get(oid)!;
      s.totalEvents++;
      s.events.push(event);
      s.totalPrizePool += event.prizePool;
      if (event.currency) s.currencies.add(event.currency);
      if (event.status === "live" || event.status === "published") s.activeEvents++;
      else if (event.status === "completed") s.completedEvents++;
      if (new Date(event.createdAt) > new Date(s.lastActivity)) s.lastActivity = event.createdAt;
    });

    allRegs.forEach((reg) => {
      const ev = allEvents.find((e) => e.id === reg.eventId);
      if (!ev || !ev.ownerId) return;
      const s = map.get(ev.ownerId);
      if (s) s.totalRegistrations++;
    });

    allBudget.filter((b) => b.type === "income").forEach((b) => {
      const ev = allEvents.find((e) => e.id === b.eventId);
      if (!ev || !ev.ownerId) return;
      const s = map.get(ev.ownerId);
      if (s) { s.totalIncome += b.amount; if (ev.currency) s.currencies.add(ev.currency); }
    });

    allDonations.forEach((d) => {
      const ev = allEvents.find((e) => e.id === d.eventId);
      if (!ev || !ev.ownerId) return;
      const s = map.get(ev.ownerId);
      if (s) { s.totalDonations += d.amount; if (ev.currency) s.currencies.add(ev.currency); }
    });

    allOrders.filter((o) => o.status !== "rejected").forEach((o) => {
      const ev = allEvents.find((e) => e.id === o.eventId);
      if (!ev || !ev.ownerId) return;
      const s = map.get(ev.ownerId);
      if (s) { s.totalTicketSales += o.total; if (ev.currency) s.currencies.add(ev.currency); }
    });

    return Array.from(map.values());
  }, [allEvents, allRegs, allBudget, allDonations, allOrders, profileMap]);

  // ---- Monthly analytics ----
  const monthlyStats = useMemo(() => {
    const months = new Map<string, { events: number; regs: number; income: number; donations: number }>();
    const key = (d: string) => d.slice(0, 7);
    allEvents.forEach((e) => {
      const k = key(e.createdAt);
      if (!months.has(k)) months.set(k, { events: 0, regs: 0, income: 0, donations: 0 });
      months.get(k)!.events++;
    });
    allRegs.forEach((r) => {
      const k = key(r.submittedAt);
      if (!months.has(k)) months.set(k, { events: 0, regs: 0, income: 0, donations: 0 });
      months.get(k)!.regs++;
    });
    allBudget.filter((b) => b.type === "income").forEach((b) => {
      const k = key(b.date);
      if (!months.has(k)) months.set(k, { events: 0, regs: 0, income: 0, donations: 0 });
      months.get(k)!.income += b.amount;
    });
    allDonations.forEach((d) => {
      const k = key(d.date);
      if (!months.has(k)) months.set(k, { events: 0, regs: 0, income: 0, donations: 0 });
      months.get(k)!.donations += d.amount;
    });
    return Array.from(months.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [allEvents, allRegs, allBudget, allDonations]);

  const sportDistribution = useMemo(() => {
    const map = new Map<string, number>();
    allEvents.forEach((e) => map.set(e.sport, (map.get(e.sport) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [allEvents]);

  // ---- Search filter ----
  const searchLower = searchTerm.toLowerCase();
  const filteredOrganizers = organizerStats.filter(
    (o) => (o.profile?.name || "").toLowerCase().includes(searchLower) ||
           (o.profile?.email || "").toLowerCase().includes(searchLower),
  );
  // Derive user list: prefer profiles table, fallback to event ownerIds
  const derivedUsers = useMemo(() => {
    if (allProfiles.length > 0) return allProfiles;
    // No profiles table yet — derive from events
    const seen = new Set<string>();
    return allEvents.reduce<Profile[]>((acc, e) => {
      if (!e.ownerId || seen.has(e.ownerId)) return acc;
      seen.add(e.ownerId);
      const fb = fallbackProfileMap.get(e.ownerId);
      acc.push({
        id: e.ownerId,
        name: fb?.name || e.contactName || `User ${e.ownerId.slice(0, 6)}`,
        email: fb?.email || "",
        role: "organizer",
        isActive: true,
        createdAt: e.createdAt,
      });
      return acc;
    }, []);
  }, [allProfiles, allEvents, fallbackProfileMap]);

  const filteredUsers = derivedUsers.filter(
    (p) => p.name.toLowerCase().includes(searchLower) ||
           p.email.toLowerCase().includes(searchLower),
  );
  const filteredEvents = allEvents.filter(
    (e) => e.name.toLowerCase().includes(searchLower) ||
           (profileMap.get(e.ownerId || "")?.name || "").toLowerCase().includes(searchLower),
  );
  const filteredDonations = allDonations.filter(
    (d) => d.donor.toLowerCase().includes(searchLower) ||
           (allEvents.find((e) => e.id === d.eventId)?.name || "").toLowerCase().includes(searchLower),
  );
  const filteredOrders = allOrders.filter(
    (o) => o.buyerName.toLowerCase().includes(searchLower) ||
           (allEvents.find((e) => e.id === o.eventId)?.name || "").toLowerCase().includes(searchLower),
  );

  const getEventName = (id: string) => allEvents.find((e) => e.id === id)?.name || id;
  const getTicketName = (id: string) => allTickets.find((t) => t.id === id)?.name || id;

  // ---- Render ----
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="text-center"><Shield className="mx-auto h-8 w-8 animate-pulse text-muted-foreground" /><p className="mt-2 text-muted-foreground">Loading superadmin dashboard...</p></div>
      </div>
    );
  }
  if (!currentUser || !isSuperAdmin(currentUser)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="text-center"><AlertTriangle className="mx-auto h-8 w-8 text-destructive" /><h2 className="mt-4 text-xl font-semibold">Access Denied</h2><p className="mt-2 text-muted-foreground">Superadmin privileges required.</p></div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="text-center max-w-md">
          <Activity className="mx-auto h-8 w-8 animate-pulse text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading superadmin dashboard...</p>
          <div className="mt-4 w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8" /> Superadmin Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">Full platform overview with real data</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text" placeholder="Search..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 border border-border rounded-lg bg-background text-sm"
              />
            </div>
            <Button onClick={async () => { setLoading(true); await hydrateStore(); toast.success("Refreshed"); setLoading(false); }} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="organizers">Organizers</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="donations">Donations</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* ====== OVERVIEW ====== */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Users" value={allProfiles.length || eventOwnerIds.size} icon={Users} sub={`${organizerStats.length} organizers`} />
              <StatCard title="Total Events" value={allEvents.length} icon={Trophy} sub={`${allEvents.filter((e) => e.status === "live" || e.status === "published").length} active`} />
              <StatCard title="Total Registrations" value={totalRegistrations} icon={Calendar} sub="Across all events" />
              <StatCard title="Platform Revenue" value={fmtMoney(totalIncome + totalDonationAmt + totalTicketRevenue, primaryCur)} icon={DollarSign} sub={currencies.length > 1 ? currencies.join(", ") : primaryCur} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Revenue Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Row label="Budget Income" value={fmtMoney(totalIncome, primaryCur)} />
                  <Row label="Donations" value={fmtMoney(totalDonationAmt, primaryCur)} />
                  <Row label="Ticket Sales" value={fmtMoney(totalTicketRevenue, primaryCur)} />
                  <Row label="Total Expenses" value={fmtMoney(totalExpense, primaryCur)} accent="text-destructive" />
                  <div className="pt-2 border-t"><Row label="Net Platform Revenue" value={fmtMoney(totalIncome + totalDonationAmt + totalTicketRevenue - totalExpense, primaryCur)} bold /></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Platform Health</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span>Active Events</span><span>{allEvents.filter((e) => e.status === "live" || e.status === "published").length}/{allEvents.length}</span></div>
                    <Progress value={allEvents.length ? (allEvents.filter((e) => e.status === "live" || e.status === "published").length / allEvents.length) * 100 : 0} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span>Avg Registrations / Event</span><span>{allEvents.length ? Math.round(totalRegistrations / allEvents.length) : 0}</span></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><span>Total Donors</span><span>{new Set(allDonations.filter((d) => d.donor).map((d) => d.donor)).size}</span></div>
                  </div>
                  <div className="pt-2 text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" /> Platform operating normally
                  </div>
                </CardContent>
              </Card>
            </div>

            {sportDistribution.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Events by Sport</CardTitle></CardHeader>
                <CardContent><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {sportDistribution.map(([sport, count]) => (
                    <div key={sport} className="flex items-center justify-between rounded-lg border p-3">
                      <span className="capitalize">{sportLabel(sport as any)}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div></CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ====== USERS ====== */}
          <TabsContent value="users" className="space-y-4">
            <p className="text-sm text-muted-foreground">{filteredUsers.length} user{filteredUsers.length !== 1 && "s"}</p>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3 text-center">Events</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last Login</th><th className="px-4 py-3">Joined</th></tr>
                </thead>
                <tbody>
                  {filteredUsers.map((p) => {
                    const evCount = allEvents.filter((e) => e.ownerId === p.id).length;
                    return (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{p.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><span className="font-medium">{p.name}</span></div></td>
                        <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                        <td className="px-4 py-3"><Badge variant={p.role === "superadmin" ? "default" : "secondary"} className="text-xs">{p.role}</Badge></td>
                        <td className="px-4 py-3 text-center">{evCount}</td>
                        <td className="px-4 py-3">{p.isActive ? <span className="flex items-center gap-1 text-success"><CheckCircle className="h-3 w-3" /> Active</span> : <span className="text-muted-foreground">Inactive</span>}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{p.lastLogin ? format(new Date(p.lastLogin), "MMM d, yyyy") : "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{p.createdAt ? format(new Date(p.createdAt), "MMM d, yyyy") : "—"}</td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No users match your search.</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ====== ORGANIZERS ====== */}
          <TabsContent value="organizers" className="space-y-4">
            <p className="text-sm text-muted-foreground">{filteredOrganizers.length} organizer{filteredOrganizers.length !== 1 && "s"}</p>
            <div className="grid gap-4">
              {filteredOrganizers.map((o) => {
                const cur = Array.from(o.currencies)[0] || primaryCur;
                return (
                  <Card key={o.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar><AvatarFallback>{(o.profile?.name || "?").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                          <div>
                            <CardTitle className="text-lg">{o.profile?.name || "Unknown"}</CardTitle>
                            <p className="text-sm text-muted-foreground">{o.profile?.email || getProfileEmail(o.id) || o.id}</p>
                          </div>
                        </div>
                        <Badge variant={o.totalEvents > 0 ? "default" : "secondary"}>{o.totalEvents > 0 ? "Active" : "Inactive"}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center"><div className="text-2xl font-bold">{o.totalEvents}</div><p className="text-xs text-muted-foreground">Events</p></div>
                        <div className="text-center"><div className="text-2xl font-bold">{o.totalRegistrations}</div><p className="text-xs text-muted-foreground">Registrations</p></div>
                        <div className="text-center"><div className="text-2xl font-bold">{fmtMoney(o.totalIncome + o.totalDonations + o.totalTicketSales, cur)}</div><p className="text-xs text-muted-foreground">Total Revenue</p></div>
                        <div className="text-center"><div className="text-2xl font-bold">{fmtMoney(o.totalPrizePool, cur)}</div><p className="text-xs text-muted-foreground">Prize Pool</p></div>
                        <div className="text-center"><div className="text-2xl font-bold">{o.totalEvents ? Math.round(o.totalRegistrations / o.totalEvents) : 0}</div><p className="text-xs text-muted-foreground">Avg Event Size</p></div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredOrganizers.length === 0 && <p className="text-center text-muted-foreground py-8">No organizers match your search.</p>}
            </div>
          </TabsContent>

          {/* ====== EVENTS ====== */}
          <TabsContent value="events" className="space-y-4">
            <p className="text-sm text-muted-foreground">{filteredEvents.length} event{filteredEvents.length !== 1 && "s"}</p>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr><th className="px-4 py-3">Event</th><th className="px-4 py-3">Organizer</th><th className="px-4 py-3">Sport</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-center">Teams</th><th className="px-4 py-3 text-right">Revenue</th></tr>
                </thead>
                <tbody>
                  {filteredEvents.map((e) => {
                    const regs = allRegs.filter((r) => r.eventId === e.id);
                    const inc = allBudget.filter((b) => b.eventId === e.id && b.type === "income").reduce((s, b) => s + b.amount, 0);
                    const dn = allDonations.filter((d) => d.eventId === e.id).reduce((s, d) => s + d.amount, 0);
                    return (
                      <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{e.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{getProfileName(e.ownerId)}</td>
                        <td className="px-4 py-3 capitalize">{sportLabel(e.sport as any)}</td>
                        <td className="px-4 py-3"><Badge variant={e.status === "live" ? "default" : "secondary"} className="text-xs">{e.status}</Badge></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(e.startDate), "MMM d")}</td>
                        <td className="px-4 py-3 text-center">{regs.length}/{e.maxTeams}</td>
                        <td className="px-4 py-3 text-right font-mono-num">{fmtMoney(inc + dn, e.currency)}</td>
                      </tr>
                    );
                  })}
                  {filteredEvents.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No events match your search.</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ====== DONATIONS ====== */}
          <TabsContent value="donations" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{filteredDonations.length} donation{filteredDonations.length !== 1 && "s"} · Total: {fmtMoney(allDonations.reduce((s, d) => s + d.amount, 0), primaryCur)}</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">Donor</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Note</th></tr>
                </thead>
                <tbody>
                  {filteredDonations.sort((a, b) => b.date.localeCompare(a.date)).map((d) => (
                    <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(d.date), "MMM d")}</td>
                      <td className="px-4 py-3">{getEventName(d.eventId)}</td>
                      <td className="px-4 py-3 font-medium">{d.donor}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{d.type}</Badge></td>
                      <td className="px-4 py-3 text-right font-mono-num font-bold text-success">+{fmtMoney(d.amount, (() => { const ev = allEvents.find((e) => e.id === d.eventId); return ev?.currency; })() || primaryCur)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{d.note || "—"}</td>
                    </tr>
                  ))}
                  {filteredDonations.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No donations yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ====== ORDERS ====== */}
          <TabsContent value="orders" className="space-y-4">
            <p className="text-sm text-muted-foreground">{filteredOrders.length} order{filteredOrders.length !== 1 && "s"} · Revenue: {fmtMoney(allOrders.filter((o) => o.status !== "rejected").reduce((s, o) => s + o.total, 0), primaryCur)}</p>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">Buyer</th><th className="px-4 py-3">Ticket</th><th className="px-4 py-3 text-center">Qty</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th></tr>
                </thead>
                <tbody>
                  {filteredOrders.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).map((o) => (
                    <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(o.submittedAt), "MMM d")}</td>
                      <td className="px-4 py-3">{getEventName(o.eventId)}</td>
                      <td className="px-4 py-3">{o.buyerName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{getTicketName(o.ticketId)}</td>
                      <td className="px-4 py-3 text-center">{o.quantity}</td>
                      <td className="px-4 py-3 text-right font-mono-num">{fmtMoney(o.total, (() => { const ev = allEvents.find((e) => e.id === o.eventId); return ev?.currency; })() || primaryCur)}</td>
                      <td className="px-4 py-3"><Badge variant={o.status === "approved" ? "default" : o.status === "rejected" ? "destructive" : "secondary"} className="text-xs">{o.status}</Badge></td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No orders yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ====== BUDGET ====== */}
          <TabsContent value="budget" className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">{allBudget.length} items</span>
              <span className="text-success">Income: {fmtMoney(totalIncome, primaryCur)}</span>
              <span className="text-destructive">Expenses: {fmtMoney(totalExpense, primaryCur)}</span>
              <span className="font-medium">Net: {fmtMoney(totalIncome - totalExpense, primaryCur)}</span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Category</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Note</th></tr>
                </thead>
                <tbody>
                  {allBudget.sort((a, b) => b.date.localeCompare(a.date)).map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(b.date), "MMM d")}</td>
                      <td className="px-4 py-3">{getEventName(b.eventId)}</td>
                      <td className="px-4 py-3"><Badge variant={b.type === "income" ? "default" : "destructive"} className="text-xs">{b.type}</Badge></td>
                      <td className="px-4 py-3">{b.category}</td>
                      <td className={`px-4 py-3 text-right font-mono-num font-bold ${b.type === "income" ? "text-success" : "text-destructive"}`}>{b.type === "income" ? "+" : "-"}{fmtMoney(b.amount, (() => { const ev = allEvents.find((e) => e.id === b.eventId); return ev?.currency; })() || primaryCur)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{b.note || "—"}</td>
                    </tr>
                  ))}
                  {allBudget.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No budget items yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* ====== ANALYTICS ====== */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Top Organizers by Revenue</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {organizerStats.sort((a, b) => (b.totalIncome + b.totalDonations + b.totalTicketSales) - (a.totalIncome + a.totalDonations + a.totalTicketSales)).slice(0, 5).map((o, i) => {
                    const cur = Array.from(o.currencies)[0] || primaryCur;
                    return (
                      <div key={o.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><span className="text-sm font-medium text-muted-foreground">#{i + 1}</span><span>{o.profile?.name || "Unknown"}</span></div>
                        <span className="font-semibold">{fmtMoney(o.totalIncome + o.totalDonations + o.totalTicketSales, cur)}</span>
                      </div>
                    );
                  })}
                  {organizerStats.length === 0 && <p className="text-sm text-muted-foreground">No organizers yet.</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Top Organizers by Events</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {organizerStats.sort((a, b) => b.totalEvents - a.totalEvents).slice(0, 5).map((o, i) => (
                    <div key={o.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3"><span className="text-sm font-medium text-muted-foreground">#{i + 1}</span><span>{o.profile?.name || "Unknown"}</span></div>
                      <span className="font-semibold">{o.totalEvents} event{o.totalEvents !== 1 && "s"}</span>
                    </div>
                  ))}
                  {organizerStats.length === 0 && <p className="text-sm text-muted-foreground">No organizers yet.</p>}
                </CardContent>
              </Card>
            </div>

            {/* Monthly trends */}
            <Card>
              <CardHeader><CardTitle>Monthly Trends</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr><th className="px-4 py-3">Month</th><th className="px-4 py-3 text-center">Events Created</th><th className="px-4 py-3 text-center">Registrations</th><th className="px-4 py-3 text-right">Budget Income</th><th className="px-4 py-3 text-right">Donations</th></tr>
                    </thead>
                    <tbody>
                      {monthlyStats.slice(-12).map(([month, stats]) => (
                        <tr key={month} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{format(new Date(month + "-01"), "MMM yyyy")}</td>
                          <td className="px-4 py-3 text-center">{stats.events}</td>
                          <td className="px-4 py-3 text-center">{stats.regs}</td>
                          <td className="px-4 py-3 text-right font-mono-num">{fmtMoney(stats.income, primaryCur)}</td>
                          <td className="px-4 py-3 text-right font-mono-num">{fmtMoney(stats.donations, primaryCur)}</td>
                        </tr>
                      ))}
                      {monthlyStats.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No data yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, sub }: { title: string; value: string | number; icon: typeof Shield; sub?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, accent, bold }: { label: string; value: string; accent?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm">{label}</span>
      <span className={`${bold ? "font-bold" : "font-semibold"} ${accent || ""}`}>{value}</span>
    </div>
  );
}
