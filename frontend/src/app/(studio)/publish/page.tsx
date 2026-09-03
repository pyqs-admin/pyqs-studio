"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import Link from "next/link";
import { usePageHeader } from "@/components/layout/header-context";
import { ContentSkeleton, EmptyState, ErrorState } from "@/components/shared/state-panels";
import { getPublishReadyQuestions, publishQuestion } from "@/lib/api/projects";

export default function PublishPage() {
  usePageHeader([{ label: "Publishing" }]);
  const client = useQueryClient();
  const ready = useQuery({ queryKey: ["publish", "ready"], queryFn: getPublishReadyQuestions });
  const publish = useMutation({
    mutationFn: publishQuestion,
    onSuccess: () => void client.invalidateQueries({ queryKey: ["publish", "ready"] }),
  });

  if (ready.isLoading) return <ContentSkeleton rows={5} />;
  if (ready.isError || !ready.data) return <ErrorState title="Publishing queue could not be loaded" description="You may not have publishing permission." onRetry={() => void ready.refetch()} />;

  return (
    <>
      <h1>Publishing</h1>
      <p className="sub">Approved questions ready to publish to PYQS.</p>
      {ready.data.length === 0 ? (
        <EmptyState title="Nothing ready to publish" description="Approved questions will appear here." pose="happy" />
      ) : (
        <table className="list">
          <thead>
            <tr>
              <th>QID</th>
              <th>Question</th>
              <th><span className="sr-only">Publish</span></th>
            </tr>
          </thead>
          <tbody>
            {ready.data.map(({ question, revision }) => (
              <tr key={question.id}>
                <td className="mono">{question.publicQid}</td>
                <td className="max-w-xl">
                  <Link href={`/questions/${question.id}`} className="font-bold text-pq-ink">{revision.stem}</Link>
                </td>
                <td className="text-right">
                  <button type="button" className="btn pri sm" onClick={() => publish.mutate(question.id)} disabled={publish.isPending}>
                    <Send className="size-3.5" aria-hidden="true" /> Publish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {publish.isError && <p className="err mt-3">{publish.error.message}</p>}
    </>
  );
}
