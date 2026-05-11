import { useState, useEffect } from "react";
import { eventsApi, regsApi, matchesApi, ticketsApi, ordersApi } from "@/lib/store";
import { useStoreSignal } from "@/hooks/use-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, Users, Calendar, MapPin, Trophy, Plus, Wallet, HeartHandshake, ScanLine, Sparkles, Download, Radio, Ticket, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { sportEmoji, sportLabel } from "@/lib/sports";
import { fmtMoney, currencySymbol } from "@/lib/currency";
import { uploadEventBanner } from "@/lib/image-upload";
import { generateBracket } from "@/lib/match-scheduler";
import { uid } from "@/lib/store";

export default function App() {
  useStoreSignal();
  const [ready, setReady] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sport: "football" as const,
    description: "",
    venue: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    maxTeams: 16,
    entryFee: 100,
    prizePool: 10000,
    currency: "USD",
    contactName: "",
    contactPhone: "",
    paymentInfo: "",
    coverImage: null,
    bannerUrl: null,
  });

  useHydrated().finally(() => setReady(true));

  useEffect(() => {
    const allEvents = eventsApi.listAll();
    setEvents(allEvents);
  }, []);

  const handleCreateEvent = async () => {
    if (!formData.name.trim()) {
      toast.error("Event name is required");
      return;
    }

    const eventId = uid();
    const newEvent = {
      id: eventId,
      owner_id: null,
      name: formData.name,
      sport: formData.sport,
      description: formData.description,
      venue: formData.venue,
      start_date: formData.startDate,
      end_date: formData.endDate,
      registration_deadline: formData.registrationDeadline,
      max_teams: formData.maxTeams,
      entry_fee: formData.entryFee,
      prize_pool: formData.prizePool,
      currency: formData.currency,
      contact_name: formData.contactName,
      contact_phone: formData.contactPhone,
      payment_info: formData.paymentInfo,
      status: "draft" as const,
      cover_image: formData.coverImage,
      banner_url: formData.bannerUrl,
      created_at: new Date().toISOString(),
    };

    eventsApi.upsert(newEvent);
    setFormData({
      name: "",
      sport: "football" as const,
      description: "",
      venue: "",
      startDate: "",
      endDate: "",
      registrationDeadline: "",
      maxTeams: 16,
      entryFee: 100,
      prizePool: 10000,
      currency: "USD",
      contactName: "",
      contactPhone: "",
      paymentInfo: "",
      coverImage: null,
      bannerUrl: null,
    });
    setShowCreateModal(false);
    toast.success("Event created successfully!");
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="text-center">
          <Users className="mx-auto h-8 w-8 animate-pulse text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-4xl">{sportEmoji("football")}</span>
              <h1 className="font-display text-3xl font-bold">PitchPro</h1>
              <span className="ml-2 text-xl text-muted-foreground">— Event Management Platform</span>
            </div>
            <nav className="flex gap-4">
              <Button variant="ghost" size="sm">Dashboard</Button>
              <Button variant="outline" size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Create Event
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Sidebar */}
        <aside className="w-80 border-r border-border bg-card">
          <div className="p-4">
            <h2 className="font-display text-lg font-semibold mb-4">Events</h2>
            <div className="space-y-2">
              {events.map((event) => (
                <Card key={event.id} className="cursor-pointer hover:shadow-glow transition-all">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{event.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        event.status === "live" ? "bg-success/20 text-success" : "bg-muted/40 text-muted-foreground"
                      }`}>
                        {event.status === "live" ? "LIVE" : event.status}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {format(new Date(event.start_date), "MMM d, yyyy")}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {format(new Date(event.end_date), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="text-muted-foreground">
                          {sportLabel(event.sport)}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{event.venue}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {fmtMoney(event.entry_fee, event.currency)} entry
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {fmtMoney(event.prize_pool, event.currency)} prize
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {event.max_teams} teams
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {eventsApi.list(event.id).length} registrations
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          {selectedEvent ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Event Name</Label>
                        <p className="text-sm text-muted-foreground">{selectedEvent.name}</p>
                      </div>
                      <div>
                        <Label>Sport</Label>
                        <p className="text-sm text-muted-foreground">{sportLabel(selectedEvent.sport)}</p>
                      </div>
                      <div>
                        <Label>Dates</Label>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(selectedEvent.start_date), "PPP")} - {format(new Date(selectedEvent.end_date), "PPP")}
                        </p>
                      </div>
                      <div>
                        <Label>Venue</Label>
                        <p className="text-sm text-muted-foreground">{selectedEvent.venue}</p>
                      </div>
                      <div>
                        <Label>Registration Deadline</Label>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(selectedEvent.registration_deadline), "PPP")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full" variant="outline" onClick={() => setSelectedEvent(null)}>
                      Select Different Event
                    </Button>
                    <Button className="w-full" onClick={() => setShowCreateModal(true)}>
                      Create New Event
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="space-y-4">
                <div className="text-center">
                  <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h2 className="mt-4 font-display text-2xl font-bold">Select an Event</h2>
                  <p className="mt-2 text-muted-foreground">Choose an event to manage or create a new one</p>
                </div>
                <div className="grid gap-4">
                  {events.map((event) => (
                    <Card key={event.id} className="cursor-pointer hover:shadow-glow transition-all">
                      <CardHeader>
                        <CardTitle>{event.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {format(new Date(event.start_date), "MMM d, yyyy")}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {format(new Date(event.end_date), "MMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {sportLabel(event.sport)}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{event.venue}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {eventsApi.list(event.id).length} registrations
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {fmtMoney(event.entry_fee, event.currency)} entry
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Event Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tournament Name"
                />
              </div>
              <div>
                <Label>Sport</Label>
                <Select value={formData.sport} onValueChange={(value) => setFormData({ ...formData, sport: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="football">Football</SelectItem>
                    <SelectItem value="cricket">Cricket</SelectItem>
                    <SelectItem value="basketball">Basketball</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tournament description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Venue</Label>
                  <Input
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="Stadium name"
                  />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Registration Deadline</Label>
                <Input
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                  />
                </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Teams</Label>
                  <Input
                    type="number"
                    value={formData.maxTeams}
                    onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) })}
                    placeholder="16"
                  />
                </div>
                <div>
                  <Label>Entry Fee</Label>
                  <Input
                    type="number"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: parseFloat(e.target.value) })}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label>Prize Pool</Label>
                  <Input
                    type="number"
                    value={formData.prizePool}
                    onChange={(e) => setFormData({ ...formData, prizePool: parseFloat(e.target.value) })}
                    placeholder="10000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Contact Name</Label>
                  <Input
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Organizer name"
                  />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <Label>Payment Information</Label>
                <Textarea
                  value={formData.paymentInfo}
                  onChange={(e) => setFormData({ ...formData, paymentInfo: e.target.value })}
                  placeholder="Payment details for participants..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEvent}>
                Create Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
