import { createFileRoute, Link } from "@tanstack/react-router";
import { eventsApi, regsApi, budgetApi } from "@/lib/store";
import { useHydrated, useStoreSignal } from "@/hooks/use-store";
import { Trophy, Users, Wallet, CalendarRange, Plus, ArrowRight, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sportEmoji } from "@/lib/sports";
import { fmtMoney } from "@/lib/currency";
import { format } from "date-fns";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  useStoreSignal();
  const ready = useHydrated();
  if (!ready) {
    return <div className="mx-auto max-w-6xl py-12 text-sm text-muted-foreground">Loading dashboard…</div>;
  }
  const events = eventsApi.list();
  const allRegs = regsApi.list();
  const pending = allRegs.filter((r) => r.status === "pending").length;
  const approved = allRegs.filter((r) => r.status === "approved").length;
  const liveEvents = events.filter((e) => e.status === "live" || e.status === "published");

  // Aggregate income+donations by currency for accuracy across mixed events
  const totalsByCurrency = events.reduce<Record<string, number>>((acc, e) => {
    const cur = e.currency || "INR";
    const inc = budgetApi.list(e.id).filter((b) => b.type === "income").reduce((s, i) => s + i.amount, 0);
    acc[cur] = (acc[cur] ?? 0) + inc;
    return acc;
  }, {});
  const totalsLabel = Object.keys(totalsByCurrency).length === 0
    ? fmtMoney(0)
    : Object.entries(totalsByCurrency).map(([c, v]) => fmtMoney(v, c)).join(" + ");

  const stats = [
    { label: "Events", value: events.length, icon: Trophy, accent: "text-primary" },
    { label: "Approved teams", value: approved, icon: Users, accent: "text-success" },
    { label: "Pending review", value: pending, icon: CalendarRange, accent: "text-warning" },
    { label: "Income + donations", value: totalsLabel, icon: Wallet, accent: "text-accent" },
  ];


  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Your events at a glance.</p>
        </div>
        <Button asChild>
          <Link to="/app/events" search={{ new: "1" }}>
            <Plus className="mr-1 h-4 w-4" /> New event
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.accent}`} />
            </div>
            <div className="mt-2 font-mono-num text-3xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold">Live & upcoming</h2>
          <Link to="/app/events" className="text-sm text-primary hover:underline">
            All events →
          </Link>
        </div>
        {liveEvents.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {liveEvents.slice(0, 4).map((e) => {
              const eRegs = regsApi.list(e.id);
              return (
                <Link
                  key={e.id}
                  to="/app/events/$eventId"
                  params={{ eventId: e.id }}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-card transition hover:border-primary/50 hover:shadow-glow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl">{sportEmoji(e.sport)}</div>
                      <h3 className="mt-2 font-display text-xl font-bold">{e.name}</h3>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {format(new Date(e.startDate), "MMM d")} • {e.venue}
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${e.status === "live" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>
                      {e.status}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{eRegs.length} teams</span>
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink to="/app/registrations" icon={Users} title="Registrations" desc="Approve teams" />
        <QuickLink to="/app/schedule" icon={CalendarRange} title="Schedule" desc="Bracket & matches" />
        <QuickLink to="/app/donations" icon={HeartHandshake} title="Donations" desc="Track sponsors" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
      <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-3 font-display text-lg font-semibold">No events yet</p>
      <p className="text-sm text-muted-foreground">Create your first tournament to get rolling.</p>
      <Button asChild className="mt-4">
        <Link to="/app/events" search={{ new: "1" }}>
          <Plus className="mr-1 h-4 w-4" /> Create event
        </Link>
      </Button>
    </div>
  );
}

function QuickLink({ to, icon: Icon, title, desc }: { to: string; icon: typeof Trophy; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card/60 p-4 transition hover:border-primary/50"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
    </Link>
  );
}
