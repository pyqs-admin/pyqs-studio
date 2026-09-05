import "server-only";

import type { StudioSession } from "@/lib/api/types";
import { AppError } from "@/server/lib/AppError";
import { projectsService } from "@/server/services/projects.service";
import { questionsService } from "@/server/services/questions.service";
import type { AuditLogQuery } from "@/server/schemas/audit.schemas";
import { auditRepository } from "@/server/repositories/audit.repository";

export class AuditService {
  async listProject(projectId: string, session: StudioSession) { await projectsService.get(projectId, session); return auditRepository.list({ limit: 50, offset: 0, projectId }); }
  async listAll(query: AuditLogQuery, session: StudioSession) { if (query.questionId) await questionsService.requireQuestionAccess(query.questionId, session); else if (query.projectId) await projectsService.get(query.projectId, session); else if (!session.permissions.includes("audit.view_all")) throw new AppError({ statusCode: 403, code: "PERMISSION_DENIED", message: "An audit.view_all permission is required for cross-project audit search." }); return auditRepository.list(query); }
}

export const auditService = new AuditService();
