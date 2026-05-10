import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { eventsApi, ticketsApi, ordersApi, uid, type TicketType, type TicketOrder } from "@/lib/store";
import { useStoreSignal } from "@/hooks/use-store";
import { fmtMoney, currencySymbol } from "@/lib/currency";
import { downloadTicketPdf } from "@/lib/ticket-pass";
import { ImageZoom } from "@/components/image-zoom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { QRCodeCanvas } from "qrcode.react";
import { Plus, Pencil, Trash2, Ticket, Share2, Download, Check, X, Copy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/app/tickets")({
  validateSearch: (s: Record<string, unknown>) => ({ event: (s.event as string) || "" }),
  component: TicketsPage,
});

const emptyTicket = (eventId: string): TicketType => ({
  id: uid(), eventId, name: "", description: "",
  price: 0, quantity: -1, sortOrder: 0, createdAt: new Date().toISOString(),
});

function TicketsPage() {
  useStoreSignal();
  const search = Route.useSearch();
  const events = eventsApi.list();
  const [eventId, setEventId] = useState(search.event || events[0]?.id || "");
  const event = eventsApi.get(eventId);
  const tickets = event ? ticketsApi.list(eventId) : [];
  const orders = event ? ordersApi.list(eventId) : [];

  const [editing, setEditing] = useState<TicketType | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const sold = useMemo(() => {
    const m = new Map<string, number>();
    tickets.forEach((t) => m.set(t.id, ordersApi.countSold(t.id)));
    return m;
  }, [tickets, orders.length]);

  const totalRevenue = orders.filter((o) => o.status === "approved").reduce((s, o) => s + o.total, 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  function saveTicket(t: TicketType) {
    if (!t.name.trim()) { toast.error("Name required"); return; }
    ticketsApi.upsert(t);
    setEditing(null);
    toast.success("Saved");
  }

  function setOrderStatus(o: TicketOrder, status: "approved" | "rejected") {
    ordersApi.upsert({ ...o, status });
    toast.success(`Order ${status}`);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Tickets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sell entry passes to the public. Approve payment proofs and issue digital tickets.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Pick an event" /></SelectTrigger>
            <SelectContent>{events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
          {event && (
            <>
              <Button variant="outline" onClick={() => setShareOpen(true)}><Share2 className="mr-1 h-4 w-4" /> Share ticket page</Button>
              <Button onClick={() => setEditing(emptyTicket(eventId))}><Plus className="mr-1 h-4 w-4" /> New ticket type</Button>
            </>
          )}
        </div>
      </div>

      {!event ? (
        <Empty text="Select an event." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Ticket types" value={tickets.length} />
            <Stat label="Pending approval" value={pendingCount} accent="text-warning" />
            <Stat label="Approved revenue" value={fmtMoney(totalRevenue, event.currency)} accent="text-success" />
          </div>

          <section>
            <h2 className="mb-3 font-display text-xl font-bold">Ticket types</h2>
            {tickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
                <Ticket className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 font-display text-lg font-semibold">No tickets yet</p>
                <p className="text-sm text-muted-foreground">Create a free or paid ticket type to start selling.</p>
                <Button className="mt-4" onClick={() => setEditing(emptyTicket(eventId))}>
                  <Plus className="mr-1 h-4 w-4" /> Create first ticket
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {tickets.map((t) => {
                  const s = sold.get(t.id) ?? 0;
                  const remaining = t.quantity < 0 ? "∞" : Math.max(0, t.quantity - s);
                  return (
                    <div key={t.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-display text-lg font-bold">{t.name}</div>
                          {t.description && <div className="mt-0.5 text-xs text-muted-foreground">{t.description}</div>}
                        </div>
                        <div className="text-right">
                          <div className="font-mono-num text-2xl font-bold text-primary">
                            {t.price === 0 ? "FREE" : fmtMoney(t.price, event.currency)}
                          </div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s} sold • {remaining} left</div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          if (confirm(`Delete "${t.name}"?`)) { ticketsApi.remove(t.id); toast.success("Deleted"); }
                        }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-bold">Orders</h2>
            {orders.length === 0 ? (
              <Empty text="No orders yet. Share the ticket link to start selling." />
            ) : (
              <div className="space-y-2">
                {orders.map((o) => {
                  const t = tickets.find((x) => x.id === o.ticketId);
                  return (
                    <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{o.buyerName}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                            o.status === "approved" ? "bg-success/20 text-success" :
                            o.status === "rejected" ? "bg-destructive/20 text-destructive" :
                            "bg-warning/20 text-warning"
                          }`}>{o.status}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t?.name ?? "—"} × {o.quantity} • {fmtMoney(o.total, event.currency)} • {format(new Date(o.submittedAt), "PP p")}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{o.buyerEmail} {o.buyerPhone && `• ${o.buyerPhone}`} {o.paymentRef && `• Ref: ${o.paymentRef}`}</div>
                      </div>
                      {o.paymentProof && (
                        <ImageZoom src={o.paymentProof} alt="Payment proof" thumbClassName="h-20 w-20" />
                      )}
                      <div className="flex gap-1">
                        {o.status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => setOrderStatus(o, "approved")}><Check className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="outline" onClick={() => setOrderStatus(o, "rejected")}><X className="h-3.5 w-3.5" /></Button>
                          </>
                        )}
                        {o.status === "approved" && t && (
                          <Button size="sm" variant="outline" onClick={() => downloadTicketPdf(event, t, o)}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {editing && event && (
        <TicketEditor t={editing} currency={event.currency} onClose={() => setEditing(null)} onSave={saveTicket} />
      )}
      {shareOpen && event && (
        <TicketShare event={event} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}

function TicketEditor({ t, currency, onClose, onSave }: { t: TicketType; currency?: string; onClose: () => void; onSave: (t: TicketType) => void }) {
  const [draft, setDraft] = useState(t);
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t.name ? "Edit ticket" : "New ticket type"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="General Admission" /></div>
          <div><Label>Description</Label><Textarea rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="What's included" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Price ({currencySymbol(currency)})</Label>
              <Input type="number" min={0} value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
              <p className="mt-1 text-[11px] text-muted-foreground">Set 0 for free tickets</p>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: Number(e.target.value) })} />
              <p className="mt-1 text-[11px] text-muted-foreground">Use -1 for unlimited</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(draft)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TicketShare({ event, onClose }: { event: any; onClose: () => void }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/tickets/${event.id}` : "";
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Share ticket page</DialogTitle></DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-2xl bg-white p-4"><QRCodeCanvas value={url} size={200} level="H" fgColor="#1a1f33" /></div>
          <div className="flex w-full items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs">
            <span className="block min-w-0 flex-1 truncate font-mono">{url}</span>
            <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5 text-primary" /></button>
          </div>
          <Button asChild className="w-full"><a href={url} target="_blank" rel="noreferrer">Open public page</a></Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, accent = "text-primary" }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-2 font-mono-num text-3xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">{text}</div>;
}
