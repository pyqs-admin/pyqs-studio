import { z } from 'zod';

import { questionStatusSchema } from '../questions/questions.schemas.js';

const id = z.uuid();
const questionIds = z.object({ questionIds: z.array(id).min(1).max(100).refine((items) => new Set(items).size === items.length, 'Question IDs must be unique.') }).strict();
export const searchQuerySchema = z.object({ projectId: id.optional(), subjectId: id.optional(), chapterId: id.optional(), topicId: id.optional(), difficultyId: id.optional(), createdBy: id.optional(), assignedTo: id.optional(), status: questionStatusSchema.optional(), q: z.string().trim().min(1).max(200).optional(), limit: z.coerce.number().int().min(1).max(100).default(30), offset: z.coerce.number().int().min(0).default(0) }).strict();
export const savedViewFiltersSchema = searchQuerySchema.omit({ limit: true, offset: true });
export const createSavedViewSchema = z.object({ name: z.string().trim().min(1).max(100), filters: savedViewFiltersSchema.default({}) }).strict();
export const updateSavedViewSchema = z.object({ name: z.string().trim().min(1).max(100).optional(), filters: savedViewFiltersSchema.optional() }).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required.');
export const savedViewIdParamsSchema = z.object({ viewId: id }).strict();
export const bulkAssignSchema = questionIds.extend({ profileId: id, assignmentType: z.enum(['tutor', 'reviewer']) }).strict();
export const bulkTaxonomySchema = questionIds.extend({ subjectId: id, chapterId: id, topicId: id }).strict();
export const bulkDifficultySchema = questionIds.extend({ difficultyId: id }).strict();
export const bulkArchiveSchema = questionIds.extend({ confirm: z.literal(true) }).strict();
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SavedViewFilters = z.infer<typeof savedViewFiltersSchema>;
