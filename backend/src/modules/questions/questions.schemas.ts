import { z } from 'zod';

const id = z.uuid();
const option = z.object({ label: z.enum(['A', 'B', 'C', 'D']), content: z.string().trim().min(1).max(10_000) }).strict();
const base = {
  stem: z.string().trim().min(1).max(20_000), correctOption: z.enum(['A', 'B', 'C', 'D']), chapterId: id, topicId: id,
  difficultyId: id, questionTypeIds: z.array(id).min(1).max(8), options: z.array(option).length(4),
};
export const createQuestionSchema = z.object(base).strict().superRefine((value, ctx) => {
  if (new Set(value.options.map((item) => item.label)).size !== 4) ctx.addIssue({ code: 'custom', message: 'Options must use A, B, C, and D exactly once.' });
});
export const updateDraftSchema = z.object(base).strict().superRefine((value, ctx) => {
  if (new Set(value.options.map((item) => item.label)).size !== 4) ctx.addIssue({ code: 'custom', message: 'Options must use A, B, C, and D exactly once.' });
});
export const questionIdParamsSchema = z.object({ questionId: id }).strict();
export const projectSubjectParamsSchema = z.object({ projectId: id, subjectId: id }).strict();
export const revisionParamsSchema = z.object({ questionId: id, revisionId: id }).strict();
export type QuestionDraftInput = z.infer<typeof createQuestionSchema>;
