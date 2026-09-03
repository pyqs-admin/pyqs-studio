"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MessageSquare, SkipForward, Undo2 } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { usePageHeader } from "@/components/layout/header-context";
import { ReviewExplanation, ReviewNavigation } from "@/components/questions/review-context";
import { Card } from "@/components/ui/card";
import { ContentSkeleton, ErrorState } from "@/components/shared/state-panels";
import { addComment, approveQuestion, getComments, getReviewItem, requestChanges, skipQueueItem } from "@/lib/api/review";

function ReviewItemContent() {
  const { questionId } = useParams<{ questionId: string }>();
  const queueId = useSearchParams().get("queue");
  const client = useQueryClient();
  const [comment, setComment] = useState("");
  const item = useQuery({ queryKey: ["review", questionId], queryFn: () => getReviewItem(questionId) });
  const comments = useQuery({ queryKey: ["comments", questionId], queryFn: () => getComments(questionId) });

  usePageHeader([
    { label: "Review", href: "/review" },
    ...(item.data ? [{ label: item.data.question.publicQid }] : []),
  ]);

  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["review"] });
    void client.invalidateQueries({ queryKey: ["comments", questionId] });
  };
  const approve = useMutation({ mutationFn: () => approveQuestion(questionId), onSuccess: () => window.location.assign("/review") });
  const changes = useMutation({
    mutationFn: () => requestChanges(questionId, comment),
    onSuccess: () => window.location.assign("/review"),
    onError: (error) => setComment(error.message),
  });
  const skip = useMutation({ mutationFn: () => skipQueueItem(queueId!), onSuccess: () => window.location.assign("/review") });
  const post = useMutation({
    mutationFn: () => addComment(questionId, comment, item.data?.revision.id),
    onSuccess: () => { setComment(""); refresh(); },
  });

  if (item.isLoading) return <ContentSkeleton rows={6} />;
  if (item.isError || !item.data) return <ErrorState description="We couldn't load this review item." onRetry={() => void item.refetch()} />;

  const medical = item.data.revision.requiresMedicalReview === "yes";

  return (
    <>
      <div className="mb-4"><ReviewNavigation questionId={questionId} queueId={queueId} /></div>
      <h1>Review question</h1>
      <p className="sub">
        {medical ? "Medical review is required before this revision can be approved." : "Review the question, options, and discussion before deciding."}
      </p>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-0">
          <Card step={1} title="Question">
            <p className="mb-3 text-lg font-bold leading-6 text-pq-ink-strong">{item.data.revision.stem}</p>
            <ol className="space-y-2">
              {item.data.options.map((option) => (
                <li className="flex items-center gap-3" key={option.label}>
                  <span className="optkey !h-9 !w-8">{option.label}</span>
                  <span>{option.content}</span>
                </li>
              ))}
            </ol>
          </Card>
          <ReviewExplanation revisionId={item.data.revision.id} />
          <Card title={<span className="flex items-center gap-1.5"><MessageSquare className="size-3.5" aria-hidden="true" /> Discussion</span>}>
            {comments.data?.length ? (
              <div>
                {comments.data.map(({ comment: entry, author }) => (
                  <div className="hist" key={entry.id}>
                    <span className="who">{author.displayName}</span>
                    <span className="when"> · {entry.createdAt.slice(0, 16).replace("T", " ")}</span>
                    <p className="mt-0.5">{entry.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="small">No comments yet.</p>
            )}
            <div className="f mt-3">
              <label>Add a comment</label>
              <textarea className="inp" rows={2} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Ask a question or leave a note…" />
            </div>
            <div className="addrow">
              <button type="button" className="btn sm" disabled={!comment.trim() || post.isPending} onClick={() => post.mutate()}>
                Post comment
              </button>
            </div>
          </Card>
        </div>

        <aside>
          <Card title="Decision">
            {medical && <p className="small mb-2.5">A medical reviewer must approve this revision.</p>}
            <button type="button" className="btn success w-full justify-center !mb-2.5" disabled={approve.isPending} onClick={() => approve.mutate()}>
              <Check className="size-4" aria-hidden="true" /> Approve
            </button>
            <div className="f !mb-2.5">
              <label>Send back with changes <span className="small">required</span></label>
              <textarea className="inp" rows={3} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="What should change?" />
            </div>
            <button
              type="button"
              className="btn danger w-full justify-center"
              disabled={!comment.trim() || changes.isPending}
              onClick={() => changes.mutate()}
            >
              <Undo2 className="size-4" aria-hidden="true" /> Request changes
            </button>
            {queueId && (
              <button type="button" className="btn sm w-full justify-center !mt-2.5" disabled={skip.isPending} onClick={() => skip.mutate()}>
                <SkipForward className="size-3.5" aria-hidden="true" /> Skip for now
              </button>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}

export default function ReviewItemPage() {
  return (
    <Suspense fallback={<ContentSkeleton rows={6} />}>
      <ReviewItemContent />
    </Suspense>
  );
}
