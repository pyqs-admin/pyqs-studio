import { AppError } from '../../lib/AppError.js';
import { questionsRepository } from '../questions/questions.repository.js';
import { questionsService } from '../questions/questions.service.js';
import type { StudioSession } from '../auth/auth.types.js';
import type { ReplaceBlocks } from './explanations.schemas.js';
import { explanationsRepository } from './explanations.repository.js';
export class ExplanationsService {
  async list(questionId: string, revisionId: string, session: StudioSession) { await this.requireRevision(questionId, revisionId, session); return explanationsRepository.list(revisionId); }
  async replace(questionId: string, revisionId: string, input: ReplaceBlocks, session: StudioSession) { if (!session.permissions.includes('explanation.edit')) throw new AppError({ statusCode: 403, code: 'PERMISSION_DENIED', message: 'You do not have permission to edit explanations.' }); await this.requireRevision(questionId, revisionId, session); return explanationsRepository.replace(revisionId, questionId, input, session.profileId); }
  private async requireRevision(questionId: string, revisionId: string, session: StudioSession) { await questionsService.requireQuestionAccess(questionId, session); const revision = await questionsRepository.findRevision(questionId, revisionId); if (!revision) throw new AppError({ statusCode: 404, code: 'QUESTION_REVISION_NOT_FOUND', message: 'Question revision not found.' }); if (session.permissions.includes('explanation.edit') && revision.status !== 'DRAFT') throw new AppError({ statusCode: 409, code: 'IMMUTABLE_REVISION', message: 'Only draft revisions can be edited.' }); }
}
export const explanationsService = new ExplanationsService();
