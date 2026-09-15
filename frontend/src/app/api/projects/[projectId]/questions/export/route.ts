import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/server/auth/session";
import { AppError } from "@/server/lib/AppError";
import { questionExportService } from "@/server/services/question-export.service";

const querySchema = z.object({
  subjectId: z.string().uuid().optional(),
  ids: z.string().optional(),
  images: z.enum(["0", "1"]).default("1"),
  explanations: z.enum(["0", "1"]).default("1"),
  title: z.string().trim().max(160).optional(),
}).strict();

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    if (!z.string().uuid().safeParse(projectId).success) {
      return NextResponse.json({ success: false, error: { code: "INVALID_PROJECT_ID", message: "Project ID must be a UUID." } }, { status: 400 });
    }
    const query = querySchema.parse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    const questionIds = query.ids?.split(",").map((id) => id.trim()).filter(Boolean);
    if (questionIds?.some((id) => !z.string().uuid().safeParse(id).success)) {
      return NextResponse.json({ success: false, error: { code: "INVALID_QUESTION_IDS", message: "Question IDs must be UUIDs." } }, { status: 400 });
    }
    const session = await requireUser();
    const document = await questionExportService.createDocx({ projectId, subjectId: query.subjectId, questionIds, includeImages: query.images === "1", includeExplanations: query.explanations === "1", title: query.title }, session);
    return new Response(new Uint8Array(document.buffer), { headers: { "Content-Type": document.mimeType, "Content-Disposition": `attachment; filename="${document.fileName}"`, "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: { code: "INVALID_EXPORT_QUERY", message: "Invalid export parameters." } }, { status: 400 });
    if (error instanceof AppError) return NextResponse.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.statusCode });
    console.error("Question DOCX export failed", error);
    return NextResponse.json({ success: false, error: { code: "EXPORT_FAILED", message: "The question document could not be generated." } }, { status: 500 });
  }
}
