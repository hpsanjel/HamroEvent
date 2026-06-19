import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { eventsApi, regsApi, budgetApi, donationsApi, matchesApi } from "@/lib/store";
import { useHydrated } from "@/hooks/use-store";
import { sportEmoji, sportLabel } from "@/lib/sports";
import { fmtMoney } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Trophy, Wallet, Share2, Pencil, Trash2, ArrowLeft, Radio } from "lucide-react";
import { format } from "date-fns";
import { ShareDialog } from "@/components/share-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/app/events/$eventId")({
  component: EventDetail,
});

function EventDetail() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const ready = useHydrated();
  const event = eventsApi.get(eventId);
  const isNonSport = event?.type === "non-sport";
  const [shareOpen, setShareOpen] = useState(false);

  if (!ready) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Loading event…</div>;
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl text-center py-20">
        <p className="text-muted-foreground">Event not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <a href="/app/events">Back to events</a>
        </Button>
      </div>
    );
  }

  const regs = regsApi.list(eventId);
  const approved = regs.filter((r) => r.status === "approved").length;
  const pending = regs.filter((r) => r.status === "pending").length;
  const budgetItems = budgetApi.list(eventId);
  const income = budgetItems.filter((b) => b.type === "income" && !b.id.startsWith("donation-")).reduce((s, i) => s + i.amount, 0);
  const expense = budgetItems.filter((b) => b.type === "expense").reduce((s, i) => s + i.amount, 0);
  const donationTotal = donationsApi.list(eventId).reduce((s, d) => s + d.amount, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <a href="/app/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All events
      </a>

      {event.bannerUrl && (
        <div className="overflow-hidden rounded-3xl border border-border shadow-card">
          <img 
            src={event.bannerUrl} 
            alt={`${event.name} banner`} 
            className="w-full h-48 sm:h-64 object-cover"
          />
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-border bg-gradient-pitch shadow-card">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  {isNonSport ? (
                    <span className="text-4xl">📋</span>
                  ) : (
                    <span className="text-4xl">{sportEmoji(event.sport)}</span>
                  )}
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                    {isNonSport ? "Event" : sportLabel(event.sport)}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                    event.status === "live" ? "bg-destructive/20 text-destructive" :
                    event.status === "published" ? "bg-success/20 text-success" :
                    "bg-muted text-muted-foreground"
                  }`}>{event.status}</span>
                </div>
                <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{event.name}</h1>
                {event.description && <p className="mt-2 max-w-2xl text-muted-foreground">{event.description}</p>}
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{format(new Date(event.startDate), "PPP")}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.venue}</span>
                  {!isNonSport && (
                    <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4" />{fmtMoney(event.prizePool, event.currency)} prize pool</span>
                  )}
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShareOpen(true)}><Share2 className="mr-1.5 h-4 w-4" /> Share QR</Button>
              <Button asChild variant="outline"><a href="/app/events">List</a></Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm(`Delete "${event.name}" and all its data?`)) {
                    eventsApi.remove(eventId);
                    toast.success("Deleted");
                    window.location.href = "/app/events";
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {!isNonSport && (() => {
        const live = matchesApi.liveFor(eventId);
        if (!live) return null;
        return (
          <div className="rounded-3xl border border-destructive/40 bg-destructive/10 p-5 shadow-card">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-destructive">
              <Radio className="h-3.5 w-3.5 animate-pulse" /> LIVE — Round {live.round} · Match {live.matchNo}
            </div>
            <div className="mt-3 flex items-center justify-center gap-6 text-center">
              <div className="flex-1">
                <div className="font-display text-xl font-bold">{live.teamA ?? "TBD"}</div>
                <div className="font-mono-num text-5xl font-bold text-primary">{live.scoreA ?? 0}</div>
              </div>
              <div className="text-2xl text-muted-foreground">vs</div>
              <div className="flex-1">
                <div className="font-display text-xl font-bold">{live.teamB ?? "TBD"}</div>
                <div className="font-mono-num text-5xl font-bold text-primary">{live.scoreB ?? 0}</div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!isNonSport && (
          <>
            <Stat label="Approved teams" value={`${approved} / ${event.maxTeams}`} icon={Users} />
            <Stat label="Pending review" value={pending} icon={Users} accent="text-warning" />
          </>
        )}
        <Stat label="Income" value={fmtMoney(income, event.currency)} icon={Trophy} accent="text-success" />
        <Stat label="Donations" value={fmtMoney(donationTotal, event.currency)} icon={Wallet} accent="text-accent" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {!isNonSport && (
          <>
            <ActionCard to="/app/registrations" search={{ event: eventId }} title="Manage registrations" desc={`${pending} pending • ${approved} approved`} />
            <ActionCard to="/app/schedule" search={{ event: eventId }} title="Bracket & schedule" desc="Generate tie sheet from approved teams" />
          </>
        )}
        <ActionCard to="/app/budget" search={{ event: eventId }} title="Budget" desc={`Net: ${fmtMoney(income - expense, event.currency)}`} />
        <ActionCard to="/app/donations" search={{ event: eventId }} title="Donations" desc={`${fmtMoney(donationTotal, event.currency)} raised`} />
        <ActionCard to="/app/tickets" search={{ event: eventId }} title="Tickets" desc="Sell entry passes to public" />
        <ActionCard to="/app/checkin" search={{ event: eventId }} title="Event-day check-in" desc="Verify tickets at the gate" />
        {!isNonSport && (
          <ActionCard to="/register/$eventId" params={{ eventId }} title="Public registration page" desc="Preview what teams see" external />
        )}
        <ActionCard to="/tickets/$eventId" params={{ eventId }} title="Public ticket page" desc="Preview what attendees see" external />
      </div>

      {shareOpen && <ShareDialog event={event} onClose={() => setShareOpen(false)} />}
    </div>
  );
}

function Stat({ label, value, icon: Icon, accent = "text-primary" }: { label: string; value: string | number; icon: typeof Users; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div className="mt-2 font-mono-num text-3xl font-bold">{value}</div>
    </div>
  );
}

function ActionCard(props: any) {
  const { title, desc, external, ...linkProps } = props;
  return (
    <Link
      {...linkProps}
      target={external ? "_blank" : undefined}
      className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50 hover:shadow-glow"
    >
      <div>
        <div className="font-display text-lg font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Pencil className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
    </Link>
  );
}
