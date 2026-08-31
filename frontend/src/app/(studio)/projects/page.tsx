"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FolderKanban } from "lucide-react";
import Link from "next/link";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { ContentSkeleton, EmptyState, ErrorState } from "@/components/shared/state-panels";
import { StatusBadge } from "@/components/shared/status-badge";
import { getProjects } from "@/lib/api/projects";

export default function ProjectsPage() {
  const projects = useQuery({ queryKey: ["projects"], queryFn: getProjects });
  if (projects.isLoading) return <ContentSkeleton />;
  if (projects.isError || !projects.data) return <ErrorState description="We couldn't load your accessible projects." onRetry={() => projects.refetch()} />;
  return <><PageHeader eyebrow="Content planning" title="Projects" description="Each project represents one exam paper for one year and session." actions={<NewProjectDialog />} />{projects.data.length === 0 ? <EmptyState title="No projects yet" description="Create a project to start entering and reviewing exam questions." action={<NewProjectDialog />} /> : <div className="grid gap-3">{projects.data.map(({ project, exam, memberRole }) => <Link href={`/projects/${project.id}`} key={project.id} className="group flex items-center gap-4 rounded-xl border bg-white p-5 transition-colors hover:border-slate-300 hover:bg-slate-50"><span className="grid size-10 place-items-center rounded-lg bg-slate-100"><FolderKanban className="size-5 text-slate-700" /></span><div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{project.name}</h2><p className="mt-1 text-sm text-slate-600">{exam.name} · {project.year}{project.session ? ` · ${project.session}` : ""}{memberRole ? ` · ${memberRole.replaceAll("_", " ")}` : ""}</p></div><StatusBadge status={project.status.toUpperCase()} /><ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5" /></Link>)}</div>}</>;
}
