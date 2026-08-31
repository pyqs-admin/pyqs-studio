"use client";

import { useParams } from "next/navigation";
import { QuestionEditor } from "@/components/questions/question-editor";
import { PageHeader } from "@/components/shared/page-header";

export default function NewQuestionPage() { const { projectId, subjectId } = useParams<{ projectId: string; subjectId: string }>(); return <><PageHeader eyebrow="New draft" title="Add question" description="Create a four-option MCQ. It will be saved as a draft." /><QuestionEditor projectId={projectId} subjectId={subjectId} /></>; }
