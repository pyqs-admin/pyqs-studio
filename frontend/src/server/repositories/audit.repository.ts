import { and, desc, eq } from "drizzle-orm";

import { db } from "@/server/db/client";
import { studioAuditLog, studioProfile } from "@/server/db/schema";
import type { AuditLogQuery } from "@/server/schemas/audit.schemas";

export class AuditRepository {
  list(query: AuditLogQuery) { const conditions = [query.projectId ? eq(studioAuditLog.projectId, query.projectId) : undefined, query.questionId ? eq(studioAuditLog.questionId, query.questionId) : undefined, query.actorProfileId ? eq(studioAuditLog.actorProfileId, query.actorProfileId) : undefined, query.action ? eq(studioAuditLog.action, query.action) : undefined].filter((condition): condition is NonNullable<typeof condition> => condition !== undefined); return db.select({ audit: studioAuditLog, actor: { id: studioProfile.id, email: studioProfile.email, displayName: studioProfile.displayName } }).from(studioAuditLog).innerJoin(studioProfile, eq(studioAuditLog.actorProfileId, studioProfile.id)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(studioAuditLog.createdAt)).limit(query.limit).offset(query.offset); }
}

export const auditRepository = new AuditRepository();
