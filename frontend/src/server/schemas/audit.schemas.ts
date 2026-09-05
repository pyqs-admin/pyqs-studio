import { z } from "zod";

const id = z.string().uuid();
export const projectIdParamsSchema = z.object({ projectId: id }).strict();
export const auditLogQuerySchema = z.object({ projectId: id.optional(), questionId: id.optional(), actorProfileId: id.optional(), action: z.string().trim().min(1).max(120).optional(), limit: z.coerce.number().int().min(1).max(100).default(50), offset: z.coerce.number().int().min(0).default(0) }).strict();
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
