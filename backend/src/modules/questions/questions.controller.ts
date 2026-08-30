import type { Request, Response } from 'express';
import { sendSuccess } from '../../lib/api-response.js';
import type { StudioSession } from '../auth/auth.types.js';
import { createQuestionSchema, duplicateQuestionSchema, projectSubjectParamsSchema, questionIdParamsSchema, questionListQuerySchema, revisionIdParamsSchema, revisionNumberParamsSchema, revisionParamsSchema, updateDraftSchema } from './questions.schemas.js';
import { questionsService } from './questions.service.js';
const session = (res: Response) => res.locals.studioSession as StudioSession;
export class QuestionsController {
  async list(req: Request, res: Response) { sendSuccess(res, await questionsService.list(questionListQuerySchema.parse(req.query), session(res))); }
  async listProjectSubject(req: Request, res: Response) { const p = projectSubjectParamsSchema.parse(req.params); sendSuccess(res, await questionsService.list({ ...questionListQuerySchema.parse(req.query), projectId: p.projectId, subjectId: p.subjectId }, session(res))); }
  async create(req: Request, res: Response) { const p = projectSubjectParamsSchema.parse(req.params); sendSuccess(res, await questionsService.create(p.projectId, p.subjectId, createQuestionSchema.parse(req.body), session(res)), 201); }
  async get(req: Request, res: Response) { sendSuccess(res, await questionsService.get(questionIdParamsSchema.parse(req.params).questionId, session(res))); }
  async contributors(req: Request, res: Response) { sendSuccess(res, await questionsService.listContributors(questionIdParamsSchema.parse(req.params).questionId, session(res))); }
  async auditLog(req: Request, res: Response) { sendSuccess(res, await questionsService.listAuditLogs(questionIdParamsSchema.parse(req.params).questionId, session(res))); }
  async listRevisions(req: Request, res: Response) { sendSuccess(res, await questionsService.listRevisions(questionIdParamsSchema.parse(req.params).questionId, session(res))); }
  async getRevision(req: Request, res: Response) { const p = revisionNumberParamsSchema.parse(req.params); sendSuccess(res, await questionsService.getRevision(p.questionId, p.revisionNumber, session(res))); }
  async createRevision(req: Request, res: Response) { sendSuccess(res, await questionsService.createRevision(questionIdParamsSchema.parse(req.params).questionId, session(res)), 201); }
  async saveDraft(req: Request, res: Response) { const p = revisionParamsSchema.parse(req.params); sendSuccess(res, await questionsService.saveDraft(p.questionId, p.revisionId, updateDraftSchema.parse(req.body), session(res))); }
  async saveDraftByRevision(req: Request, res: Response) { const p = revisionIdParamsSchema.parse(req.params); sendSuccess(res, await questionsService.saveDraftByRevision(p.revisionId, updateDraftSchema.parse(req.body), session(res))); }
  async duplicate(req: Request, res: Response) { sendSuccess(res, await questionsService.duplicate(questionIdParamsSchema.parse(req.params).questionId, duplicateQuestionSchema.parse(req.body), session(res)), 201); }
  async submit(req: Request, res: Response) { sendSuccess(res, await questionsService.submit(questionIdParamsSchema.parse(req.params).questionId, session(res))); }
  async archive(req: Request, res: Response) { sendSuccess(res, await questionsService.archive(questionIdParamsSchema.parse(req.params).questionId, session(res))); }
  async validateRevision(req: Request, res: Response) { sendSuccess(res, await questionsService.validateRevision(revisionIdParamsSchema.parse(req.params).revisionId, session(res))); }
}
export const questionsController = new QuestionsController();
