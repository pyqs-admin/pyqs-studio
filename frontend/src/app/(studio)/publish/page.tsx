"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Send } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { usePageHeader } from "@/components/layout/header-context";
import { ContentSkeleton, EmptyState, ErrorState } from "@/components/shared/state-panels";
import { Stat } from "@/components/shared/stat";
import { getPublishReadyQuestions, publishProject, publishQuestion, type PublishReadyItem } from "@/lib/api/projects";

type ProjectGroup = { project: PublishReadyItem["project"]; exam: PublishReadyItem["exam"]; items: PublishReadyItem[] };

export default function PublishPage() {
  usePageHeader([{ label: "Publishing" }]);
  const client = useQueryClient();
  const ready = useQuery({ queryKey: ["publish", "ready"], queryFn: getPublishReadyQuestions });
  const publish = useMutation({
    mutationFn: publishQuestion,
    onSuccess: () => void client.invalidateQueries({ queryKey: ["publish", "ready"] }),
  });
  const publishAll = useMutation({
    mutationFn: publishProject,
    onSuccess: () => void client.invalidateQueries({ queryKey: ["publish", "ready"] }),
  });

  const grouped = useMemo<ProjectGroup[]>(() => {
    if (!ready.data) return [];
    const map = new Map<string, ProjectGroup>();
    for (const item of ready.data) {
      const entry = map.get(item.project.id);
      if (entry) entry.items.push(item);
      else map.set(item.project.id, { project: item.project, exam: item.exam, items: [item] });
    }
    return [...map.values()];
  }, [ready.data]);

  if (ready.isLoading) return <ContentSkeleton rows={5} />;
  if (ready.isError || !ready.data) return <ErrorState title="Publishing queue could not be loaded" description="You may not have publishing permission." onRetry={() => void ready.refetch()} />;

  const total = ready.data.length;

  return (
    <>
      <h1>Publishing</h1>
      <p className="sub">Approved questions ready to publish to PYQS, grouped by project.</p>
      <div className="strip">
        <Stat value={total} label="Ready questions" tone="good" />
        <Stat value={grouped.length} label="Projects" />
      </div>
      {total === 0 ? (
        <EmptyState title="Nothing ready to publish" description="Approved questions will appear here." pose="happy" />
      ) : (
        <div className="space-y-6">
          {grouped.map(({ project, exam, items }) => (
            <section className="card !mb-0" key={project.id}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="chip">
                  <GraduationCap className="size-[22px]" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[16px]">{project.name}</h3>
                  <p className="small">
                    {exam.name} · {project.year}
                    {project.session ? ` · ${project.session}` : ""}
                  </p>
                </div>
                <button type="button" className="btn pri sm" onClick={() => publishAll.mutate(project.id)} disabled={publishAll.isPending}>
                  <Send className="size-3.5" aria-hidden="true" /> Publish project · {items.length}
                </button>
              </div>
              <table className="list mt-4">
                <thead>
                  <tr>
                    <th>QID</th>
                    <th>Question</th>
                    <th><span className="sr-only">Publish</span></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(({ question, revision }) => (
                    <tr key={question.id}>
                      <td className="mono">{question.publicQid}</td>
                      <td className="max-w-xl">
                        <Link href={`/questions/${question.id}`} className="font-bold text-pq-ink">{revision.stem}</Link>
                      </td>
                      <td className="text-right">
                        <button type="button" className="btn pri sm" onClick={() => publish.mutate(question.id)} disabled={publish.isPending}>
                          <Send className="size-3.5" aria-hidden="true" /> Publish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
      {publish.isError && <p className="err mt-3">{publish.error.message}</p>}
      {publishAll.isError && <p className="err mt-3">{publishAll.error.message}</p>}
    </>
  );
}
