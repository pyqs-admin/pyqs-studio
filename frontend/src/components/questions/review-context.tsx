"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getStudentPreview } from "@/lib/api/explanations";
import { getReviewQueue } from "@/lib/api/review";

export function ReviewNavigation({ questionId, queueId }: { questionId: string; queueId: string | null }) {
  const queue = useQuery({ queryKey: ["review", "queue"], queryFn: getReviewQueue, enabled: Boolean(queueId) });
  const index = queue.data?.items.findIndex((item) => item.question.id === questionId) ?? -1;
  const previous = index > 0 ? queue.data?.items[index - 1] : null;
  const next = index >= 0 ? queue.data?.items[index + 1] : null;
  if (!queueId || !queue.data) return null;
  return (
    <nav aria-label="Queue navigation" className="addrow !mt-0 justify-between">
      <span>
        {previous ? (
          <Link className="btn sm" href={`/review/${previous.question.id}?queue=${queueId}`}>← Previous</Link>
        ) : (
          <span className="small">First item</span>
        )}
      </span>
      <span>
        {next ? (
          <Link className="btn sm" href={`/review/${next.question.id}?queue=${queueId}`}>Next →</Link>
        ) : (
          <span className="small">Last item</span>
        )}
      </span>
    </nav>
  );
}

export function ReviewExplanation({ revisionId }: { revisionId: string }) {
  const preview = useQuery({ queryKey: ["preview", revisionId], queryFn: () => getStudentPreview(revisionId) });
  if (preview.isLoading) return <p className="small">Loading explanation…</p>;
  if (preview.isError || !preview.data) return <p className="small">No student preview is available for this revision.</p>;
  return (
    <Card title="Explanation and references">
      <div className="space-y-2 text-sm">
        {preview.data.explanationBlocks.length ? (
          preview.data.explanationBlocks.map((block) => (
            <p key={block.id} className="whitespace-pre-line">
              {typeof block.content === "string" ? block.content : Array.isArray(block.content) ? block.content.join("\n") : JSON.stringify(block.content)}
            </p>
          ))
        ) : (
          <p className="small">No explanation blocks yet.</p>
        )}
      </div>
      {preview.data.references.length > 0 && (
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
          {preview.data.references.map((reference, index) => (
            <li key={reference.id ?? index}>
              <a href={reference.sourceUrl} target="_blank" rel="noreferrer">{reference.sourceTitle}</a>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
