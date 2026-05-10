import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { eventsApi, regsApi, type RegStatus } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, Eye, Users, Phone, Mail, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/app/registrations")({
  validateSearch: (s: Record<string, unknown>) => ({ event: (s.event as string) || "" }),
  component: RegistrationsPage,
});

function RegistrationsPage() {
  const search = Route.useSearch();
  const events = eventsApi.list();
  const [eventId, setEventId] = useState(search.event || "all");
  const [tab, setTab] = useState<RegStatus | "all">("pending");
  const [viewing, setViewing] = useState<string | null>(null);

  const allRegs = eventId === "all" ? regsApi.list() : regsApi.list(eventId);
  const filtered = tab === "all" ? allRegs : allRegs.filter((r) => r.status === tab);
  const counts = {
    pending: allRegs.filter((r) => r.status === "pending").length,
    approved: allRegs.filter((r) => r.status === "approved").length,
    rejected: allRegs.filter((r) => r.status === "rejected").length,
  };

  function setStatus(id: string, status: RegStatus) {
    const r = regsApi.get(id);
    if (!r) return;
    regsApi.upsert({ ...r, status });
    toast.success(status === "approved" ? "Team approved" : status === "rejected" ? "Team rejected" : "Updated");
  }

  function deleteRegistration(id: string) {
    const r = regsApi.get(id);
    if (!r) return;
    if (confirm(`Delete registration for "${r.teamName}"? This action cannot be undone.`)) {
      regsApi.remove(id);
      toast.success("Registration deleted");
    }
  }

  const viewReg = viewing ? regsApi.get(viewing) : null;
  const viewEvent = viewReg ? eventsApi.get(viewReg.eventId) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Registrations</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Review and approve team submissions.</p>
        </div>
        <Select value={eventId} onValueChange={setEventId}>
          <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as RegStatus)}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
          <TabsTrigger value="all">All ({allRegs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-6">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">No registrations to show.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-card md:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Team</th>
                      <th className="px-4 py-3">Captain</th>
                      <th className="px-4 py-3">Players</th>
                      <th className="px-4 py-3">Submitted</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const ev = eventsApi.get(r.eventId);
                      return (
                        <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="font-semibold">{r.teamName}</div>
                            <div className="text-xs text-muted-foreground">{ev?.name ?? "Deleted event"}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div>{r.captainName}</div>
                            <div className="text-xs text-muted-foreground">{r.captainPhone}</div>
                          </td>
                          <td className="px-4 py-3 font-mono-num">{r.players.length}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(r.submittedAt), "MMM d, HH:mm")}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => setViewing(r.id)} title="View"><Eye className="h-4 w-4" /></Button>
                              {r.status !== "approved" && (
                                <Button size="icon" variant="ghost" onClick={() => setStatus(r.id, "approved")} title="Approve">
                                  <Check className="h-4 w-4 text-success" />
                                </Button>
                              )}
                              {r.status !== "rejected" && (
                                <Button size="icon" variant="ghost" onClick={() => setStatus(r.id, "rejected")} title="Reject">
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                              {r.status === "rejected" && (
                                <Button size="icon" variant="ghost" onClick={() => deleteRegistration(r.id)} title="Delete">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {filtered.map((r) => {
                  const ev = eventsApi.get(r.eventId);
                  return (
                    <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="truncate font-display text-lg font-bold">{r.teamName}</div>
                            <StatusBadge status={r.status} />
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{ev?.name ?? "Deleted event"}</div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Captain</div>
                          <div className="truncate">{r.captainName}</div>
                          <div className="truncate text-muted-foreground">{r.captainPhone}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Players</div>
                          <div className="font-mono-num font-bold">{r.players.length}</div>
                          <div className="text-muted-foreground">{format(new Date(r.submittedAt), "MMM d, HH:mm")}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setViewing(r.id)}>
                          <Eye className="mr-1 h-3.5 w-3.5" /> View
                        </Button>
                        {r.status !== "approved" && (
                          <Button size="sm" onClick={() => setStatus(r.id, "approved")}>
                            <Check className="mr-1 h-3.5 w-3.5" /> Approve
                          </Button>
                        )}
                        {r.status !== "rejected" && (
                          <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "rejected")}>
                            <X className="mr-1 h-3.5 w-3.5" /> Reject
                          </Button>
                        )}
                        {r.status === "rejected" && (
                          <Button size="sm" variant="outline" onClick={() => deleteRegistration(r.id)}>
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          {viewReg && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{viewReg.teamName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Event</p>
                  <p>{viewEvent?.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Detail label="Captain" value={viewReg.captainName} />
                  <Detail label="Status" value={<StatusBadge status={viewReg.status} />} />
                  <Detail label="Phone" value={<a href={`tel:${viewReg.captainPhone}`} className="text-primary hover:underline">{viewReg.captainPhone}</a>} />
                  <Detail label="Email" value={viewReg.captainEmail || "—"} />
                  <Detail label="Submitted" value={format(new Date(viewReg.submittedAt), "PPP p")} />
                  <Detail label="Code" value={`#${viewReg.id.slice(-6).toUpperCase()}`} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Players ({viewReg.players.length})</p>
                  <ul className="mt-1 space-y-1">
                    {viewReg.players.map((p, i) => (
                      <li key={i} className="flex justify-between rounded-md bg-muted/40 px-3 py-1.5 text-sm">
                        <span>{i + 1}. {p.name}</span>
                        {p.jersey && <span className="font-mono-num text-primary">#{p.jersey}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                {viewReg.paymentRef && <Detail label="Payment ref" value={<span className="font-mono">{viewReg.paymentRef}</span>} />}
                {viewReg.paymentProof && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Payment proof</p>
                    <img src={viewReg.paymentProof} alt="Proof" className="mt-2 max-h-80 rounded-md border border-border" />
                  </div>
                )}
                {viewReg.notes && <Detail label="Notes" value={viewReg.notes} />}
                <div className="flex justify-between border-t border-border pt-4">
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm"><a href={`tel:${viewReg.captainPhone}`}><Phone className="mr-1 h-3.5 w-3.5" /> Call</a></Button>
                    {viewReg.captainEmail && <Button asChild variant="outline" size="sm"><a href={`mailto:${viewReg.captainEmail}`}><Mail className="mr-1 h-3.5 w-3.5" /> Email</a></Button>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setStatus(viewReg.id, "rejected"); setViewing(null); }}>Reject</Button>
                    <Button onClick={() => { setStatus(viewReg.id, "approved"); setViewing(null); }}>Approve</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: RegStatus }) {
  const styles = {
    pending: "bg-warning/20 text-warning",
    approved: "bg-success/20 text-success",
    rejected: "bg-destructive/20 text-destructive",
  }[status];
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${styles}`}>{status}</span>;
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}
