import { z } from 'zod';

const id = z.uuid();
const code = z.string().trim().regex(/^[a-z][a-z0-9_]*$/).max(80);
const name = z.string().trim().min(1).max(160);
const status = z.enum(['active', 'archived']);
const sortOrder = z.number().int().min(0).max(100_000);
const changes = { code: code.optional(), name: name.optional(), status: status.optional(), sortOrder: sortOrder.optional() };

export const idParamsSchema = z.object({ id }).strict();
export const subjectParamsSchema = z.object({ subjectId: id }).strict();
export const chapterParamsSchema = z.object({ chapterId: id }).strict();
export const createSubjectSchema = z.object({ code, name, sortOrder: sortOrder.optional() }).strict();
export const updateSubjectSchema = z.object(changes).strict().refine((value) => Object.keys(value).length > 0);
export const createChapterSchema = z.object({ subjectId: id, code, name, sortOrder: sortOrder.optional() }).strict();
export const updateChapterSchema = z.object({ subjectId: id.optional(), ...changes }).strict().refine((value) => Object.keys(value).length > 0);
export const createTopicSchema = z.object({ chapterId: id, code, name, sortOrder: sortOrder.optional() }).strict();
export const updateTopicSchema = z.object({ chapterId: id.optional(), ...changes }).strict().refine((value) => Object.keys(value).length > 0);
export const createSimpleSchema = z.object({ code, name, sortOrder: sortOrder.optional() }).strict();
export const updateSimpleSchema = z.object(changes).strict().refine((value) => Object.keys(value).length > 0);

export type CreateSubject = z.infer<typeof createSubjectSchema>;
export type UpdateSubject = z.infer<typeof updateSubjectSchema>;
export type CreateChapter = z.infer<typeof createChapterSchema>;
export type UpdateChapter = z.infer<typeof updateChapterSchema>;
export type CreateTopic = z.infer<typeof createTopicSchema>;
export type UpdateTopic = z.infer<typeof updateTopicSchema>;
export type CreateSimple = z.infer<typeof createSimpleSchema>;
export type UpdateSimple = z.infer<typeof updateSimpleSchema>;
