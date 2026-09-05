"use server";

import { requireUser } from "@/server/auth/session";
import { runAction } from "@/server/lib/action-result";
import { operationsService } from "@/server/services/operations.service";
import {
  bulkArchiveSchema,
  bulkAssignSchema,
  bulkDifficultySchema,
  bulkTaxonomySchema,
  createSavedViewSchema,
  savedViewIdParamsSchema,
  searchQuerySchema,
  updateSavedViewSchema,
} from "@/server/schemas/operations.schemas";

export async function searchQuestions(query: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    return operationsService.search(searchQuerySchema.parse(query ?? {}), session);
  });
}

export async function listSavedViews() {
  return runAction(async () => {
    const session = await requireUser();
    return operationsService.listSavedViews(session);
  });
}

export async function createSavedView(input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const body = createSavedViewSchema.parse(input);
    return operationsService.createSavedView(body.name, body.filters, session);
  });
}

export async function updateSavedView(viewId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = savedViewIdParamsSchema.parse({ viewId });
    return operationsService.updateSavedView(params.viewId, updateSavedViewSchema.parse(input), session);
  });
}

export async function deleteSavedView(viewId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = savedViewIdParamsSchema.parse({ viewId });
    await operationsService.deleteSavedView(params.viewId, session);
  });
}

export async function bulkAssign(input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const body = bulkAssignSchema.parse(input);
    return operationsService.assign(body.questionIds, body.profileId, body.assignmentType, session);
  });
}

export async function bulkChangeTaxonomy(input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const body = bulkTaxonomySchema.parse(input);
    return operationsService.changeTaxonomy(body.questionIds, body, session);
  });
}

export async function bulkChangeDifficulty(input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const body = bulkDifficultySchema.parse(input);
    return operationsService.changeDifficulty(body.questionIds, body.difficultyId, session);
  });
}

export async function bulkArchive(input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const body = bulkArchiveSchema.parse(input);
    return operationsService.archive(body.questionIds, session);
  });
}
