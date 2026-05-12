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
import { Check, X, Users, Calendar, MapPin, Trophy, Plus, Wallet, HeartHandshake, ScanLine, Sparkles, Download, Radio, Ticket, Edit, Trash2, Shield, Settings, Cookie } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { sportEmoji, sportLabel } from "@/lib/sports";
import { fmtMoney, currencySymbol } from "@/lib/currency";
import { uploadEventBanner } from "@/lib/image-upload";
// import { generateBracket } from "@/lib/match-scheduler"; // Commented out as file doesn't exist
import { uid } from "@/lib/store";
import AccessibilityWidget from "@/components/accessibility-widget";
import AccessibilityTest from "@/components/accessibility-test";
import CookieConsent from "@/components/cookie-consent";
import PrivacyPolicy from "@/components/privacy-policy";
import DataProtection from "@/components/data-protection";
import GDPRTestSimple from "@/components/gdpr-test-simple";

export default function App() {
  useStoreSignal();
  const [ready, setReady] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showDataProtection, setShowDataProtection] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sport: "football" as "football" | "cricket" | "basketball",
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

  useEffect(() => {
  setReady(true);
}, []);

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
      name: formData.name,
      sport: formData.sport,
      description: formData.description,
      venue: formData.venue,
      startDate: formData.startDate,
      endDate: formData.endDate,
      registrationDeadline: formData.registrationDeadline,
      maxTeams: formData.maxTeams,
      entryFee: formData.entryFee,
      prizePool: formData.prizePool,
      currency: formData.currency,
      contactName: formData.contactName,
      contactPhone: formData.contactPhone,
      paymentInfo: formData.paymentInfo,
      status: "draft" as const,
      coverImage: formData.coverImage || undefined,
      bannerUrl: formData.bannerUrl || undefined,
      createdAt: new Date().toISOString(),
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
              <Button variant="ghost" size="sm" onClick={() => setShowPrivacyPolicy(true)}>
                <Shield className="mr-1 h-3.5 w-3.5" /> Privacy
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowDataProtection(true)}>
                <Settings className="mr-1 h-3.5 w-3.5" /> Data Rights
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Create Event
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1">
        {/* GDPR Test Section */}
        <section className="border-b border-border bg-yellow-50 dark:bg-yellow-950/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
            <h2 className="text-lg font-semibold mb-4">GDPR Components Test</h2>
            <div className="flex gap-4">
              <Button onClick={() => setShowPrivacyPolicy(true)}>
                <Shield className="mr-2 h-4 w-4" /> Test Privacy Policy
              </Button>
              <Button onClick={() => setShowDataProtection(true)} variant="outline">
                <Settings className="mr-2 h-4 w-4" /> Test Data Protection
              </Button>
              <Button onClick={() => alert('Cookie consent should be visible at bottom')} variant="secondary">
                <Cookie className="mr-2 h-4 w-4" /> Check Cookie Consent
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Cookie consent should appear at the bottom of the page automatically.
            </p>
          </div>
        </section>

        {/* Accessibility Test Section */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
            <AccessibilityTest />
          </div>
        </section>
        
        <div className="flex">
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
                          {eventsApi.list().filter(e => e.id === event.id).length} registrations
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
                              {eventsApi.list().filter(e => e.id === event.id).length} registrations
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {fmtMoney(event.entry_fee, event.currency)} entry
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </div>
            </div>
            </div>
          )}
          </div>
          
           
          
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
                            {format(new Date(selectedEvent.start_date || selectedEvent.startDate), "PPP")} - {format(new Date(selectedEvent.end_date || selectedEvent.endDate), "PPP")}
                          </p>
                        </div>
                        <div>
                          <Label>Venue</Label>
                          <p className="text-sm text-muted-foreground">{selectedEvent.venue}</p>
                        </div>
                        <div>
                          <Label>Registration Deadline</Label>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(selectedEvent.registration_deadline || selectedEvent.registrationDeadline), "PPP")}
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
                                {format(new Date(event.start_date || event.startDate), "MMM d, yyyy")}
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                {format(new Date(event.end_date || event.endDate), "MMM d, yyyy")}
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
                                {eventsApi.list().filter(e => e.id === event.id).length} registrations
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                {fmtMoney(event.entry_fee || event.entryFee, event.currency)} entry
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
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
                <Select value={formData.sport} onValueChange={(value: "football" | "cricket" | "basketball") => setFormData({ ...formData, sport: value })}>
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

      {/* GDPR Components */}
      <CookieConsent />
      
      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="absolute top-4 left-4 z-60 bg-black text-white p-2 rounded">
            Privacy Policy Modal - Click back button to close
          </div>
          <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />
        </div>
      )}
      
      {showDataProtection && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="absolute top-4 left-4 z-60 bg-black text-white p-2 rounded">
            Data Protection Modal - Click back button to close
          </div>
          <DataProtection />
        </div>
      )}
      
      <AccessibilityWidget />
      <GDPRTestSimple />
    </div>
  );
}
