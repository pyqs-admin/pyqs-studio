"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MemberPicker } from "@/components/projects/member-picker";
import { ProjectActions } from "@/components/projects/project-actions";
import { PageHeader } from "@/components/shared/page-header";
import { ContentSkeleton, ErrorState } from "@/components/shared/state-panels";
import { StatusBadge } from "@/components/shared/status-badge";
import { getProject, getProjectMembers, getQuestions, getTaxonomy } from "@/lib/api/projects";

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const project = useQuery({ queryKey: ["projects", projectId], queryFn: () => getProject(projectId) });
  const taxonomy = useQuery({ queryKey: ["taxonomy"], queryFn: getTaxonomy, staleTime: 300_000 });
  const questions = useQuery({ queryKey: ["questions", { projectId }], queryFn: () => getQuestions({ projectId, limit: 100 }) });
  const members = useQuery({ queryKey: ["projects", projectId, "members"], queryFn: () => getProjectMembers(projectId) });

  if (project.isLoading || taxonomy.isLoading) return <ContentSkeleton rows={5} />;
  if (project.isError || taxonomy.isError || !project.data || !taxonomy.data) return <ErrorState description="We couldn't load this project." onRetry={() => { void project.refetch(); void taxonomy.refetch(); }} />;

  const rows = questions.data ?? [];
  const subjectIds = Array.from(new Set(rows.map((row) => row.revision.subjectId)));
  const statuses = ["DRAFT", "NEEDS_EXPLANATION", "UNDER_REVIEW", "APPROVED", "PUBLISHED"];
  return <><PageHeader eyebrow={`${project.data.exam.name} · ${project.data.project.year}${project.data.project.session ? ` · ${project.data.project.session}` : ""}`} title={project.data.project.name} description="Choose a subject workspace to enter, review, and manage its questions." actions={<ProjectActions project={project.data.project} />} /><div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{statuses.map((status) => <div key={status} className="rounded-xl border bg-white p-4"><StatusBadge status={status} /><p className="mt-3 text-xl font-semibold">{rows.filter((row) => row.question.status === status).length}</p><p className="mt-1 text-xs text-slate-500">visible questions</p></div>)}</div><div className="grid gap-6 lg:grid-cols-[1fr_280px]"><section><h2 className="mb-3 text-sm font-semibold">Subject workspaces</h2>{questions.isLoading ? <ContentSkeleton rows={3} /> : <div className="grid gap-3 sm:grid-cols-2">{subjectIds.map((subjectId) => { const subject = taxonomy.data.subjects.find((item) => item.id === subjectId); const count = rows.filter((row) => row.revision.subjectId === subjectId).length; return <Link key={subjectId} href={`/projects/${projectId}/subjects/${subjectId}`} className="group rounded-xl border bg-white p-5 transition-colors hover:border-slate-300 hover:bg-slate-50"><p className="font-semibold">{subject?.name ?? "Unknown subject"}</p><p className="mt-1 text-sm text-slate-600">{count} visible questions</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">Open workspace <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span></Link>; })}{subjectIds.length === 0 && <p className="rounded-xl border border-dashed bg-white p-5 text-sm text-slate-600">No questions have been added yet. Subject workspaces appear once content is created.</p>}</div>}</section><aside className="rounded-xl border bg-white p-5"><div className="flex items-center gap-2"><Users className="size-4" /><h2 className="font-semibold">Project members</h2></div>{members.isLoading ? <div className="mt-4 h-12 animate-pulse rounded bg-slate-100" /> : <ul className="mt-4 space-y-3">{members.data?.slice(0, 5).map(({ member, profile }) => <li key={member.id}><p className="text-sm font-medium">{profile.displayName}</p><p className="text-xs text-slate-500">{member.projectRole.replaceAll("_", " ")} · {member.status}</p></li>)}</ul>}<MemberPicker projectId={projectId} /></aside></div></>;
}
