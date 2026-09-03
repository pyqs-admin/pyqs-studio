"use client";

import { useParams } from "next/navigation";
import { usePageHeader } from "@/components/layout/header-context";
import { QuestionEditor } from "@/components/questions/question-editor";

export default function NewQuestionPage() {
  const { projectId, subjectId } = useParams<{ projectId: string; subjectId: string }>();
  usePageHeader([{ label: "Projects", href: "/projects" }, { label: "New question" }]);
  return (
    <>
      <h1>Add question</h1>
      <p className="sub">Create a four-option MCQ. It will be saved as a draft; ⌘S saves now, ⌘⏎ submits it for review.</p>
      <QuestionEditor projectId={projectId} subjectId={subjectId} />
    </>
  );
}
