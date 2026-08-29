import type { Request, Response } from 'express';
import { sendSuccess } from '../../lib/api-response.js';
import type { StudioSession } from '../auth/auth.types.js';
import { createQuestionSchema, projectSubjectParamsSchema, questionIdParamsSchema, revisionParamsSchema, updateDraftSchema } from './questions.schemas.js';
import { questionsService } from './questions.service.js';
const session = (res: Response) => res.locals.studioSession as StudioSession;
export class QuestionsController {
  async create(req: Request, res: Response) { const p = projectSubjectParamsSchema.parse(req.params); sendSuccess(res, await questionsService.create(p.projectId, p.subjectId, createQuestionSchema.parse(req.body), session(res)), 201); }
  async get(req: Request, res: Response) { sendSuccess(res, await questionsService.get(questionIdParamsSchema.parse(req.params).questionId, session(res))); }
  async createRevision(req: Request, res: Response) { sendSuccess(res, await questionsService.createRevision(questionIdParamsSchema.parse(req.params).questionId, session(res)), 201); }
  async saveDraft(req: Request, res: Response) { const p = revisionParamsSchema.parse(req.params); sendSuccess(res, await questionsService.saveDraft(p.questionId, p.revisionId, updateDraftSchema.parse(req.body), session(res))); }
}
export const questionsController = new QuestionsController();
