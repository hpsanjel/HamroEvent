import { createFileRoute, Link } from "@tanstack/react-router";
import { eventsApi, ordersApi, ticketsApi } from "@/lib/store";
import { useHydrated, useStoreSignal } from "@/hooks/use-store";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Ticket, MapPin, Calendar, Shield } from "lucide-react";
import { format } from "date-fns";
import { fmtMoney } from "@/lib/currency";
import { sportLabel } from "@/lib/sports";

export const Route = createFileRoute("/verify/ticket/$orderId")({
  validateSearch: (s: Record<string, unknown>) => ({ e: (s.e as string) || "", n: (s.n as string) || "" }),
  component: VerifyTicket,
});

function VerifyTicket() {
  useStoreSignal();
  const ready = useHydrated();
  const { orderId } = Route.useParams();
  const { e: eventIdFromUrl, n: nameFromUrl } = Route.useSearch();
  const event = eventIdFromUrl ? eventsApi.get(eventIdFromUrl) : null;
  const order = ordersApi.get(orderId);
  const ticket = order ? ticketsApi.get(order.ticketId) : null;

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0f1223] to-[#1a1f33] p-4">
        <div className="text-center text-white/60 text-sm">Loading…</div>
      </div>
    );
  }

  const buyerName = order?.buyerName || nameFromUrl || "Ticket Holder";
  const ev = event || (order ? eventsApi.get(order.eventId) : null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0f1223] to-[#1a1f33] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs text-white/70">
            <Shield className="h-3 w-3" /> Verified by PitchPro
          </div>
        </div>

        <Card className="overflow-hidden border-0 bg-white/5 shadow-2xl backdrop-blur">
          <div className="bg-[#c7ff00] px-6 py-3">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#0f1223]" />
              <span className="font-bold text-sm tracking-wider text-[#0f1223]">VALID TICKET</span>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#c7ff00]/20 mb-3">
                <Ticket className="h-7 w-7 text-[#c7ff00]" />
              </div>
              <h1 className="text-xl font-bold text-white">{buyerName}</h1>
              {ticket && <p className="text-sm text-white/60 mt-0.5">{ticket.name}{order ? ` × ${order.quantity}` : ""}</p>}
            </div>

            <div className="h-px bg-white/10" />

            {ev && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest">Event</p>
                  <p className="text-white font-semibold">{ev.name}</p>
                  <p className="text-xs text-white/60">{sportLabel(ev.sport as any)}</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-widest">Date</p>
                    <p className="text-sm text-white flex items-center gap-1"><Calendar className="h-3 w-3 text-[#c7ff00]" />{format(new Date(ev.startDate), "MMM d, yyyy")}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/40 uppercase tracking-widest">Venue</p>
                    <p className="text-sm text-white flex items-center gap-1"><MapPin className="h-3 w-3 text-[#c7ff00]" />{ev.venue || "TBD"}</p>
                  </div>
                </div>
                {order && (
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-widest">Total Paid</p>
                    <p className="text-lg font-bold text-[#c7ff00]">{fmtMoney(order.total, ev.currency)}</p>
                  </div>
                )}
              </div>
            )}

            {!ev && (
              <div className="text-center text-white/40 text-sm py-4">
                {eventIdFromUrl ? "Loading event details…" : "Event details unavailable"}
              </div>
            )}
          </div>

          <div className="bg-white/5 px-6 py-3">
            <p className="text-center text-xs text-white/30">
              Code: #{orderId.slice(-8).toUpperCase()} · {order?.status === "approved" ? "Approved" : "Pending"}
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-white/20 mt-6">PitchPro · Event Management Platform</p>
      </div>
    </div>
  );
}
