import { Router, type Router as ExpressRouter } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { requireStudioAuth } from '../../middleware/require-studio-auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { explanationsController } from './explanations.controller.js';
import { addBlockSchema, explanationBlockIdParamsSchema, replaceBlocksSchema, replaceReferencesSchema, revisionIdParamsSchema, revisionParamsSchema, updateBlockSchema } from './explanations.schemas.js';

export const explanationsRouter: ExpressRouter = Router();
explanationsRouter.use(requireStudioAuth);
explanationsRouter.get('/questions/:questionId/revisions/:revisionId/explanation-blocks', validateRequest({ params: revisionParamsSchema }), asyncHandler((req, res) => explanationsController.list(req, res)));
explanationsRouter.put('/questions/:questionId/revisions/:revisionId/explanation-blocks', validateRequest({ params: revisionParamsSchema, body: replaceBlocksSchema }), asyncHandler((req, res) => explanationsController.replace(req, res)));
explanationsRouter.get('/question-revisions/:revisionId/explanation', validateRequest({ params: revisionIdParamsSchema }), asyncHandler((req, res) => explanationsController.listByRevision(req, res)));
explanationsRouter.put('/question-revisions/:revisionId/explanation-blocks', validateRequest({ params: revisionIdParamsSchema, body: replaceBlocksSchema }), asyncHandler((req, res) => explanationsController.replaceByRevision(req, res)));
explanationsRouter.post('/question-revisions/:revisionId/explanation-blocks', validateRequest({ params: revisionIdParamsSchema, body: addBlockSchema }), asyncHandler((req, res) => explanationsController.add(req, res)));
explanationsRouter.patch('/explanation-blocks/:blockId', validateRequest({ params: explanationBlockIdParamsSchema, body: updateBlockSchema }), asyncHandler((req, res) => explanationsController.update(req, res)));
explanationsRouter.delete('/explanation-blocks/:blockId', validateRequest({ params: explanationBlockIdParamsSchema }), asyncHandler((req, res) => explanationsController.remove(req, res)));
explanationsRouter.get('/question-revisions/:revisionId/references', validateRequest({ params: revisionIdParamsSchema }), asyncHandler((req, res) => explanationsController.listReferences(req, res)));
explanationsRouter.put('/question-revisions/:revisionId/references', validateRequest({ params: revisionIdParamsSchema, body: replaceReferencesSchema }), asyncHandler((req, res) => explanationsController.replaceReferences(req, res)));
