"use client";

import { BookOpen, ChevronDown, ChevronRight, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { usePageHeader } from "@/components/layout/header-context";
import { ContentSkeleton, EmptyState, ErrorState } from "@/components/shared/state-panels";
import { type TaxonomyItem, getTaxonomy } from "@/lib/api/projects";

const textValues = (item: TaxonomyItem) => [
  item.name,
  item.code,
  item.slug,
  ...(item.aliases ?? []),
  ...(item.includes ?? []),
  ...(item.excludes ?? []),
  ...(item.relatedTopics ?? []),
].filter(Boolean).join(" ").toLowerCase();

function TopicDetails({ topic }: { topic: TaxonomyItem }) {
  return (
    <div className="mt-3 grid gap-3 border-t-2 border-pq-line-soft pt-3 text-sm md:grid-cols-2">
      {topic.scope && <div><b className="small block uppercase">Scope</b><p>{topic.scope}</p></div>}
      {(topic.aliases?.length ?? 0) > 0 && <div><b className="small block uppercase">Also called</b><p>{topic.aliases!.join(" · ")}</p></div>}
      {(topic.includes?.length ?? 0) > 0 && <div><b className="small block uppercase">Includes</b><p>{topic.includes!.join(" · ")}</p></div>}
      {(topic.excludes?.length ?? 0) > 0 && <div><b className="small block uppercase">Does not include</b><p>{topic.excludes!.join(" · ")}</p></div>}
      {(topic.relatedTopics?.length ?? 0) > 0 && <div><b className="small block uppercase">Related topics</b><p>{topic.relatedTopics!.join(" · ")}</p></div>}
    </div>
  );
}

function TopicRow({ topic }: { topic: TaxonomyItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b-2 border-pq-line-soft py-3 last:border-b-0">
      <button type="button" className="flex w-full items-start gap-3 text-left" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="chip mt-0.5 shrink-0">{open ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <b>{topic.name}</b>
            {topic.kind && <span className="fchip">{topic.kind.replaceAll("_", " ")}</span>}
          </span>
          <span className="mono small block">{topic.code}</span>
        </span>
        <span className="small hidden shrink-0 sm:block">{open ? "Hide details" : "View details"}</span>
      </button>
      {open && <TopicDetails topic={topic} />}
    </div>
  );
}

function TaxonomyIndex({ taxonomy }: { taxonomy: Awaited<ReturnType<typeof getTaxonomy>> }) {
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const chapters = taxonomy.chapters.filter((chapter) => chapter.subjectId === subjectId);
  const selectedSubject = taxonomy.subjects.find((subject) => subject.id === subjectId);
  const selectedChapter = chapters.find((chapter) => chapter.id === chapterId) ?? chapters[0];
  const chapterTopics = taxonomy.topics.filter((topic) => topic.chapterId === selectedChapter?.id);
  const searchResults = useMemo(() => {
    if (!deferredQuery) return [];
    return taxonomy.topics.filter((topic) => textValues(topic).includes(deferredQuery));
  }, [deferredQuery, taxonomy.topics]);

  useEffect(() => {
    if (!subjectId && taxonomy.subjects[0]) setSubjectId(taxonomy.subjects[0].id);
  }, [subjectId, taxonomy.subjects]);

  useEffect(() => {
    if (!chapters.some((chapter) => chapter.id === chapterId)) setChapterId(chapters[0]?.id ?? "");
  }, [chapterId, chapters]);

  const chooseTopicResult = (topic: TaxonomyItem) => {
    setQuery("");
    setSubjectId(taxonomy.chapters.find((chapter) => chapter.id === topic.chapterId)?.subjectId ?? "");
    setChapterId(topic.chapterId ?? "");
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-3 md:flex-row md:items-center">
        <label className="qsearch min-w-0 flex-1">
          <Search className="size-4" aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics, aliases, codes, or included terms" />
        </label>
        <span className="small shrink-0">{taxonomy.subjects.length} subjects · {taxonomy.chapters.length} chapters · {taxonomy.topics.length} topics</span>
      </div>

      {deferredQuery ? (
        <section className="card">
          <h2>Search results <span className="small">{searchResults.length} matches</span></h2>
          {searchResults.length === 0 ? (
            <p className="hint">No topics match “{query}”. Try a code, abbreviation, or canonical name.</p>
          ) : (
            <div className="divide-y-2 divide-pq-line-soft">
              {searchResults.slice(0, 100).map((topic) => {
                const chapter = taxonomy.chapters.find((item) => item.id === topic.chapterId);
                const subject = taxonomy.subjects.find((item) => item.id === chapter?.subjectId);
                return (
                  <button key={topic.id} type="button" className="flex w-full items-center gap-3 py-3 text-left hover:bg-pq-muted-2" onClick={() => chooseTopicResult(topic)}>
                    <BookOpen className="size-4 shrink-0 text-pq-blue" aria-hidden="true" />
                    <span className="min-w-0 flex-1"><b className="block truncate">{topic.name}</b><span className="small">{subject?.code} · {chapter?.name}</span></span>
                    <span className="mono small">{topic.code}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="card h-fit">
            <h2>Subjects</h2>
            <div className="mt-2 space-y-1">
              {taxonomy.subjects.map((subject) => {
                const count = taxonomy.topics.filter((topic) => taxonomy.chapters.some((chapter) => chapter.id === topic.chapterId && chapter.subjectId === subject.id)).length;
                return <button key={subject.id} type="button" className={`flex w-full items-center gap-2 rounded-pq-sm px-2.5 py-2 text-left ${subject.id === subjectId ? "bg-pq-blue text-white" : "hover:bg-pq-muted-2"}`} onClick={() => setSubjectId(subject.id)}><span className="mono text-xs">{subject.code}</span><span className="min-w-0 flex-1 truncate">{subject.name}</span><span className="text-xs opacity-70">{count}</span></button>;
              })}
            </div>
          </aside>

          <main className="space-y-4">
            {selectedSubject && <div><p className="eyebrow">Master Index / {selectedSubject.code}</p><h1>{selectedSubject.name}</h1><p className="sub">Choose a chapter to review its boundaries and topics.</p></div>}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {chapters.map((chapter) => <button key={chapter.id} type="button" className={`btn sm shrink-0 ${chapter.id === selectedChapter?.id ? "pri" : ""}`} onClick={() => setChapterId(chapter.id)}>{chapter.name}<span className="small">{taxonomy.topics.filter((topic) => topic.chapterId === chapter.id).length}</span></button>)}
            </div>
            {selectedChapter ? (
              <section className="card">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1"><p className="mono small">{selectedChapter.code}</p><h2>{selectedChapter.name}</h2></div>
                  <span className="fchip">{chapterTopics.length} topics</span>
                </div>
                {selectedChapter.scope && <p className="mt-3">{selectedChapter.scope}</p>}
                <div className="mt-4 grid gap-3 border-y-2 border-pq-line-soft py-3 text-sm md:grid-cols-2">
                  {(selectedChapter.includes?.length ?? 0) > 0 && <div><b className="small block uppercase">What belongs here</b><p>{selectedChapter.includes!.join(" · ")}</p></div>}
                  {(selectedChapter.excludes?.length ?? 0) > 0 && <div><b className="small block uppercase">What does not belong here</b><p>{selectedChapter.excludes!.join(" · ")}</p></div>}
                  {(selectedChapter.overlaps?.length ?? 0) > 0 && <div><b className="small block uppercase">Boundary rules</b><p>{selectedChapter.overlaps!.join(" · ")}</p></div>}
                  {(selectedChapter.referenceSections?.length ?? 0) > 0 && <div><b className="small block uppercase">Reference sections</b><p>{selectedChapter.referenceSections!.join(" · ")}</p></div>}
                </div>
                <div className="mt-2">{chapterTopics.map((topic) => <TopicRow key={topic.id} topic={topic} />)}</div>
              </section>
            ) : <EmptyState title="No chapter selected" description="Choose a subject to browse its chapters." />}
          </main>
        </div>
      )}
    </div>
  );
}

export default function TaxonomyPage() {
  usePageHeader([{ label: "Taxonomy index" }]);
  const taxonomy = useQuery({ queryKey: ["taxonomy"], queryFn: getTaxonomy, staleTime: 5 * 60 * 1000 });
  if (taxonomy.isLoading) return <ContentSkeleton rows={8} />;
  if (taxonomy.isError || !taxonomy.data) return <ErrorState title="Taxonomy could not be loaded" description="Check your Studio access and try again." onRetry={() => void taxonomy.refetch()} />;
  return <TaxonomyIndex taxonomy={taxonomy.data} />;
}
