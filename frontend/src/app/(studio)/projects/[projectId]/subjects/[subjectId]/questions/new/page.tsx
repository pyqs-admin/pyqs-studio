"use client";

import { useParams } from "next/navigation";
import { usePageHeader } from "@/components/layout/header-context";
import { QuestionEditor } from "@/components/questions/question-editor";

export default function NewQuestionPage() {
  const { projectId, subjectId } = useParams<{ projectId: string; subjectId: string }>();
  usePageHeader([{ label: "Projects", href: "/projects" }, { label: "New question" }]);
  return <QuestionEditor projectId={projectId} subjectId={subjectId} />;
}
