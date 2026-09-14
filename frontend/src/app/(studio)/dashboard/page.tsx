"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePageHeader } from "@/components/layout/header-context";
import { ContentSkeleton, ErrorState } from "@/components/shared/state-panels";
import { Stat } from "@/components/shared/stat";
import { getCurrentStudioUser } from "@/lib/api/auth";
import { getMyQuestions, getProjects, getReviewQueue } from "@/lib/api/projects";

export default function DashboardPage() {
  usePageHeader([]);
  const user = useQuery({ queryKey: ["studio", "current-user"], queryFn: getCurrentStudioUser });
  const projects = useQuery({ queryKey: ["projects"], queryFn: getProjects });
  const questions = useQuery({ queryKey: ["questions", "mine"], queryFn: getMyQuestions });
  const review = useQuery({ queryKey: ["review", "queue"], queryFn: getReviewQueue });

  if (user.isLoading || projects.isLoading) return <ContentSkeleton rows={3} />;
  if (user.isError) return <ErrorState title="Your Studio access could not be loaded" description="Please sign in again or ask an administrator to provision your account." onRetry={() => user.refetch()} />;

  const drafts = questions.data?.filter((row) => row.question.status === "DRAFT").length ?? 0;
  const changes = questions.data?.filter((row) => row.question.status === "CHANGES_REQUESTED").length ?? 0;

  return (
    <>
      <h1>Welcome, {user.data?.displayName ?? "there"}</h1>
      <p className="sub">Pick up your current project or move directly to the work waiting for you.</p>
      <div className="mb-5">
        <Link className="btn sm" href="/taxonomy"><BookOpen className="size-4" aria-hidden="true" /> Browse taxonomy index</Link>
      </div>
      <div className="strip">
        <Stat value={drafts} label="My drafts" />
        <Stat value={changes} label="Changes requested" tone="warn" />
        <Stat value={review.data?.length ?? 0} label="Waiting for review" />
        <Stat value={projects.data?.length ?? 0} label="Accessible projects" tone="good" />
      </div>
      <h2 className="eyebrow !mb-2.5">Continue working</h2>
      {projects.data && projects.data.length > 0 ? (
        <div className="cards">
          {projects.data.slice(0, 3).map(({ project, exam, memberRole }) => (
            <Link className="pcard" href={`/projects/${project.id}`} key={project.id}>
              <span className="phead">
                <span className="chip">
                  <ChevronRight className="size-[22px]" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <span className="pbody">
                  <span className="nm">{project.name}</span>
                  <span className="meta">
                    {exam.name} · {project.year}
                    {project.session ? ` · ${project.session}` : ""}
                    {memberRole ? ` · ${memberRole.replaceAll("_", " ")}` : ""}
                  </span>
                </span>
                <span className="parrow">
                  <ChevronRight className="size-4" aria-hidden="true" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="hint">Create or join a project to start working on questions.</p>
      )}
    </>
  );
}
