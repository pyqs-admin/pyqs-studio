"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import { usePageHeader } from "@/components/layout/header-context";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ContentSkeleton, EmptyState, ErrorState } from "@/components/shared/state-panels";
import { getProjects } from "@/lib/api/projects";
import { useProjectStore } from "@/lib/stores/project-store";
import { useEffect } from "react";

export default function ProjectsPage() {
  usePageHeader([{ label: "Projects" }]);
  const cachedProjects = useProjectStore((state) => state.projects);
  const setProjects = useProjectStore((state) => state.setProjects);
  const setProjectDetails = useProjectStore((state) => state.setProjectDetails);
  const projects = useQuery({ queryKey: ["projects"], queryFn: getProjects, initialData: cachedProjects.length ? cachedProjects : undefined });
  useEffect(() => {
    if (!projects.data) return;
    setProjects(projects.data);
    projects.data.forEach(({ project, exam }) => setProjectDetails(project.id, { project, exam }));
  }, [projects.data, setProjects, setProjectDetails]);

  if (projects.isLoading) return <ContentSkeleton />;
  if (projects.isError || !projects.data) return <ErrorState description="We couldn't load your accessible projects." onRetry={() => projects.refetch()} />;

  return (
    <>
      <h1>Projects</h1>
      <p className="sub">Each project is one exam paper for one year and session. Every question in it inherits the exam and year — nobody types them per question.</p>
      {projects.data.length === 0 ? (
        <EmptyState title="No projects yet" description="Create a project to start entering and reviewing exam questions." action={<NewProjectDialog variant="button" />} />
      ) : (
        <div className="cards">
          {projects.data.map(({ project, exam, memberRole }) => (
            <Link className="pcard" href={`/projects/${project.id}`} key={project.id}>
              <span className="phead">
                <span className="chip">
                  <GraduationCap className="size-[22px]" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <span className="pbody">
                  <span className="nm">{project.name}</span>
                  <span className="meta">
                    {exam.name} · {project.year}
                    {project.session ? ` · ${project.session}` : ""}
                  </span>
                </span>
                <span className="parrow">
                  <ChevronRight className="size-4" aria-hidden="true" />
                </span>
              </span>
              <span className="pflags">
                {project.status === "archived" ? <span className="tag">Archived</span> : null}
                {memberRole ? <span className="tag indigo">{memberRole.replaceAll("_", " ")}</span> : null}
              </span>
            </Link>
          ))}
          <NewProjectDialog variant="card" />
        </div>
      )}
    </>
  );
}
