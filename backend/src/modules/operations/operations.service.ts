import { AppError } from '../../lib/AppError.js';
import type { StudioSession } from '../auth/auth.types.js';
import { projectsRepository } from '../projects/projects.repository.js';
import { taxonomyRepository } from '../taxonomy/taxonomy.repository.js';
import { questionsRepository } from '../questions/questions.repository.js';
import { questionsService } from '../questions/questions.service.js';
import type { SavedViewFilters, SearchQuery } from './operations.schemas.js';
import { operationsRepository } from './operations.repository.js';

export class OperationsService {
  async search(query: SearchQuery, session: StudioSession) { return questionsService.list(query, session); }
  listSavedViews(session: StudioSession) { return operationsRepository.listSavedViews(session.profileId); }
  createSavedView(name: string, filters: SavedViewFilters, session: StudioSession) { return operationsRepository.createSavedView(session.profileId, name, filters); }
  async updateSavedView(viewId: string, values: { name?: string | undefined; filters?: SavedViewFilters | undefined }, session: StudioSession) { const view = await operationsRepository.updateSavedView(viewId, session.profileId, values); if (!view) throw this.notFound('SAVED_VIEW_NOT_FOUND', 'Saved view not found.'); return view; }
  async deleteSavedView(viewId: string, session: StudioSession) { if (!await operationsRepository.deleteSavedView(viewId, session.profileId)) throw this.notFound('SAVED_VIEW_NOT_FOUND', 'Saved view not found.'); }
  async assign(questionIds: string[], profileId: string, assignmentType: string, session: StudioSession) {
    this.requireBulkPermission(session); if (!await projectsRepository.findActiveProfile(profileId)) throw new AppError({ statusCode: 400, code: 'INVALID_STUDIO_PROFILE', message: 'An active Studio profile is required.' });
    return Promise.all(questionIds.map(async (questionId) => { await questionsService.requireQuestionAccess(questionId, session); return operationsRepository.assign(questionId, profileId, assignmentType, session.profileId); }));
  }
  async changeTaxonomy(questionIds: string[], values: { subjectId: string; chapterId: string; topicId: string }, session: StudioSession) {
    this.requireBulkPermission(session); await this.validateTaxonomy(values);
    return Promise.all(questionIds.map(async (questionId) => { const details = await this.editableDetails(questionId, session); return operationsRepository.updateTaxonomy(questionId, details.revision.id, values, session.profileId); }));
  }
  async changeDifficulty(questionIds: string[], difficultyId: string, session: StudioSession) {
    this.requireBulkPermission(session); const difficulty = await taxonomyRepository.findDifficulty(difficultyId); if (!difficulty || difficulty.status !== 'active') throw new AppError({ statusCode: 400, code: 'INVALID_DIFFICULTY', message: 'An active difficulty is required.' });
    return Promise.all(questionIds.map(async (questionId) => { const details = await this.editableDetails(questionId, session); return operationsRepository.updateDifficulty(questionId, details.revision.id, difficultyId, session.profileId); }));
  }
  async archive(questionIds: string[], session: StudioSession) { this.requireBulkPermission(session); return Promise.all(questionIds.map((questionId) => questionsService.archive(questionId, session))); }
  private requireBulkPermission(session: StudioSession) { if (!session.permissions.includes('question.bulk_manage') && !session.permissions.includes('question.edit')) throw new AppError({ statusCode: 403, code: 'PERMISSION_DENIED', message: 'You do not have permission to perform bulk question operations.' }); }
  private async editableDetails(questionId: string, session: StudioSession) { const details = await questionsService.get(questionId, session); if (!['DRAFT', 'CHANGES_REQUESTED'].includes(details.question.status) || details.revision.status !== 'DRAFT') throw new AppError({ statusCode: 409, code: 'BULK_EDIT_NOT_ALLOWED', message: 'Only editable draft questions can be changed in bulk.' }); return details; }
  private async validateTaxonomy(values: { subjectId: string; chapterId: string; topicId: string }) { const [chapter, topic] = await Promise.all([taxonomyRepository.findChapter(values.chapterId), taxonomyRepository.findTopic(values.topicId)]); if (!chapter || chapter.status !== 'active' || chapter.subjectId !== values.subjectId) throw new AppError({ statusCode: 400, code: 'INVALID_CHAPTER', message: 'Chapter must belong to the selected active subject.' }); if (!topic || topic.status !== 'active' || topic.chapterId !== values.chapterId) throw new AppError({ statusCode: 400, code: 'INVALID_TOPIC', message: 'Topic must belong to the selected active chapter.' }); }
  private notFound(code: string, message: string) { return new AppError({ statusCode: 404, code, message }); }
}

export const operationsService = new OperationsService();
