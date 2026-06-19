import { createFileRoute, Link } from "@tanstack/react-router";
import { eventsApi, regsApi } from "@/lib/store";
import { useHydrated, useStoreSignal } from "@/hooks/use-store";
import { Card } from "@/components/ui/card";
import { Users, MapPin, Calendar, Shield, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { sportLabel } from "@/lib/sports";

export const Route = createFileRoute("/verify/team/$regId")({
  validateSearch: (s: Record<string, unknown>) => ({ e: (s.e as string) || "", n: (s.n as string) || "" }),
  component: VerifyTeam,
});

function VerifyTeam() {
  useStoreSignal();
  const ready = useHydrated();
  const { regId } = Route.useParams();
  const { e: eventIdFromUrl, n: nameFromUrl } = Route.useSearch();
  const reg = regsApi.get(regId);
  const event = eventIdFromUrl ? eventsApi.get(eventIdFromUrl) : (reg ? eventsApi.get(reg.eventId) : null);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0f1223] to-[#1a1f33] p-4">
        <div className="text-center text-white/60 text-sm">Loading…</div>
      </div>
    );
  }

  const teamName = reg?.teamName || nameFromUrl || "Team";
  const captain = reg?.captainName;
  const approved = reg?.status === "approved";
  const checkin = reg?.checkedIn;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0f1223] to-[#1a1f33] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs text-white/70">
            <Shield className="h-3 w-3" /> Verified by PitchPro
          </div>
        </div>

        <Card className="overflow-hidden border-0 bg-white/5 shadow-2xl backdrop-blur">
          <div className={`px-6 py-3 ${approved ? "bg-[#c7ff00]" : "bg-white/10"}`}>
            <div className="flex items-center justify-center gap-2">
              {approved ? (
                <><CheckCircle2 className="h-5 w-5 text-[#0f1223]" /><span className="font-bold text-sm tracking-wider text-[#0f1223]">{checkin ? "CHECKED IN" : "VERIFIED TEAM"}</span></>
              ) : (
                <span className="font-bold text-sm tracking-wider text-white/60">PENDING</span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white/10 mb-3">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">{teamName}</h1>
              {captain && <p className="text-sm text-white/60 mt-0.5">Captain: {captain}</p>}
              {reg && <p className="text-xs text-white/40 mt-1">{reg.players.length} player{reg.players.length !== 1 && "s"}</p>}
            </div>

            <div className="h-px bg-white/10" />

            {event && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest">Event</p>
                  <p className="text-white font-semibold">{event.name}</p>
                  <p className="text-xs text-white/60">{sportLabel(event.sport as any)}</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-widest">Date</p>
                    <p className="text-sm text-white flex items-center gap-1"><Calendar className="h-3 w-3 text-white/40" />{format(new Date(event.startDate), "MMM d, yyyy")}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-widest">Venue</p>
                    <p className="text-sm text-white flex items-center gap-1"><MapPin className="h-3 w-3 text-white/40" />{event.venue || "TBD"}</p>
                  </div>
                </div>
              </div>
            )}

            {reg && reg.players.length > 0 && (
              <>
                <div className="h-px bg-white/10" />
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Players</p>
                  <div className="space-y-1.5">
                    {reg.players.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                        <span className="text-white text-sm flex-1">{p.name}</span>
                        {p.jersey && <span className="text-xs text-white/40">#{p.jersey}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!event && !reg && (
              <div className="text-center text-white/40 text-sm py-4">Loading details…</div>
            )}
          </div>

          <div className="bg-white/5 px-6 py-3">
            <p className="text-center text-xs text-white/30">
              Code: #{regId.slice(-6).toUpperCase()} · {approved ? "Approved" : reg?.status || "Pending"}
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-white/20 mt-6">PitchPro · Event Management Platform</p>
      </div>
    </div>
  );
}
