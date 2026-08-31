"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ExplanationWorkspace } from "@/components/questions/explanation-workspace";
import { PageHeader } from "@/components/shared/page-header";
import { ContentSkeleton, ErrorState } from "@/components/shared/state-panels";
import { getQuestion } from "@/lib/api/questions";

export default function ExplanationPage() { const { questionId } = useParams<{ questionId: string }>(); const question = useQuery({ queryKey: ["question", questionId], queryFn: () => getQuestion(questionId) }); if (question.isLoading) return <ContentSkeleton rows={6} />; if (question.isError || !question.data) return <ErrorState description="We couldn't load this question." onRetry={() => void question.refetch()} />; return <><PageHeader eyebrow={question.data.question.publicQid} title="Explanation workspace" description="Build an ordered, referenced explanation and inspect the student-facing preview." /><ExplanationWorkspace revisionId={question.data.revision.id} /></>; }
