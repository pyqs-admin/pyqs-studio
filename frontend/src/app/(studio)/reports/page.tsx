"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { usePageHeader } from "@/components/layout/header-context";
import { ContentSkeleton, EmptyState, ErrorState } from "@/components/shared/state-panels";
import { Stat } from "@/components/shared/stat";
import { getQuestionReportStats, getQuestionReports, type ReportStatus, updateQuestionReport } from "@/lib/api/reports";

const statuses: Array<"" | ReportStatus> = ["", "pending", "reviewing", "done", "dismissed"];
const reasons: Record<string, string> = { wrong_answer: "Wrong answer", typo: "Typo / grammar", unclear: "Unclear question", missing_info: "Missing info / image", other: "Other" };

export default function ReportsPage() {
  usePageHeader([{ label: "Question reports" }]);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"" | ReportStatus>("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const reports = useQuery({ queryKey: ["question-reports", status], queryFn: () => getQuestionReports(status ? { status } : {}) });
  const stats = useQuery({ queryKey: ["question-report-stats"], queryFn: getQuestionReportStats });
  const update = useMutation({ mutationFn: ({ id, nextStatus, adminNote }: { id: string; nextStatus: ReportStatus; adminNote?: string }) => updateQuestionReport(id, { status: nextStatus, ...(adminNote === undefined ? {} : { adminNote }) }), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["question-reports"] }); void queryClient.invalidateQueries({ queryKey: ["question-report-stats"] }); } });

  if (reports.isLoading || stats.isLoading) return <ContentSkeleton rows={6} />;
  if (reports.isError || stats.isError || !reports.data || !stats.data) return <ErrorState title="Reports could not be loaded" description="Check the main PYQS reports integration and your Studio permissions." onRetry={() => { void reports.refetch(); void stats.refetch(); }} />;

  return <>
    <h1>Question reports</h1>
    <p className="sub">Review learner reports from the main PYQS site and track their resolution.</p>
    <div className="strip mb-5"><Stat label="Pending" value={stats.data.pending} tone="warn" /><Stat label="Reviewing" value={stats.data.reviewing} /><Stat label="Resolved" value={stats.data.done} tone="good" /><Stat label="Dismissed" value={stats.data.dismissed} /></div>
    <div className="mb-4 flex flex-wrap gap-1.5">{statuses.map((item) => <button key={item || "all"} type="button" className="fchip" aria-pressed={status === item} onClick={() => setStatus(item)}>{item ? item.replaceAll("_", " ") : "All reports"}</button>)}</div>
    {reports.data.length === 0 ? <EmptyState title="No reports found" description={status ? "There are no reports with this status." : "New learner reports will appear here."} /> : <div className="overflow-x-auto"><table className="list"><thead><tr><th>Question</th><th>Reason</th><th>Reporter</th><th>Status</th><th>Date</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{reports.data.map((report) => <tr key={report.id}>
      <td className="max-w-md"><button type="button" className="text-left" onClick={() => { setExpanded(expanded === report.id ? null : report.id); setNotes((current) => ({ ...current, [report.id]: current[report.id] ?? report.adminNote ?? "" })); }}><p className="mono small">{report.questionPublicQid}</p><p className="mt-0.5">{report.questionTitle || report.questionDescription}</p></button>{expanded === report.id && <div className="mt-2 rounded-lg border border-[var(--pq-line)] bg-[var(--pq-muted-bg)] p-3 text-sm"><p className="whitespace-pre-wrap">{report.description || "No additional details provided."}</p><label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-[var(--pq-ink-3)]">Admin note</label><textarea className="inp mt-1 min-h-20 w-full" value={notes[report.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [report.id]: event.target.value }))} maxLength={1000} placeholder="Add an internal note" /><button type="button" className="btn sm mt-2" disabled={update.isPending} onClick={() => update.mutate({ id: report.id, nextStatus: report.status, adminNote: notes[report.id] || undefined })}>Save note</button></div>}</td>
      <td><span className="tag warn">{reasons[report.reason] ?? report.reason}</span></td><td>{report.profileName || report.profileEmail}</td><td><select className="inp w-auto" value={report.status} disabled={update.isPending} onChange={(event) => update.mutate({ id: report.id, nextStatus: event.target.value as ReportStatus })}><option value="pending">Pending</option><option value="reviewing">Reviewing</option><option value="done">Done</option><option value="dismissed">Dismissed</option></select></td><td className="small">{new Date(report.createdAt).toLocaleString()}</td><td className="text-right">{report.studioQuestionId ? <Link className="btn sm" href={`/questions/${report.studioQuestionId}`}>Open</Link> : <span className="small">Not imported</span>}</td>
    </tr>)}</tbody></table></div>}
  </>;
}
