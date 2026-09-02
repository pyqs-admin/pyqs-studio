"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ContentSkeleton, EmptyState, ErrorState } from "@/components/shared/state-panels";
import { getPublishReadyQuestions, publishQuestion } from "@/lib/api/projects";

export default function PublishPage() {
  const client = useQueryClient();
  const ready = useQuery({ queryKey: ["publish", "ready"], queryFn: getPublishReadyQuestions });
  const publish = useMutation({ mutationFn: publishQuestion, onSuccess: () => void client.invalidateQueries({ queryKey: ["publish", "ready"] }) });
  if (ready.isLoading) return <ContentSkeleton rows={5} />;
  if (ready.isError || !ready.data) return <ErrorState title="Publishing queue could not be loaded" description="You may not have publishing permission." onRetry={() => void ready.refetch()} />;
  return <><PageHeader eyebrow="Release control" title="Publishing" description="Approved questions ready to publish to PYQS." />{ready.data.length === 0 ? <EmptyState title="Nothing ready to publish" description="Approved questions will appear here." /> : <section className="overflow-hidden rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">QID</th><th className="px-5 py-3">Question</th><th className="px-5 py-3"><span className="sr-only">Actions</span></th></tr></thead><tbody>{ready.data.map(({ question, revision }) => <tr key={question.id} className="border-b last:border-0"><td className="px-5 py-4 font-mono text-xs">{question.publicQid}</td><td className="px-5 py-4"><Link className="font-medium hover:underline" href={`/questions/${question.id}`}>{revision.stem}</Link></td><td className="px-5 py-4 text-right"><Button onClick={() => publish.mutate(question.id)} disabled={publish.isPending}><Send className="size-4" />Publish</Button></td></tr>)}</tbody></table>{publish.isError && <p className="p-4 text-sm text-red-700">{publish.error.message}</p>}</section>}</>;
}
