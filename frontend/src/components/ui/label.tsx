import { type LabelHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn("flex items-center gap-1.5 text-xs font-bold tracking-tight text-pq-ink-2", className)} {...props} />
));
Label.displayName = "Label";
