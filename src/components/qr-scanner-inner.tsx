import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface Props {
  onScan: (text: string) => void;
  onClose?: () => void;
}

export function QrScannerInner({ onScan, onClose }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    console.log('[QrScanner] useEffect triggered');
    let cancelled = false;
    const id = "qr-reader-" + Math.random().toString(36).slice(2, 8);
    console.log('[QrScanner] Creating scanner with ID:', id);
    if (!elRef.current) {
      console.log('[QrScanner] No elRef.current, exiting');
      return;
    }
    elRef.current.id = id;
    const scanner = new Html5Qrcode(id, { verbose: false });
    scannerRef.current = scanner;
    console.log('[QrScanner] Scanner created');

    Html5Qrcode.getCameras()
      .then((cams: any[]) => {
        console.log('[QrScanner] Cameras found:', cams.length);
        if (cancelled || !cams.length) {
          if (!cams.length) setError("No camera found.");
          return;
        }
        const back = cams.find((c: any) => /back|rear|environment/i.test(c.label)) ?? cams[cams.length - 1];
        console.log('[QrScanner] Starting scanner with camera:', back.id);
        scanner
          .start(
            back.id,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decoded: any) => {
              console.log('[QrScanner] QR decoded:', decoded);
              if (!cancelled) {
                console.log('[QrScanner] Calling onScan with decoded data');
                onScan(decoded);
              }
            },
            () => {},
          )
          .then(() => {
            console.log('[QrScanner] Scanner started successfully');
            !cancelled && setReady(true);
          })
          .catch((e: any) => {
            console.error('[QrScanner] Scanner start error:', e);
            setError(e?.message ?? String(e));
          });
      })
      .catch((e: any) => {
        console.error('[QrScanner] Camera access error:', e);
        setError(e?.message ?? String(e));
      });

    return () => {
      console.log('[QrScanner] Cleanup triggered');
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        console.log('[QrScanner] Stopping scanner');
        Promise.resolve(s.stop()).catch(() => {}).finally(() => { try { s.clear(); } catch {} });
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div ref={elRef} className="overflow-hidden rounded-xl border border-border bg-black" />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!ready && !error && <p className="text-xs text-muted-foreground">Requesting camera…</p>}
      {onClose && (
        <Button variant="outline" size="sm" onClick={onClose} className="w-full">
          <X className="mr-1 h-3.5 w-3.5" /> Close scanner
        </Button>
      )}
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Camera className="h-3 w-3" /> Point at a ticket or player QR.
      </p>
    </div>
  );
}
