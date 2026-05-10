import { lazy, Suspense } from "react";
import { Camera } from "lucide-react";

interface Props {
  onScan: (text: string) => void;
  onClose?: () => void;
}

const QrScannerInner = lazy(() => import('./qr-scanner-inner').then(mod => ({ default: mod.QrScannerInner })));

export function QrScanner({ onScan, onClose }: Props) {
  return (
    <Suspense fallback={
      <div className="space-y-2">
        <div className="h-64 rounded-xl border border-border bg-muted animate-pulse" />
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Camera className="h-3 w-3" /> Loading scanner...
        </p>
      </div>
    }>
      <QrScannerInner onScan={onScan} onClose={onClose} />
    </Suspense>
  );
}
