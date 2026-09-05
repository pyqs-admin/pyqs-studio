"use server";

import { requireUser } from "@/server/auth/session";
import { runAction } from "@/server/lib/action-result";
import { auditService } from "@/server/services/audit.service";
import { auditLogQuerySchema, projectIdParamsSchema } from "@/server/schemas/audit.schemas";

export async function listProjectAudit(projectId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = projectIdParamsSchema.parse({ projectId });
    return auditService.listProject(params.projectId, session);
  });
}

export async function listAllAudit(query: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    return auditService.listAll(auditLogQuerySchema.parse(query ?? {}), session);
  });
}
