import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({ label, hint, required, className, children }: { label: ReactNode; hint?: ReactNode; required?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={cn("f", className)}>
      <label>
        {label}
        {required && <span className="req" aria-hidden="true">•</span>}
        {hint && <span className="small">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
