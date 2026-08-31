"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ContentSkeleton, EmptyState, ErrorState } from "@/components/shared/state-panels";
import { StatusBadge } from "@/components/shared/status-badge";
import { getProject, getQuestions, getTaxonomy } from "@/lib/api/projects";

const pageSize = 30;
export default function SubjectWorkspacePage() {
  const { projectId, subjectId } = useParams<{ projectId: string; subjectId: string }>(); const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? ""); const [status, setStatus] = useState(searchParams.get("status") ?? ""); const [page, setPage] = useState(0);
  const project = useQuery({ queryKey: ["projects", projectId], queryFn: () => getProject(projectId) }); const taxonomy = useQuery({ queryKey: ["taxonomy"], queryFn: getTaxonomy, staleTime: 300_000 });
  const questions = useQuery({ queryKey: ["questions", { projectId, subjectId, query, status, page }], queryFn: () => getQuestions({ projectId, subjectId, q: query || undefined, status: status || undefined, limit: pageSize, offset: page * pageSize }) });
  if (project.isLoading || taxonomy.isLoading || questions.isLoading) return <ContentSkeleton rows={6} />;
  if (project.isError || taxonomy.isError || questions.isError || !project.data || !taxonomy.data || !questions.data) return <ErrorState description="We couldn't load this subject workspace." onRetry={() => { void project.refetch(); void taxonomy.refetch(); void questions.refetch(); }} />;
  const subject = taxonomy.data.subjects.find((item) => item.id === subjectId); const statusOptions = ["DRAFT", "QUESTION_SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED", "APPROVED", "PUBLISHED"];
  return <><PageHeader eyebrow={project.data.project.name} title={subject?.name ?? "Subject workspace"} description="Project, exam, year, and subject context are retained here." actions={<Button asChild><Link href={`/projects/${projectId}/subjects/${subjectId}/questions/new`}><Plus className="size-4" />Add question</Link></Button>} /><div className="mb-5 flex flex-col gap-3 rounded-xl border bg-white p-3 sm:flex-row"><label className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} className="h-9 w-full rounded-md border pl-9 pr-3 text-sm" placeholder="Search QID or question text" /></label><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }} className="h-9 rounded-md border px-3 text-sm"><option value="">All statuses</option>{statusOptions.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></div>{questions.data.length === 0 ? <EmptyState title="No matching questions" description={query || status ? "Try clearing a filter, or add a new question." : "Add the first question for this subject."} action={<Button asChild><Link href={`/projects/${projectId}/subjects/${subjectId}/questions/new`}><Plus className="size-4" />Add question</Link></Button>} /> : <><section className="overflow-hidden rounded-xl border bg-white"><div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="border-b bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">QID</th><th className="px-5 py-3">Question</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"><span className="sr-only">Actions</span></th></tr></thead><tbody>{questions.data.map(({ question, revision }) => <tr key={question.id} className="border-b last:border-0"><td className="px-5 py-4 font-mono text-xs text-slate-600">{question.publicQid}</td><td className="max-w-xl px-5 py-4 font-medium">{revision.stem}</td><td className="px-5 py-4"><StatusBadge status={question.status} /></td><td className="px-5 py-4 text-right"><Button asChild variant="ghost"><Link href={`/questions/${question.id}`}>Open</Link></Button></td></tr>)}</tbody></table></div></section><div className="mt-4 flex items-center justify-between text-sm text-slate-600"><p>Page {page + 1}</p><div className="flex gap-2"><Button variant="outline" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button variant="outline" disabled={questions.data.length < pageSize} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div></>}</>;
}
