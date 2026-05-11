import { useState, useEffect } from "react";
import { eventsApi, regsApi, budgetApi, donationsApi, matchesApi, ticketsApi, ordersApi } from "@/lib/store";
import { useStoreSignal } from "@/hooks/use-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, FileText, Users, Trophy, Wallet, HeartHandshake, Ticket, Calendar, Trash2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { sportLabel, sportEmoji } from "@/lib/sports";
import { fmtMoney, currencySymbol } from "@/lib/currency";
import jsPDF from "jspdf";

export default function ExportPage() {
  useStoreSignal();
  const [ready, setReady] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useHydrated();
  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    const allEvents = eventsApi.list();
    setEvents(allEvents);
  }, []);

  const generatePDF = (content: string, filename: string) => {
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
    
    pdf.save(filename);
  };

  const exportAllEvents = () => {
    setIsExporting(true);
    try {
      let content = "ALL EVENTS REPORT\n";
      content += "=".repeat(50) + "\n\n";
      
      events.forEach((event, index) => {
        content += `${index + 1}. ${event.name}\n`;
        content += `   Sport: ${sportLabel(event.sport || 'other')}\n`;
        content += `   Venue: ${event.venue}\n`;
        content += `   Dates: ${format(new Date(event.startDate), "MMM d, yyyy")} - ${format(new Date(event.endDate), "MMM d, yyyy")}\n`;
        content += `   Status: ${event.status}\n`;
        content += `   Entry Fee: ${fmtMoney(event.entryFee, event.currency)}\n`;
        content += `   Prize Pool: ${fmtMoney(event.prizePool, event.currency)}\n`;
        content += `   Max Teams: ${event.maxTeams}\n`;
        content += `   Contact: ${event.contactName} (${event.contactPhone})\n`;
        content += `   Created: ${format(new Date(event.createdAt), "PPP")}\n`;
        content += "\n" + "-".repeat(30) + "\n\n";
      });
      
      generatePDF(content, `all-events-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("All events exported successfully!");
    } catch (error) {
      toast.error("Failed to export events");
    } finally {
      setIsExporting(false);
    }
  };

  const exportEventDetails = () => {
    if (!selectedEvent) {
      toast.error("Please select an event");
      return;
    }
    
    setIsExporting(true);
    try {
      const event = eventsApi.get(selectedEvent);
      const registrations = regsApi.list(selectedEvent);
      
      let content = `EVENT DETAILS: ${event?.name}\n`;
      content += "=".repeat(50) + "\n\n";
      
      // Event Information
      content += "EVENT INFORMATION\n";
      content += "-".repeat(20) + "\n";
      content += `Name: ${event?.name}\n`;
      content += `Sport: ${sportLabel(event?.sport || 'other')}\n`;
      content += `Venue: ${event?.venue}\n`;
      content += `Dates: ${format(new Date(event?.startDate || ""), "PPP")} - ${format(new Date(event?.endDate || ""), "PPP")}\n`;
      content += `Registration Deadline: ${format(new Date(event?.registrationDeadline || ""), "PPP")}\n`;
      content += `Status: ${event?.status}\n`;
      content += `Entry Fee: ${fmtMoney(event?.entryFee || 0, event?.currency)}\n`;
      content += `Prize Pool: ${fmtMoney(event?.prizePool || 0, event?.currency)}\n`;
      content += `Max Teams: ${event?.maxTeams}\n`;
      content += `Contact: ${event?.contactName} (${event?.contactPhone})\n`;
      content += `Description: ${event?.description}\n\n`;
      
      // Teams and Players
      content += "TEAMS AND PLAYERS\n";
      content += "-".repeat(20) + "\n";
      registrations.forEach((reg, index) => {
        content += `\nTeam ${index + 1}: ${reg.teamName}\n`;
        content += `Captain: ${reg.captainName} (${reg.captainPhone}, ${reg.captainEmail})\n`;
        content += `Status: ${reg.status}\n`;
        content += `Checked In: ${reg.checkedIn ? "Yes" : "No"}\n`;
        content += "Players:\n";
        reg.players.forEach((player, pIndex) => {
          content += `  ${pIndex + 1}. ${player.name}`;
          if (player.jersey) content += ` (Jersey: ${player.jersey})`;
          if (player.phone) content += ` (Phone: ${player.phone})`;
          content += "\n";
        });
        content += "\n";
      });
      
      generatePDF(content, `event-details-${event?.name}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Event details exported successfully!");
    } catch (error) {
      toast.error("Failed to export event details");
    } finally {
      setIsExporting(false);
    }
  };

  const exportDonations = () => {
    if (!selectedEvent) {
      toast.error("Please select an event");
      return;
    }
    
    setIsExporting(true);
    try {
      const event = eventsApi.get(selectedEvent);
      const donations = donationsApi.list(selectedEvent);
      
      let content = `DONATION REPORT: ${event?.name}\n`;
      content += "=".repeat(50) + "\n\n";
      
      if (donations.length === 0) {
        content += "No donations recorded for this event.\n";
      } else {
        let totalAmount = 0;
        donations.forEach((donation, index) => {
          content += `${index + 1}. ${donation.donorName || 'Anonymous'}\n`;
          content += `   Amount: ${fmtMoney(donation.amount, event?.currency)}\n`;
          content += `   Type: ${donation.type}\n`;
          content += `   Date: ${format(new Date(donation.date), "PPP")}\n`;
          if (donation.note) content += `   Note: ${donation.note}\n`;
          content += "\n";
          totalAmount += donation.amount;
        });
        
        content += "-".repeat(30) + "\n";
        content += `TOTAL DONATIONS: ${fmtMoney(totalAmount, event?.currency)}\n`;
      }
      
      generatePDF(content, `donations-${event?.name}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Donation report exported successfully!");
    } catch (error) {
      toast.error("Failed to export donations");
    } finally {
      setIsExporting(false);
    }
  };

  const exportBudget = () => {
    if (!selectedEvent) {
      toast.error("Please select an event");
      return;
    }
    
    setIsExporting(true);
    try {
      const event = eventsApi.get(selectedEvent);
      const budgetItems = budgetApi.list(selectedEvent);
      
      let content = `BUDGET REPORT: ${event?.name}\n`;
      content += "=".repeat(50) + "\n\n";
      
      const income = budgetItems.filter(item => item.type === 'income');
      const expenses = budgetItems.filter(item => item.type === 'expense');
      
      let totalIncome = 0;
      let totalExpenses = 0;
      
      // Income Column
      content += "INCOME\n";
      content += "-".repeat(20) + "\n";
      if (income.length === 0) {
        content += "No income items recorded.\n\n";
      } else {
        income.forEach((item, index) => {
          content += `${index + 1}. ${item.category}\n`;
          content += `   Amount: ${fmtMoney(item.amount, event?.currency)}\n`;
          content += `   Date: ${format(new Date(item.date), "PPP")}\n`;
          if (item.note) content += `   Note: ${item.note}\n`;
          content += "\n";
          totalIncome += item.amount;
        });
        content += `TOTAL INCOME: ${fmtMoney(totalIncome, event?.currency)}\n\n`;
      }
      
      // Expenses Column
      content += "EXPENSES\n";
      content += "-".repeat(20) + "\n";
      if (expenses.length === 0) {
        content += "No expense items recorded.\n\n";
      } else {
        expenses.forEach((item, index) => {
          content += `${index + 1}. ${item.category}\n`;
          content += `   Amount: ${fmtMoney(item.amount, event?.currency)}\n`;
          content += `   Date: ${format(new Date(item.date), "PPP")}\n`;
          if (item.note) content += `   Note: ${item.note}\n`;
          content += "\n";
          totalExpenses += item.amount;
        });
        content += `TOTAL EXPENSES: ${fmtMoney(totalExpenses, event?.currency)}\n\n`;
      }
      
      // Summary
      content += "SUMMARY\n";
      content += "=".repeat(20) + "\n";
      content += `Total Income: ${fmtMoney(totalIncome, event?.currency)}\n`;
      content += `Total Expenses: ${fmtMoney(totalExpenses, event?.currency)}\n`;
      content += `Net Balance: ${fmtMoney(totalIncome - totalExpenses, event?.currency)}\n`;
      
      generatePDF(content, `budget-${event?.name}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Budget report exported successfully!");
    } catch (error) {
      toast.error("Failed to export budget");
    } finally {
      setIsExporting(false);
    }
  };

  const exportTicketSales = () => {
    if (!selectedEvent) {
      toast.error("Please select an event");
      return;
    }
    
    setIsExporting(true);
    try {
      const event = eventsApi.get(selectedEvent);
      const tickets = ticketsApi.list(selectedEvent);
      const orders = ordersApi.list(selectedEvent);
      
      let content = `TICKET SALES REPORT: ${event?.name}\n`;
      content += "=".repeat(50) + "\n\n";
      
      // Ticket Types
      content += "TICKET TYPES\n";
      content += "-".repeat(20) + "\n";
      tickets.forEach((ticket, index) => {
        const soldCount = orders.filter(o => o.ticketId === ticket.id && o.status !== 'rejected')
          .reduce((sum, o) => sum + o.quantity, 0);
        const revenue = soldCount * ticket.price;
        
        content += `${index + 1}. ${ticket.name}\n`;
        content += `   Price: ${fmtMoney(ticket.price, event?.currency)}\n`;
        content += `   Available: ${ticket.quantity === -1 ? 'Unlimited' : ticket.quantity}\n`;
        content += `   Sold: ${soldCount}\n`;
        content += `   Revenue: ${fmtMoney(revenue, event?.currency)}\n`;
        if (ticket.description) content += `   Description: ${ticket.description}\n`;
        content += "\n";
      });
      
      // Orders
      content += "ORDERS\n";
      content += "-".repeat(20) + "\n";
      let totalRevenue = 0;
      let totalTickets = 0;
      
      orders.forEach((order, index) => {
        const ticket = tickets.find(t => t.id === order.ticketId);
        content += `${index + 1}. ${order.buyerName}\n`;
        content += `   Email: ${order.buyerEmail}\n`;
        content += `   Phone: ${order.buyerPhone}\n`;
        content += `   Ticket: ${ticket?.name || 'Unknown'}\n`;
        content += `   Quantity: ${order.quantity}\n`;
        content += `   Total: ${fmtMoney(order.total, event?.currency)}\n`;
        content += `   Status: ${order.status}\n`;
        content += `   Checked In: ${order.checkedIn ? "Yes" : "No"}\n`;
        content += `   Date: ${format(new Date(order.submittedAt), "PPP")}\n`;
        content += "\n";
        
        if (order.status !== 'rejected') {
          totalRevenue += order.total;
          totalTickets += order.quantity;
        }
      });
      
      content += "SUMMARY\n";
      content += "=".repeat(20) + "\n";
      content += `Total Tickets Sold: ${totalTickets}\n`;
      content += `Total Revenue: ${fmtMoney(totalRevenue, event?.currency)}\n`;
      
      generatePDF(content, `ticket-sales-${event?.name}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Ticket sales report exported successfully!");
    } catch (error) {
      toast.error("Failed to export ticket sales");
    } finally {
      setIsExporting(false);
    }
  };

  const exportAllInOne = () => {
    if (!selectedEvent) {
      toast.error("Please select an event");
      return;
    }
    
    setIsExporting(true);
    try {
      const event = eventsApi.get(selectedEvent);
      const registrations = regsApi.list(selectedEvent);
      const budgetItems = budgetApi.list(selectedEvent);
      const donations = donationsApi.list(selectedEvent);
      const tickets = ticketsApi.list(selectedEvent);
      const orders = ordersApi.list(selectedEvent);
      const matches = matchesApi.list(selectedEvent);
      
      let content = `COMPLETE EVENT REPORT: ${event?.name}\n`;
      content += "=".repeat(40) + "\n";
      content += `Generated: ${format(new Date(), "PPP")}\n\n`;
      
      // 1. Event Information
      content += "1. EVENT INFORMATION\n";
      content += "-".repeat(30) + "\n";
      content += `Name: ${event?.name}\n`;
      content += `Sport: ${sportLabel(event?.sport || 'other')}\n`;
      content += `Venue: ${event?.venue}\n`;
      content += `Dates: ${format(new Date(event?.startDate || ""), "PPP")} - ${format(new Date(event?.endDate || ""), "PPP")}\n`;
      content += `Registration Deadline: ${format(new Date(event?.registrationDeadline || ""), "PPP")}\n`;
      content += `Status: ${event?.status}\n`;
      content += `Entry Fee: ${fmtMoney(event?.entryFee || 0, event?.currency)}\n`;
      content += `Prize Pool: ${fmtMoney(event?.prizePool || 0, event?.currency)}\n`;
      content += `Max Teams: ${event?.maxTeams}\n`;
      content += `Contact: ${event?.contactName} (${event?.contactPhone})\n`;
      content += `Description: ${event?.description}\n\n`;
      
      // 2. Teams and Players
      content += "2. TEAMS AND PLAYERS\n";
      content += "-".repeat(30) + "\n";
      registrations.forEach((reg, index) => {
        content += `\nTeam ${index + 1}: ${reg.teamName}\n`;
        content += `Captain: ${reg.captainName} (${reg.captainPhone}, ${reg.captainEmail})\n`;
        content += `Status: ${reg.status}\n`;
        content += `Checked In: ${reg.checkedIn ? "Yes" : "No"}\n`;
        content += "Players:\n";
        reg.players.forEach((player, pIndex) => {
          content += `  ${pIndex + 1}. ${player.name}`;
          if (player.jersey) content += ` (Jersey: ${player.jersey})`;
          if (player.phone) content += ` (Phone: ${player.phone})`;
          content += "\n";
        });
        content += "\n";
      });
      
      // 3. Match Schedule
      content += "\n3. MATCH SCHEDULE\n";
      content += "-".repeat(30) + "\n";
      if (matches.length === 0) {
        content += "No matches scheduled.\n\n";
      } else {
        matches.forEach((match, index) => {
          content += `${index + 1}. Round ${match.round}, Match ${match.matchNo}\n`;
          content += `   ${match.teamA || 'TBD'} vs ${match.teamB || 'TBD'}\n`;
          if (match.scoreA !== undefined && match.scoreB !== undefined) {
            content += `   Score: ${match.scoreA} - ${match.scoreB}\n`;
          }
          if (match.winner) content += `   Winner: ${match.winner}\n`;
          if (match.scheduledAt) content += `   Scheduled: ${format(new Date(match.scheduledAt), "PPP")}\n`;
          content += `   Status: ${match.status}\n\n`;
        });
      }
      
      // 4. Budget Summary
      content += "\n4. BUDGET SUMMARY\n";
      content += "-".repeat(30) + "\n";
      const income = budgetItems.filter(item => item.type === 'income');
      const expenses = budgetItems.filter(item => item.type === 'expense');
      let totalIncome = 0;
      let totalExpenses = 0;
      
      content += "Income:\n";
      income.forEach(item => {
        content += `  ${item.category}: ${fmtMoney(item.amount, event?.currency)}\n`;
        totalIncome += item.amount;
      });
      
      content += "Expenses:\n";
      expenses.forEach(item => {
        content += `  ${item.category}: ${fmtMoney(item.amount, event?.currency)}\n`;
        totalExpenses += item.amount;
      });
      
      content += `Net Balance: ${fmtMoney(totalIncome - totalExpenses, event?.currency)}\n\n`;
      
      // 5. Donations
      content += "5. DONATIONS\n";
      content += "-".repeat(30) + "\n";
      let totalDonations = 0;
      donations.forEach((donation, index) => {
        content += `${index + 1}. ${donation.donorName || 'Anonymous'}: ${fmtMoney(donation.amount, event?.currency)} (${donation.type})\n`;
        totalDonations += donation.amount;
      });
      content += `Total Donations: ${fmtMoney(totalDonations, event?.currency)}\n\n`;
      
      // 6. Ticket Sales
      content += "6. TICKET SALES\n";
      content += "-".repeat(30) + "\n";
      let totalTicketRevenue = 0;
      let totalTicketsSold = 0;
      
      orders.forEach((order, index) => {
        const ticket = tickets.find(t => t.id === order.ticketId);
        content += `${index + 1}. ${order.buyerName}: ${order.quantity}x ${ticket?.name || 'Unknown'} - ${fmtMoney(order.total, event?.currency)}\n`;
        if (order.status !== 'rejected') {
          totalTicketRevenue += order.total;
          totalTicketsSold += order.quantity;
        }
      });
      content += `Total Tickets Sold: ${totalTicketsSold}\n`;
      content += `Total Ticket Revenue: ${fmtMoney(totalTicketRevenue, event?.currency)}\n\n`;
      
      // 7. Overall Summary
      content += "7. OVERALL SUMMARY\n";
      content += "-".repeat(30) + "\n";
      content += `Total Teams Registered: ${registrations.length}\n`;
      content += `Total Players: ${registrations.reduce((sum, reg) => sum + reg.players.length, 0)}\n`;
      content += `Total Revenue: ${fmtMoney(totalIncome + totalDonations + totalTicketRevenue, event?.currency)}\n`;
      content += `Total Expenses: ${fmtMoney(totalExpenses, event?.currency)}\n`;
      content += `Net Profit: ${fmtMoney((totalIncome + totalDonations + totalTicketRevenue) - totalExpenses, event?.currency)}\n`;
      
      generatePDF(content, `complete-report-${event?.name}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Complete event report exported successfully!");
    } catch (error) {
      toast.error("Failed to export complete report");
    } finally {
      setIsExporting(false);
    }
  };

  const deleteAccountData = async () => {
    if (deleteConfirmText !== "DELETE ALL DATA") {
      toast.error("Please type 'DELETE ALL DATA' to confirm");
      return;
    }
    
    try {
      // Delete all user's events and related data
      const userEvents = eventsApi.list();
      for (const event of userEvents) {
        eventsApi.remove(event.id);
      }
      
      toast.success("All your data has been deleted successfully");
      setShowDeleteDialog(false);
      setDeleteConfirmText("");
      
      // Redirect to home or login page after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      toast.error("Failed to delete data. Please try again.");
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="text-center">
          <Download className="mx-auto h-8 w-8 animate-pulse text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading export options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Export Center</h1>
          <p className="mt-2 text-muted-foreground">Generate comprehensive PDF reports for your events</p>
        </div>

        {/* Event Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Select Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an event for detailed exports" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} ({format(new Date(event.startDate), "MMM yyyy")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Export Options */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* All Events Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Export list of all events with their details
              </p>
              <Button 
                onClick={exportAllEvents} 
                disabled={isExporting}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Export All Events
              </Button>
            </CardContent>
          </Card>

          {/* Event Details Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Export event info with teams and players
              </p>
              <Button 
                onClick={exportEventDetails} 
                disabled={isExporting || !selectedEvent}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Event Details
              </Button>
            </CardContent>
          </Card>

          {/* Donations Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartHandshake className="h-5 w-5" />
                Donations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Export donation details and totals
              </p>
              <Button 
                onClick={exportDonations} 
                disabled={isExporting || !selectedEvent}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Donations
              </Button>
            </CardContent>
          </Card>

          {/* Budget Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Budget Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Export income, expenses with calculations
              </p>
              <Button 
                onClick={exportBudget} 
                disabled={isExporting || !selectedEvent}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Budget
              </Button>
            </CardContent>
          </Card>

          {/* Ticket Sales Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Ticket Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Export ticket sales report
              </p>
              <Button 
                onClick={exportTicketSales} 
                disabled={isExporting || !selectedEvent}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Ticket Sales
              </Button>
            </CardContent>
          </Card>

          {/* Complete Report Export */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Complete Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Export everything about selected event
              </p>
              <Button 
                onClick={exportAllInOne} 
                disabled={isExporting || !selectedEvent}
                className="w-full"
                variant="default"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Complete Report
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Account Deletion */}
        <Card className="mt-8 border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Permanently delete all your events and data. This action cannot be undone.
            </p>
            <Button 
              onClick={() => setShowDeleteDialog(true)}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete All My Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete All Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your events, registrations, budget items, donations, tickets, and orders. 
              This action cannot be undone and your account will remain but with no data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="confirm-text" className="text-sm font-medium">
              Type "DELETE ALL DATA" to confirm:
            </Label>
            <Input
              id="confirm-text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE ALL DATA"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAccountData}
              disabled={deleteConfirmText !== "DELETE ALL DATA"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
