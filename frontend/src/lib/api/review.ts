import { addComment as addCommentAction, approveQuestion as approveQuestionAction, getComments as getCommentsAction, getReviewItem as getReviewItemAction, getReviewQueue as getReviewQueueAction, requestChanges as requestChangesAction, skipQueueItem as skipQueueItemAction } from "@/actions/review";
import { callAction } from "./client";

export type QueueItem = { item: { id: string; queueId: string; status: string }; question: { id: string; publicQid: string; status: string }; revision: { id: string; stem: string; requiresMedicalReview: "yes" | "no" }; report: { reason: string; description: string | null; profileName: string | null; profileEmail: string; status: string } | null; previousItemId: string | null; nextItemId: string | null };
export type Comment = { comment: { id: string; body: string; createdAt: string; revisionId: string | null }; author: { id: string; displayName: string; email: string } };

export const getReviewQueue = () => callAction<{ queue: { id: string }; items: QueueItem[] }>(getReviewQueueAction());
export const getReviewItem = (questionId: string) => callAction<{ question: { id: string; publicQid: string; status: string }; revision: { id: string; stem: string; requiresMedicalReview: "yes" | "no" }; options: { label: string; content: string }[] }>(getReviewItemAction(questionId));
export const getComments = (questionId: string) => callAction<Comment[]>(getCommentsAction(questionId));
export const addComment = (questionId: string, body: string, revisionId?: string) => callAction<Comment>(addCommentAction(questionId, { body, revisionId }));
export const approveQuestion = (questionId: string) => callAction<unknown>(approveQuestionAction(questionId));
export const requestChanges = (questionId: string, comment: string) => callAction<unknown>(requestChangesAction(questionId, { comment }));
export const skipQueueItem = (queueId: string) => callAction<unknown>(skipQueueItemAction(queueId));
