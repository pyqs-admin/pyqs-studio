import { and, asc, eq } from "drizzle-orm";

import { db } from "@/server/db/client";
import { taxonomyChapter, taxonomyDifficulty, taxonomyExam, taxonomyQuestionType, taxonomySubject, taxonomyTopic } from "@/server/db/schema";
import type { CreateChapter, CreateSimple, CreateSubject, CreateTopic, UpdateChapter, UpdateSimple, UpdateSubject, UpdateTopic } from "@/server/schemas/taxonomy.schemas";

const active = (column: typeof taxonomySubject.status) => eq(column, "active");

export class TaxonomyRepository {
  listSubjects() { return db.select().from(taxonomySubject).where(active(taxonomySubject.status)).orderBy(asc(taxonomySubject.sortOrder), asc(taxonomySubject.name)); }
  listChapters(subjectId?: string) { return db.select().from(taxonomyChapter).where(subjectId ? and(eq(taxonomyChapter.subjectId, subjectId), eq(taxonomyChapter.status, "active")) : eq(taxonomyChapter.status, "active")).orderBy(asc(taxonomyChapter.sortOrder), asc(taxonomyChapter.name)); }
  listTopics(chapterId?: string) { return db.select().from(taxonomyTopic).where(chapterId ? and(eq(taxonomyTopic.chapterId, chapterId), eq(taxonomyTopic.status, "active")) : eq(taxonomyTopic.status, "active")).orderBy(asc(taxonomyTopic.sortOrder), asc(taxonomyTopic.name)); }
  listDifficulties() { return db.select().from(taxonomyDifficulty).where(eq(taxonomyDifficulty.status, "active")).orderBy(asc(taxonomyDifficulty.sortOrder), asc(taxonomyDifficulty.name)); }
  listExams() { return db.select().from(taxonomyExam).where(eq(taxonomyExam.status, "active")).orderBy(asc(taxonomyExam.sortOrder), asc(taxonomyExam.name)); }
  listQuestionTypes() { return db.select().from(taxonomyQuestionType).where(eq(taxonomyQuestionType.status, "active")).orderBy(asc(taxonomyQuestionType.sortOrder), asc(taxonomyQuestionType.name)); }
  async findSubject(id: string) { const [row] = await db.select().from(taxonomySubject).where(eq(taxonomySubject.id, id)); return row ?? null; }
  async findChapter(id: string) { const [row] = await db.select().from(taxonomyChapter).where(eq(taxonomyChapter.id, id)); return row ?? null; }
  async findTopic(id: string) { const [row] = await db.select().from(taxonomyTopic).where(eq(taxonomyTopic.id, id)); return row ?? null; }
  async findDifficulty(id: string) { const [row] = await db.select().from(taxonomyDifficulty).where(eq(taxonomyDifficulty.id, id)); return row ?? null; }
  async findQuestionType(id: string) { const [row] = await db.select().from(taxonomyQuestionType).where(eq(taxonomyQuestionType.id, id)); return row ?? null; }
  async createSubject(input: CreateSubject) { const [row] = await db.insert(taxonomySubject).values(input).returning(); return row; }
  async updateSubject(id: string, input: UpdateSubject) { const [row] = await db.update(taxonomySubject).set(input).where(eq(taxonomySubject.id, id)).returning(); return row ?? null; }
  async createChapter(input: CreateChapter) { const [row] = await db.insert(taxonomyChapter).values(input).returning(); return row; }
  async updateChapter(id: string, input: UpdateChapter) { const [row] = await db.update(taxonomyChapter).set(input).where(eq(taxonomyChapter.id, id)).returning(); return row ?? null; }
  async createTopic(input: CreateTopic) { const [row] = await db.insert(taxonomyTopic).values(input).returning(); return row; }
  async updateTopic(id: string, input: UpdateTopic) { const [row] = await db.update(taxonomyTopic).set(input).where(eq(taxonomyTopic.id, id)).returning(); return row ?? null; }
  async createDifficulty(input: CreateSimple) { const [row] = await db.insert(taxonomyDifficulty).values(input).returning(); return row; }
  async updateDifficulty(id: string, input: UpdateSimple) { const [row] = await db.update(taxonomyDifficulty).set(input).where(eq(taxonomyDifficulty.id, id)).returning(); return row ?? null; }
  async createExam(input: CreateSimple) { const [row] = await db.insert(taxonomyExam).values(input).returning(); return row; }
  async updateExam(id: string, input: UpdateSimple) { const [row] = await db.update(taxonomyExam).set(input).where(eq(taxonomyExam.id, id)).returning(); return row ?? null; }
  async createQuestionType(input: CreateSimple) { const [row] = await db.insert(taxonomyQuestionType).values(input).returning(); return row; }
  async updateQuestionType(id: string, input: UpdateSimple) { const [row] = await db.update(taxonomyQuestionType).set(input).where(eq(taxonomyQuestionType.id, id)).returning(); return row ?? null; }
}

export const taxonomyRepository = new TaxonomyRepository();
