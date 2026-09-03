"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Dialog({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="dlg-backdrop" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={cn("dlg", wide && "max-w-[1120px]")}>
        <div className="dlg-h">
          <h2>{title}</h2>
          <span className="grow" />
          <button type="button" className="btn-icon" aria-label="Close" onClick={onClose}>
            <X className="size-[18px]" aria-hidden="true" />
          </button>
        </div>
        <div className="dlg-b">{children}</div>
        {footer != null && <div className="dlg-f">{footer}</div>}
      </div>
    </div>
  );
}
