import type { Request, Response } from 'express';
import { sendSuccess } from '../../lib/api-response.js';
import type { StudioSession } from '../auth/auth.types.js';
import { auditLogQuerySchema, projectIdParamsSchema } from './audit.schemas.js';
import { auditService } from './audit.service.js';
const session = (res: Response) => res.locals.studioSession as StudioSession;
export const auditController = { async listProject(req: Request, res: Response) { sendSuccess(res, await auditService.listProject(projectIdParamsSchema.parse(req.params).projectId, session(res))); }, async listAll(req: Request, res: Response) { sendSuccess(res, await auditService.listAll(auditLogQuerySchema.parse(req.query), session(res))); } };
