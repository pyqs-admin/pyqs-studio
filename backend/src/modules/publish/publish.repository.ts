import { and, asc, eq } from 'drizzle-orm';
import { blocksToSolutionMarkdown, blockToSolutionMarkdown, type SolutionBlock } from './solution-markdown.js';
import { db } from '../../database/client.js';
import { studioAuditLog, studioExplanationBlock, studioMediaAsset, studioProject, studioPublishEvent, studioQuestion, studioQuestionOption, studioQuestionRevision, studioQuestionRevisionType, studioReference, taxonomyChapter, taxonomyDifficulty, taxonomyExam, taxonomySubject, taxonomyTopic } from '../../database/schema.js';

const publishPayload = (payload: object) => {
  const value = payload as { explanationBlocks?: SolutionBlock[] };
  if (!value.explanationBlocks) return payload;
  const explanationBlocks = value.explanationBlocks.map((block) => ({ ...block, content: blockToSolutionMarkdown(block) }));
  return { ...payload, explanationBlocks, solutionMarkdown: blocksToSolutionMarkdown(value.explanationBlocks) };
};

export class PublishRepository {
  async preview(revisionId: string) {
    const [row] = await db.select({ question: studioQuestion, revision: studioQuestionRevision, project: studioProject, exam: taxonomyExam, subject: taxonomySubject, chapter: taxonomyChapter, topic: taxonomyTopic, difficulty: taxonomyDifficulty }).from(studioQuestionRevision).innerJoin(studioQuestion, eq(studioQuestionRevision.questionId, studioQuestion.id)).innerJoin(studioProject, eq(studioQuestion.projectId, studioProject.id)).innerJoin(taxonomyExam, eq(studioProject.examId, taxonomyExam.id)).innerJoin(taxonomySubject, eq(studioQuestionRevision.subjectId, taxonomySubject.id)).innerJoin(taxonomyChapter, eq(studioQuestionRevision.chapterId, taxonomyChapter.id)).innerJoin(taxonomyTopic, eq(studioQuestionRevision.topicId, taxonomyTopic.id)).innerJoin(taxonomyDifficulty, eq(studioQuestionRevision.difficultyId, taxonomyDifficulty.id)).where(eq(studioQuestionRevision.id, revisionId));
    if (!row) return null;
    const [options, types, blockRows, references] = await Promise.all([db.select().from(studioQuestionOption).where(eq(studioQuestionOption.revisionId, revisionId)).orderBy(asc(studioQuestionOption.position)), db.select().from(studioQuestionRevisionType).where(eq(studioQuestionRevisionType.revisionId, revisionId)), db.select({ block: studioExplanationBlock, mediaAsset: studioMediaAsset }).from(studioExplanationBlock).leftJoin(studioMediaAsset, eq(studioExplanationBlock.mediaAssetId, studioMediaAsset.id)).where(eq(studioExplanationBlock.revisionId, revisionId)).orderBy(asc(studioExplanationBlock.position)), db.select().from(studioReference).where(eq(studioReference.revisionId, revisionId)).orderBy(asc(studioReference.position))]);
    const blocks = blockRows.map(({ block, mediaAsset }) => ({ ...block, mediaAsset }));
    return { ...row, options, questionTypes: types, explanationBlocks: blocks, references };
  }
  ready() { return db.select({ question: studioQuestion, revision: studioQuestionRevision }).from(studioQuestionRevision).innerJoin(studioQuestion, eq(studioQuestionRevision.questionId, studioQuestion.id)).where(and(eq(studioQuestion.status, 'APPROVED'), eq(studioQuestionRevision.status, 'APPROVED'))); }
  async publish(questionId: string, revisionId: string, profileId: string, payload: object) { return db.transaction(async (tx) => { await tx.update(studioQuestionRevision).set({ status: 'PUBLISHED' }).where(eq(studioQuestionRevision.id, revisionId)); const [question] = await tx.update(studioQuestion).set({ status: 'PUBLISHED', publishedRevisionId: revisionId }).where(eq(studioQuestion.id, questionId)).returning(); const [event] = await tx.insert(studioPublishEvent).values({ questionId, revisionId, eventType: 'PUBLISH', payload: publishPayload(payload), createdBy: profileId }).returning(); await tx.insert(studioAuditLog).values({ projectId: question!.projectId, questionId, revisionId, actorProfileId: profileId, action: 'question_published', metadata: { eventId: event!.id } }); return event!; }); }
  async unpublish(questionId: string, revisionId: string, profileId: string, payload: object) { return db.transaction(async (tx) => { const [question] = await tx.update(studioQuestion).set({ status: 'APPROVED', publishedRevisionId: null }).where(eq(studioQuestion.id, questionId)).returning(); const [event] = await tx.insert(studioPublishEvent).values({ questionId, revisionId, eventType: 'UNPUBLISH', payload, createdBy: profileId }).returning(); await tx.insert(studioAuditLog).values({ projectId: question!.projectId, questionId, revisionId, actorProfileId: profileId, action: 'question_unpublished', metadata: { eventId: event!.id } }); return event!; }); }
  async markEvent(id: string, status: string, error?: string) { const [event] = await db.update(studioPublishEvent).set({ status, lastError: error, deliveredAt: status === 'DELIVERED' ? new Date() : null }).where(eq(studioPublishEvent.id, id)).returning(); return event ?? null; }
  async event(id: string) { const [event] = await db.select().from(studioPublishEvent).where(eq(studioPublishEvent.id, id)); return event ?? null; }
}
export const publishRepository = new PublishRepository();
