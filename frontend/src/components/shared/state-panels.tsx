import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({ title, description, action, pose = "normal" }: { title: string; description: string; action?: ReactNode; pose?: "normal" | "lens" | "reading" | "waving" | "happy" }) {
  return (
    <section className="empty">
      <img src={`/theme/assets/mascot/${pose}.svg`} alt="" />
      <h2 className="empty__title">{title}</h2>
      <p className="empty__hint">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </section>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry }: { title?: string; description: string; onRetry?: () => void }) {
  return (
    <section className="card">
      <div className="flex items-start gap-3">
        <p className="small mt-0.5">
          <b className="text-pq-danger">{title}</b>
          <br />
          {description}
        </p>
        {onRetry && (
          <button type="button" className="btn sm ml-auto" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </section>
  );
}

export function ContentSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-label="Loading content" role="status">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={cn("h-14 animate-pulse rounded-pq-md bg-pq-muted-2", index % 4 === 3 && "w-2/3")} />
      ))}
      <span className="sr-only">Loading content</span>
    </div>
  );
}
