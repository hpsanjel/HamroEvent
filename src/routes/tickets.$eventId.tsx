import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { eventsApi, ticketsApi, ordersApi, uid, type TicketType, type TicketOrder } from "@/lib/store";
import { useHydrated, useStoreSignal } from "@/hooks/use-store";
import { fmtMoney } from "@/lib/currency";
import { sportEmoji, sportLabel } from "@/lib/sports";
import { downloadTicketPdf } from "@/lib/ticket-pass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Trophy, Sparkles, CheckCircle2, Download, Minus, Plus, Ticket } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/tickets/$eventId")({ component: PublicTickets });

function PublicTickets() {
  useStoreSignal();
  const ready = useHydrated();
  const { eventId } = Route.useParams();
  const event = eventsApi.get(eventId);
  const tickets = event ? ticketsApi.list(eventId) : [];
  const [selected, setSelected] = useState<TicketType | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const submitted = submittedId ? ordersApi.get(submittedId) ?? null : null;

  // Poll for order status updates when waiting for approval
  useEffect(() => {
    if (!submittedId || submitted?.status !== "pending") return;

    const interval = setInterval(() => {
      const updatedOrder = ordersApi.get(submittedId);
      if (updatedOrder && updatedOrder.status !== "pending") {
        // Order status changed, trigger re-render
        setSubmittedId(submittedId); // This will trigger the component to update
        toast.success(updatedOrder.status === "approved" ? "Payment approved! Your ticket is ready." : "Order status updated");
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [submittedId, submitted?.status]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl font-bold">Event not found</h1>
          <Button asChild className="mt-4"><Link to="/">Visit PitchPro</Link></Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    const t = tickets.find((x) => x.id === submitted.ticketId);
    const isFree = submitted.total === 0;
    const isApproved = submitted.status === "approved";
    return (
      <div className="min-h-screen px-4 py-12">
        <div className={`mx-auto max-w-lg rounded-3xl border bg-card p-8 text-center shadow-pop ${isApproved ? "border-success/40" : "border-warning/40"}`}>
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${isApproved ? "bg-success/20" : "bg-warning/20"}`}>
            <CheckCircle2 className={`h-9 w-9 ${isApproved ? "text-success" : "text-warning"}`} />
          </div>
          <h1 className="mt-5 font-display text-3xl font-bold">
            {isFree ? "You're in!" : isApproved ? "Ticket confirmed!" : "Order received!"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {submitted.quantity} × {t?.name} for <span className="font-semibold text-foreground">{event.name}</span>
          </p>
          <div className="mt-3 inline-block rounded-md border border-primary/30 bg-primary/10 px-4 py-2 font-mono-num text-lg font-bold text-primary">
            #{submitted.id.slice(-8).toUpperCase()}
          </div>
          {isApproved ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {isFree ? "Your free ticket is confirmed. Download your pass below." : "Payment approved. Your ticket with QR is ready to download."}
            </p>
          ) : (
            <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-4 text-left text-sm">
              <p className="font-semibold text-warning">Payment verification in progress</p>
              <p className="mt-1 text-muted-foreground">
                <span className="font-medium text-foreground">{event.contactName || "The organizer"}</span> will verify your payment proof shortly. Your ticket will be issued automatically once approved.
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-warning"></div>
                  <span className="text-xs text-muted-foreground">Save your order code: <span className="font-mono font-bold text-foreground">#{submitted.id.slice(-8).toUpperCase()}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-warning"></div>
                  <span className="text-xs text-muted-foreground">Check status anytime at <a href="/lookup" className="text-primary underline hover:no-underline">pitchpro.com/lookup</a></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-warning"></div>
                  <span className="text-xs text-muted-foreground">No need to keep this page open</span>
                </div>
              </div>
              {event.contactPhone && (
                <p className="mt-3 text-xs text-muted-foreground">Questions? Contact organizer: <a href={`tel:${event.contactPhone}`} className="text-primary underline">{event.contactPhone}</a></p>
              )}
            </div>
          )}
          {isApproved && t && (
            <Button onClick={() => downloadTicketPdf(event, t, submitted)} size="lg" className="mt-5 w-full shadow-glow">
              <Download className="mr-2 h-4 w-4" /> Download ticket (PDF with QR)
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
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
            <span className="text-4xl">{sportEmoji(event.sport)}</span>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              {sportLabel(event.sport)}
            </span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{event.name}</h1>
          {event.description && <p className="mt-2 max-w-xl text-muted-foreground">{event.description}</p>}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{format(new Date(event.startDate), "PPP")}</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.venue}</span>
            <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4" />Prize {fmtMoney(event.prizePool, event.currency)}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {tickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
            <Ticket className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-display text-lg font-semibold">No tickets available yet</p>
            <p className="text-sm text-muted-foreground">Check back later or contact {event.contactName}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="font-display text-2xl font-bold">Pick your ticket</h2>
            {tickets.map((t) => {
              const sold = ordersApi.countSold(t.id);
              const remaining = t.quantity < 0 ? Infinity : Math.max(0, t.quantity - sold);
              const soldOut = remaining === 0;
              return (
                <button
                  key={t.id}
                  disabled={soldOut}
                  onClick={() => setSelected(t)}
                  className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-5 text-left shadow-card transition hover:border-primary/50 disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <div className="font-display text-lg font-bold">{t.name}</div>
                    {t.description && <div className="mt-0.5 text-xs text-muted-foreground">{t.description}</div>}
                    <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                      {soldOut ? "Sold out" : t.quantity < 0 ? "Available" : `${remaining} left`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono-num text-2xl font-bold text-primary">
                      {t.price === 0 ? "FREE" : fmtMoney(t.price, event.currency)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <BuyDialog
          event={event}
          ticket={selected}
          onClose={() => setSelected(null)}
          onDone={(o) => { setSelected(null); setSubmittedId(o.id); }}
        />
      )}
    </div>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

function BuyDialog({ event, ticket, onClose, onDone }: { event: any; ticket: TicketType; onClose: () => void; onDone: (o: TicketOrder) => void }) {
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ buyerName: "", buyerEmail: "", buyerPhone: "", paymentRef: "", notes: "" });
  const [proof, setProof] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const sold = ordersApi.countSold(ticket.id);
  const remaining = ticket.quantity < 0 ? 99 : Math.max(0, ticket.quantity - sold);
  const total = qty * ticket.price;
  const isFree = ticket.price === 0;

  async function uploadProof(file: File): Promise<string | undefined> {
    try {
      const path = `${event.id}/${Date.now()}-${file.name.replace(/[^a-z0-9._-]+/gi, "_")}`;
      const { error } = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("payment-proofs").getPublicUrl(path);
      return data.publicUrl;
    } catch (e: any) {
      // Fall back to data URL so the order still goes through
      return await new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(file);
      });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.buyerName.trim()) { toast.error("Name required"); return; }
    if (!isFree && !proof && !form.paymentRef.trim()) {
      toast.error("Upload proof or enter payment reference");
      return;
    }
    setBusy(true);
    const order: TicketOrder = {
      id: uid(),
      eventId: event.id,
      ticketId: ticket.id,
      buyerName: form.buyerName.trim(),
      buyerEmail: form.buyerEmail.trim(),
      buyerPhone: form.buyerPhone.trim(),
      quantity: qty,
      total,
      paymentProof: proof,
      paymentRef: form.paymentRef.trim() || undefined,
      notes: form.notes.trim() || undefined,
      status: isFree ? "approved" : "pending",
      checkedIn: false,
      submittedAt: new Date().toISOString(),
    };
    ordersApi.upsert(order);
    setBusy(false);
    onDone(order);
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto p-0">
        <div className="sticky top-0 z-10 border-b border-border bg-background px-6 py-4">
          <DialogHeader><DialogTitle>{ticket.name}</DialogTitle></DialogHeader>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4 p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3">
              <span className="text-sm">Quantity</span>
              <div className="flex items-center gap-2">
                <Button type="button" size="icon" variant="outline" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-3.5 w-3.5" /></Button>
                <span className="w-8 text-center font-mono-num font-bold">{qty}</span>
                <Button type="button" size="icon" variant="outline" onClick={() => setQty(Math.min(remaining, qty + 1))}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-mono-num text-2xl font-bold text-primary">{isFree ? "FREE" : fmtMoney(total, event.currency)}</span>
            </div>
            <div><Label>Full name *</Label><Input value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.buyerEmail} onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.buyerPhone} onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })} /></div>
            <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

            {!isFree ? (
              <>
                {(event.paymentInfo || event.paymentQrDataUrl) && (
                  <div className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Pay {fmtMoney(total, event.currency)} to:</p>
                    {event.paymentInfo && <pre className="mt-1 whitespace-pre-wrap font-mono text-xs">{event.paymentInfo}</pre>}
                    {event.paymentQrDataUrl && <img src={event.paymentQrDataUrl} alt="QR" className="mt-2 h-32 w-32 rounded-md border border-border bg-white object-contain p-1" />}
                  </div>
                )}
                <div>
                  <Label>Upload payment screenshot</Label>
                  <Input type="file" accept="image/*" onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const url = await uploadProof(f); setProof(url);
                  }} />
                  {proof && <img src={proof} alt="proof" className="mt-2 h-32 w-full rounded-md border border-border object-contain" />}
                </div>
                <div><Label>Transaction ref (optional)</Label><Input value={form.paymentRef} onChange={(e) => setForm({ ...form, paymentRef: e.target.value })} /></div>
                <p className="rounded-md border border-warning/30 bg-warning/10 p-2 text-[11px] text-muted-foreground">
                  Your QR ticket will be issued after the organizer verifies your payment. You'll receive an order code to check status anytime at pitchpro.com/lookup
                </p>
              </>
            ) : (
              <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
                <p className="font-semibold text-success">Free ticket</p>
                <p className="mt-1 text-muted-foreground">Your QR pass is issued instantly after submitting.</p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>{isFree ? "Get free ticket" : "Submit order"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
