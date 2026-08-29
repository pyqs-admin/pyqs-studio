import type { Request, Response } from 'express';

import { sendSuccess } from '../../lib/api-response.js';
import type { StudioSession } from '../auth/auth.types.js';
import { createMemberBodySchema, createProjectBodySchema, memberIdParamsSchema, projectIdParamsSchema, updateMemberBodySchema, updateProjectBodySchema } from './projects.schemas.js';
import { projectsService } from './projects.service.js';

const session = (res: Response) => res.locals.studioSession as StudioSession;

export class ProjectsController {
  async list(_req: Request, res: Response) { sendSuccess(res, await projectsService.list(session(res))); }
  async get(req: Request, res: Response) { sendSuccess(res, await projectsService.get(projectIdParamsSchema.parse(req.params).projectId, session(res))); }
  async create(req: Request, res: Response) { sendSuccess(res, await projectsService.create(createProjectBodySchema.parse(req.body), session(res)), 201); }
  async update(req: Request, res: Response) { sendSuccess(res, await projectsService.update(projectIdParamsSchema.parse(req.params).projectId, updateProjectBodySchema.parse(req.body), session(res))); }
  async listMembers(req: Request, res: Response) { sendSuccess(res, await projectsService.listMembers(projectIdParamsSchema.parse(req.params).projectId, session(res))); }
  async addMember(req: Request, res: Response) { sendSuccess(res, await projectsService.addMember(projectIdParamsSchema.parse(req.params).projectId, createMemberBodySchema.parse(req.body), session(res)), 201); }
  async updateMember(req: Request, res: Response) { const params = memberIdParamsSchema.parse(req.params); sendSuccess(res, await projectsService.updateMember(params.projectId, params.memberId, updateMemberBodySchema.parse(req.body), session(res))); }
}

export const projectsController = new ProjectsController();
