"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ContentSkeleton, ErrorState } from "@/components/shared/state-panels";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentStudioUser } from "@/lib/api/auth";
import { getProjects, getQuestions, getReviewQueue } from "@/lib/api/projects";

export default function DashboardPage() {
  const user = useQuery({ queryKey: ["studio", "current-user"], queryFn: getCurrentStudioUser });
  const projects = useQuery({ queryKey: ["projects"], queryFn: getProjects }); const questions = useQuery({ queryKey: ["questions", "mine"], queryFn: () => getQuestions({ createdBy: user.data?.profileId, limit: 100 }), enabled: Boolean(user.data?.profileId) }); const review = useQuery({ queryKey: ["review", "queue"], queryFn: getReviewQueue });
  if (user.isLoading || projects.isLoading) return <ContentSkeleton rows={3} />;
  if (user.isError) return <ErrorState title="Your Studio access could not be loaded" description="Please sign in again or ask an administrator to provision your account." onRetry={() => user.refetch()} />;
  const drafts = questions.data?.filter((row) => row.question.status === "DRAFT").length ?? 0; const changes = questions.data?.filter((row) => row.question.status === "CHANGES_REQUESTED").length ?? 0;
  return <><PageHeader eyebrow="PYQS Content Studio" title={`Welcome, ${user.data?.displayName ?? "there"}`} description="Pick up your current project or move directly to the work waiting for you." /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["My drafts", drafts, "/questions?status=DRAFT"], ["Changes requested", changes, "/questions?status=CHANGES_REQUESTED"], ["Waiting for review", review.data?.length ?? 0, "/review"], ["Accessible projects", projects.data?.length ?? 0, "/projects"]].map(([label, count, href]) => <Link key={label as string} href={href as string} className="rounded-xl border bg-white p-5 transition-colors hover:bg-slate-50"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-2xl font-semibold">{count}</p></Link>)}</div><section className="mt-7 rounded-xl border bg-white p-6"><h2 className="font-semibold">Continue working</h2>{projects.data?.length ? <div className="mt-4 grid gap-3">{projects.data.slice(0, 3).map(({ project }) => <Link key={project.id} href={`/projects/${project.id}`} className="rounded-lg border p-4 text-sm font-medium transition-colors hover:bg-slate-50">{project.name}</Link>)}</div> : <p className="mt-2 text-sm text-slate-600">Create or join a project to start working on questions.</p>}</section></>;
}
