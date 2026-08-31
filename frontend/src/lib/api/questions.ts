import { studioFetch } from "./client";

export type QuestionOption = { id?: string; label: "A" | "B" | "C" | "D"; content: string; position?: number };
export type QuestionDraft = { stem: string; correctOption: "A" | "B" | "C" | "D"; chapterId: string; topicId: string; difficultyId: string; questionTypeIds: string[]; options: QuestionOption[] };
export type QuestionDetails = { question: { id: string; publicQid: string; projectId: string; status: string; createdAt: string; updatedAt: string }; revision: { id: string; revisionNumber: number; status: string; stem: string; subjectId: string; chapterId: string; topicId: string; difficultyId: string; correctOption: "A" | "B" | "C" | "D"; createdAt: string }; options: QuestionOption[]; questionTypes: { questionTypeId: string }[] };
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
