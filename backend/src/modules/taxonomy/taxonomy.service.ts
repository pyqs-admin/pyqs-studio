import { AppError } from '../../lib/AppError.js';
import { taxonomyRepository } from './taxonomy.repository.js';
import type { CreateChapter, CreateSimple, CreateSubject, CreateTopic, UpdateChapter, UpdateSimple, UpdateSubject, UpdateTopic } from './taxonomy.schemas.js';

export class TaxonomyService {
  async getTaxonomy() {
    const [subjects, chapters, topics, difficulties, questionTypes, exams] = await Promise.all([
      taxonomyRepository.listSubjects(), taxonomyRepository.listChapters(), taxonomyRepository.listTopics(), taxonomyRepository.listDifficulties(), taxonomyRepository.listQuestionTypes(), taxonomyRepository.listExams(),
    ]);
    return { subjects, chapters, topics, difficulties, questionTypes, exams };
  }
  async createSubject(input: CreateSubject) { return taxonomyRepository.createSubject(input); }
  async updateSubject(id: string, input: UpdateSubject) { return this.requireItem(await taxonomyRepository.updateSubject(id, input), 'Subject'); }
  async createChapter(input: CreateChapter) { await this.requireActiveSubject(input.subjectId); return taxonomyRepository.createChapter(input); }
  async updateChapter(id: string, input: UpdateChapter) { if (input.subjectId) await this.requireActiveSubject(input.subjectId); return this.requireItem(await taxonomyRepository.updateChapter(id, input), 'Chapter'); }
  async createTopic(input: CreateTopic) { await this.requireActiveChapter(input.chapterId); return taxonomyRepository.createTopic(input); }
  async updateTopic(id: string, input: UpdateTopic) { if (input.chapterId) await this.requireActiveChapter(input.chapterId); return this.requireItem(await taxonomyRepository.updateTopic(id, input), 'Topic'); }
  async createDifficulty(input: CreateSimple) { return taxonomyRepository.createDifficulty(input); }
  async updateDifficulty(id: string, input: UpdateSimple) { return this.requireItem(await taxonomyRepository.updateDifficulty(id, input), 'Difficulty'); }
  async createExam(input: CreateSimple) { return taxonomyRepository.createExam(input); }
  async updateExam(id: string, input: UpdateSimple) { return this.requireItem(await taxonomyRepository.updateExam(id, input), 'Exam'); }
  async createQuestionType(input: CreateSimple) { return taxonomyRepository.createQuestionType(input); }
  async updateQuestionType(id: string, input: UpdateSimple) { return this.requireItem(await taxonomyRepository.updateQuestionType(id, input), 'Question type'); }
  private async requireActiveSubject(id: string): Promise<void> { const item = await taxonomyRepository.findSubject(id); if (!item || item.status !== 'active') throw new AppError({ statusCode: 400, code: 'INVALID_SUBJECT', message: 'An active subject is required.' }); }
  private async requireActiveChapter(id: string): Promise<void> { const item = await taxonomyRepository.findChapter(id); if (!item || item.status !== 'active') throw new AppError({ statusCode: 400, code: 'INVALID_CHAPTER', message: 'An active chapter is required.' }); }
  private requireItem<T>(item: T | null, name: string): T { if (!item) throw new AppError({ statusCode: 404, code: 'TAXONOMY_ITEM_NOT_FOUND', message: `${name} not found.` }); return item; }
}

export const taxonomyService = new TaxonomyService();
