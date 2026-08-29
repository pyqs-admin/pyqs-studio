import { Router, type Router as ExpressRouter } from 'express';

import { asyncHandler } from '../../lib/async-handler.js';
import { requireStudioAuth, requireStudioPermission } from '../../middleware/require-studio-auth.middleware.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { taxonomyController } from './taxonomy.controller.js';
import { chapterParamsSchema, createChapterSchema, createSimpleSchema, createSubjectSchema, createTopicSchema, idParamsSchema, subjectParamsSchema, updateChapterSchema, updateSimpleSchema, updateSubjectSchema, updateTopicSchema } from './taxonomy.schemas.js';

export const taxonomyRouter: ExpressRouter = Router();
taxonomyRouter.use(requireStudioAuth);
taxonomyRouter.get('/', asyncHandler((req, res) => taxonomyController.getAll(req, res)));
taxonomyRouter.get('/subjects', asyncHandler((req, res) => taxonomyController.listSubjects(req, res)));
taxonomyRouter.get('/subjects/:subjectId/chapters', validateRequest({ params: subjectParamsSchema }), asyncHandler((req, res) => taxonomyController.listChapters(req, res)));
taxonomyRouter.get('/chapters/:chapterId/topics', validateRequest({ params: chapterParamsSchema }), asyncHandler((req, res) => taxonomyController.listTopics(req, res)));
taxonomyRouter.get('/difficulties', asyncHandler((req, res) => taxonomyController.listDifficulties(req, res)));
taxonomyRouter.get('/question-types', asyncHandler((req, res) => taxonomyController.listQuestionTypes(req, res)));
taxonomyRouter.use(requireStudioPermission('taxonomy.manage'));
taxonomyRouter.post('/subjects', validateRequest({ body: createSubjectSchema }), asyncHandler((req, res) => taxonomyController.createSubject(req, res)));
taxonomyRouter.patch('/subjects/:id', validateRequest({ params: idParamsSchema, body: updateSubjectSchema }), asyncHandler((req, res) => taxonomyController.updateSubject(req, res)));
taxonomyRouter.post('/chapters', validateRequest({ body: createChapterSchema }), asyncHandler((req, res) => taxonomyController.createChapter(req, res)));
taxonomyRouter.patch('/chapters/:id', validateRequest({ params: idParamsSchema, body: updateChapterSchema }), asyncHandler((req, res) => taxonomyController.updateChapter(req, res)));
taxonomyRouter.post('/topics', validateRequest({ body: createTopicSchema }), asyncHandler((req, res) => taxonomyController.createTopic(req, res)));
taxonomyRouter.patch('/topics/:id', validateRequest({ params: idParamsSchema, body: updateTopicSchema }), asyncHandler((req, res) => taxonomyController.updateTopic(req, res)));
taxonomyRouter.post('/difficulties', validateRequest({ body: createSimpleSchema }), asyncHandler((req, res) => taxonomyController.createDifficulty(req, res)));
taxonomyRouter.patch('/difficulties/:id', validateRequest({ params: idParamsSchema, body: updateSimpleSchema }), asyncHandler((req, res) => taxonomyController.updateDifficulty(req, res)));
taxonomyRouter.post('/question-types', validateRequest({ body: createSimpleSchema }), asyncHandler((req, res) => taxonomyController.createQuestionType(req, res)));
taxonomyRouter.patch('/question-types/:id', validateRequest({ params: idParamsSchema, body: updateSimpleSchema }), asyncHandler((req, res) => taxonomyController.updateQuestionType(req, res)));
