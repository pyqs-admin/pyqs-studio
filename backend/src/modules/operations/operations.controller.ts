import type { Request, Response } from 'express';
import { sendSuccess } from '../../lib/api-response.js';
import type { StudioSession } from '../auth/auth.types.js';
import { bulkArchiveSchema, bulkAssignSchema, bulkDifficultySchema, bulkTaxonomySchema, createSavedViewSchema, savedViewIdParamsSchema, searchQuerySchema, updateSavedViewSchema } from './operations.schemas.js';
import { operationsService } from './operations.service.js';
const session = (res: Response) => res.locals.studioSession as StudioSession;
export const operationsController = {
  async search(req: Request, res: Response) { sendSuccess(res, await operationsService.search(searchQuerySchema.parse(req.query), session(res))); },
  async listSavedViews(_req: Request, res: Response) { sendSuccess(res, await operationsService.listSavedViews(session(res))); },
  async createSavedView(req: Request, res: Response) { const body = createSavedViewSchema.parse(req.body); sendSuccess(res, await operationsService.createSavedView(body.name, body.filters, session(res)), 201); },
  async updateSavedView(req: Request, res: Response) { sendSuccess(res, await operationsService.updateSavedView(savedViewIdParamsSchema.parse(req.params).viewId, updateSavedViewSchema.parse(req.body), session(res))); },
  async deleteSavedView(req: Request, res: Response) { await operationsService.deleteSavedView(savedViewIdParamsSchema.parse(req.params).viewId, session(res)); res.status(204).send(); },
  async assign(req: Request, res: Response) { const body = bulkAssignSchema.parse(req.body); sendSuccess(res, await operationsService.assign(body.questionIds, body.profileId, body.assignmentType, session(res))); },
  async taxonomy(req: Request, res: Response) { const body = bulkTaxonomySchema.parse(req.body); sendSuccess(res, await operationsService.changeTaxonomy(body.questionIds, body, session(res))); },
  async difficulty(req: Request, res: Response) { const body = bulkDifficultySchema.parse(req.body); sendSuccess(res, await operationsService.changeDifficulty(body.questionIds, body.difficultyId, session(res))); },
  async archive(req: Request, res: Response) { const body = bulkArchiveSchema.parse(req.body); sendSuccess(res, await operationsService.archive(body.questionIds, session(res))); },
};
