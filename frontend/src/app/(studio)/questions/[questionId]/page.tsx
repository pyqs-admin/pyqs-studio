"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { usePageHeader } from "@/components/layout/header-context";
import { QuestionEditor } from "@/components/questions/question-editor";
import { ContentSkeleton, ErrorState } from "@/components/shared/state-panels";
import { getQuestion } from "@/lib/api/questions";

export default function QuestionPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const question = useQuery({ queryKey: ["question", questionId], queryFn: () => getQuestion(questionId) });

  usePageHeader([
    { label: "My questions", href: "/questions" },
    ...(question.data ? [{ label: question.data.question.publicQid }] : []),
  ]);

  if (question.isLoading) return <ContentSkeleton rows={7} />;
  if (question.isError || !question.data) return <ErrorState description="We couldn't load this question." onRetry={() => void question.refetch()} />;

  return <QuestionEditor projectId={question.data.question.projectId} subjectId={question.data.revision.subjectId} details={question.data} />;
}
