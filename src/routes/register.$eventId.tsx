import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { eventsApi, regsApi, uid, type Player, type TeamRegistration } from "@/lib/store";
import { useHydrated, useStoreSignal } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sportEmoji, sportLabel } from "@/lib/sports";
import { fmtMoney, currencySymbol } from "@/lib/currency";
import { downloadEventPasses } from "@/lib/event-pass";
import { Calendar, MapPin, Trophy, Plus, X, CheckCircle2, Sparkles, Download, Wallet } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/register/$eventId")({
  component: PublicRegister,
});

function PublicRegister() {
  useStoreSignal();
  const ready = useHydrated();
  const { eventId } = Route.useParams();
  const event = eventsApi.get(eventId);
  const [submitted, setSubmitted] = useState<TeamRegistration | null>(null);
  const [form, setForm] = useState({
    teamName: "",
    captainName: "",
    captainPhone: "",
    captainEmail: "",
    paymentRef: "",
    notes: "",
  });
  const [players, setPlayers] = useState<Player[]>([{ name: "" }, { name: "" }]);
  const [proof, setProof] = useState<string | undefined>();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-sm text-muted-foreground">Loading event…</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl font-bold">Event not found</h1>
          <p className="mt-2 text-muted-foreground">This registration link is invalid or the event was removed.</p>
          <Button asChild className="mt-4"><Link to="/">Visit PitchPro</Link></Button>
        </div>
      </div>
    );
  }

  const closed = event.status === "draft" || event.status === "completed" || new Date(event.registrationDeadline) < new Date();

  if (submitted) {
    return (
      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-lg rounded-3xl border border-success/40 bg-card p-8 text-center shadow-pop">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <CheckCircle2 className="h-9 w-9 text-success" />
          </div>
          <h1 className="mt-5 font-display text-3xl font-bold">Registration submitted!</h1>
          <p className="mt-2 text-muted-foreground">
            <span className="font-semibold text-foreground">{submitted.teamName}</span> has been registered for{" "}
            <span className="font-semibold text-foreground">{event.name}</span>.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            The organizer will verify your payment and confirm. Save this code to track your status:
          </p>
          <div className="mt-3 inline-block rounded-md border border-primary/30 bg-primary/10 px-4 py-2 font-mono-num text-lg font-bold text-primary">
            #{submitted.id.slice(-6).toUpperCase()}
          </div>
          <div className="mt-6">
            <Button onClick={() => downloadEventPasses(event, submitted)} size="lg" className="w-full shadow-glow">
              <Download className="mr-2 h-4 w-4" /> Download event passes (PDF)
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              One pass per player + a team master pass. Show at the gate.
            </p>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Need to contact the organizer? {event.contactName} {event.contactPhone && `• ${event.contactPhone}`}
          </p>
        </div>
      </div>
    );
  }

  function addPlayer() { setPlayers([...players, { name: "" }]); }
  function removePlayer(i: number) { setPlayers(players.filter((_, idx) => idx !== i)); }
  function updatePlayer(i: number, key: keyof Player, val: string) {
    setPlayers(players.map((p, idx) => idx === i ? { ...p, [key]: val } : p));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.teamName.trim() || !form.captainName.trim() || !form.captainPhone.trim()) {
      toast.error("Team, captain name and phone are required");
      return;
    }
    const validPlayers = players.filter((p) => p.name.trim());
    if (validPlayers.length === 0) {
      toast.error("Add at least one player");
      return;
    }
    const reg: TeamRegistration = {
      id: uid(),
      eventId,
      teamName: form.teamName.trim(),
      captainName: form.captainName.trim(),
      captainPhone: form.captainPhone.trim(),
      captainEmail: form.captainEmail.trim(),
      players: validPlayers,
      paymentProof: proof,
      paymentRef: form.paymentRef.trim() || undefined,
      notes: form.notes.trim() || undefined,
      status: "pending",
      checkedIn: false,
      submittedAt: new Date().toISOString(),
    };
    regsApi.upsert(reg);
    setSubmitted(reg);
    toast.success("Registration submitted!");
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="border-b border-border bg-gradient-pitch">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          {event.bannerUrl && (
            <div className="mb-6">
              <img 
                src={event.bannerUrl} 
                alt={`${event.name} banner`} 
                className="w-full h-48 sm:h-64 rounded-lg border border-border object-cover object-top"
              />
            </div>
          )}
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Powered by PitchPro
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-4xl">{event.type === "non-sport" ? "📋" : sportEmoji(event.sport)}</span>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              {event.type === "non-sport" ? "Event" : sportLabel(event.sport)}
            </span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{event.name}</h1>
          {event.description && <p className="mt-2 max-w-xl text-muted-foreground">{event.description}</p>}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{format(new Date(event.startDate), "PPP")}</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.venue}</span>
            {event.type !== "non-sport" && <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4" />Prize {fmtMoney(event.prizePool, event.currency)}</span>}
            {event.type !== "non-sport" && <span className="flex items-center gap-1.5"><Wallet className="h-4 w-4" />Entry {fmtMoney(event.entryFee, event.currency)}</span>}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {event.type === "non-sport" ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
            <h2 className="font-display text-2xl font-bold">No team registration needed</h2>
            <p className="mt-2 text-muted-foreground">This event doesn't require team registration. Get your tickets directly instead.</p>
            <Button asChild className="mt-6" size="lg">
              <Link to="/tickets/$eventId" params={{ eventId: event.id }}>
                <Sparkles className="mr-2 h-4 w-4" /> Get tickets
              </Link>
            </Button>
          </div>
        ) : closed ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-8 text-center">
            <h2 className="font-display text-2xl font-bold">Registration closed</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The deadline was {format(new Date(event.registrationDeadline), "PPP")}. Contact {event.contactName} for assistance.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-8">
            {/* Team */}
            <Section title="Team details">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Team name *">
                  <Input value={form.teamName} onChange={(e) => setForm({ ...form, teamName: e.target.value })} placeholder="FC North Stars" />
                </Field>
                <Field label="Captain name *">
                  <Input value={form.captainName} onChange={(e) => setForm({ ...form, captainName: e.target.value })} />
                </Field>
                <Field label="Captain phone *">
                  <Input value={form.captainPhone} onChange={(e) => setForm({ ...form, captainPhone: e.target.value })} placeholder="+47 ..." />
                </Field>
                <Field label="Captain email">
                  <Input type="email" value={form.captainEmail} onChange={(e) => setForm({ ...form, captainEmail: e.target.value })} />
                </Field>
              </div>
            </Section>

            {/* Players */}
            <Section title="Players">
              <div className="space-y-2">
                {players.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono-num text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <Input value={p.name} onChange={(e) => updatePlayer(i, "name", e.target.value)} placeholder="Player name" />
                    <Input className="w-24" value={p.jersey ?? ""} onChange={(e) => updatePlayer(i, "jersey", e.target.value)} placeholder="#" />
                    <Button type="button" size="icon" variant="ghost" onClick={() => removePlayer(i)} disabled={players.length <= 1}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addPlayer}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add player
                </Button>
              </div>
            </Section>

            {/* Payment */}
            <Section title="Payment">
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Pay {fmtMoney(event.entryFee, event.currency)} to:</p>
                {event.paymentInfo && (
                  <pre className="mt-1 whitespace-pre-wrap font-mono text-sm">{event.paymentInfo}</pre>
                )}
                {event.paymentQrDataUrl && (
                  <div className="mt-3 flex flex-col items-center gap-2">
                    <img src={event.paymentQrDataUrl} alt="Payment QR" className="h-44 w-44 rounded-lg border border-border bg-white object-contain p-2" />
                    <p className="text-xs text-muted-foreground">Scan to pay</p>
                  </div>
                )}
                {!event.paymentInfo && !event.paymentQrDataUrl && (
                  <p className="text-sm text-muted-foreground">Contact organizer for payment details.</p>
                )}
              </div>
              <div className="mt-4 grid gap-4">
                <Field label="Upload payment screenshot">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = () => setProof(r.result as string);
                      r.readAsDataURL(f);
                    }}
                  />
                  {proof && <img src={proof} alt="Proof" className="mt-2 h-24 rounded-md border border-border object-contain" />}
                </Field>
                <Field label="Transaction ID / reference (optional)">
                  <Input value={form.paymentRef} onChange={(e) => setForm({ ...form, paymentRef: e.target.value })} />
                </Field>
              </div>
            </Section>

            <Section title="Anything else?">
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Special requests, queries..." />
            </Section>

            <Button type="submit" size="lg" className="w-full shadow-glow">
              Submit registration
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="mb-4 font-display text-xl font-bold">{title}</h2>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
