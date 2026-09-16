import { and, desc, eq, inArray } from "drizzle-orm";
import { env } from "@/server/config/env";
import { db } from "@/server/db/client";
import { studioAuditLog, studioQuestion, studioQuestionRevision, studioReviewQueue, studioReviewQueueItem } from "@/server/db/schema";
import { AppError } from "@/server/lib/AppError";
import type { StudioSession } from "@/lib/api/types";
import type { ReportListQuery, UpdateReport } from "@/server/schemas/reports.schemas";

type MainReport = { id: string; questionId: string; questionPublicQid: string; questionTitle: string; questionDescription: string; profileId: string; profileEmail: string; profileName: string | null; reason: string; description: string | null; status: "pending" | "reviewing" | "done" | "dismissed"; adminNote: string | null; createdAt: string; updatedAt: string };
function requireConfigured() { if (!env.PYQS_REPORTS_API_URL || !env.PYQS_REPORTS_API_KEY) throw new AppError({ statusCode: 503, code: "REPORTS_INTEGRATION_NOT_CONFIGURED", message: "Question reports integration is not configured." }); return { baseUrl: env.PYQS_REPORTS_API_URL.replace(/\/+$/, ""), key: env.PYQS_REPORTS_API_KEY }; }
function requirePermission(session: StudioSession, permission: string) { if (!session.permissions.includes(permission)) throw new AppError({ statusCode: 403, code: "PERMISSION_DENIED", message: "You do not have permission to manage question reports.", details: { permission } }); }
async function request<T>(path: string, init?: RequestInit): Promise<T> { const { baseUrl, key } = requireConfigured(); let response: Response; try { response = await fetch(`${baseUrl}/api/v1/internal/question-reports${path}`, { ...init, headers: { "content-type": "application/json", "x-pyqs-studio-api-key": key, ...(init?.headers ?? {}) }, cache: "no-store" }); } catch (error) { throw new AppError({ statusCode: 502, code: "REPORTS_UPSTREAM_UNAVAILABLE", message: "The main PYQS reports service is unavailable.", cause: error }); } const body = await response.json().catch(() => null) as { success?: boolean; data?: T; message?: string; code?: string; details?: unknown } | null; if (!response.ok || !body?.success) throw new AppError({ statusCode: response.status || 502, code: body?.code ?? "REPORTS_UPSTREAM_ERROR", message: body?.message ?? "The main PYQS reports service returned an error.", details: body?.details }); return body.data as T; }
export class ReportsService {
  async list(query: ReportListQuery, session: StudioSession) { requirePermission(session, "question.report.view"); const params = new URLSearchParams({ limit: String(query.limit), offset: String(query.offset) }); if (query.status) params.set("status", query.status); const reports = await request<MainReport[]>(`?${params.toString()}`); const mapped = await this.mapReports(reports); if (session.permissions.includes("question.review")) await this.enqueueMappedReports(mapped, session); return mapped; }
  async stats(session: StudioSession) { requirePermission(session, "question.report.view"); return request<{ pending: number; reviewing: number; done: number; dismissed: number }>("/stats"); }
  async update(reportId: string, input: UpdateReport, session: StudioSession) { requirePermission(session, "question.report.manage"); return request<MainReport>(`/${reportId}`, { method: "PATCH", body: JSON.stringify(input) }); }

  async syncActiveReportsToReviewQueue(session: StudioSession) {
    if (!session.permissions.includes("question.review")) return 0;
    const reports = await request<MainReport[]>("?status=pending&limit=100&offset=0");
    return this.enqueueMappedReports(await this.mapReports(reports), session);
  }

  async findActiveReportsForQuestions(publicQids: string[], session: StudioSession) {
    if (!session.permissions.includes("question.review") || publicQids.length === 0) return new Map<string, MainReport>();
    const [pending, reviewing] = await Promise.all([
      request<MainReport[]>("?status=pending&limit=100&offset=0"),
      request<MainReport[]>("?status=reviewing&limit=100&offset=0"),
    ]);
    const wanted = new Set(publicQids);
    return new Map([...pending, ...reviewing].filter((report) => wanted.has(report.questionPublicQid)).map((report) => [report.questionPublicQid, report]));
  }

  private async mapReports(reports: MainReport[]) { const qids = reports.map((report) => report.questionPublicQid).filter(Boolean); const localQuestions = qids.length ? await db.select({ id: studioQuestion.id, publicQid: studioQuestion.publicQid }).from(studioQuestion).where(inArray(studioQuestion.publicQid, qids)) : []; const byQid = new Map(localQuestions.map((question) => [question.publicQid, question.id])); return reports.map((report) => ({ ...report, studioQuestionId: byQid.get(report.questionPublicQid) ?? null })); }

  private async enqueueMappedReports(reports: Array<MainReport & { studioQuestionId: string | null }>, session: StudioSession) {
    let assigned = 0;
    for (const report of reports) {
      if (!report.studioQuestionId || !["pending", "reviewing"].includes(report.status)) continue;
      const result = await db.transaction(async (tx) => {
        const [revision] = await tx.select().from(studioQuestionRevision).where(eq(studioQuestionRevision.questionId, report.studioQuestionId!)).orderBy(desc(studioQuestionRevision.revisionNumber)).limit(1);
        if (!revision || revision.status !== "DRAFT") return false;
        const [existing] = await tx.select({ id: studioReviewQueueItem.id }).from(studioReviewQueueItem).where(and(eq(studioReviewQueueItem.revisionId, revision.id), eq(studioReviewQueueItem.reviewerProfileId, session.profileId))).limit(1);
        if (existing) return false;
        await tx.insert(studioReviewQueue).values({ reviewerProfileId: session.profileId }).onConflictDoNothing();
        const [queue] = await tx.select().from(studioReviewQueue).where(eq(studioReviewQueue.reviewerProfileId, session.profileId)).limit(1);
        if (!queue) return false;
        await tx.insert(studioReviewQueueItem).values({ queueId: queue.id, questionId: report.studioQuestionId!, revisionId: revision.id, reviewerProfileId: session.profileId, status: "ASSIGNED", position: 0, assignedBy: session.profileId });
        await tx.update(studioQuestionRevision).set({ status: "UNDER_REVIEW" }).where(eq(studioQuestionRevision.id, revision.id));
        await tx.update(studioQuestion).set({ status: "UNDER_REVIEW" }).where(eq(studioQuestion.id, report.studioQuestionId!));
        await tx.insert(studioAuditLog).values({ questionId: report.studioQuestionId!, revisionId: revision.id, actorProfileId: session.profileId, action: "question_report_auto_queued", metadata: { reportId: report.id, mainQuestionId: report.questionId } });
        return true;
      });
      if (result) { assigned += 1; if (report.status === "pending") await request<MainReport>(`/${report.id}`, { method: "PATCH", body: JSON.stringify({ status: "reviewing" }) }); }
    }
    return assigned;
  }
}
export const reportsService = new ReportsService();
