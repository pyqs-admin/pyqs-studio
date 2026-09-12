"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, CircleCheck, Copy, FileText, History, Lock, Plus, Search, Send, Users, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ExplanationWorkspace } from "@/components/questions/explanation-workspace";
import { getQuestions, getTaxonomy, type QuestionRow, type Taxonomy } from "@/lib/api/projects";
import { getMedia, registerExternalImage, uploadMedia, type MediaAsset } from "@/lib/api/explanations";
import { getCurrentStudioUser } from "@/lib/api/auth";
import { approveQuestion, requestChanges } from "@/lib/api/review";
import { StudioApiError } from "@/lib/api/types";
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
  questionTypeId: z.string().uuid("Choose a question type."),
  questionType2Id: z.string().uuid().nullable(),
  presentation: z.enum(["DIRECT", "VIGNETTE"]),
  difficultyRationale: z.string().max(2_000).nullable(),
  secondaryTopics: z.array(z.object({ topicId: z.string().uuid(), role: z.enum(["DISEASE", "MECHANISM", "DIAGNOSIS", "MANAGEMENT", "ASSOCIATION", "COMPLICATION", "OTHER"]) })).max(3),
  options: z.array(z.object({ label: z.enum(labels), content: z.string().trim().min(1, "Every option needs content."), mediaAssetId: z.string().uuid().nullable().optional() })).length(4),
  stemMediaAssetIds: z.array(z.string().uuid()).max(5),
});
type FormValues = z.infer<typeof draftSchema>;

type DropdownOption = { id: string; name: string; code?: string };

function TaxonomyDropdown({ value, options, placeholder, searchPlaceholder, disabled, allowClear = false, onChange }: { value: string; options: DropdownOption[]; placeholder: string; searchPlaceholder: string; disabled?: boolean; allowClear?: boolean; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.id === value);
  const filtered = options.filter((option) => `${option.name} ${option.code ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return <div className="studio-dropdown" ref={ref}>
    <button type="button" className="inp studio-dropdown-trigger" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} onClick={() => { setOpen((current) => !current); setQuery(""); }}>
      <span className={selected ? "" : "studio-dropdown-placeholder"}>{selected?.name ?? placeholder}</span><ChevronDown className="size-4" aria-hidden="true" />
    </button>
    {open && <div className="studio-dropdown-menu" role="listbox">
      <div className="studio-dropdown-search"><Search className="size-3.5" aria-hidden="true" /><input autoFocus value={query} placeholder={searchPlaceholder} onChange={(event) => setQuery(event.target.value)} /></div>
      <div className="studio-dropdown-options">{allowClear && value && <button type="button" role="option" aria-selected="false" onClick={() => { onChange(""); setOpen(false); setQuery(""); }}><span>{placeholder}</span></button>}{filtered.map((option) => <button type="button" role="option" aria-selected={option.id === value} key={option.id} onClick={() => { onChange(option.id); setOpen(false); setQuery(""); }}><span>{option.name}</span>{option.code && <span className="mono small">{option.code}</span>}</button>)}{filtered.length === 0 && <p className="small studio-dropdown-empty">No taxonomy match.</p>}</div>
    </div>}
  </div>;
}

function QuestionRail({ details, projectId, subjectId, taxonomy, questions }: { details?: QuestionDetails; projectId: string; subjectId: string; taxonomy: Taxonomy; questions: QuestionRow[] }) {
  return <aside className="question-rail">
    <div className="question-rail-tools"><label className="qsearch"><Search className="size-4" aria-hidden="true" /><input placeholder="Find in this project" aria-label="Find in this project" /></label><div className="filters"><button className="fchip" aria-pressed="true">All 1</button>{details && <span className="fchip">{details.question.status.replaceAll("_", " ")} 1</span>}</div></div>
    <div className="question-tree">{taxonomy.subjects.map((subject) => { const rows = questions.filter((row) => row.revision.subjectId === subject.id); const active = subject.id === subjectId; return <div key={subject.id}><div className={`question-section ${active ? "is-current" : ""}`}><span className="question-caret">›</span><b>{subject.name}</b><span className="question-count">{active ? Math.max(rows.length, 1) : rows.length}</span></div>{active ? <><div className="question-item" aria-current="true"><span className="question-number">{details ? `Q${details.question.questionNumber}` : "New"}</span><span className="question-stem">{details?.revision.stem || "Empty question"}</span><span className="tag">{details ? "Draft" : "New"}</span></div><Link href={`/projects/${projectId}/subjects/${subject.id}/questions/new`} className="question-add"><Plus className="size-3.5" aria-hidden="true" /> Add question here</Link></> : <Link href={`/projects/${projectId}/subjects/${subject.id}/questions/new`} className="question-subject-link">{rows.length ? `${rows.length} question${rows.length === 1 ? "" : "s"}` : "Add question"}<span>›</span></Link>}</div>; })}</div>
  </aside>;
}

function QuestionChecks({ form, details }: { form: ReturnType<typeof useForm<FormValues>>; details?: QuestionDetails }) {
  const values = form.getValues();
  const checks = [{ label: "Question stem", ok: Boolean(values.stem.trim()) }, { label: "At least two options", ok: values.options.filter((option) => option.content.trim()).length >= 2 }, { label: "Correct answer marked", ok: Boolean(values.correctOption) }, { label: "Topic chosen from the index", ok: Boolean(values.topicId) }, { label: "Question type set", ok: Boolean(values.questionTypeId) }, { label: "Presentation set (Direct / Vignette)", ok: Boolean(values.presentation) }, { label: "Difficulty set", ok: Boolean(values.difficultyId) }, { label: "Second type differs from the first", ok: !values.questionType2Id || values.questionType2Id !== values.questionTypeId }];
  const workflow = [{ key: "DRAFT", label: "Draft" }, { key: "NEEDS_EXPLANATION", label: "Needs explanation" }, { key: "EXPLANATION_READY", label: "Explanation drafted" }, { key: "UNDER_REVIEW", label: "In review" }, { key: "APPROVED", label: "Approved" }, { key: "PUBLISHED", label: "Published" }];
  const currentIndex = details ? Math.max(0, workflow.findIndex((item) => item.key === details.question.status || (item.key === "NEEDS_EXPLANATION" && details.question.status === "QUESTION_SUBMITTED") || (item.key === "DRAFT" && details.question.status === "CHANGES_REQUESTED"))) : 0;
  return <aside className="question-checks"><h3>Checks</h3>{checks.map((check) => <div className={`question-check ${check.ok ? "ok" : "bad"}`} key={check.label}>{check.ok ? <CircleCheck className="size-4" aria-hidden="true" /> : <AlertCircle className="size-4" aria-hidden="true" />}<span>{check.label}</span></div>)}{details && <><h3 className="question-checks-heading">Status</h3><div className="status-now"><StatusBadge status={details.question.status} /></div><div className="status-ladder">{workflow.map((item, index) => <span className={index < currentIndex ? "done" : index === currentIndex ? "now" : ""} key={item.key}>{item.label}</span>)}</div><div className="kv"><span>Revision</span><b>{details.revision.revisionNumber}</b></div><div className="kv"><span>Updated</span><b className="small">{details.question.updatedAt.slice(0, 10)}</b></div></>}</aside>;
}

function ImageDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (asset: MediaAsset) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isOver, setIsOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [values, setValues] = useState({ sourceUrl: "", sourceTitle: "", creator: "", license: "", attribution: "", caption: "", altText: "", annotated: "no" as "yes" | "no" });
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const set = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const chooseFile = (nextFile?: File) => { if (nextFile) setFile(nextFile); setIsOver(false); };
  useEffect(() => { if (!file) { setPreviewUrl(null); return; } const url = URL.createObjectURL(file); setPreviewUrl(url); return () => URL.revokeObjectURL(url); }, [file]);
  const save = async () => { setError(""); const imageUrl = externalUrl.trim(); const sourceUrl = values.sourceUrl || imageUrl; if ((!file && !imageUrl) || !sourceUrl || !values.license || !values.altText) { setError("Choose a picture or paste an image URL, then complete the source link, licence, and alt text fields."); return; } setBusy(true); try { const attribution = values.attribution || [values.sourceTitle, values.creator, values.license].filter(Boolean).join(" · "); const asset = file ? await uploadMedia(file, { ...values, attribution }) : await registerExternalImage({ ...values, attribution, fileUrl: imageUrl, sourceUrl }); onSaved(asset); onClose(); } catch (cause) { const details = cause instanceof StudioApiError && detailsProperties(cause.details); setError(details || (cause instanceof Error ? cause.message : "The image could not be saved.")); } finally { setBusy(false); } };
  return <div className="image-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="image-dialog" role="dialog" aria-modal="true" aria-labelledby="image-dialog-title"><div className="image-dialog-head"><h2 id="image-dialog-title">Image</h2><button type="button" className="btn-icon" onClick={onClose} aria-label="Close">×</button></div><div className="image-dialog-body"><p className="hint">Add an image to the question. You can upload a file or paste a direct image URL. Source link and licence are required before the question can leave draft.</p><div className="f"><label>Image <span className="req">•</span></label><label className={`drop image-drop ${isOver ? "over" : ""}`} onDragOver={(event) => { event.preventDefault(); setIsOver(true); }} onDragLeave={() => setIsOver(false)} onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files[0]); }}>{previewUrl && <img className="image-dialog-preview" src={previewUrl} alt="Selected preview" />}<span>{file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : "Drop an image here, or click to choose"}</span><input className="sr-only" type="file" accept="image/*" onChange={(event) => chooseFile(event.target.files?.[0])} /></label><input className="inp" value={externalUrl} onChange={(event) => { setExternalUrl(event.target.value); if (event.target.value) { setFile(null); setPreviewUrl(null); } }} placeholder="…or paste a direct image URL (https://…)" /></div><div className="row"><div className="f flex-1"><label>Caption</label><input className="inp" value={values.caption} onChange={(event) => set("caption", event.target.value)} /></div><div className="f flex-1"><label>Alt text <span className="small">for screen readers</span></label><input className="inp" value={values.altText} onChange={(event) => set("altText", event.target.value)} placeholder="Describe what the image shows" /></div></div><div className="row"><div className="f flex-1"><label>Source title</label><input className="inp" value={values.sourceTitle} onChange={(event) => set("sourceTitle", event.target.value)} placeholder="Evolution of Caspases and the Invention of Pyroptosis" /></div><div className="f flex-1"><label>Author / holder</label><input className="inp" value={values.creator} onChange={(event) => set("creator", event.target.value)} placeholder="Author or rights holder" /></div></div><div className="row"><div className="f flex-1"><label>Source link <span className="req">•</span></label><input className="inp" value={values.sourceUrl} onChange={(event) => set("sourceUrl", event.target.value)} placeholder="https://…" /></div><div className="f flex-1"><label>Licence <span className="req">•</span></label><select className="inp" value={values.license} onChange={(event) => set("license", event.target.value)}><option value="">Choose…</option><option value="CC_BY_4_0">CC BY 4.0</option><option value="CC_BY_SA_4_0">CC BY-SA 4.0</option><option value="CC_BY_3_0">CC BY 3.0</option><option value="CC_BY_2_5">CC BY 2.5</option><option value="CC_BY_NC_4_0">CC BY-NC 4.0</option><option value="CC0">CC0 / no rights reserved</option><option value="PUBLIC_DOMAIN">Public domain</option><option value="OWN_WORK">Our own work</option><option value="LICENSED_STOCK">Licensed stock (licence on file)</option><option value="PERMISSION">Written permission on file</option></select></div></div><label className="fsm"><input type="checkbox" checked={values.annotated === "yes"} onChange={(event) => set("annotated", event.target.checked ? "yes" : "no")} /> I annotated or cropped this image</label>{error && <p className="err">{error}</p>}</div><div className="image-dialog-foot"><button type="button" className="btn" onClick={onClose}>Cancel</button><span className="grow" /><button type="button" className="btn pri" onClick={() => void save()} disabled={busy}>{busy ? "Saving…" : "Save image"}</button></div></section></div>;
}

function detailsProperties(details: unknown) {
  if (!details || typeof details !== "object" || !("properties" in details)) return "";
  const properties = details.properties;
  if (!properties || typeof properties !== "object") return "";
  return Object.entries(properties).flatMap(([field, value]) => value && typeof value === "object" && "errors" in value && Array.isArray(value.errors) ? value.errors.map((message: unknown) => `${field}: ${String(message)}`) : []).join(" ");
}

function initialValues(subjectId: string, details?: QuestionDetails): FormValues {
  return details
    ? {
        stem: details.revision.stem,
        stemMediaAssetIds: details.revision.stemMediaAssetIds ?? [],
        correctOption: details.revision.correctOption,
        chapterId: details.revision.chapterId,
        topicId: details.revision.topicId,
        difficultyId: details.revision.difficultyId,
        questionTypeId: details.questionTypes.find((type) => type.questionTypeId !== details.revision.questionType2Id)?.questionTypeId ?? "",
        questionType2Id: details.revision.questionType2Id ?? null,
        presentation: details.revision.presentation ?? "DIRECT",
        difficultyRationale: details.revision.difficultyRationale ?? null,
        secondaryTopics: details.secondaryTopics ?? [],
        options: labels.map((label) => ({ label, content: details.options.find((option) => option.label === label)?.content ?? "", mediaAssetId: details.options.find((option) => option.label === label)?.mediaAssetId ?? null })),
      }
    : {
        stem: "",
        stemMediaAssetIds: [],
        correctOption: "A",
        chapterId: "",
        topicId: "",
        difficultyId: "",
        questionTypeId: "",
        questionType2Id: null,
        presentation: "DIRECT",
        difficultyRationale: null,
        secondaryTopics: [],
        options: labels.map((label) => ({ label, content: "", mediaAssetId: null })),
      };
}

export function QuestionEditor({ projectId, subjectId, details }: { projectId: string; subjectId: string; details?: QuestionDetails }) {
  const queryClient = useQueryClient();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [addNext, setAddNext] = useState(false);
  const [imageTarget, setImageTarget] = useState<"stem" | `option:${typeof labels[number]}` | null>(null);
  const [uploadedAssets, setUploadedAssets] = useState<MediaAsset[]>([]);
  const [tagSubjectId, setTagSubjectId] = useState("all");
  const [tagChapterId, setTagChapterId] = useState("");
  const [tagTerm, setTagTerm] = useState("");
  const [tagMenu, setTagMenu] = useState<"topic" | null>(null);
  const [secondaryTerm, setSecondaryTerm] = useState("");
  const [secondaryMenu, setSecondaryMenu] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taxonomy = useQuery({ queryKey: ["taxonomy"], queryFn: getTaxonomy, staleTime: 300_000 });
  const projectQuestions = useQuery({ queryKey: ["questions", { projectId, workspace: true }], queryFn: () => getQuestions({ projectId, limit: 100 }), staleTime: 30_000 });
  const media = useQuery({ queryKey: ["media"], queryFn: getMedia, staleTime: 300_000 });
  const currentUser = useQuery({ queryKey: ["studio", "current-user"], queryFn: getCurrentStudioUser, staleTime: 300_000 });
  const form = useForm<FormValues>({ resolver: zodResolver(draftSchema), defaultValues: initialValues(subjectId, details) });
  const values = useWatch({ control: form.control });
  const asset = (id: string) => uploadedAssets.find((item) => item.id === id) ?? media.data?.find((item) => item.id === id);
  const attachImage = (saved: MediaAsset) => { setUploadedAssets((current) => [...current, saved]); if (imageTarget === "stem") form.setValue("stemMediaAssetIds", [...form.getValues("stemMediaAssetIds"), saved.id], { shouldDirty: true }); else if (imageTarget?.startsWith("option:")) { const label = imageTarget.slice(7) as typeof labels[number]; const index = labels.indexOf(label); form.setValue(`options.${index}.mediaAssetId`, saved.id, { shouldDirty: true }); } };

  const selectedTopic = taxonomy.data?.topics.find((item) => item.id === form.watch("topicId"));
  const selectedChapter = taxonomy.data?.chapters.find((item) => item.id === form.watch("chapterId"));
  const selectedTopicChapter = taxonomy.data?.chapters.find((item) => item.id === selectedTopic?.chapterId);
  const selectedTopicSubject = taxonomy.data?.subjects.find((item) => item.id === selectedTopicChapter?.subjectId);
  const tagChapters = taxonomy.data?.chapters.filter((item) => item.subjectId === tagSubjectId) ?? [];
  const tagResults = (taxonomy.data?.topics ?? []).filter((topic) => {
    const topicChapter = taxonomy.data?.chapters.find((chapter) => chapter.id === topic.chapterId);
    const subjectMatch = tagSubjectId === "all" || topicChapter?.subjectId === tagSubjectId;
    const chapterMatch = !tagChapterId || topic.chapterId === tagChapterId;
    const query = tagTerm.trim().toLowerCase();
    const text = [topic.name, topic.code, ...(topic.aliases ?? [])].join(" ").toLowerCase();
    return subjectMatch && chapterMatch && (!query || text.includes(query));
  }).slice(0, 18);
  const secondaryResults = (taxonomy.data?.topics ?? []).filter((topic) => {
    const query = secondaryTerm.trim().toLowerCase();
    const selected = form.watch("secondaryTopics").map((item) => item.topicId);
    return !selected.includes(topic.id) && topic.id !== form.watch("topicId") && (!query || `${topic.name} ${topic.code} ${(topic.aliases ?? []).join(" ")}`.toLowerCase().includes(query));
  }).slice(0, 12);

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
  const approve = useMutation({ mutationFn: () => approveQuestion(details!.question.id), onSuccess: () => { invalidate(); window.location.reload(); } });
  const sendBack = useMutation({ mutationFn: (comment: string) => requestChanges(details!.question.id, comment), onSuccess: () => { invalidate(); window.location.reload(); } });
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
  const canReview = Boolean(currentUser.data?.permissions.includes("question.review"));
  const canEditExplanation = Boolean(currentUser.data?.permissions.includes("explanation.edit"));
  const reviewable = Boolean(details && ["NEEDS_EXPLANATION", "QUESTION_SUBMITTED", "EXPLANATION_READY", "UNDER_REVIEW"].includes(details.question.status));
  const subject = taxonomy.data.subjects.find((item) => item.id === subjectId);
  const saveText =
    saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Save failed — try again" : details ? "Draft" : "New draft";

  return (
    <div className="question-workspace">
      <QuestionRail details={details} projectId={projectId} subjectId={subjectId} taxonomy={taxonomy.data} questions={projectQuestions.data ?? []} />
      <form
        onSubmit={form.handleSubmit((body) => (details ? save.mutate(body) : create.mutate(body)))}
        className="question-editor-main min-w-0 space-y-0"
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
            <span>{details ? `Q${details.question.questionNumber}` : "new draft"}</span>
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
            <div className="addrow"><button type="button" className="btn sm" disabled={!isEditable} onClick={() => setImageTarget("stem")}><span aria-hidden="true">▧</span> Add image to the stem</button></div>
            <div className="question-image-list">{form.watch("stemMediaAssetIds").map((id) => <span className="question-image-chip" key={id}>{asset(id)?.fileUrl && <img src={asset(id)!.fileUrl} alt={asset(id)?.altText ?? ""} />}{asset(id)?.fileName ?? "Attached image"}<button type="button" onClick={() => form.setValue("stemMediaAssetIds", form.getValues("stemMediaAssetIds").filter((item) => item !== id), { shouldDirty: true })} aria-label="Remove stem image">×</button></span>)}</div>
            {form.formState.errors.stem && <p className="err">{form.formState.errors.stem.message}</p>}
          </div>
          <div className="f mt-4 mb-1.5">
            <label>Options <span className="req" aria-hidden="true">•</span><span className="small">— tick the correct one</span></label>
          </div>
          {labels.map((label, index) => {
            const correct = form.watch("correctOption") === label;
            return (
              <Fragment key={label}>
              <div className={`opt ${correct ? "correct" : ""}`}>
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
                  <button type="button" className="btn-icon" disabled={!isEditable} title="Add an image to this option" onClick={() => setImageTarget(`option:${label}`)} aria-label={`Add image to option ${label}`}>▧</button>
                </span>
              </div>
              {form.watch(`options.${index}.mediaAssetId`) && <div className="question-image-chip option-image">{asset(form.watch(`options.${index}.mediaAssetId`)!)?.fileUrl && <img src={asset(form.watch(`options.${index}.mediaAssetId`)!)!.fileUrl} alt={asset(form.watch(`options.${index}.mediaAssetId`)!)?.altText ?? ""} />}{asset(form.watch(`options.${index}.mediaAssetId`)!)?.fileName ?? "Attached image"}<button type="button" onClick={() => form.setValue(`options.${index}.mediaAssetId`, null, { shouldDirty: true })} aria-label={`Remove image from option ${label}`}>×</button></div>}
              </Fragment>
            );
          })}
          {form.formState.errors.options && <p className="err">Complete all four options before saving.</p>}
        </Card>

        <Card step={2} title="Tags" headerRight={<span className="small">subject and chapter derive from the topic path</span>}>
          {selectedTopic ? <>
            <div className="picked">
              <span className="tn">{selectedTopic.name}</span>
              <span className="code mono">{selectedTopic.code}</span>
              <Link className="btn sm ghost" href="/taxonomy" title="Read this topic in the Index" style={{ textDecoration: "none" }}>↗</Link>
              <span className="grow" />
              <button type="button" className="btn sm" disabled={!isEditable} onClick={() => { form.setValue("topicId", "", { shouldDirty: true }); setTagSubjectId(selectedTopicChapter?.subjectId ?? "all"); setTagChapterId(selectedTopic.chapterId ?? ""); setTagTerm(""); setTagMenu("topic"); }}>Change</button>
            </div>
            <div className="derived mb-3">
              {selectedTopicSubject && <span className="d"><b>Subject</b> {selectedTopicSubject.name} <span className="mono small">{selectedTopicSubject.code}</span></span>}
              {selectedChapter && <span className="d"><b>Chapter</b> {selectedChapter.name}</span>}
            </div>
          </> : <>
            <div className="row mb-3">
              <div className="f flex-1 basis-52">
                <label>Search within <span className="small">a boost, never a wall — every subject stays visible</span></label>
                <TaxonomyDropdown value={tagSubjectId} options={[{ id: "all", name: "All subjects", code: "ALL" }, ...(taxonomy.data?.subjects ?? [])]} placeholder="All subjects" searchPlaceholder="Search subjects…" disabled={!isEditable} onChange={(value) => { setTagSubjectId(value); setTagChapterId(""); setTagTerm(""); setTagMenu("topic"); }} />
              </div>
              <div className="f flex-1 basis-52">
                <label>Chapter <span className="small">optional, narrows the search</span></label>
                <TaxonomyDropdown value={tagChapterId} options={[{ id: "", name: "Any chapter", code: "ALL" }, ...tagChapters]} placeholder={tagSubjectId === "all" ? "Choose a subject first" : "Any chapter"} searchPlaceholder="Search chapters…" allowClear disabled={!isEditable || tagSubjectId === "all"} onChange={(value) => { setTagChapterId(value); setTagTerm(""); setTagMenu("topic"); }} />
              </div>
            </div>
            <div className="f ta">
              <label>Topic <span className="req" aria-hidden="true">•</span><span className="small">— start typing; subject and chapter fill in themselves</span></label>
              <input
                disabled={!isEditable}
                className="inp"
                value={tagTerm}
                autoComplete="off"
                spellCheck={false}
                placeholder="e.g. mitral stenosis, AF, faggot cells, Parkland formula, or topic code"
                onFocus={() => setTagMenu("topic")}
                onBlur={() => window.setTimeout(() => setTagMenu(null), 120)}
                onChange={(event) => { setTagTerm(event.target.value); setTagMenu("topic"); }}
              />
              {tagMenu === "topic" && tagResults.length > 0 && <div className="ta-menu" role="listbox">
                {tagResults.map((topic) => {
                  const resultChapter = taxonomy.data?.chapters.find((item) => item.id === topic.chapterId);
                  const resultSubject = taxonomy.data?.subjects.find((item) => item.id === resultChapter?.subjectId);
                  return <button type="button" className="ta-item" role="option" aria-selected={topic.id === form.watch("topicId")} key={topic.id} onMouseDown={(event) => event.preventDefault()} onClick={() => { form.setValue("topicId", topic.id, { shouldDirty: true }); form.setValue("chapterId", topic.chapterId ?? "", { shouldDirty: true }); setTagSubjectId(resultChapter?.subjectId ?? "all"); setTagChapterId(topic.chapterId ?? ""); setTagTerm(""); setTagMenu(null); }}>
                    <span className="nm"><span>{topic.name}</span><span className="tag indigo">{resultSubject?.code ?? ""}</span></span>
                    <span className="path">{topic.code} · {resultSubject?.name ?? "Unknown subject"} › {resultChapter?.name ?? "Unknown chapter"}</span>
                  </button>;
                })}
              </div>}
              {tagMenu === "topic" && tagTerm.trim() && tagResults.length === 0 && <div className="ta-menu"><div className="small p-2">No matching topic. Try another subject, chapter, or search term.</div></div>}
            </div>
          </>}
          {form.formState.errors.chapterId && <p className="err">{form.formState.errors.chapterId.message}</p>}
          {form.formState.errors.topicId && <p className="err">{form.formState.errors.topicId.message}</p>}
          <div className="row mb-3">
            <div className="f flex-1 basis-52">
              <label>Question type <span className="req" aria-hidden="true">•</span><span className="small">— what the student had to <i>do</i></span></label>
              <TaxonomyDropdown value={form.watch("questionTypeId")} options={taxonomy.data.questionTypes} placeholder="Choose…" searchPlaceholder="Search question types…" disabled={!isEditable} onChange={(value) => form.setValue("questionTypeId", value, { shouldDirty: true })} />
              {form.formState.errors.questionTypeId && <p className="err">{form.formState.errors.questionTypeId.message}</p>}
            </div>
            <div className="f flex-1 basis-52">
              <label>Second type <span className="small">only when the first hides the task</span></label>
              <TaxonomyDropdown value={form.watch("questionType2Id") ?? ""} options={taxonomy.data.questionTypes.filter((type) => type.id !== form.watch("questionTypeId"))} placeholder="—" searchPlaceholder="Search a second type…" allowClear disabled={!isEditable} onChange={(value) => form.setValue("questionType2Id", value || null, { shouldDirty: true })} />
              {form.formState.errors.questionType2Id && <p className="err">{form.formState.errors.questionType2Id.message}</p>}
            </div>
          </div>
          <div className="f mb-3">
            <label>Presentation <span className="req" aria-hidden="true">•</span></label>
            <div className="choices"><button type="button" className="choice" aria-pressed={form.watch("presentation") === "DIRECT"} onClick={() => form.setValue("presentation", "DIRECT", { shouldDirty: true })}><b>Direct</b><span>the stem names the concept</span></button><button type="button" className="choice" aria-pressed={form.watch("presentation") === "VIGNETTE"} onClick={() => form.setValue("presentation", "VIGNETTE", { shouldDirty: true })}><b>Vignette</b><span>the student must infer it first</span></button></div>
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
          <div className="f mt-3">
            <label>Why that difficulty <span className="small">— optional; one line: where the fact sits, what must be derived</span></label>
            <textarea disabled={!isEditable} className="inp" rows={2} placeholder="Fine print in the source; one derivation; two attractive distractors." value={form.watch("difficultyRationale") ?? ""} onChange={(event) => form.setValue("difficultyRationale", event.target.value || null, { shouldDirty: true })} />
          </div>
          <details className="mt-3" open={form.watch("secondaryTopics").length > 0}>
            <summary className="small" style={{ cursor: "pointer" }}>Integrated question? Add up to three secondary topics</summary>
            <div className="mt-2">
              {form.watch("secondaryTopics").map((item, index) => { const topic = taxonomy.data.topics.find((candidate) => candidate.id === item.topicId); return <div className="row mb-1.5 items-center" key={item.topicId}><span className="tag">{topic?.name ?? item.topicId}</span><select disabled={!isEditable} className="inp w-auto" value={item.role} onChange={(event) => form.setValue(`secondaryTopics.${index}.role`, event.target.value as FormValues["secondaryTopics"][number]["role"], { shouldDirty: true })}><option value="DISEASE">Disease</option><option value="MECHANISM">Mechanism</option><option value="DIAGNOSIS">Diagnosis</option><option value="MANAGEMENT">Management</option><option value="ASSOCIATION">Association</option><option value="COMPLICATION">Complication</option><option value="OTHER">Other</option></select><button type="button" className="btn sm" disabled={!isEditable} onClick={() => form.setValue("secondaryTopics", form.getValues("secondaryTopics").filter((_, current) => current !== index), { shouldDirty: true })}>Remove</button></div>; })}
              {form.watch("secondaryTopics").length < 3 && <div className="f ta"><input disabled={!isEditable} className="inp" value={secondaryTerm} placeholder="Search a second topic…" autoComplete="off" onFocus={() => setSecondaryMenu(true)} onBlur={() => window.setTimeout(() => setSecondaryMenu(false), 120)} onChange={(event) => { setSecondaryTerm(event.target.value); setSecondaryMenu(true); }} />{secondaryMenu && <div className="ta-menu" role="listbox">{secondaryResults.map((topic) => <button type="button" className="ta-item" role="option" aria-selected="false" key={topic.id} onMouseDown={(event) => event.preventDefault()} onClick={() => { form.setValue("secondaryTopics", [...form.getValues("secondaryTopics"), { topicId: topic.id, role: "DISEASE" }], { shouldDirty: true }); setSecondaryTerm(""); setSecondaryMenu(false); }}><span className="nm">{topic.name}</span><span className="path">{topic.code}</span></button>)}{secondaryResults.length === 0 && <div className="small p-2">No matching taxonomy topic.</div>}</div>}</div>}
            </div>
          </details>
        </Card>

        {details && canEditExplanation && ["NEEDS_EXPLANATION", "QUESTION_SUBMITTED", "EXPLANATION_READY", "UNDER_REVIEW"].includes(details.question.status) && (
          <section className="question-inline-explanation">
            <div className="question-inline-explanation-heading">
              <div>
                <p className="eyebrow">Step 3</p>
                <h2>Explanation</h2>
              </div>
              <span className="small">Write and save the explanation on this question</span>
            </div>
            <ExplanationWorkspace revisionId={details.revision.id} previewHref={`/questions/${details.question.id}/preview`} />
          </section>
        )}

        <div className="addrow !mt-4">
          {details && ["DRAFT", "CHANGES_REQUESTED"].includes(details.question.status) && (
            <button type="submit" className="btn" disabled={!isEditable}>
              <FileText className="size-4" aria-hidden="true" /> Save draft
            </button>
          )}
          {details && ["DRAFT", "CHANGES_REQUESTED"].includes(details.question.status) && (
            <button type="button" className="btn pri" disabled={!isEditable || submit.isPending} onClick={() => submit.mutate()}>
              <Send className="size-4" aria-hidden="true" /> Send for explanation <span className="small !text-white/70">⌘⏎</span>
            </button>
          )}
          {details && canReview && reviewable && (
            <>
              <button type="button" className="btn success" disabled={approve.isPending || sendBack.isPending} onClick={() => approve.mutate()}><Check className="size-4" aria-hidden="true" /> Approve</button>
              <button type="button" className="btn" disabled={approve.isPending || sendBack.isPending} onClick={() => { const comment = window.prompt("Why are you sending this question back?", ""); if (comment !== null && comment.trim()) sendBack.mutate(comment.trim()); }}>Send back</button>
            </>
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

      <aside className="question-side-panels">
        <QuestionChecks form={form} details={details} />
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
      {imageTarget && <ImageDialog onClose={() => setImageTarget(null)} onSaved={attachImage} />}
    </div>
  );
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}
