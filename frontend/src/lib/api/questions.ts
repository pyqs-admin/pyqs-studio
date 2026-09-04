import { studioFetch } from "./client";

export type QuestionOption = { id?: string; label: "A" | "B" | "C" | "D"; content: string; mediaAssetId?: string | null; position?: number };
export type SecondaryTopic = { topicId: string; role: "DISEASE" | "MECHANISM" | "DIAGNOSIS" | "MANAGEMENT" | "ASSOCIATION" | "COMPLICATION" | "OTHER" };
export type QuestionDraft = { stem: string; stemMediaAssetIds: string[]; correctOption: "A" | "B" | "C" | "D"; chapterId: string; topicId: string; difficultyId: string; questionTypeId: string; questionType2Id: string | null; presentation: "DIRECT" | "VIGNETTE"; difficultyRationale: string | null; secondaryTopics: SecondaryTopic[]; options: QuestionOption[] };
export type QuestionDetails = { question: { id: string; publicQid: string; questionNumber: number; projectId: string; status: string; createdAt: string; updatedAt: string }; revision: { id: string; revisionNumber: number; status: string; stem: string; stemMediaAssetIds: string[]; subjectId: string; chapterId: string; topicId: string; difficultyId: string; questionType2Id: string | null; presentation: "DIRECT" | "VIGNETTE" | null; difficultyRationale: string | null; correctOption: "A" | "B" | "C" | "D"; createdAt: string }; options: QuestionOption[]; questionTypes: { questionTypeId: string }[]; secondaryTopics: SecondaryTopic[] };
export type Revision = { id: string; revisionNumber: number; status: string; createdAt: string; createdBy: string };
export type ValidationResult = { valid: boolean; errors: { field: string; message: string }[]; warnings: { field: string; message: string }[]; revisionId: string };
export type Contributor = { contributor: { id: string; contributionType: string; createdAt: string }; profile: { id: string; displayName: string; email: string } };
export type AuditEntry = { audit: { id: string; action: string; createdAt: string }; actor: { id: string; displayName: string; email: string } };

export const createQuestion = (projectId: string, subjectId: string, body: QuestionDraft) => studioFetch<QuestionDetails>(`/projects/${projectId}/subjects/${subjectId}/questions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
export const getQuestion = (questionId: string) => studioFetch<QuestionDetails>(`/questions/${questionId}`);
export const getQuestionRevisions = (questionId: string) => studioFetch<Revision[]>(`/questions/${questionId}/revisions`);
export const saveQuestionDraft = (questionId: string, revisionId: string, body: QuestionDraft) => studioFetch<QuestionDetails["revision"]>(`/questions/${questionId}/revisions/${revisionId}/draft`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
export const createQuestionRevision = (questionId: string) => studioFetch<Revision>(`/questions/${questionId}/revisions`, { method: "POST" });
export const validateQuestionRevision = (revisionId: string) => studioFetch<ValidationResult>(`/question-revisions/${revisionId}/validate`, { method: "POST" });
export const submitQuestion = (questionId: string) => studioFetch<unknown>(`/questions/${questionId}/submit`, { method: "POST" });
export const duplicateQuestion = (questionId: string) => studioFetch<QuestionDetails>(`/questions/${questionId}/duplicate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
export const getQuestionContributors = (questionId: string) => studioFetch<Contributor[]>(`/questions/${questionId}/contributors`);
export const getQuestionAudit = (questionId: string) => studioFetch<AuditEntry[]>(`/questions/${questionId}/audit-log`);
