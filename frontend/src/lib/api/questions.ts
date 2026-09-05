import { createQuestion as createQuestionAction, createQuestionRevision as createQuestionRevisionAction, duplicateQuestion as duplicateQuestionAction, getQuestion as getQuestionAction, listQuestionAudit, listQuestionContributors, listQuestionRevisions, saveQuestionDraft as saveQuestionDraftAction, submitQuestion as submitQuestionAction, validateQuestionRevision as validateQuestionRevisionAction } from "@/actions/questions";
import { callAction } from "./client";

export type QuestionOption = { id?: string; label: "A" | "B" | "C" | "D"; content: string; mediaAssetId?: string | null; position?: number };
export type SecondaryTopic = { topicId: string; role: "DISEASE" | "MECHANISM" | "DIAGNOSIS" | "MANAGEMENT" | "ASSOCIATION" | "COMPLICATION" | "OTHER" };
export type QuestionDraft = { stem: string; stemMediaAssetIds: string[]; correctOption: "A" | "B" | "C" | "D"; chapterId: string; topicId: string; difficultyId: string; questionTypeId: string; questionType2Id: string | null; presentation: "DIRECT" | "VIGNETTE"; difficultyRationale: string | null; secondaryTopics: SecondaryTopic[]; options: QuestionOption[] };
export type QuestionDetails = { question: { id: string; publicQid: string; questionNumber: number; projectId: string; status: string; createdAt: string; updatedAt: string }; revision: { id: string; revisionNumber: number; status: string; stem: string; stemMediaAssetIds: string[]; subjectId: string; chapterId: string; topicId: string; difficultyId: string; questionType2Id: string | null; presentation: "DIRECT" | "VIGNETTE" | null; difficultyRationale: string | null; correctOption: "A" | "B" | "C" | "D"; createdAt: string }; options: QuestionOption[]; questionTypes: { questionTypeId: string }[]; secondaryTopics: SecondaryTopic[] };
export type Revision = { id: string; revisionNumber: number; status: string; createdAt: string; createdBy: string };
export type ValidationResult = { valid: boolean; errors: { field: string; message: string }[]; warnings: { field: string; message: string }[]; revisionId: string };
export type Contributor = { contributor: { id: string; contributionType: string; createdAt: string }; profile: { id: string; displayName: string; email: string } };
export type AuditEntry = { audit: { id: string; action: string; createdAt: string }; actor: { id: string; displayName: string; email: string } };

export const createQuestion = (projectId: string, subjectId: string, body: QuestionDraft) => callAction<QuestionDetails>(createQuestionAction(projectId, subjectId, body));
export const getQuestion = (questionId: string) => callAction<QuestionDetails>(getQuestionAction(questionId));
export const getQuestionRevisions = (questionId: string) => callAction<Revision[]>(listQuestionRevisions(questionId));
export const saveQuestionDraft = (questionId: string, revisionId: string, body: QuestionDraft) => callAction<QuestionDetails["revision"]>(saveQuestionDraftAction(questionId, revisionId, body));
export const createQuestionRevision = (questionId: string) => callAction<Revision>(createQuestionRevisionAction(questionId));
export const validateQuestionRevision = (revisionId: string) => callAction<ValidationResult>(validateQuestionRevisionAction(revisionId));
export const submitQuestion = (questionId: string) => callAction<unknown>(submitQuestionAction(questionId));
export const duplicateQuestion = (questionId: string) => callAction<QuestionDetails>(duplicateQuestionAction(questionId, {}));
export const getQuestionContributors = (questionId: string) => callAction<Contributor[]>(listQuestionContributors(questionId));
export const getQuestionAudit = (questionId: string) => callAction<AuditEntry[]>(listQuestionAudit(questionId));
