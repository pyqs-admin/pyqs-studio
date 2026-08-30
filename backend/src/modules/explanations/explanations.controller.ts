import type { Request, Response } from 'express';
import { sendSuccess } from '../../lib/api-response.js';
import type { StudioSession } from '../auth/auth.types.js';
import { addBlockSchema, explanationBlockIdParamsSchema, replaceBlocksSchema, replaceReferencesSchema, revisionIdParamsSchema, revisionParamsSchema, updateBlockSchema } from './explanations.schemas.js';
import { explanationsService } from './explanations.service.js';
const session = (res: Response) => res.locals.studioSession as StudioSession;
export const explanationsController = {
  async list(req: Request, res: Response) { const p = revisionParamsSchema.parse(req.params); sendSuccess(res, await explanationsService.list(p.questionId, p.revisionId, session(res))); },
  async replace(req: Request, res: Response) { const p = revisionParamsSchema.parse(req.params); sendSuccess(res, await explanationsService.replace(p.questionId, p.revisionId, replaceBlocksSchema.parse(req.body), session(res))); },
  async listByRevision(req: Request, res: Response) { const p = revisionIdParamsSchema.parse(req.params); sendSuccess(res, await explanationsService.listByRevision(p.revisionId, session(res))); },
  async replaceByRevision(req: Request, res: Response) { const p = revisionIdParamsSchema.parse(req.params); sendSuccess(res, await explanationsService.replaceByRevision(p.revisionId, replaceBlocksSchema.parse(req.body), session(res))); },
  async add(req: Request, res: Response) { const p = revisionIdParamsSchema.parse(req.params); sendSuccess(res, await explanationsService.add(p.revisionId, addBlockSchema.parse(req.body), session(res)), 201); },
  async update(req: Request, res: Response) { const p = explanationBlockIdParamsSchema.parse(req.params); sendSuccess(res, await explanationsService.update(p.blockId, updateBlockSchema.parse(req.body), session(res))); },
  async remove(req: Request, res: Response) { const p = explanationBlockIdParamsSchema.parse(req.params); await explanationsService.remove(p.blockId, session(res)); res.status(204).send(); },
  async listReferences(req: Request, res: Response) { const p = revisionIdParamsSchema.parse(req.params); sendSuccess(res, await explanationsService.listReferences(p.revisionId, session(res))); },
  async replaceReferences(req: Request, res: Response) { const p = revisionIdParamsSchema.parse(req.params); sendSuccess(res, await explanationsService.replaceReferences(p.revisionId, replaceReferencesSchema.parse(req.body), session(res))); },
};
