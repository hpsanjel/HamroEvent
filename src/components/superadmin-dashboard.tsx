import { useState, useEffect } from "react";
import { eventsApi, regsApi, budgetApi, donationsApi, ticketsApi, ordersApi, matchesApi, superAdminApi, type SportsEvent, type TeamRegistration, type BudgetItem, type Donation, type TicketType, type TicketOrder, type Match, hydrateStore } from "@/lib/store";
import { useStoreSignal } from "@/hooks/use-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Trophy, 
  DollarSign, 
  Ticket, 
  Calendar, 
  TrendingUp, 
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Download,
  Search,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { fmtMoney } from "@/lib/currency";
import { sportLabel } from "@/lib/sports";
import { getCurrentUser, isSuperAdmin } from "@/lib/auth";
import jsPDF from "jspdf";

interface OrganizerStats {
  id: string;
  email: string;
  name: string;
  phone?: string;
  totalEvents: number;
  activeEvents: number;
  completedEvents: number;
  totalRegistrations: number;
  totalRevenue: number;
  totalDonations: number;
  totalTicketSales: number;
  averageEventSize: number;
  lastActivity: string;
  status: "active" | "inactive" | "suspended";
  events: any[];
  currencies: Set<string>;
  primarySport?: string;
  totalPrizePool: number;
}

export default function SuperAdminDashboard() {
  useStoreSignal();
  const [ready, setReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [organizers, setOrganizers] = useState<OrganizerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useHydrated();
  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    const initDashboard = async () => {
      try {
        // First ensure the user is authenticated and is a superadmin
        const user = await getCurrentUser();
        if (!user || !isSuperAdmin(user)) {
          toast.error("Access denied. Superadmin privileges required.");
          setLoading(false);
          return;
        }
        setCurrentUser(user);

        // Then ensure the store is properly hydrated with all data
        console.log('[SuperAdmin] Ensuring store hydration...');
        await hydrateStore();
        console.log('[SuperAdmin] Store hydrated, loading organizer stats...');
        
        // Finally load the organizer statistics
        await loadOrganizerStats();
        console.log('[SuperAdmin] Dashboard data loaded successfully');
      } catch (error) {
        console.error("Failed to initialize dashboard:", error);
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, []);

  const extractOrganizerEmails = (allEvents: SportsEvent[], allRegistrations: TeamRegistration[]): Map<string, string> => {
    const emailMap = new Map<string, string>();
    
    // Method 1: Check if ownerId is already an email
    allEvents.forEach(event => {
      if (event.ownerId && event.ownerId.includes('@')) {
        emailMap.set(event.ownerId, event.ownerId);
      }
    });
    
    // Method 2: Extract emails from registration captain emails
    // Group registrations by event to find the first/primary registration
    const eventRegistrations = new Map<string, TeamRegistration[]>();
    allRegistrations.forEach(reg => {
      if (!eventRegistrations.has(reg.eventId)) {
        eventRegistrations.set(reg.eventId, []);
      }
      eventRegistrations.get(reg.eventId)!.push(reg);
    });
    
    // Use captain emails from registrations as organizer emails
    eventRegistrations.forEach((regs, eventId) => {
      const event = allEvents.find(e => e.id === eventId);
      if (event && event.ownerId && regs.length > 0) {
        // Use the first approved registration's captain email
        const approvedReg = regs.find(reg => reg.status === 'approved') || regs[0];
        if (approvedReg?.captainEmail && !emailMap.has(event.ownerId)) {
          emailMap.set(event.ownerId, approvedReg.captainEmail);
        }
      }
    });
    
    // Method 3: Look for patterns in contact info
    allEvents.forEach(event => {
      if (event.ownerId && !emailMap.has(event.ownerId)) {
        // Check if contact name or phone contains email patterns
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        const contactMatch = (event.contactName + ' ' + event.contactPhone).match(emailPattern);
        if (contactMatch) {
          emailMap.set(event.ownerId, contactMatch[0]);
        }
      }
    });
    
    console.log('[SuperAdmin] Extracted emails for', emailMap.size, 'organizers using multiple methods');
    return emailMap;
  };

  const loadOrganizerStats = async () => {
    try {
      console.log('[SuperAdmin] Loading organizer stats...');
      
      // Get all data from superAdminApi (superadmin sees all data without user filtering)
      const allEvents = superAdminApi.getAllEvents();
      const allRegistrations = superAdminApi.getAllRegistrations();
      const allOrders = superAdminApi.getAllOrders();
      
      // Get all budget items, donations, tickets, matches without user filtering
      const allBudgetItems = superAdminApi.getAllBudgetItems();
      const allDonations = superAdminApi.getAllDonations();
      const allTickets = superAdminApi.getAllTickets();
      const allMatches = superAdminApi.getAllMatches();
      
      console.log('[SuperAdmin] Data loaded:', {
        events: allEvents.length,
        registrations: allRegistrations.length,
        orders: allOrders.length,
        budgetItems: allBudgetItems.length,
        donations: allDonations.length,
        tickets: allTickets.length,
        matches: allMatches.length
      });

    // Extract organizer emails from registrations
    const organizerEmails = extractOrganizerEmails(allEvents, allRegistrations);

    // Group events by organizer
    const organizerMap = new Map<string, OrganizerStats>();

    allEvents.forEach((event: SportsEvent) => {
      const organizerId = event.ownerId || 'unknown';
      
      if (!organizerMap.has(organizerId)) {
        // Extract meaningful organizer info from the event
        const organizerName = event.contactName || `Organizer ${organizerId.slice(-6)}`;
        const realEmail = organizerEmails.get(organizerId);
        const organizerEmail = realEmail || (organizerId.includes('@') ? organizerId : `${organizerName.toLowerCase().replace(/\s+/g, '.')}@example.com`);
        
        organizerMap.set(organizerId, {
          id: organizerId,
          email: organizerEmail,
          name: organizerName,
          phone: event.contactPhone,
          totalEvents: 0,
          activeEvents: 0,
          completedEvents: 0,
          totalRegistrations: 0,
          totalRevenue: 0,
          totalDonations: 0,
          totalTicketSales: 0,
          averageEventSize: 0,
          lastActivity: event.createdAt,
          status: "active",
          events: [],
          currencies: new Set<string>(),
          primarySport: event.sport,
          totalPrizePool: 0
        });
      }

      const stats = organizerMap.get(organizerId)!;
      stats.totalEvents++;
      stats.events.push(event);
      
      // Add to prize pool
      stats.totalPrizePool += event.prizePool;
      
      // Update primary sport (most common sport)
      if (!stats.primarySport) {
        stats.primarySport = event.sport;
      }
      
      if (event.status === "live" || event.status === "published") {
        stats.activeEvents++;
      } else if (event.status === "completed") {
        stats.completedEvents++;
      }

      // Update last activity
      if (new Date(event.createdAt) > new Date(stats.lastActivity)) {
        stats.lastActivity = event.createdAt;
      }
    });

    // Calculate registration and revenue stats
    allRegistrations.forEach((reg: TeamRegistration) => {
      const event = allEvents.find(e => e.id === reg.eventId);
      if (event) {
        const organizerId = event.ownerId || 'unknown';
        const stats = organizerMap.get(organizerId);
        if (stats) {
          stats.totalRegistrations++;
          // Add event currency to organizer's currencies
          if (event.currency) {
            stats.currencies.add(event.currency);
          }
        }
      }
    });

    // Calculate budget revenue
    allBudgetItems.forEach((item: BudgetItem) => {
      if (item.type === 'income') {
        const event = allEvents.find(e => e.id === item.eventId);
        if (event) {
          const organizerId = event.ownerId || 'unknown';
          const stats = organizerMap.get(organizerId);
          if (stats) {
            stats.totalRevenue += item.amount;
            // Add event currency to organizer's currencies
            const event = allEvents.find(e => e.id === item.eventId);
            if (event?.currency) {
              stats.currencies.add(event.currency);
            }
          }
        }
      }
    });

    // Calculate donations
    allDonations.forEach((donation: Donation) => {
      const event = allEvents.find(e => e.id === donation.eventId);
      if (event) {
        const organizerId = event.ownerId || 'unknown';
        const stats = organizerMap.get(organizerId);
        if (stats) {
          stats.totalDonations += donation.amount;
          // Add event currency to organizer's currencies
          if (event.currency) {
            stats.currencies.add(event.currency);
          }
        }
      }
    });

    // Calculate ticket sales
    allOrders.forEach((order: TicketOrder) => {
      if (order.status !== 'rejected') {
        const event = allEvents.find(e => e.id === order.eventId);
        if (event) {
          const organizerId = event.ownerId || 'unknown';
          const stats = organizerMap.get(organizerId);
          if (stats) {
            stats.totalTicketSales += order.total;
            // Add event currency to organizer's currencies
            if (event.currency) {
              stats.currencies.add(event.currency);
            }
          }
        }
      }
    });

    // Calculate average event size
    organizerMap.forEach(stats => {
      if (stats.totalEvents > 0) {
        stats.averageEventSize = Math.round(stats.totalRegistrations / stats.totalEvents);
      }
    });

    setOrganizers(Array.from(organizerMap.values()));
    console.log('[SuperAdmin] Organizer stats processed:', Array.from(organizerMap.values()).length, 'organizers');
    } catch (error) {
      console.error('[SuperAdmin] Error loading organizer stats:', error);
      toast.error("Failed to load organizer data");
    }
  };

  const exportOrganizerReport = () => {
    try {
      let content = "SUPERADMIN ORGANIZER REPORT\n";
      content += "=".repeat(60) + "\n";
      content += `Generated: ${format(new Date(), "PPP")}\n\n`;

      const filteredOrganizers = organizers.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

      content += `Total Organizers: ${filteredOrganizers.length}\n\n`;

      filteredOrganizers.forEach((org, index) => {
        content += `${index + 1}. ${org.name}\n`;
        content += `   Email: ${org.email}\n`;
        if (org.phone) content += `   Phone: ${org.phone}\n`;
        if (org.primarySport) content += `   Primary Sport: ${sportLabel(org.primarySport as any)}\n`;
        content += `   Status: ${org.status}\n`;
        content += `   Total Events: ${org.totalEvents}\n`;
        content += `   Active Events: ${org.activeEvents}\n`;
        content += `   Completed Events: ${org.completedEvents}\n`;
        content += `   Total Registrations: ${org.totalRegistrations}\n`;
        content += `   Average Event Size: ${org.averageEventSize} participants\n`;
        // Use the organizer's primary currency or default to first available
        const currency = Array.from(org.currencies)[0] || 'NPR';
        content += `   Total Revenue: ${fmtMoney(org.totalRevenue, currency)}\n`;
        content += `   Total Donations: ${fmtMoney(org.totalDonations, currency)}\n`;
        content += `   Total Ticket Sales: ${fmtMoney(org.totalTicketSales, currency)}\n`;
        content += `   Total Prize Pool: ${fmtMoney(org.totalPrizePool, currency)}\n`;
        content += `   Combined Revenue: ${fmtMoney(org.totalRevenue + org.totalDonations + org.totalTicketSales, currency)}\n`;
        if (org.currencies.size > 1) {
          content += `   Currencies: ${Array.from(org.currencies).join(', ')}\n`;
        }
        content += `   Last Activity: ${format(new Date(org.lastActivity), "PPP")}\n`;
        content += "\n" + "-".repeat(40) + "\n\n";
      });

      // Platform-wide statistics
      const totalEvents = filteredOrganizers.reduce((sum, org) => sum + org.totalEvents, 0);
      const totalRegistrations = filteredOrganizers.reduce((sum, org) => sum + org.totalRegistrations, 0);
      const totalRevenue = filteredOrganizers.reduce((sum, org) => sum + org.totalRevenue, 0);
      const totalDonations = filteredOrganizers.reduce((sum, org) => sum + org.totalDonations, 0);
      const totalTicketSales = filteredOrganizers.reduce((sum, org) => sum + org.totalTicketSales, 0);

      content += "PLATFORM-WIDE STATISTICS\n";
      content += "=".repeat(40) + "\n";
      content += `Total Events: ${totalEvents}\n`;
      content += `Total Registrations: ${totalRegistrations}\n`;
      // Get all currencies used across platform
      const allCurrencies = new Set<string>();
      filteredOrganizers.forEach(org => {
        org.currencies.forEach(currency => allCurrencies.add(currency));
      });
      const primaryCurrency = Array.from(allCurrencies)[0] || 'NPR';
      
      content += `Total Revenue: ${fmtMoney(totalRevenue, primaryCurrency)}\n`;
      content += `Total Donations: ${fmtMoney(totalDonations, primaryCurrency)}\n`;
      content += `Total Ticket Sales: ${fmtMoney(totalTicketSales, primaryCurrency)}\n`;
      content += `Combined Platform Revenue: ${fmtMoney(totalRevenue + totalDonations + totalTicketSales, primaryCurrency)}\n`;
      if (allCurrencies.size > 1) {
        content += `Currencies Used: ${Array.from(allCurrencies).join(', ')}\n`;
      }
      content += `Average Events per Organizer: ${(totalEvents / filteredOrganizers.length).toFixed(1)}\n`;
      content += `Average Registrations per Event: ${totalEvents > 0 ? Math.round(totalRegistrations / totalEvents) : 0}\n`;

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const lineHeight = 7;
      const maxWidth = pageWidth - 2 * margin;
      
      const lines = pdf.splitTextToSize(content, maxWidth);
      
      let yPosition = margin;
      
      lines.forEach((line: string) => {
        if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      
      pdf.save(`superadmin-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Organizer report exported successfully!");
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  const filteredOrganizers = organizers.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get all currencies used across platform for display
  const allCurrencies = new Set<string>();
  organizers.forEach(org => {
    org.currencies.forEach(currency => allCurrencies.add(currency));
  });
  const primaryCurrency = Array.from(allCurrencies)[0] || 'NPR';

  const platformStats = {
    totalOrganizers: organizers.length,
    totalEvents: organizers.reduce((sum, org) => sum + org.totalEvents, 0),
    activeEvents: organizers.reduce((sum, org) => sum + org.activeEvents, 0),
    totalRegistrations: organizers.reduce((sum, org) => sum + org.totalRegistrations, 0),
    totalRevenue: organizers.reduce((sum, org) => sum + org.totalRevenue, 0),
    totalDonations: organizers.reduce((sum, org) => sum + org.totalDonations, 0),
    totalTicketSales: organizers.reduce((sum, org) => sum + org.totalTicketSales, 0),
    primaryCurrency,
    allCurrencies: Array.from(allCurrencies),
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="text-center">
          <Shield className="mx-auto h-8 w-8 animate-pulse text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading superadmin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !isSuperAdmin(currentUser)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Access Denied</h2>
          <p className="mt-2 text-muted-foreground">Superadmin privileges required to access this dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="text-center max-w-md">
          <Activity className="mx-auto h-8 w-8 animate-pulse text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading superadmin dashboard...</p>
          <p className="mt-1 text-sm text-muted-foreground">Fetching data from all organizers and events</p>
          <div className="mt-4 w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8" />
            Superadmin Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">Complete overview of all event organizers and platform statistics</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList className="grid w-full sm:w-auto grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="organizers">Organizers</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search organizers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-64 border border-border rounded-lg bg-background"
                />
              </div>
              <Button 
                onClick={async () => {
                  setLoading(true);
                  try {
                    await hydrateStore();
                    await loadOrganizerStats();
                    toast.success("Data refreshed successfully");
                  } catch (error) {
                    toast.error("Failed to refresh data");
                  } finally {
                    setLoading(false);
                  }
                }} 
                variant="outline" 
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={exportOrganizerReport} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Organizers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformStats.totalOrganizers}</div>
                  <p className="text-xs text-muted-foreground">Registered organizers</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformStats.totalEvents}</div>
                  <p className="text-xs text-muted-foreground">{platformStats.activeEvents} active</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformStats.totalRegistrations}</div>
                  <p className="text-xs text-muted-foreground">Across all events</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{fmtMoney(platformStats.totalRevenue + platformStats.totalDonations + platformStats.totalTicketSales, platformStats.primaryCurrency)}</div>
                  <p className="text-xs text-muted-foreground">
                    Combined revenue {platformStats.allCurrencies.length > 1 && `(${platformStats.allCurrencies.join(', ')})`}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Event Revenue</span>
                    <span className="font-semibold">{fmtMoney(platformStats.totalRevenue, platformStats.primaryCurrency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Donations</span>
                    <span className="font-semibold">{fmtMoney(platformStats.totalDonations, platformStats.primaryCurrency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Ticket Sales</span>
                    <span className="font-semibold">{fmtMoney(platformStats.totalTicketSales, platformStats.primaryCurrency)}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total</span>
                      <span className="font-bold">{fmtMoney(platformStats.totalRevenue + platformStats.totalDonations + platformStats.totalTicketSales, platformStats.primaryCurrency)}</span>
                    </div>
                    {platformStats.allCurrencies.length > 1 && (
                      <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                        <span>Currencies:</span>
                        <span>{platformStats.allCurrencies.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Active Events</span>
                      <span>{platformStats.activeEvents}/{platformStats.totalEvents}</span>
                    </div>
                    <Progress value={platformStats.totalEvents > 0 ? (platformStats.activeEvents / platformStats.totalEvents) * 100 : 0} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Avg. Event Size</span>
                      <span>{platformStats.totalEvents > 0 ? Math.round(platformStats.totalRegistrations / platformStats.totalEvents) : 0} participants</span>
                    </div>
                  </div>
                  <div className="pt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>Platform operating normally</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Organizers Tab */}
          <TabsContent value="organizers" className="space-y-6">
            <div className="grid gap-4">
              {filteredOrganizers.map((organizer) => (
                <Card key={organizer.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={undefined} />
                          <AvatarFallback>{organizer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{organizer.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{organizer.email}</p>
                          {organizer.phone && (
                            <p className="text-xs text-muted-foreground">{organizer.phone}</p>
                          )}
                          {organizer.primarySport && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs text-muted-foreground">Primary:</span>
                              <Badge variant="outline" className="text-xs">
                                {sportLabel(organizer.primarySport as any)}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={organizer.status === "active" ? "default" : "secondary"}>
                          {organizer.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{organizer.totalEvents}</div>
                        <p className="text-xs text-muted-foreground">Total Events</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{organizer.totalRegistrations}</div>
                        <p className="text-xs text-muted-foreground">Registrations</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{fmtMoney(organizer.totalRevenue + organizer.totalDonations + organizer.totalTicketSales, Array.from(organizer.currencies)[0] || 'NPR')}</div>
                        <p className="text-xs text-muted-foreground">
                          Total Revenue {organizer.currencies.size > 1 && `(${Array.from(organizer.currencies).join(', ')})`}
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{fmtMoney(organizer.totalPrizePool, Array.from(organizer.currencies)[0] || 'NPR')}</div>
                        <p className="text-xs text-muted-foreground">Total Prize Pool</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{organizer.averageEventSize}</div>
                        <p className="text-xs text-muted-foreground">Avg. Event Size</p>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      Last activity: {format(new Date(organizer.lastActivity), "PPP")}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="grid gap-4">
              {filteredOrganizers.flatMap(organizer => 
                organizer.events.map(event => (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{event.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">by {organizer.name}</p>
                        </div>
                        <Badge variant={event.status === "live" ? "default" : "secondary"}>
                          {event.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Sport:</span>
                          <p className="font-medium">{sportLabel(event.sport)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>
                          <p className="font-medium">{format(new Date(event.startDate), "MMM d, yyyy")}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Registrations:</span>
                          <p className="font-medium">{regsApi.list(event.id).length}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Entry Fee:</span>
                          <p className="font-medium">{fmtMoney(event.entryFee, event.currency)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Organizers by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {organizers
                      .sort((a, b) => (b.totalRevenue + b.totalDonations + b.totalTicketSales) - (a.totalRevenue + a.totalDonations + b.totalTicketSales))
                      .slice(0, 5)
                      .map((org, index) => (
                        <div key={org.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">#{index + 1}</span>
                            <span>{org.name}</span>
                          </div>
                          <span className="font-semibold">{fmtMoney(org.totalRevenue + org.totalDonations + org.totalTicketSales, Array.from(org.currencies)[0] || 'NPR')}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Organizers by Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {organizers
                      .sort((a, b) => b.totalEvents - a.totalEvents)
                      .slice(0, 5)
                      .map((org, index) => (
                        <div key={org.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">#{index + 1}</span>
                            <span>{org.name}</span>
                          </div>
                          <span className="font-semibold">{org.totalEvents} events</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
