import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { eventsApi, budgetApi, uid, type BudgetItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fmtMoney, currencySymbol } from "@/lib/currency";

export const Route = createFileRoute("/app/budget")({
  validateSearch: (s: Record<string, unknown>) => ({ event: (s.event as string) || "" }),
  component: BudgetPage,
});

const INCOME_CATEGORIES = [
  "Entry fees",
  "Sponsorship",
  "Ticket sales",
  "Merchandise",
  "Other",
];

const EXPENSE_CATEGORIES = [
  "Venue rental",
  "Trophies & medals",
  "Referee fees",
  "Equipment",
  "Marketing",
  "Food & beverages",
  "Transport",
  "Medical & first-aid",
  "Security",
  "Volunteer stipends",
  "Photography / Videography",
  "Printing",
  "Other",
];

const empty = (eventId: string): BudgetItem => ({
  id: uid(), eventId, type: "expense", category: "", amount: 0, note: "", date: new Date().toISOString().slice(0, 10),
});

function BudgetPage() {
  const search = Route.useSearch();
  const events = eventsApi.list();
  const [eventId, setEventId] = useState(search.event || events[0]?.id || "");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [categoryChoice, setCategoryChoice] = useState<string>("");

  const event = eventId ? eventsApi.get(eventId) : undefined;
  const cur = event?.currency;
  const sym = currencySymbol(cur);

  const items = eventId ? budgetApi.list(eventId) : [];
  const visible = filterCat === "all" ? items : items.filter((i) => i.category === filterCat);
  const income = items.filter((i) => i.type === "income").reduce((s, i) => s + i.amount, 0);
  const expense = items.filter((i) => i.type === "expense").reduce((s, i) => s + i.amount, 0);
  const net = income - expense;

  const allCats = Array.from(new Set(items.map((i) => i.category))).filter(Boolean).sort();

  function startNew() {
    if (!eventId) { toast.error("Pick an event first"); return; }
    setEditing(empty(eventId));
    setCategoryChoice("");
    setOpen(true);
  }

  function save() {
    if (!editing) return;
    const finalCat = categoryChoice === "Other" || !categoryChoice
      ? editing.category.trim()
      : categoryChoice;
    if (!finalCat) { toast.error("Category required"); return; }
    budgetApi.upsert({ ...editing, category: finalCat });
    toast.success("Saved");
    setOpen(false);
  }

  const presetList = editing?.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Budget</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Track income, expenses and net balance.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Pick event" /></SelectTrigger>
            <SelectContent>{events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={startNew} className="w-full sm:w-auto"><Plus className="mr-1 h-4 w-4" /> Add entry</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={TrendingUp} label="Income" value={fmtMoney(income, cur)} accent="text-success" />
        <Stat icon={TrendingDown} label="Expense" value={fmtMoney(expense, cur)} accent="text-destructive" />
        <Stat icon={Wallet} label="Net" value={fmtMoney(net, cur)} accent={net >= 0 ? "text-primary" : "text-destructive"} />
      </div>

      {eventId && items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">Filter by category</Label>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {allCats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {!eventId ? (
        <Empty text="Select an event to manage its budget." />
      ) : visible.length === 0 ? (
        <Empty text={items.length === 0 ? "No entries yet. Add your first one." : "No entries match this filter."} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Note</th><th /></tr>
              </thead>
              <tbody>
                {visible.sort((a, b) => b.date.localeCompare(a.date)).map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(i.date), "MMM d")}</td>
                    <td className="px-4 py-3 font-semibold">{i.category}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${i.type === "income" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>{i.type}</span></td>
                    <td className={`px-4 py-3 text-right font-mono-num font-bold ${i.type === "income" ? "text-success" : "text-destructive"}`}>{i.type === "income" ? "+" : "-"}{fmtMoney(i.amount, cur)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{i.note}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="icon" variant="ghost" onClick={() => { budgetApi.remove(i.id); toast.success("Removed"); }}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {visible.sort((a, b) => b.date.localeCompare(a.date)).map((i) => (
              <div key={i.id} className="rounded-xl border border-border bg-card p-3 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{i.category}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${i.type === "income" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>{i.type}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{format(new Date(i.date), "MMM d, yyyy")}</div>
                    {i.note && <div className="mt-1 text-xs text-muted-foreground">{i.note}</div>}
                  </div>
                  <div className="text-right">
                    <div className={`font-mono-num font-bold ${i.type === "income" ? "text-success" : "text-destructive"}`}>{i.type === "income" ? "+" : "-"}{fmtMoney(i.amount, cur)}</div>
                    <Button size="icon" variant="ghost" onClick={() => { budgetApi.remove(i.id); toast.success("Removed"); }}><Trash2 className="h-4 w-4" /></Button>
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
              <DialogHeader><DialogTitle className="font-display text-2xl">Add entry</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Type</Label>
                    <Select value={editing.type} onValueChange={(v) => { setEditing({ ...editing, type: v as "income" | "expense", category: "" }); setCategoryChoice(""); }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Date</Label><Input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={categoryChoice} onValueChange={(v) => {
                    setCategoryChoice(v);
                    if (v !== "Other") setEditing({ ...editing, category: v });
                    else setEditing({ ...editing, category: "" });
                  }}>
                    <SelectTrigger><SelectValue placeholder="Pick a category" /></SelectTrigger>
                    <SelectContent>
                      {presetList.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {categoryChoice === "Other" && (
                    <Input
                      className="mt-2"
                      autoFocus
                      placeholder="Describe the category..."
                      value={editing.category}
                      onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    />
                  )}
                </div>
                <div><Label>Amount ({sym})</Label><Input type="number" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })} /></div>
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

function Stat({ icon: Icon, label, value, accent }: { icon: typeof Wallet; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div className={`mt-2 font-mono-num text-3xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">{text}</div>;
}
