import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { SportsEvent, TeamRegistration } from "./store";
import { sportLabel } from "./sports";
import { format } from "date-fns";
import { fmtMoney } from "./currency";

export function teamQrPayload(reg: TeamRegistration): string {
  const params = new URLSearchParams({ e: reg.eventId, n: reg.teamName });
  return `${window.location.origin}/verify/team/${reg.id}?${params}`;
}
export function playerQrPayload(reg: TeamRegistration, playerIdx: number): string {
  const name = reg.players[playerIdx]?.name || "Player";
  const params = new URLSearchParams({ e: reg.eventId, n: name });
  return `${window.location.origin}/verify/player/${reg.id}/${playerIdx}?${params}`;
}

// Generates a multi-page PDF with one event pass per player + a team master pass.
export async function generateEventPassesPdf(event: SportsEvent, reg: TeamRegistration): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a5", orientation: "portrait" });
  const code = `#${reg.id.slice(-6).toUpperCase()}`;

  const drawPass = async (params: {
    label: string;
    name: string;
    sub?: string;
    jersey?: string;
    isTeam?: boolean;
    qrPayload?: string;
  }) => {
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // Background
    doc.setFillColor(15, 18, 35); // midnight navy
    doc.rect(0, 0, W, H, "F");

    // Top accent strip
    doc.setFillColor(199, 255, 0); // electric lime
    doc.rect(0, 0, W, 14, "F");

    // Header band
    doc.setFillColor(26, 31, 51);
    doc.rect(0, 14, W, 70, "F");

    doc.setTextColor(199, 255, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("EVENT PASS", 24, 36);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(event.name, 24, 58, { maxWidth: W - 48 });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(180, 188, 208);
    doc.text(`${sportLabel(event.sport)}  •  ${format(new Date(event.startDate), "PPP p")}`, 24, 74, { maxWidth: W - 48 });

    // Pass type label
    doc.setFillColor(199, 255, 0);
    doc.roundedRect(24, 100, 80, 22, 4, 4, "F");
    doc.setTextColor(15, 18, 35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(params.label, 64, 115, { align: "center" });

    // Name block
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(params.name, 24, 152, { maxWidth: W - 48 });

    if (params.sub) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(180, 188, 208);
      doc.text(params.sub, 24, 172, { maxWidth: W - 48 });
    }

    if (params.jersey) {
      doc.setFillColor(199, 255, 0);
      doc.circle(W - 50, 140, 26, "F");
      doc.setTextColor(15, 18, 35);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text(`#${params.jersey}`, W - 50, 147, { align: "center" });
    }

    // Divider
    doc.setDrawColor(60, 70, 95);
    doc.setLineDashPattern([3, 3], 0);
    doc.line(24, 200, W - 24, 200);
    doc.setLineDashPattern([], 0);

    // Details grid
    const detailsY = 220;
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

    detailLine(detailsY, "Team", reg.teamName);
    detailLine(detailsY + 36, "Captain", `${reg.captainName} • ${reg.captainPhone}`);
    detailLine(detailsY + 72, "Venue", event.venue || "TBD");
    detailLine(detailsY + 108, "Pass code", code);

    // Prize / fee row
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 170);
    doc.text("ENTRY", 24, detailsY + 144);
    doc.text("PRIZE POOL", W / 2, detailsY + 144);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(199, 255, 0);
    doc.text(fmtMoney(event.entryFee, event.currency), 24, detailsY + 158);
    doc.text(fmtMoney(event.prizePool, event.currency), W / 2, detailsY + 158);

    // QR code
    if (params.qrPayload) {
      try {
        const qrDataUrl = await QRCode.toDataURL(params.qrPayload, { margin: 0, width: 220, color: { dark: "#0f1223", light: "#ffffff" } });
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(W - 110, detailsY + 130, 86, 86, 6, 6, "F");
        doc.addImage(qrDataUrl, "PNG", W - 106, detailsY + 134, 78, 78);
      } catch {}
    }

    // Footer
    doc.setFillColor(26, 31, 51);
    doc.rect(0, H - 44, W, 44, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 170);
    doc.text("Present this pass at the gate. Verification required.", 24, H - 24);
    doc.setTextColor(199, 255, 0);
    doc.setFont("helvetica", "bold");
    doc.text("PitchPro", W - 24, H - 24, { align: "right" });
  };

  // Team master pass first
  await drawPass({
    label: "TEAM",
    name: reg.teamName,
    sub: `${reg.players.length} players • Captain: ${reg.captainName}`,
    isTeam: true,
    qrPayload: teamQrPayload(reg),
  });

  // One pass per player
  for (let i = 0; i < reg.players.length; i++) {
    const p = reg.players[i];
    doc.addPage();
    await drawPass({
      label: "PLAYER",
      name: p.name,
      sub: p.phone ? `Phone: ${p.phone}` : undefined,
      jersey: p.jersey,
      qrPayload: playerQrPayload(reg, i),
    });
  }

  return doc;
}

export async function downloadEventPasses(event: SportsEvent, reg: TeamRegistration) {
  const doc = await generateEventPassesPdf(event, reg);
  const safe = `${event.name}-${reg.teamName}`.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`${safe}-passes.pdf`);
}
