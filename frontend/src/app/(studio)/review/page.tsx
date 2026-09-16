"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePageHeader } from "@/components/layout/header-context";
import { ContentSkeleton, EmptyState, ErrorState } from "@/components/shared/state-panels";
import { StatusBadge } from "@/components/shared/status-badge";
import { getReviewQueue } from "@/lib/api/review";

export default function ReviewQueuePage() {
  usePageHeader([{ label: "Review" }]);
  const queue = useQuery({ queryKey: ["review", "queue"], queryFn: getReviewQueue });

  if (queue.isLoading) return <ContentSkeleton rows={5} />;
  if (queue.isError || !queue.data) return <ErrorState description="We couldn't load your review queue." onRetry={() => void queue.refetch()} />;

  return (
    <>
      <h1>Review</h1>
      <p className="sub">{queue.data.items.length} assigned item{queue.data.items.length === 1 ? "" : "s"}. Work through them in order, or skip an item when needed.</p>
      {queue.data.items.length === 0 ? (
        <EmptyState title="Your review queue is clear" description="New assigned questions will appear here." pose="happy" />
      ) : (
        <table className="list">
          <thead>
            <tr>
              <th>Question</th>
              <th>Review state</th>
              <th>Report</th>
              <th>Medical review</th>
              <th><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody>
            {queue.data.items.map((item, index) => (
              <tr key={item.item.id}>
                <td className="max-w-xl">
                  <p className="mono small">{index + 1} · {item.question.publicQid}</p>
                  <p className="mt-0.5">{item.revision.stem}</p>
                </td>
                <td><StatusBadge status={item.question.status} /></td>
                <td className="max-w-sm">{item.report ? <div><span className="tag warn">{item.report.reason.replaceAll("_", " ")}</span><p className="mt-1 text-xs text-[var(--pq-ink-2)]">{item.report.description || "No additional note provided."}</p><p className="mt-1 text-[11px] text-[var(--pq-ink-3)]">Reported by {item.report.profileName || item.report.profileEmail}</p></div> : <span className="tag">No report</span>}</td>
                <td>{item.revision.requiresMedicalReview === "yes" ? <span className="tag warn">Required</span> : <span className="tag">Not required</span>}</td>
                <td className="text-right">
                  <Link className="btn sm" href={`/review/${item.question.id}?queue=${item.item.queueId}`}>Review</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
