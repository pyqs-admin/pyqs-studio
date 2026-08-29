import { z } from 'zod';
export const blockTypeSchema = z.enum(['paragraph', 'heading', 'bullet_list', 'numbered_list', 'image', 'table', 'other_options', 'educational_objective', 'references', 'high_yield_callout']);
const id = z.uuid();
export const revisionParamsSchema = z.object({ questionId: id, revisionId: id }).strict();
export const blockParamsSchema = z.object({ questionId: id, revisionId: id, blockId: id }).strict();
export const replaceBlocksSchema = z.object({ blocks: z.array(z.object({ blockType: blockTypeSchema, content: z.unknown(), position: z.number().int().min(0) }).strict()).max(100) }).strict();
export type ReplaceBlocks = z.infer<typeof replaceBlocksSchema>;
