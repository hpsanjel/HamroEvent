import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { eventsApi, donationsApi, uid, type Donation } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fmtMoney, currencySymbol } from "@/lib/currency";

export const Route = createFileRoute("/app/donations")({
  validateSearch: (s: Record<string, unknown>) => ({ event: (s.event as string) || "" }),
  component: DonationsPage,
});

const empty = (eventId: string): Donation => ({
  id: uid(), eventId, donor: "", amount: 0, type: "cash", note: "", date: new Date().toISOString().slice(0, 10),
});

function DonationsPage() {
  const search = Route.useSearch();
  const events = eventsApi.list();
  const [eventId, setEventId] = useState(search.event || events[0]?.id || "");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Donation | null>(null);

  const event = eventId ? eventsApi.get(eventId) : undefined;
  const cur = event?.currency;
  const sym = currencySymbol(cur);

  const items = eventId ? donationsApi.list(eventId) : [];
  const total = items.reduce((s, d) => s + d.amount, 0);

  function startNew() {
    if (!eventId) { toast.error("Pick an event first"); return; }
    setEditing(empty(eventId));
    setOpen(true);
  }
  function save() {
    if (!editing) return;
    if (!editing.donor.trim()) { toast.error("Donor name required"); return; }
    donationsApi.upsert(editing);
    toast.success("Saved");
    setOpen(false);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Donations & sponsors</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Log every contribution.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Pick event" /></SelectTrigger>
            <SelectContent>{events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={startNew} className="w-full sm:w-auto"><Plus className="mr-1 h-4 w-4" /> Log donation</Button>
        </div>
      </div>

      <div className="rounded-3xl border border-accent/30 bg-gradient-broadcast p-6 shadow-pop sm:p-8">
        <div className="text-xs uppercase tracking-widest text-accent-foreground/80">Total raised</div>
        <div className="mt-1 break-words font-mono-num text-4xl font-bold text-accent-foreground sm:text-5xl">{fmtMoney(total, cur)}</div>
        <div className="mt-1 text-sm text-accent-foreground/80">From {items.length} contribution{items.length !== 1 && "s"}</div>
      </div>

      {!eventId ? (
        <Empty text="Select an event to view donations." />
      ) : items.length === 0 ? (
        <Empty text="No donations yet. Log one to get started." />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Donor</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Note</th><th /></tr>
              </thead>
              <tbody>
                {items.sort((a, b) => b.date.localeCompare(a.date)).map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(d.date), "MMM d")}</td>
                    <td className="px-4 py-3 font-semibold">{d.donor}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">{d.type}</span></td>
                    <td className="px-4 py-3 text-right font-mono-num font-bold text-success">+{fmtMoney(d.amount, cur)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{d.note}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="icon" variant="ghost" onClick={() => { donationsApi.remove(d.id); toast.success("Removed"); }}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-2 md:hidden">
            {items.sort((a, b) => b.date.localeCompare(a.date)).map((d) => (
              <div key={d.id} className="rounded-xl border border-border bg-card p-3 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{d.donor}</span>
                      <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-accent">{d.type}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{format(new Date(d.date), "MMM d, yyyy")}</div>
                    {d.note && <div className="mt-1 text-xs text-muted-foreground">{d.note}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-mono-num font-bold text-success">+{fmtMoney(d.amount, cur)}</div>
                    <Button size="icon" variant="ghost" onClick={() => { donationsApi.remove(d.id); toast.success("Removed"); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-md">
          {editing && (
            <>
              <DialogHeader><DialogTitle className="font-display text-2xl">Log donation</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div><Label>Donor / sponsor</Label><Input value={editing.donor} onChange={(e) => setEditing({ ...editing, donor: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Type</Label>
                    <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as Donation["type"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="kind">In-kind</SelectItem>
                        <SelectItem value="sponsorship">Sponsorship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Amount ({sym})</Label><Input type="number" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })} /></div>
                </div>
                <div><Label>Date</Label><Input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></div>
                <div><Label>Note</Label><Input value={editing.note ?? ""} onChange={(e) => setEditing({ ...editing, note: e.target.value })} /></div>
              </div>
              <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save}>Save</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">{text}</div>;
}
