import { cva, type VariantProps } from "class-variance-authority";
import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-[11px] font-bold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--pq-muted-bg-2)] text-[var(--pq-ink-3)]",
        secondary: "border-transparent bg-[var(--pq-blue-10)] text-[var(--pq-blue)]",
        outline: "border-[var(--pq-line)] bg-[var(--pq-surface)] text-[var(--pq-ink-2)]",
        solid: "border-transparent bg-[var(--pq-blue)] text-white",
        success: "border-transparent bg-[var(--pq-success-bg)] text-[var(--pq-success-ink)]",
        destructive: "border-transparent bg-[var(--pq-danger-bg)] text-[var(--pq-danger-ink)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
