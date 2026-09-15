"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { usePageHeader } from "@/components/layout/header-context";
import { ContentSkeleton, EmptyState, ErrorState } from "@/components/shared/state-panels";
import { StatusBadge } from "@/components/shared/status-badge";
import { getProject, getQuestions, getSubject } from "@/lib/api/projects";
import { questionPageKey, useProjectStore } from "@/lib/stores/project-store";

const pageSize = 10;
const statusOptions = ["DRAFT", "QUESTION_SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED", "APPROVED", "PUBLISHED"];

function SubjectWorkspaceContent() {
  const { projectId, subjectId } = useParams<{ projectId: string; subjectId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [page, setPage] = useState(0);
  const cachedProject = useProjectStore((state) => state.projectDetails[projectId]);
  const cachedSubjectName = useProjectStore((state) => state.subjectNames[subjectId]);
  const cachedQuestionPage = useProjectStore((state) => state.questionPages[questionPageKey(projectId, subjectId, query, status, page)]);
  const setProjectDetails = useProjectStore((state) => state.setProjectDetails);
  const setSubjectName = useProjectStore((state) => state.setSubjectName);
  const setQuestionPage = useProjectStore((state) => state.setQuestionPage);
  const project = useQuery({ queryKey: ["projects", projectId], queryFn: () => getProject(projectId), initialData: cachedProject });
  const subject = useQuery({ queryKey: ["taxonomy", "subject", subjectId], queryFn: () => getSubject(subjectId), initialData: cachedSubjectName ? { id: subjectId, name: cachedSubjectName } : undefined, staleTime: 300_000 });
  const questions = useQuery({
    queryKey: ["questions", { projectId, subjectId, query, status, page }],
    queryFn: () => getQuestions({ projectId, subjectId, q: query || undefined, status: status || undefined, limit: pageSize, offset: page * pageSize }),
    initialData: cachedQuestionPage?.rows,
    initialDataUpdatedAt: cachedQuestionPage?.fetchedAt,
    placeholderData: keepPreviousData,
  });

  useEffect(() => { if (project.data) setProjectDetails(projectId, project.data); }, [project.data, projectId, setProjectDetails]);
  useEffect(() => { if (subject.data?.name) setSubjectName(subjectId, subject.data.name); }, [subject.data?.name, subjectId, setSubjectName]);
  useEffect(() => { if (questions.data) setQuestionPage(questionPageKey(projectId, subjectId, query, status, page), questions.data); }, [questions.data, projectId, subjectId, query, status, page, setQuestionPage]);
  useEffect(() => { void router.prefetch(`/projects/${projectId}/subjects/${subjectId}/questions/new`); }, [projectId, subjectId, router]);

  const subjectName = subject.data?.name;
  usePageHeader([
    { label: "Projects", href: "/projects" },
    ...(project.data ? [{ label: project.data.project.name, href: `/projects/${projectId}` }] : []),
    ...(subjectName ? [{ label: subjectName }] : []),
  ]);

  if (project.isLoading || subject.isLoading || questions.isLoading) return <ContentSkeleton rows={6} />;
  if (project.isError || subject.isError || questions.isError || !project.data || !subject.data || !questions.data) {
    return <ErrorState description="We couldn't load this subject workspace." onRetry={() => { void project.refetch(); void subject.refetch(); void questions.refetch(); }} />;
  }

  return (
    <>
      <h1>{subjectName ?? "Subject workspace"}</h1>
      <p className="sub">Project, exam, year and subject context are retained here. Search the section or filter by where each question is in the flow.</p>
      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <label className="qsearch min-w-0 flex-1">
          <Search className="size-4" aria-hidden="true" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Find in this subject" />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {["", ...statusOptions].map((item) => (
            <button
              key={item || "ALL"}
              type="button"
              className="fchip"
              aria-pressed={status === item}
              onClick={() => { setStatus(item); setPage(0); }}
            >
              {item ? item.replaceAll("_", " ") : "All statuses"}
            </button>
          ))}
        </div>
        <Link className="btn pri sm" href={`/projects/${projectId}/subjects/${subjectId}/questions/new`}>
          <Plus className="size-3.5" aria-hidden="true" /> New question
        </Link>
      </div>
      {questions.data.length === 0 ? (
        <EmptyState
          title="No matching questions"
          description={query || status ? "Try clearing a filter, or add a new question." : "Add the first question for this subject."}
          action={
            <Link className="btn pri" href={`/projects/${projectId}/subjects/${subjectId}/questions/new`}>
              <Plus className="size-4" aria-hidden="true" /> New question
            </Link>
          }
        />
      ) : (
        <>
          <table className="list">
            <thead>
              <tr>
                <th>QID</th>
                <th>Question</th>
                <th>Status</th>
                <th><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {questions.data.map(({ question, revision }) => (
                <tr key={question.id}>
                  <td className="mono">Q{question.questionNumber}</td>
                  <td className="max-w-xl">{revision.stem}</td>
                  <td><StatusBadge status={question.status} /></td>
                  <td className="text-right">
                    <Link className="btn sm" href={`/questions/${question.id}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="addrow justify-between">
            <span className="small">Page {page + 1}</span>
            <span className="flex gap-2">
              <button type="button" className="btn sm" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</button>
              <button type="button" className="btn sm" disabled={questions.data.length < pageSize} onClick={() => setPage((value) => value + 1)}>Next</button>
            </span>
          </div>
        </>
      )}
    </>
  );
}

export default function SubjectWorkspacePage() {
  return (
    <Suspense fallback={<ContentSkeleton rows={6} />}>
      <SubjectWorkspaceContent />
    </Suspense>
  );
}
