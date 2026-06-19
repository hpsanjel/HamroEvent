import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { eventsApi, regsApi, ordersApi, ticketsApi } from "@/lib/store";
import { useStoreSignal } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QrScanner } from "@/components/qr-scanner";
import { ScanLine, Search, CheckCircle2, Users, Undo2, Ticket, Camera } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/checkin")({
  validateSearch: (s: Record<string, unknown>) => ({ event: (s.event as string) || "" }),
  component: CheckinPage,
});

function CheckinPage() {
  useStoreSignal();
  const search = Route.useSearch();
  const events = eventsApi.list();
  const [eventId, setEventId] = useState(search.event || events[0]?.id || "");
  const [q, setQ] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);

  const teams = eventId ? regsApi.list(eventId).filter((r) => r.status === "approved") : [];
  const ticketOrders = eventId ? ordersApi.list(eventId).filter((o) => o.status === "approved") : [];
  const tickets = eventId ? ticketsApi.list(eventId) : [];
  const filtered = teams.filter((t) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      t.teamName.toLowerCase().includes(s) ||
      t.captainName.toLowerCase().includes(s) ||
      t.captainPhone.includes(s) ||
      t.id.toLowerCase().endsWith(s.toLowerCase()) ||
      t.players.some((p) => p.name.toLowerCase().includes(s))
    );
  });
  const checked = teams.filter((t) => t.checkedIn).length;
  const ticketsChecked = ticketOrders.filter((o) => o.checkedIn).length;

  function toggle(id: string) {
    const t = regsApi.get(id);
    if (!t) return;
    regsApi.upsert({ ...t, checkedIn: !t.checkedIn });
    toast.success(!t.checkedIn ? `${t.teamName} checked in ✓` : `${t.teamName} undone`);
  }

  const handleScan = useCallback((text: string) => {
    console.log('[CheckinPage] handleScan called with:', text);
    if (lastScan === text) {
      console.log('[CheckinPage] Duplicate scan detected, ignoring');
      return;
    }
    setLastScan(text);
    setTimeout(() => setLastScan(null), 2500);

    // Try to parse as URL first (new format), fallback to JSON (legacy)
    let type: string | null = null;
    let id: string | null = null;
    let playerIdx: number | undefined;

    try {
      const url = new URL(text);
      const parts = url.pathname.split("/").filter(Boolean);
      // /verify/{type}/{id} or /verify/{type}/{id}/{playerIdx}
      if (parts[0] === "verify" && parts.length >= 3) {
        type = parts[1];
        id = parts[2];
        if (parts.length >= 4) playerIdx = parseInt(parts[3], 10);
      }
    } catch {
      // Not a URL, try JSON
      try {
        const data = JSON.parse(text);
        type = data.t;
        id = data.id;
        playerIdx = data.p;
      } catch {
        return toast.error("Invalid QR code");
      }
    }

    if (!type || !id) return toast.error("Invalid QR code");

    console.log('[CheckinPage] Parsed QR - type:', type, 'id:', id, 'playerIdx:', playerIdx);
    if (type === "ticket") {
      const o = ordersApi.get(id);
      if (!o) return toast.error("Ticket not found");
      if (o.status !== "approved") return toast.error("Ticket not approved");
      if (o.checkedIn) return toast.message(`${o.buyerName} already checked in`);
      ordersApi.upsert({ ...o, checkedIn: true });
      toast.success(`✓ ${o.buyerName} (ticket) checked in`);
    } else if (type === "team" || type === "player") {
      const r = regsApi.get(id);
      if (!r) return toast.error("Team not found");
      if (r.status !== "approved") return toast.error("Team not approved");
      if (r.checkedIn) return toast.message(`${r.teamName} already checked in`);
      regsApi.upsert({ ...r, checkedIn: true });
      const who = type === "player" ? `Player: ${r.players[playerIdx ?? -1]?.name ?? "?"}` : "Team";
      toast.success(`✓ ${r.teamName} (${who}) checked in`);
    } else {
      toast.error("Unknown QR");
    }
  }, [lastScan]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Event-day check-in</h1>
          <p className="mt-1 text-muted-foreground">Verify approved teams and players at the gate.</p>
        </div>
        <Select value={eventId} onValueChange={setEventId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Pick event" /></SelectTrigger>
          <SelectContent>{events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Approved teams" value={teams.length} />
        <Stat label="Teams in" value={`${checked}/${teams.length}`} accent="text-success" />
        <Stat label="Tickets sold" value={ticketOrders.length} />
        <Stat label="Tickets in" value={`${ticketsChecked}/${ticketOrders.length}`} accent="text-success" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team, captain, phone, player or code..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
          <Button size="sm" variant={scanOpen ? "default" : "outline"} onClick={() => setScanOpen(!scanOpen)}>
            <Camera className="mr-1 h-3.5 w-3.5" /> {scanOpen ? "Stop scan" : "Scan QR"}
          </Button>
        </div>
        {scanOpen && (
          <div className="mt-3"><QrScanner onScan={handleScan} /></div>
        )}
      </div>

      {!eventId ? (
        <Empty text="Select an event to start check-in." />
      ) : (
        <Tabs defaultValue="teams">
          <TabsList>
            <TabsTrigger value="teams"><Users className="mr-1 h-3.5 w-3.5" /> Teams ({teams.length})</TabsTrigger>
            <TabsTrigger value="tickets"><Ticket className="mr-1 h-3.5 w-3.5" /> Tickets ({ticketOrders.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="teams" className="mt-4">
            {teams.length === 0 ? (
              <Empty text="No approved teams yet." />
            ) : (
              <div className="space-y-2">
                {filtered.map((t) => (
                  <div key={t.id} className={`flex items-center gap-4 rounded-2xl border p-4 shadow-card transition ${t.checkedIn ? "border-success/40 bg-success/5" : "border-border bg-card hover:border-primary/40"}`}>
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${t.checkedIn ? "bg-success/20" : "bg-primary/10"}`}>
                      {t.checkedIn ? <CheckCircle2 className="h-6 w-6 text-success" /> : <Users className="h-6 w-6 text-primary" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg font-bold">{t.teamName}</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">#{t.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{t.captainName} · {t.captainPhone} · {t.players.length} players</div>
                    </div>
                    <Button variant={t.checkedIn ? "outline" : "default"} onClick={() => toggle(t.id)}>
                      {t.checkedIn ? <><Undo2 className="mr-1 h-4 w-4" /> Undo</> : <>Check in</>}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="tickets" className="mt-4">
            {ticketOrders.length === 0 ? (
              <Empty text="No approved tickets yet." />
            ) : (
              <div className="space-y-2">
                {ticketOrders.map((o) => {
                  const tk = tickets.find((x) => x.id === o.ticketId);
                  return (
                    <div key={o.id} className={`flex items-center gap-4 rounded-2xl border p-4 shadow-card ${o.checkedIn ? "border-success/40 bg-success/5" : "border-border bg-card"}`}>
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${o.checkedIn ? "bg-success/20" : "bg-primary/10"}`}>
                        {o.checkedIn ? <CheckCircle2 className="h-6 w-6 text-success" /> : <Ticket className="h-6 w-6 text-primary" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-lg font-bold">{o.buyerName}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">#{o.id.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{tk?.name ?? "—"} × {o.quantity} · {o.buyerPhone || o.buyerEmail}</div>
                      </div>
                      <Button variant={o.checkedIn ? "outline" : "default"} onClick={() => ordersApi.upsert({ ...o, checkedIn: !o.checkedIn })}>
                        {o.checkedIn ? <><Undo2 className="mr-1 h-4 w-4" /> Undo</> : <>Check in</>}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function Stat({ label, value, accent = "text-foreground" }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono-num text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">{text}</div>;
}
