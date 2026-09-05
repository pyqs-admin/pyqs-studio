"use server";

import { requireUser } from "@/server/auth/session";
import { runAction } from "@/server/lib/action-result";
import { explanationsService } from "@/server/services/explanations.service";
import {
  addBlockSchema,
  explanationBlockIdParamsSchema,
  replaceBlocksSchema,
  replaceReferencesSchema,
  revisionIdParamsSchema,
  revisionParamsSchema,
  updateBlockSchema,
} from "@/server/schemas/explanations.schemas";

export async function listExplanationBlocks(questionId: string, revisionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = revisionParamsSchema.parse({ questionId, revisionId });
    return explanationsService.list(params.questionId, params.revisionId, session);
  });
}

export async function replaceExplanationBlocks(questionId: string, revisionId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = revisionParamsSchema.parse({ questionId, revisionId });
    return explanationsService.replace(params.questionId, params.revisionId, replaceBlocksSchema.parse(input), session);
  });
}

export async function getExplanation(revisionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = revisionIdParamsSchema.parse({ revisionId });
    return explanationsService.listByRevision(params.revisionId, session);
  });
}

export async function replaceExplanation(revisionId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = revisionIdParamsSchema.parse({ revisionId });
    return explanationsService.replaceByRevision(params.revisionId, replaceBlocksSchema.parse(input), session);
  });
}

export async function addExplanationBlock(revisionId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = revisionIdParamsSchema.parse({ revisionId });
    return explanationsService.add(params.revisionId, addBlockSchema.parse(input), session);
  });
}

export async function updateExplanationBlock(blockId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = explanationBlockIdParamsSchema.parse({ blockId });
    return explanationsService.update(params.blockId, updateBlockSchema.parse(input), session);
  });
}

export async function removeExplanationBlock(blockId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = explanationBlockIdParamsSchema.parse({ blockId });
    await explanationsService.remove(params.blockId, session);
  });
}

export async function getReferences(revisionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = revisionIdParamsSchema.parse({ revisionId });
    return explanationsService.listReferences(params.revisionId, session);
  });
}

export async function replaceReferences(revisionId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = revisionIdParamsSchema.parse({ revisionId });
    return explanationsService.replaceReferences(params.revisionId, replaceReferencesSchema.parse(input), session);
  });
}
