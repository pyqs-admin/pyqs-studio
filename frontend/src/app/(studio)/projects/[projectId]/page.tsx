"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { usePageHeader } from "@/components/layout/header-context";
import { MemberPicker } from "@/components/projects/member-picker";
import { ProjectActions } from "@/components/projects/project-actions";
import { ContentSkeleton, ErrorState } from "@/components/shared/state-panels";
import { Stat } from "@/components/shared/stat";
import { StatusBar } from "@/components/shared/status-badge";
import { getProject, getProjectMembers, getQuestions, getTaxonomy } from "@/lib/api/projects";

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const project = useQuery({ queryKey: ["projects", projectId], queryFn: () => getProject(projectId) });
  const taxonomy = useQuery({ queryKey: ["taxonomy"], queryFn: getTaxonomy, staleTime: 300_000 });
  const questions = useQuery({ queryKey: ["questions", { projectId }], queryFn: () => getQuestions({ projectId, limit: 100 }) });
  const members = useQuery({ queryKey: ["projects", projectId, "members"], queryFn: () => getProjectMembers(projectId) });

  const actions = useMemo(() => (project.data ? <ProjectActions project={project.data.project} /> : null), [project.data]);
  usePageHeader(
    [{ label: "Projects", href: "/projects" }, ...(project.data ? [{ label: project.data.project.name }] : [])],
    actions
  );

  if (project.isLoading || taxonomy.isLoading) return <ContentSkeleton rows={5} />;
  if (project.isError || taxonomy.isError || !project.data || !taxonomy.data) return <ErrorState description="We couldn't load this project." onRetry={() => { void project.refetch(); void taxonomy.refetch(); }} />;

  const rows = questions.data ?? [];
  const byStatus: Record<string, number> = {};
  for (const row of rows) byStatus[row.question.status] = (byStatus[row.question.status] ?? 0) + 1;
  const bySubject = new Map<string, { total: number; statuses: Record<string, number> }>();
  for (const row of rows) {
    const entry = bySubject.get(row.revision.subjectId) ?? { total: 0, statuses: {} };
    entry.total += 1;
    entry.statuses[row.question.status] = (entry.statuses[row.question.status] ?? 0) + 1;
    bySubject.set(row.revision.subjectId, entry);
  }

  return (
    <>
      <h1>{project.data.project.name}</h1>
      <p className="sub">
        {project.data.exam.name} · {project.data.project.year}
        {project.data.project.session ? ` · ${project.data.project.session}` : ""}
        {project.data.project.status === "archived" && <span className="tag ml-1.5">archived</span>}
      </p>
      <div className="strip">
        <Stat value={rows.length} label="Questions" />
        <Stat value={byStatus.NEEDS_EXPLANATION ?? 0} label="Need explaining" tone="warn" />
        <Stat value={byStatus.UNDER_REVIEW ?? 0} label="In review" />
        <Stat value={byStatus.CHANGES_REQUESTED ?? 0} label="Changes requested" tone="bad" />
        <Stat value={byStatus.DRAFT ?? 0} label="Drafts" />
        <Stat value={(byStatus.APPROVED ?? 0) + (byStatus.PUBLISHED ?? 0)} label="Approved" tone="good" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <h2 className="eyebrow mb-2.5">Subject workspaces</h2>
          <div className="cards !grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
            {taxonomy.data.subjects.map((subject) => {
              const entry = bySubject.get(subject.id) ?? { total: 0, statuses: {} };
              return (
                <Link className="scard" href={`/projects/${projectId}/subjects/${subject.id}`} key={subject.id}>
                  <div className="nm">
                    <span>{subject.name}</span>
                    <span className="n">{entry.total}</span>
                  </div>
                  <div className="meta">{entry.total ? "Open the workspace" : "No questions yet"}</div>
                  <StatusBar counts={entry.statuses} />
                </Link>
              );
            })}
          </div>
        </div>
        <aside>
          <h2 className="eyebrow mb-2.5">Project members</h2>
          <section className="card !mb-0">
            {members.isLoading ? (
              <div className="mt-4 h-12 animate-pulse rounded-pq-md bg-pq-muted-2" />
            ) : (
              <ul className="space-y-2.5">
                {members.data?.slice(0, 5).map(({ member, profile }) => (
                  <li key={member.id} className="flex items-center gap-2.5">
                    <span className="avatar !h-8 !w-8 !text-[11px]">{initials(profile.displayName)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{profile.displayName}</span>
                      <span className="small">{member.projectRole.replaceAll("_", " ")} · {member.status}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <MemberPicker projectId={projectId} />
          </section>
        </aside>
      </div>
    </>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
