"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { usePageHeader } from "@/components/layout/header-context";
import { ExplanationWorkspace } from "@/components/questions/explanation-workspace";
import { ContentSkeleton, ErrorState } from "@/components/shared/state-panels";
import { getQuestion } from "@/lib/api/questions";

export default function ExplanationPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const question = useQuery({ queryKey: ["question", questionId], queryFn: () => getQuestion(questionId) });

  usePageHeader([
    { label: "My questions", href: "/questions" },
    ...(question.data ? [{ label: question.data.question.publicQid, href: `/questions/${questionId}` }] : []),
    { label: "Explanation" },
  ]);

  if (question.isLoading) return <ContentSkeleton rows={6} />;
  if (question.isError || !question.data) return <ErrorState description="We couldn't load this question." onRetry={() => void question.refetch()} />;

  return (
    <>
      <h1>Explanation</h1>
      <p className="sub">{question.data.question.publicQid} — build an ordered, referenced explanation and inspect the student-facing preview.</p>
      <ExplanationWorkspace revisionId={question.data.revision.id} />
    </>
  );
}
