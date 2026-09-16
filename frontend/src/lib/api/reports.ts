import { getQuestionReportStats as getQuestionReportStatsAction, listQuestionReports as listQuestionReportsAction, updateQuestionReport as updateQuestionReportAction } from "@/actions/reports";
import { callAction } from "./client";
export type ReportStatus = "pending" | "reviewing" | "done" | "dismissed";
export type QuestionReport = { id: string; questionId: string; questionPublicQid: string; studioQuestionId: string | null; questionTitle: string; questionDescription: string; profileId: string; profileEmail: string; profileName: string | null; reason: string; description: string | null; status: ReportStatus; adminNote: string | null; createdAt: string; updatedAt: string };
export type ReportStats = Record<ReportStatus, number>;
export const getQuestionReports = (query: { status?: ReportStatus; limit?: number; offset?: number } = {}) => callAction<QuestionReport[]>(listQuestionReportsAction(query));
export const getQuestionReportStats = () => callAction<ReportStats>(getQuestionReportStatsAction());
export const updateQuestionReport = (id: string, body: { status: ReportStatus; adminNote?: string }) => callAction<QuestionReport>(updateQuestionReportAction(id, body));
