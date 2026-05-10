import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ZoomIn } from "lucide-react";

interface Props {
  src: string;
  alt?: string;
  thumbClassName?: string;
}

export function ImageZoom({ src, alt = "image", thumbClassName }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative overflow-hidden rounded-md border border-border ${thumbClassName ?? "h-14 w-14"}`}
        title="Click to zoom"
      >
        <img src={src} alt={alt} className="h-full w-full object-cover transition group-hover:scale-110" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
          <ZoomIn className="h-4 w-4" />
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
          <img src={src} alt={alt} className="max-h-[85vh] w-full rounded-lg object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
}
