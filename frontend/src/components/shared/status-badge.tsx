import { cn } from "@/lib/utils";

export const QUESTION_FLOW = ["DRAFT", "QUESTION_SUBMITTED", "NEEDS_EXPLANATION", "RAG_EXPORTED", "RAG_IMPORTED", "EXPLANATION_READY", "UNDER_REVIEW", "CHANGES_REQUESTED", "APPROVED", "PUBLISHED", "ARCHIVED"] as const;

export type QuestionStatus = (typeof QUESTION_FLOW)[number];

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  QUESTION_SUBMITTED: "Needs explanation",
  EXPLANATION_DRAFTED: "Explanation drafted",
  NEEDS_EXPLANATION: "Needs explanation",
  RAG_EXPORTED: "RAG exported",
  RAG_IMPORTED: "RAG imported",
  EXPLANATION_READY: "Explanation drafted",
  UNDER_REVIEW: "In review",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export const statusLabel = (status: string) => STATUS_LABEL[status] ?? status.replaceAll("_", " ");

/* tag tone mirrors the original: grey = waiting, yellow = waiting on the RAG,
   blue = moving, green = done */
export const statusTone = (status: string) =>
  ({
    DRAFT: "neutral",
    QUESTION_SUBMITTED: "indigo",
    NEEDS_EXPLANATION: "warn",
    RAG_EXPORTED: "indigo",
    RAG_IMPORTED: "indigo",
    EXPLANATION_READY: "indigo",
    UNDER_REVIEW: "indigo",
    CHANGES_REQUESTED: "warn",
    APPROVED: "good",
    PUBLISHED: "good",
    ARCHIVED: "neutral",
  })[status] ?? "neutral";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = statusTone(status);
  return (
    <span className={cn("tag", tone !== "neutral" && tone, className)}>
      <i className={cn("dot", status)} aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}

export function StatusBar({ counts }: { counts: Partial<Record<string, number>> }) {
  const total = Object.values(counts).reduce<number>((sum, value) => sum + (value ?? 0), 0);
  if (!total) return <div className="bar" />;
  const shown = QUESTION_FLOW.filter((status) => (counts[status] ?? 0) > 0);
  return (
    <div>
      <div className="bar">
        {shown.map((status) => (
          <i key={status} className={status} style={{ width: `${(100 * (counts[status] ?? 0)) / total}%` }} />
        ))}
      </div>
      <div className="legend">
        {shown.map((status) => (
          <span key={status}>
            <i className={cn("dot", status)} aria-hidden="true" />
            {counts[status]} {statusLabel(status).toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
