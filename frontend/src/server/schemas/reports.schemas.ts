import { z } from "zod";

export const reportStatusSchema = z.enum(["pending", "reviewing", "done", "dismissed"]);
export const reportListQuerySchema = z.object({ status: reportStatusSchema.optional(), limit: z.coerce.number().int().min(1).max(100).default(50), offset: z.coerce.number().int().min(0).default(0) }).strict();
export const reportIdSchema = z.string().uuid();
export const updateReportSchema = z.object({ status: reportStatusSchema, adminNote: z.string().trim().max(1000).optional() }).strict();
export type ReportListQuery = z.infer<typeof reportListQuerySchema>;
export type UpdateReport = z.infer<typeof updateReportSchema>;
