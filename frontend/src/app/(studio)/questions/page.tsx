"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ContentSkeleton, EmptyState, ErrorState } from "@/components/shared/state-panels";
import { StatusBadge } from "@/components/shared/status-badge";
import { getQuestions } from "@/lib/api/projects";

const statuses = ["DRAFT", "QUESTION_SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED", "APPROVED", "PUBLISHED", "ARCHIVED"];

export default function QuestionsPage() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const questions = useQuery({ queryKey: ["questions", "workspace", q, status], queryFn: () => getQuestions({ q: q || undefined, status: status || undefined, limit: 100 }) });

  if (questions.isLoading) return <ContentSkeleton rows={6} />;
  if (questions.isError || !questions.data) return <ErrorState title="Questions could not be loaded" description="Check your Studio access and try again." onRetry={() => void questions.refetch()} />;

  return <><PageHeader eyebrow="Content workspace" title="My questions" description="Search and open questions in projects you can access." /><section className="rounded-xl border bg-white"><div className="flex flex-col gap-3 border-b p-4 sm:flex-row"><label className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" /><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search QID or question text" className="h-9 w-full rounded-md border pl-9 pr-3 text-sm" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-md border px-3 text-sm"><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></div>{questions.data.length === 0 ? <EmptyState title="No matching questions" description="Create a project and add questions to see them here." /> : <div className="overflow-x-auto"><table className="min-w-[680px] w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">QID</th><th className="px-5 py-3">Question</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"><span className="sr-only">Open</span></th></tr></thead><tbody>{questions.data.map(({ question, revision }) => <tr key={question.id} className="border-b last:border-0"><td className="px-5 py-4 font-mono text-xs text-slate-600">{question.publicQid}</td><td className="max-w-xl px-5 py-4 font-medium">{revision.stem}</td><td className="px-5 py-4"><StatusBadge status={question.status} /></td><td className="px-5 py-4 text-right"><Button asChild variant="ghost"><Link href={`/questions/${question.id}`}>Open</Link></Button></td></tr>)}</tbody></table></div>}</section></>;
}
