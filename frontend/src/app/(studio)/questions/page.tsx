"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { usePageHeader } from "@/components/layout/header-context";
import { ContentSkeleton, EmptyState, ErrorState } from "@/components/shared/state-panels";
import { StatusBadge } from "@/components/shared/status-badge";
import { getQuestions } from "@/lib/api/projects";
import { questionPageKey, useProjectStore } from "@/lib/stores/project-store";

const statuses = ["DRAFT", "QUESTION_SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED", "APPROVED", "PUBLISHED", "ARCHIVED"];
const pageSize = 10;

function QuestionsContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [q, setQ] = useState(search);
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [page, setPage] = useState(0);
  const cachedPage = useProjectStore((state) => state.questionPages[questionPageKey("all", "all", q, status, page)]);
  const setQuestionPage = useProjectStore((state) => state.setQuestionPage);
  useEffect(() => {
    const timer = window.setTimeout(() => { setQ(search.trim()); setPage(0); }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  usePageHeader([{ label: "My questions" }]);
  const questions = useQuery({
    queryKey: ["questions", "workspace", q, status, page],
    queryFn: () => getQuestions({ q: q || undefined, status: status || undefined, limit: pageSize, offset: page * pageSize }),
    initialData: cachedPage?.rows,
    initialDataUpdatedAt: cachedPage?.fetchedAt,
    placeholderData: keepPreviousData,
  });
  useEffect(() => { if (questions.data) setQuestionPage(questionPageKey("all", "all", q, status, page), questions.data); }, [questions.data, q, status, page, setQuestionPage]);

  if (questions.isLoading) return <ContentSkeleton rows={6} />;
  if (questions.isError || !questions.data) return <ErrorState title="Questions could not be loaded" description="Check your Studio access and try again." onRetry={() => void questions.refetch()} />;

  return (
    <>
      <h1>My questions</h1>
      <p className="sub">Search and open questions in the projects you can access.</p>
      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <label className="qsearch min-w-0 flex-1">
          <Search className="size-4" aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search QID or question text" />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {["", ...statuses].map((item) => (
            <button key={item || "ALL"} type="button" className="fchip" aria-pressed={status === item} onClick={() => { setStatus(item); setPage(0); }}>
              {item ? item.replaceAll("_", " ") : "All statuses"}
            </button>
          ))}
        </div>
      </div>
      {questions.data.length === 0 ? (
        <EmptyState title="No matching questions" description="Create a project and add questions to see them here." />
      ) : (
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
      )}
      {questions.data.length > 0 && (
        <div className="addrow justify-between">
          <span className="small">Page {page + 1}</span>
          <span className="flex gap-2">
            <button type="button" className="btn sm" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</button>
            <button type="button" className="btn sm" disabled={questions.data.length < pageSize} onClick={() => setPage((value) => value + 1)}>Next</button>
          </span>
        </div>
      )}
    </>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<ContentSkeleton rows={6} />}>
      <QuestionsContent />
    </Suspense>
  );
}
