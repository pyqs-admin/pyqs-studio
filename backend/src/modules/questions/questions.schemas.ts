import { z } from 'zod';

const id = z.uuid();
const option = z.object({ label: z.enum(['A', 'B', 'C', 'D']), content: z.string().trim().min(1).max(10_000) }).strict();
const base = {
  stem: z.string().trim().min(1).max(20_000), correctOption: z.enum(['A', 'B', 'C', 'D']), chapterId: id, topicId: id,
  difficultyId: id, questionTypeIds: z.array(id).min(1).max(8), options: z.array(option).length(4),
};
export const questionStatusSchema = z.enum(['DRAFT', 'QUESTION_SUBMITTED', 'NEEDS_EXPLANATION', 'RAG_EXPORTED', 'RAG_IMPORTED', 'EXPLANATION_READY', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'ARCHIVED']);
export const createQuestionSchema = z.object(base).strict().superRefine((value, ctx) => {
  if (new Set(value.options.map((item) => item.label)).size !== 4) ctx.addIssue({ code: 'custom', message: 'Options must use A, B, C, and D exactly once.' });
});
export const updateDraftSchema = z.object(base).strict().superRefine((value, ctx) => {
  if (new Set(value.options.map((item) => item.label)).size !== 4) ctx.addIssue({ code: 'custom', message: 'Options must use A, B, C, and D exactly once.' });
});
export const questionIdParamsSchema = z.object({ questionId: id }).strict();
export const projectSubjectParamsSchema = z.object({ projectId: id, subjectId: id }).strict();
export const revisionParamsSchema = z.object({ questionId: id, revisionId: id }).strict();
export const revisionIdParamsSchema = z.object({ revisionId: id }).strict();
export const revisionNumberParamsSchema = z.object({ questionId: id, revisionNumber: z.coerce.number().int().positive() }).strict();
export const questionListQuerySchema = z.object({
  projectId: id.optional(), subjectId: id.optional(), chapterId: id.optional(), topicId: id.optional(), difficultyId: id.optional(), createdBy: id.optional(), assignedTo: id.optional(), status: questionStatusSchema.optional(), q: z.string().trim().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30), offset: z.coerce.number().int().min(0).default(0),
}).strict();
export const duplicateQuestionSchema = z.object({ projectId: id.optional() }).strict();
export type QuestionDraftInput = z.infer<typeof createQuestionSchema>;
export type QuestionListQuery = z.infer<typeof questionListQuerySchema>;
