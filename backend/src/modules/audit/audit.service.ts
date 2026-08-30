import { AppError } from '../../lib/AppError.js';
import type { StudioSession } from '../auth/auth.types.js';
import { projectsService } from '../projects/projects.service.js';
import { questionsService } from '../questions/questions.service.js';
import type { AuditLogQuery } from './audit.schemas.js';
import { auditRepository } from './audit.repository.js';
export class AuditService {
  async listProject(projectId: string, session: StudioSession) { await projectsService.get(projectId, session); return auditRepository.list({ limit: 50, offset: 0, projectId }); }
  async listAll(query: AuditLogQuery, session: StudioSession) { if (query.questionId) await questionsService.requireQuestionAccess(query.questionId, session); else if (query.projectId) await projectsService.get(query.projectId, session); else if (!session.permissions.includes('audit.view_all')) throw new AppError({ statusCode: 403, code: 'PERMISSION_DENIED', message: 'An audit.view_all permission is required for cross-project audit search.' }); return auditRepository.list(query); }
}
export const auditService = new AuditService();
