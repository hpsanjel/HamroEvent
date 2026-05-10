import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { eventsApi, regsApi, matchesApi, generateBracket, type Match } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shuffle, Trophy, Calendar, AlertTriangle, Radio, Flag } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/app/schedule")({
  validateSearch: (s: Record<string, unknown>) => ({ event: (s.event as string) || "" }),
  component: SchedulePage,
});

function SchedulePage() {
  const search = Route.useSearch();
  const events = eventsApi.list();
  const [eventId, setEventId] = useState(search.event || events[0]?.id || "");

  const event = eventsApi.get(eventId);
  const teams = event ? regsApi.list(eventId).filter((r) => r.status === "approved").map((r) => r.teamName) : [];
  const teamSet = useMemo(() => new Set(teams), [teams.join("|")]);
  const matches = event ? matchesApi.list(eventId) : [];
  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b);

  // Detect any matches that reference a team no longer in approved list
  const staleTeams = useMemo(() => {
    const stale = new Set<string>();
    matches.forEach((m) => {
      if (m.teamA && !teamSet.has(m.teamA)) stale.add(m.teamA);
      if (m.teamB && !teamSet.has(m.teamB)) stale.add(m.teamB);
    });
    return stale;
  }, [matches, teamSet]);

  // Auto-sync: when an approved team gets revoked, scrub it out of the bracket
  useEffect(() => {
    if (!event || staleTeams.size === 0) return;
    matches.forEach((m) => {
      const aBad = m.teamA && staleTeams.has(m.teamA);
      const bBad = m.teamB && staleTeams.has(m.teamB);
      if (!aBad && !bBad) return;
      const next: Match = { ...m };
      if (aBad) { next.teamA = null; next.scoreA = undefined; }
      if (bBad) { next.teamB = null; next.scoreB = undefined; }
      // Reset winner if it was a removed team
      if (next.winner && staleTeams.has(next.winner)) next.winner = undefined;
      // If both gone, mark scheduled as TBD
      if (!next.teamA && !next.teamB) next.status = "scheduled";
      matchesApi.upsert(next);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staleTeams.size, eventId]);

  function generate() {
    if (!event) return;
    if (teams.length < 2) { toast.error("Need at least 2 approved teams"); return; }
    generateBracket(event.id, teams);
    toast.success(`Bracket generated for ${teams.length} teams`);
  }

  function updateMatch(m: Match, patch: Partial<Match>) {
    const next = { ...m, ...patch };
    if (typeof next.scoreA === "number" && typeof next.scoreB === "number") {
      next.winner = next.scoreA > next.scoreB ? next.teamA ?? undefined : next.scoreB > next.scoreA ? next.teamB ?? undefined : undefined;
      next.status = next.winner ? "done" : "live";
    }
    matchesApi.upsert(next);
    if (next.winner) {
      const sameRound = matchesApi.list(event!.id).filter((x) => x.round === next.round).sort((a, b) => a.matchNo - b.matchNo);
      const idx = sameRound.findIndex((x) => x.id === next.id);
      const nextRoundMatches = matchesApi.list(event!.id).filter((x) => x.round === next.round + 1).sort((a, b) => a.matchNo - b.matchNo);
      const target = nextRoundMatches[Math.floor(idx / 2)];
      if (target) {
        const slot = idx % 2 === 0 ? "teamA" : "teamB";
        matchesApi.upsert({ ...target, [slot]: next.winner });
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Schedule & Bracket</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Auto-generate tie sheets and run match-day.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Pick an event" /></SelectTrigger>
            <SelectContent>
              {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {event && (
            <Button onClick={generate} className="w-full sm:w-auto">
              <Shuffle className="mr-1 h-4 w-4" /> {matches.length ? "Regenerate" : "Generate"}
            </Button>
          )}
        </div>
      </div>

      {staleTeams.size > 0 && matches.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-warning">Bracket out of sync</p>
            <p className="mt-1 text-muted-foreground">
              Removed teams: {Array.from(staleTeams).join(", ")}. They have been cleared from match cards. Click Regenerate for a fresh bracket.
            </p>
          </div>
          <Button size="sm" onClick={generate} disabled={teams.length < 2}>Regenerate</Button>
        </div>
      )}

      {!event ? (
        <Empty text="Select an event to view its schedule." />
      ) : matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-display text-lg font-semibold">No bracket yet</p>
          <p className="text-sm text-muted-foreground">{teams.length} approved team{teams.length !== 1 && "s"}. Click generate to build the tie sheet.</p>
          <Button className="mt-4" onClick={generate} disabled={teams.length < 2}>
            <Shuffle className="mr-1 h-4 w-4" /> Generate bracket
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {rounds.map((rnd) => {
            const total = rounds.length;
            const label = rnd === total ? "Final" : rnd === total - 1 ? "Semi-finals" : rnd === total - 2 ? "Quarter-finals" : `Round ${rnd}`;
            const rmatches = matches.filter((m) => m.round === rnd);
            return (
              <section key={rnd}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="font-display text-2xl font-bold">{label}</h2>
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">{rmatches.length} match{rmatches.length !== 1 && "es"}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {rmatches.map((m) => <MatchCard key={m.id} m={m} onChange={(p) => updateMatch(m, p)} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MatchCard({ m, onChange }: { m: Match; onChange: (p: Partial<Match>) => void }) {
  const isBye = !m.teamA || !m.teamB;
  const winA = m.winner && m.winner === m.teamA;
  const winB = m.winner && m.winner === m.teamB;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-mono-num font-bold text-muted-foreground">M{m.matchNo}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${m.status === "done" ? "bg-success/20 text-success" : m.status === "live" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}`}>{m.status}</span>
      </div>
      <div className="space-y-2">
        <TeamRow name={m.teamA} score={m.scoreA} winner={!!winA} onScore={(v) => onChange({ scoreA: v })} disabled={!m.teamA || !m.teamB} />
        <TeamRow name={m.teamB} score={m.scoreB} winner={!!winB} onScore={(v) => onChange({ scoreB: v })} disabled={!m.teamA || !m.teamB} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input
          type="datetime-local"
          className="h-8 min-w-0 flex-1 text-xs"
          value={m.scheduledAt ?? ""}
          onChange={(e) => onChange({ scheduledAt: e.target.value })}
          disabled={isBye}
        />
        <Input
          className="h-8 w-28 text-xs"
          placeholder="Venue"
          value={m.venue ?? ""}
          onChange={(e) => onChange({ venue: e.target.value })}
          disabled={isBye}
        />
      </div>
      {m.scheduledAt && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {format(new Date(m.scheduledAt), "MMM d, HH:mm")}
        </div>
      )}
      {!isBye && (
        <div className="mt-3 flex flex-wrap gap-2">
          {m.status !== "live" ? (
            <Button size="sm" variant="outline" onClick={() => onChange({ status: "live" })}>
              <Radio className="mr-1 h-3.5 w-3.5 text-destructive" /> Go live
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onChange({ status: "scheduled" })}>
              Pause
            </Button>
          )}
          {m.status !== "done" && (
            <Button size="sm" variant="ghost" onClick={() => {
              const winner = (m.scoreA ?? 0) > (m.scoreB ?? 0) ? m.teamA : (m.scoreB ?? 0) > (m.scoreA ?? 0) ? m.teamB : undefined;
              onChange({ status: "done", winner: winner ?? undefined });
            }}>
              <Flag className="mr-1 h-3.5 w-3.5" /> Finish
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function TeamRow({ name, score, winner, onScore, disabled }: { name: string | null; score?: number; winner: boolean; onScore: (n: number) => void; disabled: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${winner ? "border-primary/50 bg-primary/10" : "border-border bg-muted/30"}`}>
      <span className={`min-w-0 truncate text-sm ${name ? "font-semibold" : "italic text-muted-foreground"} ${winner && "text-primary"}`}>
        {name ?? "TBD / bye"}
      </span>
      <Input
        type="number"
        className="h-8 w-16 shrink-0 font-mono-num"
        value={score ?? ""}
        onChange={(e) => onScore(Number(e.target.value))}
        disabled={disabled}
      />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">{text}</div>;
}
