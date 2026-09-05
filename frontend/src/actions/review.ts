"use server";

import { requireUser } from "@/server/auth/session";
import { runAction } from "@/server/lib/action-result";
import { reviewService } from "@/server/services/review.service";
import {
  addCommentSchema,
  assignQueueSchema,
  commentIdParamsSchema,
  questionIdParamsSchema,
  queueIdParamsSchema,
  requestChangesSchema,
  updateCommentSchema,
} from "@/server/schemas/review.schemas";

export async function getReviewQueue() {
  return runAction(async () => {
    const session = await requireUser();
    return reviewService.queue(session);
  });
}

export async function getReviewQueueItems(queueId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = queueIdParamsSchema.parse({ queueId });
    return reviewService.queueItems(params.queueId, session);
  });
}

export async function assignReview(input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    return reviewService.assign(assignQueueSchema.parse(input), session);
  });
}

export async function getReviewItem(questionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = questionIdParamsSchema.parse({ questionId });
    return reviewService.reviewReady(params.questionId, session);
  });
}

export async function approveQuestion(questionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = questionIdParamsSchema.parse({ questionId });
    return reviewService.approve(params.questionId, session);
  });
}

export async function requestChanges(questionId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = questionIdParamsSchema.parse({ questionId });
    return reviewService.requestChanges(params.questionId, requestChangesSchema.parse(input).comment, session);
  });
}

export async function skipQueueItem(queueId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = queueIdParamsSchema.parse({ queueId });
    return reviewService.skip(params.queueId, session);
  });
}

export async function getComments(questionId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = questionIdParamsSchema.parse({ questionId });
    return reviewService.listComments(params.questionId, session);
  });
}

export async function addComment(questionId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = questionIdParamsSchema.parse({ questionId });
    return reviewService.addComment(params.questionId, addCommentSchema.parse(input), session);
  });
}

export async function updateComment(commentId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = commentIdParamsSchema.parse({ commentId });
    return reviewService.updateComment(params.commentId, updateCommentSchema.parse(input).body, session);
  });
}

export async function deleteComment(commentId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = commentIdParamsSchema.parse({ commentId });
    await reviewService.deleteComment(params.commentId, session);
  });
}
