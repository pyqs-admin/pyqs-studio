import { type HTMLAttributes, type ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  step?: ReactNode;
  title?: ReactNode;
  headerRight?: ReactNode;
}

export const Card = forwardRef<HTMLElement, CardProps>(({ step, title, headerRight, className, children, ...props }, ref) => (
  <section ref={ref} className={cn("card", className)} {...props}>
    {title != null && (
      <h2>
        {step != null && <span className="step">{step}</span>}
        {title}
        <span className="grow" />
        {headerRight}
      </h2>
    )}
    {children}
  </section>
));
Card.displayName = "Card";
