import { and, desc, eq } from 'drizzle-orm';

import { db } from '../../database/client.js';
import { studioAuditLog, studioQuestion, studioQuestionContributor, studioQuestionOption, studioQuestionRevision, studioQuestionRevisionType } from '../../database/schema.js';
import type { QuestionDraftInput } from './questions.schemas.js';

export class QuestionsRepository {
  async create(input: QuestionDraftInput, projectId: string, subjectId: string, profileId: string, publicQid: string) {
    return db.transaction(async (tx) => {
      const [question] = await tx.insert(studioQuestion).values({ projectId, publicQid, createdBy: profileId }).returning();
      const [revision] = await tx.insert(studioQuestionRevision).values({ questionId: question!.id, revisionNumber: 1, stem: input.stem, correctOption: input.correctOption, subjectId, chapterId: input.chapterId, topicId: input.topicId, difficultyId: input.difficultyId, createdBy: profileId }).returning();
      await tx.insert(studioQuestionOption).values(input.options.map((item, position) => ({ revisionId: revision!.id, ...item, position })));
      await tx.insert(studioQuestionRevisionType).values(input.questionTypeIds.map((questionTypeId) => ({ revisionId: revision!.id, questionTypeId })));
      await tx.insert(studioQuestionContributor).values({ questionId: question!.id, profileId, contributionType: 'primary_creator' });
      await tx.insert(studioAuditLog).values({ projectId, questionId: question!.id, revisionId: revision!.id, actorProfileId: profileId, action: 'question_created', metadata: {} });
      return { question: question!, revision: revision! };
    });
  }
  async find(questionId: string) { const [row] = await db.select().from(studioQuestion).where(eq(studioQuestion.id, questionId)); return row ?? null; }
  async findRevision(questionId: string, revisionId: string) { const [row] = await db.select().from(studioQuestionRevision).where(and(eq(studioQuestionRevision.id, revisionId), eq(studioQuestionRevision.questionId, questionId))); return row ?? null; }
  async updateDraft(questionId: string, revisionId: string, input: QuestionDraftInput, profileId: string) {
    return db.transaction(async (tx) => {
      const [revision] = await tx.update(studioQuestionRevision).set({ stem: input.stem, correctOption: input.correctOption, chapterId: input.chapterId, topicId: input.topicId, difficultyId: input.difficultyId }).where(and(eq(studioQuestionRevision.id, revisionId), eq(studioQuestionRevision.questionId, questionId))).returning();
      await tx.delete(studioQuestionOption).where(eq(studioQuestionOption.revisionId, revisionId));
      await tx.delete(studioQuestionRevisionType).where(eq(studioQuestionRevisionType.revisionId, revisionId));
      await tx.insert(studioQuestionOption).values(input.options.map((item, position) => ({ revisionId, ...item, position })));
      await tx.insert(studioQuestionRevisionType).values(input.questionTypeIds.map((questionTypeId) => ({ revisionId, questionTypeId })));
      await tx.insert(studioQuestionContributor).values({ questionId, profileId, contributionType: 'question_editor' });
      await tx.insert(studioAuditLog).values({ questionId, revisionId, actorProfileId: profileId, action: 'question_draft_saved', metadata: {} });
      return revision ?? null;
    });
  }
  async details(questionId: string) {
    const question = await this.find(questionId); if (!question) return null;
    const [revision] = await db.select().from(studioQuestionRevision).where(eq(studioQuestionRevision.questionId, questionId)).orderBy(desc(studioQuestionRevision.revisionNumber)).limit(1);
    if (!revision) return null;
    const [options, questionTypes] = await Promise.all([db.select().from(studioQuestionOption).where(eq(studioQuestionOption.revisionId, revision.id)), db.select().from(studioQuestionRevisionType).where(eq(studioQuestionRevisionType.revisionId, revision.id))]);
    return { question, revision, options, questionTypes };
  }
  async createRevision(questionId: string, profileId: string) {
    return db.transaction(async (tx) => {
      const [source] = await tx.select().from(studioQuestionRevision).where(eq(studioQuestionRevision.questionId, questionId)).orderBy(desc(studioQuestionRevision.revisionNumber)).limit(1);
      if (!source) return null;
      const [revision] = await tx.insert(studioQuestionRevision).values({ questionId, revisionNumber: source.revisionNumber + 1, stem: source.stem, correctOption: source.correctOption, subjectId: source.subjectId, chapterId: source.chapterId, topicId: source.topicId, difficultyId: source.difficultyId, createdBy: profileId }).returning();
      const [options, types] = await Promise.all([tx.select().from(studioQuestionOption).where(eq(studioQuestionOption.revisionId, source.id)), tx.select().from(studioQuestionRevisionType).where(eq(studioQuestionRevisionType.revisionId, source.id))]);
      await tx.insert(studioQuestionOption).values(options.map(({ id, revisionId: _revisionId, ...option }) => ({ ...option, revisionId: revision!.id })));
      if (types.length) await tx.insert(studioQuestionRevisionType).values(types.map((type) => ({ revisionId: revision!.id, questionTypeId: type.questionTypeId })));
      await tx.insert(studioAuditLog).values({ questionId, revisionId: revision!.id, actorProfileId: profileId, action: 'question_revision_created', metadata: {} });
      return revision!;
    });
  }
}
export const questionsRepository = new QuestionsRepository();
