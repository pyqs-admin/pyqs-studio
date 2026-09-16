"use server";
import { requireUser } from "@/server/auth/session";
import { runAction } from "@/server/lib/action-result";
import { reportIdSchema, reportListQuerySchema, updateReportSchema } from "@/server/schemas/reports.schemas";
import { reportsService } from "@/server/services/reports.service";
export async function listQuestionReports(query: unknown) { return runAction(async () => reportsService.list(reportListQuerySchema.parse(query ?? {}), await requireUser())); }
export async function getQuestionReportStats() { return runAction(async () => reportsService.stats(await requireUser())); }
export async function updateQuestionReport(reportId: string, input: unknown) { return runAction(async () => reportsService.update(reportIdSchema.parse(reportId), updateReportSchema.parse(input), await requireUser())); }
