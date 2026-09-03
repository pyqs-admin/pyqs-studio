"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, FileText, History, Lock, Plus, Send, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { getTaxonomy } from "@/lib/api/projects";
import {
  createQuestion,
  createQuestionRevision,
  duplicateQuestion,
  getQuestionAudit,
  getQuestionContributors,
  getQuestionRevisions,
  saveQuestionDraft,
  submitQuestion,
  type QuestionDetails,
  type QuestionDraft,
} from "@/lib/api/questions";

const labels = ["A", "B", "C", "D"] as const;
const draftSchema = z.object({
  stem: z.string().trim().min(1, "Enter the question stem."),
  correctOption: z.enum(labels),
  chapterId: z.string().uuid("Select a chapter."),
  topicId: z.string().uuid("Select a topic."),
  difficultyId: z.string().uuid("Select a difficulty."),
  questionTypeIds: z.array(z.string().uuid()).min(1, "Choose at least one question type."),
  options: z.array(z.object({ label: z.enum(labels), content: z.string().trim().min(1, "Every option needs content.") })).length(4),
});
type FormValues = z.infer<typeof draftSchema>;

function initialValues(subjectId: string, details?: QuestionDetails): FormValues {
  return details
    ? {
        stem: details.revision.stem,
        correctOption: details.revision.correctOption,
        chapterId: details.revision.chapterId,
        topicId: details.revision.topicId,
        difficultyId: details.revision.difficultyId,
        questionTypeIds: details.questionTypes.map((type) => type.questionTypeId),
        options: labels.map((label) => ({ label, content: details.options.find((option) => option.label === label)?.content ?? "" })),
      }
    : {
        stem: "",
        correctOption: "A",
        chapterId: "",
        topicId: "",
        difficultyId: "",
        questionTypeIds: [],
        options: labels.map((label) => ({ label, content: "" })),
      };
}

export function QuestionEditor({ projectId, subjectId, details }: { projectId: string; subjectId: string; details?: QuestionDetails }) {
  const queryClient = useQueryClient();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [addNext, setAddNext] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taxonomy = useQuery({ queryKey: ["taxonomy"], queryFn: getTaxonomy, staleTime: 300_000 });
  const form = useForm<FormValues>({ resolver: zodResolver(draftSchema), defaultValues: initialValues(subjectId, details) });
  const values = useWatch({ control: form.control });
  const chapterId = form.watch("chapterId");

  const chapters = taxonomy.data?.chapters.filter((item) => item.subjectId === subjectId) ?? [];
  const topics = taxonomy.data?.topics.filter((item) => item.chapterId === chapterId) ?? [];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["questions"] });
    if (details) {
      void queryClient.invalidateQueries({ queryKey: ["question", details.question.id] });
      void queryClient.invalidateQueries({ queryKey: ["question", details.question.id, "revisions"] });
    }
  };

  const create = useMutation({
    mutationFn: (body: QuestionDraft) => createQuestion(projectId, subjectId, body),
    onSuccess: (result) => {
      invalidate();
      if (addNext) {
        setAddNext(false);
        form.reset(initialValues(subjectId));
        setSaveState("saved");
      } else {
        window.location.assign(`/questions/${result.question.id}`);
      }
    },
  });
  const save = useMutation({
    mutationFn: (body: QuestionDraft) => saveQuestionDraft(details!.question.id, details!.revision.id, body),
    onMutate: () => setSaveState("saving"),
    onSuccess: () => {
      setSaveState("saved");
      form.reset(form.getValues());
      invalidate();
    },
    onError: () => setSaveState("error"),
  });
  const submit = useMutation({
    mutationFn: () => submitQuestion(details!.question.id),
    onSuccess: () => {
      invalidate();
      window.location.reload();
    },
  });
  const duplicate = useMutation({
    mutationFn: () => duplicateQuestion(details!.question.id),
    onSuccess: (result) => window.location.assign(`/questions/${result.question.id}`),
  });
  const newRevision = useMutation({
    mutationFn: () => createQuestionRevision(details!.question.id),
    onSuccess: () => window.location.reload(),
  });
  const contributors = useQuery({
    queryKey: ["question", details?.question.id, "contributors"],
    queryFn: () => getQuestionContributors(details!.question.id),
    enabled: Boolean(details),
  });
  const audit = useQuery({
    queryKey: ["question", details?.question.id, "audit"],
    queryFn: () => getQuestionAudit(details!.question.id),
    enabled: Boolean(details),
  });
  const revisions = useQuery({
    queryKey: ["question", details?.question.id, "revisions"],
    queryFn: () => getQuestionRevisions(details!.question.id),
    enabled: Boolean(details),
  });

  const performSave = async () => {
    const valid = await form.trigger();
    if (valid && details) save.mutate(form.getValues());
  };

  useEffect(() => {
    if (!details || !form.formState.isDirty) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void performSave(); }, 900);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, details]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void performSave();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && details) {
        event.preventDefault();
        submit.mutate();
      }
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("keydown", shortcut);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("keydown", shortcut);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, form.formState.isDirty]);

  if (taxonomy.isLoading) return <div className="h-96 animate-pulse rounded-pq-lg bg-pq-muted-2" />;
  if (taxonomy.isError || !taxonomy.data) return <p className="err">Taxonomy could not be loaded. Refresh and try again.</p>;

  const isEditable = !details || details.revision.status === "DRAFT";
  const subject = taxonomy.data.subjects.find((item) => item.id === subjectId);
  const saveText =
    saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Save failed — try again" : details ? "Draft" : "New draft";

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <form
        onSubmit={form.handleSubmit((body) => (details ? save.mutate(body) : create.mutate(body)))}
        className="min-w-0 space-y-0"
      >
        {!isEditable && (
          <div className="prov readonly">
            <Lock className="size-3.5" aria-hidden="true" />
            Read only — this revision is not a draft.
          </div>
        )}
        <Card step={1} title="Question" headerRight={<span className={`small !font-bold ${saveState === "error" ? "!text-pq-danger" : ""}`}>{saveText}</span>}>
          <div className="prov">
            <b>{subject?.name ?? "Subject"}</b>
            <span>·</span>
            <span>{details ? details.question.publicQid : "new draft"}</span>
            <span className="small">— exam, year and source come from the project</span>
          </div>
          <div className="f mb-1.5">
            <label>Stem <span className="req" aria-hidden="true">•</span></label>
            <textarea
              disabled={!isEditable}
              className="inp"
              rows={3}
              placeholder="A 30-year-old woman with a childhood history of rheumatic fever presents with…"
              {...form.register("stem")}
            />
            {form.formState.errors.stem && <p className="err">{form.formState.errors.stem.message}</p>}
          </div>
          <div className="f mt-4 mb-1.5">
            <label>Options <span className="req" aria-hidden="true">•</span><span className="small">— tick the correct one</span></label>
          </div>
          {labels.map((label, index) => {
            const correct = form.watch("correctOption") === label;
            return (
              <div className={`opt ${correct ? "correct" : ""}`} key={label}>
                <span className="optkey" title={correct ? "Correct answer" : ""}>
                  {correct ? <Check className="size-4" aria-hidden="true" /> : label}
                </span>
                <textarea
                  disabled={!isEditable}
                  className="inp !min-h-[38px]"
                  rows={1}
                  placeholder={`Option ${label}`}
                  {...form.register(`options.${index}.content`)}
                />
                <span className="optacts">
                  <button
                    type="button"
                    className={`btn-icon ${correct ? "on" : ""}`}
                    aria-pressed={correct}
                    title="Mark as the answer"
                    onClick={() => form.setValue("correctOption", label, { shouldDirty: true })}
                  >
                    <Check className="size-4" aria-hidden="true" />
                  </button>
                </span>
              </div>
            );
          })}
          {form.formState.errors.options && <p className="err">Complete all four options before saving.</p>}
        </Card>

        <Card step={2} title="Tags" headerRight={<span className="small">subject and chapter derive from the topic path</span>}>
          {subject && (
            <div className="derived mb-3">
              <span className="d"><b>Subject</b> {subject.name} <span className="mono small">{subject.code}</span></span>
              {chapters.find((item) => item.id === chapterId) && (
                <span className="d"><b>Chapter</b> {chapters.find((item) => item.id === chapterId)!.name}</span>
              )}
              {topics.find((item) => item.id === form.watch("topicId")) && (
                <span className="d"><b>Topic</b> {topics.find((item) => item.id === form.watch("topicId"))!.name}</span>
              )}
            </div>
          )}
          <div className="row mb-3">
            <div className="f flex-1 basis-52">
              <label>Chapter <span className="req" aria-hidden="true">•</span></label>
              <select disabled={!isEditable} className="inp" {...form.register("chapterId")}>
                <option value="">Choose…</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
                ))}
              </select>
              {form.formState.errors.chapterId && <p className="err">{form.formState.errors.chapterId.message}</p>}
            </div>
            <div className="f flex-1 basis-52">
              <label>Topic <span className="req" aria-hidden="true">•</span></label>
              <select disabled={!isEditable || !chapterId} className="inp" {...form.register("topicId")}>
                <option value="">{chapterId ? "Choose…" : "Choose a chapter first"}</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </select>
              {form.formState.errors.topicId && <p className="err">{form.formState.errors.topicId.message}</p>}
            </div>
          </div>
          <div className="f mb-3">
            <label>Question type <span className="req" aria-hidden="true">•</span><span className="small">— what the student had to do</span></label>
            <div className="flex flex-wrap gap-2">
              {taxonomy.data.questionTypes.map((type) => (
                <label className="fsm" key={type.id}>
                  <input
                    type="checkbox"
                    value={type.id}
                    checked={form.watch("questionTypeIds").includes(type.id)}
                    onChange={(event) => {
                      const current = form.getValues("questionTypeIds");
                      form.setValue(
                        "questionTypeIds",
                        event.target.checked ? [...current, type.id] : current.filter((id) => id !== type.id),
                        { shouldDirty: true }
                      );
                    }}
                  />
                  {type.name}
                </label>
              ))}
            </div>
            {form.formState.errors.questionTypeIds && <p className="err">{form.formState.errors.questionTypeIds.message}</p>}
          </div>
          <div className="f">
            <label>Difficulty <span className="req" aria-hidden="true">•</span></label>
            <div className="seg">
              {taxonomy.data.difficulties.map((difficulty) => (
                <button
                  key={difficulty.id}
                  type="button"
                  aria-pressed={form.watch("difficultyId") === difficulty.id}
                  onClick={() => form.setValue("difficultyId", difficulty.id, { shouldDirty: true })}
                >
                  {difficulty.name}
                </button>
              ))}
            </div>
            {form.formState.errors.difficultyId && <p className="err">{form.formState.errors.difficultyId.message}</p>}
          </div>
        </Card>

        <div className="addrow !mt-4">
          {details && (
            <button type="submit" className="btn" disabled={!isEditable}>
              <FileText className="size-4" aria-hidden="true" /> Save draft
            </button>
          )}
          {details && (
            <button type="button" className="btn pri" disabled={!isEditable || submit.isPending} onClick={() => submit.mutate()}>
              <Send className="size-4" aria-hidden="true" /> Submit for review <span className="small !text-white/70">⌘⏎</span>
            </button>
          )}
          {!details && (
            <button type="submit" className="btn pri" disabled={create.isPending}>
              <Plus className="size-4" aria-hidden="true" /> Create question
            </button>
          )}
          {!details && (
            <label className="fsm ml-1">
              <input type="checkbox" checked={addNext} onChange={(event) => setAddNext(event.target.checked)} /> Add another after this
            </label>
          )}
          {details && (
            <button type="button" className="btn sm" disabled={duplicate.isPending} onClick={() => duplicate.mutate()}>
              <Copy className="size-3.5" aria-hidden="true" /> Duplicate
            </button>
          )}
          {details && (
            <button type="button" className="btn sm" disabled={newRevision.isPending} onClick={() => newRevision.mutate()}>
              <History className="size-3.5" aria-hidden="true" /> New revision
            </button>
          )}
        </div>
      </form>

      <aside className="space-y-4">
        {details && (
          <Card title="Status">
            <div className="status-now">
              <StatusBadge status={details.question.status} />
            </div>
            <div className="kv"><span>Revision</span><b>{details.revision.revisionNumber}</b></div>
            <div className="kv"><span>Created</span><b className="small">{details.question.createdAt.slice(0, 10)}</b></div>
            <div className="kv"><span>Updated</span><b className="small">{details.question.updatedAt.slice(0, 10)}</b></div>
          </Card>
        )}
        {details && (
          <Card title={<span className="flex items-center gap-1.5"><Users className="size-3.5" aria-hidden="true" /> Contributors</span>}>
            {contributors.data?.length ? (
              contributors.data.map(({ contributor, profile }) => (
                <div className="hist flex items-center gap-2.5" key={contributor.id}>
                  <span className="avatar !h-7 !w-7 !text-[11px]">{initials(profile.displayName)}</span>
                  <span className="min-w-0">
                    <span className="who block truncate">{profile.displayName}</span>
                    <span className="small">{contributor.contributionType.replaceAll("_", " ")}</span>
                  </span>
                </div>
              ))
            ) : (
              <p className="small">No contributors recorded.</p>
            )}
          </Card>
        )}
        {details && (
          <Card title="History">
            {audit.data?.length ? (
              audit.data.slice(0, 12).map(({ audit: entry, actor }) => (
                <div className="hist" key={entry.id}>
                  <span className="who">{actor.displayName}</span> <span className="mono small">{entry.action}</span>
                  <br />
                  <span className="when">{entry.createdAt.slice(0, 16).replace("T", " ")}</span>
                </div>
              ))
            ) : (
              <p className="small">No activity yet.</p>
            )}
            {details && revisions.data && (
              <div className="kv !mt-2">
                <span>Revisions</span>
                <b>{revisions.data.length}</b>
              </div>
            )}
          </Card>
        )}
      </aside>
    </div>
  );
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}
