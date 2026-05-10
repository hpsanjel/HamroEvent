import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { eventsApi, regsApi, type SportsEvent, type EventStatus, uid } from "@/lib/store";
import { useStoreSignal } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SPORTS, sportEmoji } from "@/lib/sports";
import { CURRENCIES, currencySymbol } from "@/lib/currency";
import { Plus, Pencil, Trash2, Share2, Calendar, MapPin, Trophy, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ShareDialog } from "@/components/share-dialog";
import { uploadEventBanner, deleteEventBanner, deleteEventBannerByUrl, validateImageFile, ImageUploadError } from "@/lib/image-upload";

export const Route = createFileRoute("/app/events/")({
  validateSearch: (s: Record<string, unknown>) => ({ new: s.new === "1" || s.new === 1 ? "1" : undefined }),
  component: EventsList,
});

const empty = (): SportsEvent => ({
  id: uid(),
  name: "",
  sport: "football",
  description: "",
  venue: "",
  startDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
  endDate: new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 16),
  registrationDeadline: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 16),
  maxTeams: 16,
  entryFee: 500,
  prizePool: 10000,
  paymentInfo: "",
  currency: "NOK",
  contactName: "",
  contactPhone: "",
  status: "draft",
  createdAt: new Date().toISOString(),
});

function EventsList() {
  useStoreSignal();
  const events = eventsApi.list();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SportsEvent | null>(null);
  const [shareEvent, setShareEvent] = useState<SportsEvent | null>(null);

  function startEdit(e?: SportsEvent) {
    setEditing(e ? { ...e } : empty());
    setOpen(true);
  }

  // Auto-open create form when ?new=1 in URL (used by dashboard "New event" button)
  useEffect(() => {
    if (search.new === "1") {
      startEdit();
      navigate({ to: "/app/events", search: { new: undefined }, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.new]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Create, publish and run your tournaments.</p>
        </div>
        <Button onClick={() => startEdit()} className="shrink-0">
          <Plus className="mr-1 h-4 w-4" /> New event
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-3 font-display text-xl font-semibold">No events yet</p>
          <p className="text-sm text-muted-foreground">Spin up your first tournament.</p>
          <Button className="mt-4" onClick={() => startEdit()}>
            <Plus className="mr-1 h-4 w-4" /> Create event
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((e) => {
            const teamCount = regsApi.list(e.id).filter((r) => r.status === "approved").length;
            return (
              <div key={e.id} className="group flex flex-col rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                <div className="bg-gradient-pitch p-5">
                  <div className="flex items-start justify-between">
                    <div className="text-3xl">{sportEmoji(e.sport)}</div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      e.status === "live" ? "bg-destructive/20 text-destructive" :
                      e.status === "published" ? "bg-primary/20 text-primary" :
                      e.status === "completed" ? "bg-success/20 text-success" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {e.status}
                    </span>
                  </div>
                  <Link to="/app/events/$eventId" params={{ eventId: e.id }}>
                    <h3 className="mt-3 font-display text-xl font-bold hover:text-primary transition">{e.name}</h3>
                  </Link>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{format(new Date(e.startDate), "MMM d, yyyy")}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{e.venue || "TBD"}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border px-5 py-3">
                  <div className="text-sm">
                    <span className="font-mono-num font-bold text-primary">{teamCount}</span>
                    <span className="text-muted-foreground"> / {e.maxTeams} teams</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setShareEvent(e)} title="Share">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => startEdit(e)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Delete"
                      onClick={() => {
                        if (confirm(`Delete "${e.name}" and all its data?`)) {
                          eventsApi.remove(e.id);
                          toast.success("Event deleted");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EventForm open={open} setOpen={setOpen} editing={editing} setEditing={setEditing} />
      {shareEvent && <ShareDialog event={shareEvent} onClose={() => setShareEvent(null)} />}
    </div>
  );
}

function EventForm({
  open, setOpen, editing, setEditing,
}: {
  open: boolean;
  setOpen: (b: boolean) => void;
  editing: SportsEvent | null;
  setEditing: (e: SportsEvent | null) => void;
}) {
  const [formData, setFormData] = useState<SportsEvent | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(editing);
    setBannerError(null);
  }, [editing]);

  
  // Local form setter to prevent parent re-renders on every keystroke
  const set = <K extends keyof SportsEvent>(k: K, v: SportsEvent[K]) => {
    if (formData) {
      setFormData({ ...formData, [k]: v });
    }
  };
  
  function save() {
    if (!formData || !formData.name.trim()) {
      toast.error("Event name is required");
      return;
    }
    eventsApi.upsert(formData);
    toast.success("Event saved");
    setOpen(false);
  }
  
  if (!formData) return null;
  const sym = currencySymbol(formData.currency);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {eventsApi.get(formData.id) ? "Edit event" : "Create event"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label>Event name *</Label>
            <Input value={formData.name} onChange={(e) => set("name", e.target.value)} placeholder="Summer Football Cup 2026" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Sport</Label>
              <Select value={formData.sport} onValueChange={(v) => set("sport", v as SportsEvent["sport"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPORTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.emoji} {s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => set("status", v as EventStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={3} value={formData.description} onChange={(e) => set("description", e.target.value)} placeholder="Open tournament for all clubs..." />
          </div>
          <div>
            <Label>Venue</Label>
            <Input value={formData.venue} onChange={(e) => set("venue", e.target.value)} placeholder="City Stadium, Sector 21" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Start</Label>
              <Input type="datetime-local" value={formData.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div>
              <Label>End</Label>
              <Input type="datetime-local" value={formData.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Registration deadline</Label>
            <Input type="datetime-local" value={formData.registrationDeadline} onChange={(e) => set("registrationDeadline", e.target.value)} />
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={formData.currency || "NOK"} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label>Max teams</Label>
              <Input type="number" value={formData.maxTeams} onChange={(e) => set("maxTeams", Number(e.target.value))} />
            </div>
            <div>
              <Label>Entry fee ({sym})</Label>
              <Input type="number" value={formData.entryFee} onChange={(e) => set("entryFee", Number(e.target.value))} />
            </div>
            <div>
              <Label>Prize pool ({sym})</Label>
              <Input type="number" value={formData.prizePool} onChange={(e) => set("prizePool", Number(e.target.value))} />
            </div>
          </div>
          <div>
            <Label>Payment instructions</Label>
            <Textarea
              rows={2}
              value={formData.paymentInfo}
              onChange={(e) => set("paymentInfo", e.target.value)}
              placeholder={"A/C 8467239842, IFSC ABCD0001\nOr Wallet: organizer@wallet"}
            />
          </div>
              <div>
            <Label>Payment QR (image)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => set("paymentQrDataUrl", reader.result as string);
                reader.readAsDataURL(f);
              }}
            />
            {formData.paymentQrDataUrl && (
              <img src={formData.paymentQrDataUrl} alt="Payment QR" className="mt-2 h-32 w-32 rounded-md border border-border object-contain" />
            )}
          </div>
          <div>
            <Label>Event banner (max 2MB)</Label>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingBanner}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    
                    // Clear previous errors
                    setBannerError(null);
                    
                    // Validate file
                    const validation = validateImageFile(f);
                    if (!validation.valid) {
                      setBannerError(validation.error || "Invalid file");
                      return;
                    }
                    
                    setIsUploadingBanner(true);
                    
                    try {
                      // Delete old banner if it exists
                      if (formData.bannerUrl) {
                        await deleteEventBannerByUrl(formData.bannerUrl);
                      }
                      
                      const result = await uploadEventBanner(f, formData.id);
                      set("bannerUrl", result.url);
                      toast.success("Banner uploaded successfully");
                    } catch (error) {
                      if (error instanceof ImageUploadError) {
                        setBannerError(error.message);
                        toast.error(error.message);
                      } else {
                        setBannerError("Failed to upload banner. Please try again.");
                        toast.error("Failed to upload banner");
                      }
                    } finally {
                      setIsUploadingBanner(false);
                    }
                  }}
                />
                {isUploadingBanner && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      Uploading...
                    </div>
                  </div>
                )}
              </div>
              
              {bannerError && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{bannerError}</p>
                </div>
              )}
              {formData.bannerUrl && (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Banner preview - this is exactly how it will appear on event pages:
                  </div>
                  <div className="relative">
                    <img 
                      src={formData.bannerUrl} 
                      alt="Event banner preview" 
                      className="w-full h-48 sm:h-64 rounded-md border border-border object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      Full width × 256px (desktop) • Full width × 192px (mobile)
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={async () => {
                        if (!formData.bannerUrl) return;
                        try {
                          // Extract file path from URL
                          const url = new URL(formData.bannerUrl);
                          const pathParts = url.pathname.split('/');
                          const fileName = pathParts[pathParts.length - 1];
                          const filePath = `banners/${fileName}`;
                          
                          await deleteEventBanner(filePath);
                          set("bannerUrl", undefined);
                          toast.success("Banner removed");
                        } catch (error) {
                          toast.error("Failed to remove banner");
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    💡 <strong>Tip:</strong> Use wide landscape images (minimum 1200×300px recommended). The banner will be cropped to full width with fixed height.
                  </div>
                </div>
              )}
            </div>
          </div>
      
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Contact name</Label>
              <Input value={formData.contactName} onChange={(e) => set("contactName", e.target.value)} />
            </div>
            <div>
              <Label>Contact phone</Label>
              <Input value={formData.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save}>Save event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
