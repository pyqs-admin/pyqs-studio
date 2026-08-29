import type { Request, Response } from 'express';

import { sendSuccess } from '../../lib/api-response.js';
import { createChapterSchema, createSimpleSchema, createSubjectSchema, createTopicSchema, idParamsSchema, updateChapterSchema, updateSimpleSchema, updateSubjectSchema, updateTopicSchema } from './taxonomy.schemas.js';
import { taxonomyService } from './taxonomy.service.js';

export class TaxonomyController {
  async getAll(_req: Request, res: Response) { sendSuccess(res, await taxonomyService.getTaxonomy()); }
  async listSubjects(_req: Request, res: Response) { sendSuccess(res, await taxonomyService.getTaxonomy().then((data) => data.subjects)); }
  async listChapters(req: Request, res: Response) { sendSuccess(res, await taxonomyService.getTaxonomy().then((data) => data.chapters.filter((item) => item.subjectId === req.params.subjectId))); }
  async listTopics(req: Request, res: Response) { sendSuccess(res, await taxonomyService.getTaxonomy().then((data) => data.topics.filter((item) => item.chapterId === req.params.chapterId))); }
  async listDifficulties(_req: Request, res: Response) { sendSuccess(res, await taxonomyService.getTaxonomy().then((data) => data.difficulties)); }
  async listQuestionTypes(_req: Request, res: Response) { sendSuccess(res, await taxonomyService.getTaxonomy().then((data) => data.questionTypes)); }
  async createSubject(req: Request, res: Response) { sendSuccess(res, await taxonomyService.createSubject(createSubjectSchema.parse(req.body)), 201); }
  async updateSubject(req: Request, res: Response) { sendSuccess(res, await taxonomyService.updateSubject(idParamsSchema.parse(req.params).id, updateSubjectSchema.parse(req.body))); }
  async createChapter(req: Request, res: Response) { sendSuccess(res, await taxonomyService.createChapter(createChapterSchema.parse(req.body)), 201); }
  async updateChapter(req: Request, res: Response) { sendSuccess(res, await taxonomyService.updateChapter(idParamsSchema.parse(req.params).id, updateChapterSchema.parse(req.body))); }
  async createTopic(req: Request, res: Response) { sendSuccess(res, await taxonomyService.createTopic(createTopicSchema.parse(req.body)), 201); }
  async updateTopic(req: Request, res: Response) { sendSuccess(res, await taxonomyService.updateTopic(idParamsSchema.parse(req.params).id, updateTopicSchema.parse(req.body))); }
  async createDifficulty(req: Request, res: Response) { sendSuccess(res, await taxonomyService.createDifficulty(createSimpleSchema.parse(req.body)), 201); }
  async updateDifficulty(req: Request, res: Response) { sendSuccess(res, await taxonomyService.updateDifficulty(idParamsSchema.parse(req.params).id, updateSimpleSchema.parse(req.body))); }
  async createQuestionType(req: Request, res: Response) { sendSuccess(res, await taxonomyService.createQuestionType(createSimpleSchema.parse(req.body)), 201); }
  async updateQuestionType(req: Request, res: Response) { sendSuccess(res, await taxonomyService.updateQuestionType(idParamsSchema.parse(req.params).id, updateSimpleSchema.parse(req.body))); }
}

export const taxonomyController = new TaxonomyController();
