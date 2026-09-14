"use server";

import { requireUser } from "@/server/auth/session";
import { runAction } from "@/server/lib/action-result";
import { questionsService } from "@/server/services/questions.service";
import {
  createQuestionSchema,
  duplicateQuestionSchema,
  projectSubjectParamsSchema,
  questionIdParamsSchema,
  questionListQuerySchema,
  revisionIdParamsSchema,
  revisionNumberParamsSchema,
  revisionParamsSchema,
  updateDraftSchema,
} from "@/server/schemas/questions.schemas";

export async function listQuestions(query: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    return questionsService.list(questionListQuerySchema.parse(query ?? {}), session);
  });
}

export async function listMyQuestions() {
  return runAction(async () => {
    const session = await requireUser();
    return questionsService.list({ createdBy: session.profileId, limit: 100, offset: 0 }, session);
  });
}

export async function getProjectQuestionStats(projectId: string) {
  return runAction(async () => {
    const session = await requireUser();
    return questionsService.projectStats(projectId, session);
  });
}

export async function listProjectSubjectQuestions(projectId: string, subjectId: string, query: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = projectSubjectParamsSchema.parse({ projectId, subjectId });
    return questionsService.list({ ...questionListQuerySchema.parse(query ?? {}), projectId: params.projectId, subjectId: params.subjectId }, session);
  });
}

export async function createQuestion(projectId: string, subjectId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = projectSubjectParamsSchema.parse({ projectId, subjectId });
    return questionsService.create(params.projectId, params.subjectId, createQuestionSchema.parse(input), session);
  });
}

export async function getQuestion(questionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = questionIdParamsSchema.parse({ questionId });
    return questionsService.get(params.questionId, session);
  });
}

export async function listQuestionContributors(questionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = questionIdParamsSchema.parse({ questionId });
    return questionsService.listContributors(params.questionId, session);
  });
}

export async function listQuestionAudit(questionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = questionIdParamsSchema.parse({ questionId });
    return questionsService.listAuditLogs(params.questionId, session);
  });
}

export async function listQuestionRevisions(questionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = questionIdParamsSchema.parse({ questionId });
    return questionsService.listRevisions(params.questionId, session);
  });
}

export async function getQuestionRevision(questionId: string, revisionNumber: number) {
  return runAction(async () => {
    const session = await requireUser();
    const params = revisionNumberParamsSchema.parse({ questionId, revisionNumber });
    return questionsService.getRevision(params.questionId, params.revisionNumber, session);
  });
}

export async function createQuestionRevision(questionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = questionIdParamsSchema.parse({ questionId });
    return questionsService.createRevision(params.questionId, session);
  });
}

export async function saveQuestionDraft(questionId: string, revisionId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = revisionParamsSchema.parse({ questionId, revisionId });
    return questionsService.saveDraft(params.questionId, params.revisionId, updateDraftSchema.parse(input), session);
  });
}

export async function saveDraftByRevision(revisionId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = revisionIdParamsSchema.parse({ revisionId });
    return questionsService.saveDraftByRevision(params.revisionId, updateDraftSchema.parse(input), session);
  });
}

export async function duplicateQuestion(questionId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = questionIdParamsSchema.parse({ questionId });
    return questionsService.duplicate(params.questionId, duplicateQuestionSchema.parse(input ?? {}), session);
  });
}

export async function submitQuestion(questionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = questionIdParamsSchema.parse({ questionId });
    return questionsService.submit(params.questionId, session);
  });
}

export async function archiveQuestion(questionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = questionIdParamsSchema.parse({ questionId });
    return questionsService.archive(params.questionId, session);
  });
}

export async function validateQuestionRevision(revisionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = revisionIdParamsSchema.parse({ revisionId });
    return questionsService.validateRevision(params.revisionId, session);
  });
}
