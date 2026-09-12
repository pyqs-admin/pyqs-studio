"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from "react";
import { cn } from "@/lib/utils";

const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer grid size-4 shrink-0 place-items-center rounded-[5px] border-2 border-[var(--pq-ink-3)] bg-[var(--pq-surface)] text-white outline-none transition-colors hover:border-[var(--pq-blue)] focus-visible:ring-2 focus-visible:ring-[var(--pq-blue)] disabled:cursor-not-allowed data-[state=checked]:border-[var(--pq-blue)] data-[state=checked]:bg-[var(--pq-blue)] data-[state=checked]:text-white",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="grid place-items-center text-current">
      <Check className="size-3.5 text-white" strokeWidth={3.5} aria-hidden="true" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
