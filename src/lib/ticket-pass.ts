import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { SportsEvent, TicketType, TicketOrder } from "./store";
import { sportLabel } from "./sports";
import { format } from "date-fns";
import { fmtMoney } from "./currency";

export function ticketQrPayload(order: TicketOrder): string {
  return JSON.stringify({ t: "ticket", id: order.id, e: order.eventId });
}

export async function generateTicketPdf(event: SportsEvent, ticket: TicketType, order: TicketOrder): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a5", orientation: "portrait" });
  const code = `#${order.id.slice(-8).toUpperCase()}`;
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  doc.setFillColor(15, 18, 35);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(199, 255, 0);
  doc.rect(0, 0, W, 14, "F");

  doc.setFillColor(26, 31, 51);
  doc.rect(0, 14, W, 70, "F");
  doc.setTextColor(199, 255, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ADMIT ONE • TICKET", 24, 36);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(event.name, 24, 58, { maxWidth: W - 48 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(180, 188, 208);
  doc.text(`${sportLabel(event.sport)}  •  ${format(new Date(event.startDate), "PPP p")}`, 24, 74, { maxWidth: W - 48 });

  doc.setFillColor(199, 255, 0);
  doc.roundedRect(24, 100, 110, 22, 4, 4, "F");
  doc.setTextColor(15, 18, 35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(ticket.name.toUpperCase(), 79, 115, { align: "center", maxWidth: 100 });

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(order.buyerName, 24, 152, { maxWidth: W - 48 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(180, 188, 208);
  doc.text(`${order.quantity} × ${ticket.name}`, 24, 172);

  doc.setFillColor(199, 255, 0);
  doc.circle(W - 50, 140, 26, "F");
  doc.setTextColor(15, 18, 35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(`×${order.quantity}`, W - 50, 147, { align: "center" });

  doc.setDrawColor(60, 70, 95);
  doc.setLineDashPattern([3, 3], 0);
  doc.line(24, 200, W - 24, 200);
  doc.setLineDashPattern([], 0);

  const detailLine = (y: number, k: string, v: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 170);
    doc.text(k.toUpperCase(), 24, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(v, 24, y + 14, { maxWidth: W - 48 });
  };

  detailLine(220, "Venue", event.venue || "TBD");
  detailLine(256, "Contact", order.buyerPhone || order.buyerEmail || "—");
  detailLine(292, "Ticket code", code);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 150, 170);
  doc.text("TOTAL PAID", 24, 336);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(199, 255, 0);
  doc.text(fmtMoney(order.total, event.currency), 24, 352);

  // QR code (right side)
  try {
    const qrDataUrl = await QRCode.toDataURL(ticketQrPayload(order), { margin: 0, width: 220, color: { dark: "#0f1223", light: "#ffffff" } });
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(W - 110, 220, 86, 86, 6, 6, "F");
    doc.addImage(qrDataUrl, "PNG", W - 106, 224, 78, 78);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(140, 150, 170);
    doc.text("Scan at gate", W - 67, 314, { align: "center" });
  } catch {}

  doc.setFillColor(26, 31, 51);
  doc.rect(0, H - 44, W, 44, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 150, 170);
  doc.text("Present this ticket at the gate. One scan per entry.", 24, H - 24);
  doc.setTextColor(199, 255, 0);
  doc.setFont("helvetica", "bold");
  doc.text("PitchPro", W - 24, H - 24, { align: "right" });

  return doc;
}

export async function downloadTicketPdf(event: SportsEvent, ticket: TicketType, order: TicketOrder) {
  const doc = await generateTicketPdf(event, ticket, order);
  const safe = `${event.name}-${order.buyerName}`.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`${safe}-ticket.pdf`);
}

export async function ticketPdfBlob(event: SportsEvent, ticket: TicketType, order: TicketOrder): Promise<Blob> {
  const doc = await generateTicketPdf(event, ticket, order);
  return doc.output("blob");
}
