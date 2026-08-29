import { Router, type Router as ExpressRouter } from 'express';

import { asyncHandler } from '../../lib/async-handler.js';
import { requireStudioAuth } from '../../middleware/require-studio-auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { projectsController } from './projects.controller.js';
import { createMemberBodySchema, createProjectBodySchema, memberIdParamsSchema, projectIdParamsSchema, updateMemberBodySchema, updateProjectBodySchema } from './projects.schemas.js';

export const projectsRouter: ExpressRouter = Router();
projectsRouter.use(requireStudioAuth);
projectsRouter.get('/', asyncHandler((req, res) => projectsController.list(req, res)));
projectsRouter.post('/', validateRequest({ body: createProjectBodySchema }), asyncHandler((req, res) => projectsController.create(req, res)));
projectsRouter.get('/:projectId', validateRequest({ params: projectIdParamsSchema }), asyncHandler((req, res) => projectsController.get(req, res)));
projectsRouter.patch('/:projectId', validateRequest({ params: projectIdParamsSchema, body: updateProjectBodySchema }), asyncHandler((req, res) => projectsController.update(req, res)));
projectsRouter.get('/:projectId/members', validateRequest({ params: projectIdParamsSchema }), asyncHandler((req, res) => projectsController.listMembers(req, res)));
projectsRouter.post('/:projectId/members', validateRequest({ params: projectIdParamsSchema, body: createMemberBodySchema }), asyncHandler((req, res) => projectsController.addMember(req, res)));
projectsRouter.patch('/:projectId/members/:memberId', validateRequest({ params: memberIdParamsSchema, body: updateMemberBodySchema }), asyncHandler((req, res) => projectsController.updateMember(req, res)));
