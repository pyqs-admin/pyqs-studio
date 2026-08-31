"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { QuestionEditor } from "@/components/questions/question-editor";
import { ContentSkeleton, ErrorState } from "@/components/shared/state-panels";
import { PageHeader } from "@/components/shared/page-header";
import { getQuestion } from "@/lib/api/questions";

export default function QuestionPage() { const { questionId } = useParams<{ questionId: string }>(); const question = useQuery({ queryKey: ["question", questionId], queryFn: () => getQuestion(questionId) }); if (question.isLoading) return <ContentSkeleton rows={7} />; if (question.isError || !question.data) return <ErrorState description="We couldn't load this question." onRetry={() => void question.refetch()} />; return <><PageHeader eyebrow={question.data.question.publicQid} title="Question workspace" description={`Revision ${question.data.revision.revisionNumber} · ${question.data.question.status.replaceAll("_", " ")}`} /><QuestionEditor projectId={question.data.question.projectId} subjectId={question.data.revision.subjectId} details={question.data} /></>; }
