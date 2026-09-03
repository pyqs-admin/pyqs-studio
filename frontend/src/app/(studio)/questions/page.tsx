"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { usePageHeader } from "@/components/layout/header-context";
import { ContentSkeleton, EmptyState, ErrorState } from "@/components/shared/state-panels";
import { StatusBadge } from "@/components/shared/status-badge";
import { getQuestions } from "@/lib/api/projects";

const statuses = ["DRAFT", "QUESTION_SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED", "APPROVED", "PUBLISHED", "ARCHIVED"];

function QuestionsContent() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  usePageHeader([{ label: "My questions" }]);
  const questions = useQuery({
    queryKey: ["questions", "workspace", q, status],
    queryFn: () => getQuestions({ q: q || undefined, status: status || undefined, limit: 100 }),
  });

  if (questions.isLoading) return <ContentSkeleton rows={6} />;
  if (questions.isError || !questions.data) return <ErrorState title="Questions could not be loaded" description="Check your Studio access and try again." onRetry={() => void questions.refetch()} />;

  return (
    <>
      <h1>My questions</h1>
      <p className="sub">Search and open questions in the projects you can access.</p>
      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <label className="qsearch min-w-0 flex-1">
          <Search className="size-4" aria-hidden="true" />
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search QID or question text" />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {["", ...statuses].map((item) => (
            <button key={item || "ALL"} type="button" className="fchip" aria-pressed={status === item} onClick={() => setStatus(item)}>
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
                <td className="mono">{question.publicQid}</td>
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
