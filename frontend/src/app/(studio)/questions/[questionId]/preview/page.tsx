"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, Check, ChevronLeft, MoreHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePageHeader } from "@/components/layout/header-context";
import { ContentSkeleton, ErrorState } from "@/components/shared/state-panels";
import { getMedia, getStudentPreview } from "@/lib/api/explanations";
import { SolutionBlocks } from "@/lib/solution-renderer";
import { getQuestion } from "@/lib/api/questions";

export default function QuestionPreviewPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const question = useQuery({ queryKey: ["question", questionId], queryFn: () => getQuestion(questionId) });
  const preview = useQuery({ queryKey: ["preview", question.data?.revision.id], queryFn: () => getStudentPreview(question.data!.revision.id), enabled: Boolean(question.data?.revision.id) });
  const media = useQuery({ queryKey: ["media"], queryFn: getMedia });

  usePageHeader([{ label: "My questions", href: "/questions" }, ...(question.data ? [{ label: question.data.question.publicQid, href: `/questions/${questionId}` }] : []), { label: "QBank preview" }]);
  if (question.isLoading || preview.isLoading) return <ContentSkeleton rows={8} />;
  if (question.isError || !question.data || preview.isError || !preview.data) return <ErrorState description="We couldn't load the QBank preview." onRetry={() => { void question.refetch(); void preview.refetch(); }} />;

  const data = preview.data;
  return <main className="qbank-preview-page">
    <div className="qbank-preview-inner">
      <header className="qbank-player-header"><Link href={`/questions/${questionId}`} className="qbank-player-exit desktop" aria-label="Exit preview" title="Exit preview"><X className="size-4" /></Link><Link href={`/questions/${questionId}`} className="qbank-player-exit mobile" aria-label="Back to editor"><ChevronLeft className="size-5" /></Link><div className="qbank-progress"><span /></div><button type="button" className="qbank-player-action" aria-label="Preview options"><MoreHorizontal className="size-5" /></button></header>
      <div className="qbank-context-row"><span className="qbank-context-label"><BookOpen className="size-3.5" /> Chapter</span><span className="qbank-context-value">{data.chapter?.name ?? data.subject?.name ?? "Question preview"}</span><span className="qbank-context-count">1 / 1</span></div>
      <article className="qbank-preview-card">
        <section className="qbank-preview-question"><p className="qbank-preview-stem"><span className="qbank-preview-index">1. </span>{data.revision.stem}</p><ol className="qbank-preview-options">{data.options.map((option) => <li key={option.label} className={option.label === data.revision.correctOption ? "is-correct" : ""}><span className="qbank-preview-option-label">{option.label === data.revision.correctOption ? <Check className="size-4" /> : option.label}</span><span>{option.content}</span></li>)}</ol></section>
        <section className="qbank-preview-explanation"><div className="qbank-preview-section-title"><BookOpen className="size-4" /><h2>Explanation</h2></div><p className="qbank-preview-answer">The correct answer is <strong>{data.options.find((option) => option.label === data.revision.correctOption)?.content ?? data.revision.correctOption}</strong></p><SolutionBlocks blocks={data.explanationBlocks} media={media.data ?? []} references={data.references} /></section>
      </article>
    </div>
  </main>;
}
