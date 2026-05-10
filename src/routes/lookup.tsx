import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { eventsApi, ordersApi, ticketsApi, hydrateStore } from "@/lib/store";
import { useStoreSignal } from "@/hooks/use-store";
import { fmtMoney } from "@/lib/currency";
import { downloadTicketPdf } from "@/lib/ticket-pass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Ticket, CheckCircle2, Download, ExternalLink, Sparkles, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/lookup")({
  component: OrderLookup,
});

function OrderLookup() {
  useStoreSignal();
  const [loading, setLoading] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  const [searched, setSearched] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    hydrateStore().finally(() => setHydrating(false));
  }, []);

  if (hydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading ticket system…
        </div>
      </div>
    );
  }

  async function handleSearch() {
    const code = orderCode.trim().toUpperCase();
    if (!code) {
      toast.error("Please enter an order code");
      return;
    }

    setLoading(true);
    setSearched(false);

    try {
      // Ensure store is hydrated
      await hydrateStore();
      
      // Find order by matching the last 8 characters of the ID
      const allOrders = ordersApi.list();
      console.log('Available orders:', allOrders.map(o => ({ id: o.id, code: o.id.slice(-8).toUpperCase() })));
      console.log('Searching for code:', code);
      
      const foundOrder = allOrders.find(o => o.id.slice(-8).toUpperCase() === code);
      
      if (!foundOrder) {
        setSearched(true);
        setOrder(null);
        setEvent(null);
        setTicket(null);
        toast.error("We couldn't find an order with that code. Please check the code and try again.");
        return;
      }

      const foundEvent = eventsApi.get(foundOrder.eventId);
      const foundTicket = ticketsApi.list(foundOrder.eventId).find(t => t.id === foundOrder.ticketId);

      setSearched(true);
      setOrder(foundOrder);
      setEvent(foundEvent);
      setTicket(foundTicket);
      console.log('Order found:', foundOrder);
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isApproved = order?.status === "approved";
  const isRejected = order?.status === "rejected";
  const isPending = order?.status === "pending";

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Powered by PitchPro
          </Link>
          <h1 className="mt-6 font-display text-4xl font-bold">Check Your Ticket</h1>
          <p className="mt-2 text-muted-foreground">Enter your order code to view your ticket status and download your pass.</p>
        </div>

        {/* Search Form */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Enter order code (e.g., ABC12345)"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                className="pl-10 font-mono"
                maxLength={8}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={!orderCode.trim() || loading}>
              {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {loading ? "Searching..." : "Lookup"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Your order code is the 8-character code shown after purchase (e.g., #ABC12345)
          </p>
        </div>

        {/* Results */}
        {searched && (
          <div className="mt-6">
            {!order ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
                <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="mt-4 font-display text-xl font-semibold">Order Not Found</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We couldn't find an order with that code. Please check:
                </p>
                <ul className="mt-2 text-sm text-muted-foreground text-left space-y-1">
                  <li>• You're entering the 8-character code (without #)</li>
                  <li>• The code matches what was shown after purchase</li>
                  <li>• Your payment was submitted successfully</li>
                </ul>
                <p className="mt-3 text-sm text-muted-foreground">
                  If you recently made a purchase, please wait a few minutes and try again.
                </p>
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" size="sm" onClick={() => {
                    setSearched(false);
                    setOrderCode("");
                  }}>
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <div className={`rounded-3xl border bg-card p-8 shadow-pop ${
                isApproved ? "border-success/40" : 
                isRejected ? "border-destructive/40" : 
                "border-warning/40"
              }`}>
                {/* Status Header */}
                <div className="text-center">
                  <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                    isApproved ? "bg-success/20" : 
                    isRejected ? "bg-destructive/20" : 
                    "bg-warning/20"
                  }`}>
                    <CheckCircle2 className={`h-9 w-9 ${
                      isApproved ? "text-success" : 
                      isRejected ? "text-destructive" : 
                      "text-warning"
                    }`} />
                  </div>
                  <h2 className="mt-4 font-display text-3xl font-bold">
                    {isApproved ? "Ticket Approved!" : 
                     isRejected ? "Order Rejected" : 
                     "Pending Approval"}
                  </h2>
                  <div className="mt-2 inline-block rounded-md border border-primary/30 bg-primary/10 px-4 py-2 font-mono-num text-lg font-bold text-primary">
                    #{order.id.slice(-8).toUpperCase()}
                  </div>
                </div>

                {/* Order Details */}
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <h3 className="font-semibold">Order Details</h3>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Event:</span>
                        <span className="font-medium">{event?.name || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ticket:</span>
                        <span className="font-medium">{ticket?.name || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium">{order.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-mono-num font-bold text-primary">
                          {order.total === 0 ? "FREE" : fmtMoney(order.total, event?.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Buyer:</span>
                        <span className="font-medium">{order.buyerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Submitted:</span>
                        <span className="font-medium">{format(new Date(order.submittedAt), "PP p")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Messages */}
                  {isApproved && (
                    <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
                      <p className="font-semibold text-success">Payment verified ✓</p>
                      <p className="mt-1 text-muted-foreground">
                        Your ticket is ready! Download your digital pass below. It contains a QR code that will be scanned at the venue.
                      </p>
                    </div>
                  )}

                  {isPending && (
                    <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
                      <p className="font-semibold text-warning">Waiting for payment verification</p>
                      <p className="mt-1 text-muted-foreground">
                        The organizer is reviewing your payment proof. You can check back here anytime using your order code. 
                        {event?.contactPhone && (
                          <> Need help? Contact the organizer at <a href={`tel:${event.contactPhone}`} className="text-primary underline">{event.contactPhone}</a>.</>
                        )}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Tip: Save this page or bookmark your order code for easy access.
                      </p>
                    </div>
                  )}

                  {isRejected && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
                      <p className="font-semibold text-destructive">Payment verification failed</p>
                      <p className="mt-1 text-muted-foreground">
                        Your payment proof could not be verified. Please contact the organizer for assistance.
                        {event?.contactPhone && (
                          <> You can reach them at <a href={`tel:${event.contactPhone}`} className="text-primary underline">{event.contactPhone}</a>.</>
                        )}
                      </p>
                      {order.notes && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Note: {order.notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {isApproved && ticket && event && (
                      <Button 
                        onClick={() => downloadTicketPdf(event, ticket, order)} 
                        size="lg" 
                        className="w-full shadow-glow"
                      >
                        <Download className="mr-2 h-4 w-4" /> Download Ticket (PDF with QR)
                      </Button>
                    )}
                    
                    <Button variant="outline" asChild className="w-full">
                      <a href={`/tickets/${event?.id}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" /> Buy Another Ticket
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Debug Section - Remove in production */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 rounded-xl border border-border bg-muted/20 p-4">
            <h3 className="font-display text-sm font-semibold">Debug: Available Orders</h3>
            <div className="mt-2 text-xs">
              {(() => {
                const allOrders = ordersApi.list();
                if (allOrders.length === 0) {
                  return <p className="text-muted-foreground">No orders found in system</p>;
                }
                return (
                  <div className="space-y-1">
                    {allOrders.map(o => (
                      <div key={o.id} className="text-muted-foreground">
                        Code: #{o.id.slice(-8).toUpperCase()} | Status: {o.status} | Buyer: {o.buyerName}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )} */}

        {/* Help Section */}
        <div className="mt-12 text-center">
          <h3 className="font-display text-lg font-semibold">Need Help?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            If you can't find your order or have questions, contact the event organizer directly.
          </p>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link to="/">Back to PitchPro</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
