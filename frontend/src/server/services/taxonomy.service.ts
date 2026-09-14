import "server-only";

import { AppError } from "@/server/lib/AppError";
import { taxonomyRepository } from "@/server/repositories/taxonomy.repository";
import type { CreateChapter, CreateSimple, CreateSubject, CreateTopic, UpdateChapter, UpdateSimple, UpdateSubject, UpdateTopic } from "@/server/schemas/taxonomy.schemas";

const TAXONOMY_CACHE_TTL_MS = 5 * 60 * 1000;

async function loadTaxonomy() {
  const [subjects, chapters, topics, difficulties, questionTypes, exams] = await Promise.all([
    taxonomyRepository.listSubjects(), taxonomyRepository.listChapters(), taxonomyRepository.listTopics(), taxonomyRepository.listDifficulties(), taxonomyRepository.listQuestionTypes(), taxonomyRepository.listExams(),
  ]);
  return { subjects, chapters, topics, difficulties, questionTypes, exams };
}

let taxonomyCache: { expiresAt: number; value: ReturnType<typeof loadTaxonomy> } | null = null;

export class TaxonomyService {
  async getSubject(id: string) {
    return taxonomyRepository.findSubject(id);
  }
  async getChapter(id: string) {
    return taxonomyRepository.findChapter(id);
  }
  async getTopic(id: string) {
    return taxonomyRepository.findTopic(id);
  }
  async getTaxonomy() {
    if (taxonomyCache && taxonomyCache.expiresAt > Date.now()) return taxonomyCache.value;
    const value = loadTaxonomy();
    taxonomyCache = { expiresAt: Date.now() + TAXONOMY_CACHE_TTL_MS, value };
    try {
      return await value;
    } catch (error) {
      taxonomyCache = null;
      throw error;
    }
  }
  async getTaxonomyOptions() {
    const [subjects, chapters, topics, difficulties, questionTypes, exams] = await Promise.all([
      taxonomyRepository.listSubjectOptions(), taxonomyRepository.listChapterOptions(), taxonomyRepository.listTopicOptions(), taxonomyRepository.listDifficultyOptions(), taxonomyRepository.listQuestionTypeOptions(), taxonomyRepository.listExamOptions(),
    ]);
    return { subjects, chapters, topics, difficulties, questionTypes, exams };
  }
  async createSubject(input: CreateSubject) { return taxonomyRepository.createSubject(input); }
  async updateSubject(id: string, input: UpdateSubject) { return this.requireItem(await taxonomyRepository.updateSubject(id, input), "Subject"); }
  async createChapter(input: CreateChapter) { await this.requireActiveSubject(input.subjectId); return taxonomyRepository.createChapter(input); }
  async updateChapter(id: string, input: UpdateChapter) { if (input.subjectId) await this.requireActiveSubject(input.subjectId); return this.requireItem(await taxonomyRepository.updateChapter(id, input), "Chapter"); }
  async createTopic(input: CreateTopic) { await this.requireActiveChapter(input.chapterId); return taxonomyRepository.createTopic(input); }
  async updateTopic(id: string, input: UpdateTopic) { if (input.chapterId) await this.requireActiveChapter(input.chapterId); return this.requireItem(await taxonomyRepository.updateTopic(id, input), "Topic"); }
  async createDifficulty(input: CreateSimple) { return taxonomyRepository.createDifficulty(input); }
  async updateDifficulty(id: string, input: UpdateSimple) { return this.requireItem(await taxonomyRepository.updateDifficulty(id, input), "Difficulty"); }
  async createExam(input: CreateSimple) { return taxonomyRepository.createExam(input); }
  async updateExam(id: string, input: UpdateSimple) { return this.requireItem(await taxonomyRepository.updateExam(id, input), "Exam"); }
  async createQuestionType(input: CreateSimple) { return taxonomyRepository.createQuestionType(input); }
  async updateQuestionType(id: string, input: UpdateSimple) { return this.requireItem(await taxonomyRepository.updateQuestionType(id, input), "Question type"); }
  private async requireActiveSubject(id: string): Promise<void> { const item = await taxonomyRepository.findSubject(id); if (!item || item.status !== "active") throw new AppError({ statusCode: 400, code: "INVALID_SUBJECT", message: "An active subject is required." }); }
  private async requireActiveChapter(id: string): Promise<void> { const item = await taxonomyRepository.findChapter(id); if (!item || item.status !== "active") throw new AppError({ statusCode: 400, code: "INVALID_CHAPTER", message: "An active chapter is required." }); }
  private requireItem<T>(item: T | null, name: string): T { if (!item) throw new AppError({ statusCode: 404, code: "TAXONOMY_ITEM_NOT_FOUND", message: `${name} not found.` }); return item; }
}

export const taxonomyService = new TaxonomyService();
