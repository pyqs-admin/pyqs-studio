"use server";

import { requireUser } from "@/server/auth/session";
import { runAction } from "@/server/lib/action-result";
import { publishService } from "@/server/services/publish.service";
import {
  bulkPublishSchema,
  publishEventIdParamsSchema,
  questionIdParamsSchema,
  revisionIdParamsSchema,
} from "@/server/schemas/publish.schemas";

export async function getStudentPreview(revisionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = revisionIdParamsSchema.parse({ revisionId });
    return publishService.preview(params.revisionId, session);
  });
}

export async function getPublishReady() {
  return runAction(async () => {
    const session = await requireUser();
    return publishService.ready(session);
  });
}

export async function publishQuestion(questionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = questionIdParamsSchema.parse({ questionId });
    return publishService.publish(params.questionId, session);
  });
}

export async function publishBulk(input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    return publishService.bulk(bulkPublishSchema.parse(input).questionIds, session);
  });
}

export async function unpublishQuestion(questionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = questionIdParamsSchema.parse({ questionId });
    return publishService.unpublish(params.questionId, session);
  });
}

export async function retryPublish(eventId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = publishEventIdParamsSchema.parse({ eventId });
    return publishService.retry(params.eventId, session);
  });
}
