import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { SportsEvent } from "@/lib/store";
import { Copy, Download, Share2, MessageCircle, Twitter, Facebook, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export function ShareDialog({ event, onClose }: { event: SportsEvent; onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const url = typeof window !== "undefined" ? `${window.location.origin}/register/${event.id}` : "";
  const shareText = `🏆 Register your team for "${event.name}"! Open registration via this link:`;

  const close = () => {
    setOpen(false);
    setTimeout(onClose, 150);
  };

  function downloadQR() {
    const canvas = document.getElementById("share-qr") as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${event.name.replace(/\s+/g, "-")}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: event.name, text: shareText, url });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(`${shareText} ${url}`);
      toast.success("Copied to clipboard");
    }
  }

  const enc = encodeURIComponent(`${shareText} ${url}`);
  const wa = `https://wa.me/?text=${enc}`;
  const tw = `https://twitter.com/intent/tweet?text=${enc}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Share registration</DialogTitle>
        </DialogHeader>
        <div className="flex w-full min-w-0 flex-col items-center gap-4 py-2">
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <QRCodeCanvas
              id="share-qr"
              value={url}
              size={200}
              level="H"
              bgColor="#ffffff"
              fgColor="#1a1f33"
              includeMargin={false}
            />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Print, post or message this QR. Scanning opens the team registration form.
          </p>
          <div className="flex w-full min-w-0 items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs">
            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="block min-w-0 flex-1 overflow-hidden truncate font-mono">{url}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(url);
                toast.success("Link copied");
              }}
              className="shrink-0 text-primary hover:opacity-80"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid w-full min-w-0 grid-cols-2 gap-2">
            <Button onClick={nativeShare} className="col-span-2">
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button asChild variant="outline">
              <a href={wa} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={tw} target="_blank" rel="noopener noreferrer">
                <Twitter className="mr-2 h-4 w-4" /> Twitter
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={fb} target="_blank" rel="noopener noreferrer">
                <Facebook className="mr-2 h-4 w-4" /> Facebook
              </a>
            </Button>
            <Button variant="outline" onClick={downloadQR}>
              <Download className="mr-2 h-4 w-4" /> Save QR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
