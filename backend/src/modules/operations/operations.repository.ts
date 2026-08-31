import { and, desc, eq } from 'drizzle-orm';

import { db } from '../../database/client.js';
import { studioAuditLog, studioQuestionAssignment, studioQuestionRevision, studioSavedView } from '../../database/schema.js';
import type { SavedViewFilters } from './operations.schemas.js';

export class OperationsRepository {
  listSavedViews(profileId: string) { return db.select().from(studioSavedView).where(and(eq(studioSavedView.profileId, profileId), eq(studioSavedView.resource, 'questions'))).orderBy(desc(studioSavedView.updatedAt)); }
  async findSavedView(viewId: string, profileId: string) { const [view] = await db.select().from(studioSavedView).where(and(eq(studioSavedView.id, viewId), eq(studioSavedView.profileId, profileId))); return view ?? null; }
  async createSavedView(profileId: string, name: string, filters: SavedViewFilters) { const [view] = await db.insert(studioSavedView).values({ profileId, name, filters }).returning(); return view!; }
  async updateSavedView(viewId: string, profileId: string, values: { name?: string | undefined; filters?: SavedViewFilters | undefined }) { const [view] = await db.update(studioSavedView).set(values).where(and(eq(studioSavedView.id, viewId), eq(studioSavedView.profileId, profileId))).returning(); return view ?? null; }
  async deleteSavedView(viewId: string, profileId: string) { const [view] = await db.delete(studioSavedView).where(and(eq(studioSavedView.id, viewId), eq(studioSavedView.profileId, profileId))).returning(); return view ?? null; }
  async assign(questionId: string, profileId: string, assignmentType: string, actorProfileId: string) {
    return db.transaction(async (tx) => {
      const [existing] = await tx.select().from(studioQuestionAssignment).where(and(eq(studioQuestionAssignment.questionId, questionId), eq(studioQuestionAssignment.assignmentType, assignmentType)));
      const assignment = existing
        ? (await tx.update(studioQuestionAssignment).set({ profileId, assignedBy: actorProfileId }).where(eq(studioQuestionAssignment.id, existing.id)).returning())[0]!
        : (await tx.insert(studioQuestionAssignment).values({ questionId, profileId, assignmentType, assignedBy: actorProfileId }).returning())[0]!;
      await tx.insert(studioAuditLog).values({ questionId, actorProfileId, action: 'question_assigned', metadata: { profileId, assignmentType } });
      return assignment;
    });
  }
  async updateTaxonomy(questionId: string, revisionId: string, values: { subjectId: string; chapterId: string; topicId: string }, actorProfileId: string) {
    return db.transaction(async (tx) => {
      const [revision] = await tx.update(studioQuestionRevision).set(values).where(eq(studioQuestionRevision.id, revisionId)).returning();
      await tx.insert(studioAuditLog).values({ questionId, revisionId, actorProfileId, action: 'question_taxonomy_changed', metadata: values });
      return revision!;
    });
  }
  async updateDifficulty(questionId: string, revisionId: string, difficultyId: string, actorProfileId: string) {
    return db.transaction(async (tx) => {
      const [revision] = await tx.update(studioQuestionRevision).set({ difficultyId }).where(eq(studioQuestionRevision.id, revisionId)).returning();
      await tx.insert(studioAuditLog).values({ questionId, revisionId, actorProfileId, action: 'question_difficulty_changed', metadata: { difficultyId } });
      return revision!;
    });
  }
}

export const operationsRepository = new OperationsRepository();
