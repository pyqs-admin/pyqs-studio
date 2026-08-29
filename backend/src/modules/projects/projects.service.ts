import { AppError } from '../../lib/AppError.js';
import type { StudioSession } from '../auth/auth.types.js';
import { authService } from '../auth/auth.service.js';
import { projectsRepository } from './projects.repository.js';
import type { CreateMemberBody, CreateProjectBody, UpdateMemberBody, UpdateProjectBody } from './projects.schemas.js';

export class ProjectsService {
  async list(session: StudioSession) { return projectsRepository.listForProfile(session.profileId, session.permissions.includes('project.view_all')); }
  async get(projectId: string, session: StudioSession) { const project = await this.requireProject(projectId); await this.requireView(projectId, session, project.project.createdBy); return project; }
  async create(input: CreateProjectBody, session: StudioSession) {
    authService.requirePermission(session, 'project.create');
    await this.requireActiveExam(input.examId);
    if (input.projectLeadProfileId) await this.requireActiveProfile(input.projectLeadProfileId);
    const project = await projectsRepository.createProject(input, session.profileId);
    await projectsRepository.createMember(project.id, { profileId: session.profileId, projectRole: 'project_owner' }, session.profileId);
    return project;
  }
  async update(projectId: string, input: UpdateProjectBody, session: StudioSession) {
    const project = await this.requireProject(projectId);
    await this.requireManage(projectId, session, project.project.createdBy);
    if (input.projectLeadProfileId) await this.requireActiveProfile(input.projectLeadProfileId);
    return this.requireResult(await projectsRepository.updateProject(projectId, input), 'Project');
  }
  async listMembers(projectId: string, session: StudioSession) { const project = await this.requireProject(projectId); await this.requireView(projectId, session, project.project.createdBy); return projectsRepository.listMembers(projectId); }
  async addMember(projectId: string, input: CreateMemberBody, session: StudioSession) {
    const project = await this.requireProject(projectId); await this.requireManageMembers(projectId, session, project.project.createdBy); await this.requireActiveProfile(input.profileId);
    if (await projectsRepository.findMembership(projectId, input.profileId)) throw new AppError({ statusCode: 409, code: 'PROJECT_MEMBER_EXISTS', message: 'This user is already an active project member.' });
    return projectsRepository.createMember(projectId, input, session.profileId);
  }
  async updateMember(projectId: string, memberId: string, input: UpdateMemberBody, session: StudioSession) {
    const project = await this.requireProject(projectId); await this.requireManageMembers(projectId, session, project.project.createdBy);
    const member = await projectsRepository.findMember(memberId);
    if (!member || member.projectId !== projectId) throw new AppError({ statusCode: 404, code: 'PROJECT_MEMBER_NOT_FOUND', message: 'Project member not found.' });
    if (member.projectRole === 'project_owner' && input.status === 'inactive') throw new AppError({ statusCode: 400, code: 'PROJECT_OWNER_REQUIRED', message: 'The project owner cannot be deactivated.' });
    return this.requireResult(await projectsRepository.updateMember(memberId, input), 'Project member');
  }
  private async requireProject(projectId: string) { const project = await projectsRepository.findProject(projectId); if (!project) throw new AppError({ statusCode: 404, code: 'PROJECT_NOT_FOUND', message: 'Project not found.' }); return project; }
  private async requireActiveExam(examId: string) { if (!await projectsRepository.findActiveExam(examId)) throw new AppError({ statusCode: 400, code: 'INVALID_EXAM', message: 'An active exam is required.' }); }
  private async requireActiveProfile(profileId: string) { if (!await projectsRepository.findActiveProfile(profileId)) throw new AppError({ statusCode: 400, code: 'INVALID_STUDIO_PROFILE', message: 'An active Studio profile is required.' }); }
  private async requireView(projectId: string, session: StudioSession, createdBy: string) { if (session.permissions.includes('project.view_all') || session.profileId === createdBy || await projectsRepository.findMembership(projectId, session.profileId)) return; throw new AppError({ statusCode: 403, code: 'PROJECT_ACCESS_DENIED', message: 'You do not have access to this project.' }); }
  private async requireManage(projectId: string, session: StudioSession, createdBy: string) { if (session.permissions.includes('project.manage_all')) return; const member = await projectsRepository.findMembership(projectId, session.profileId); if (session.profileId === createdBy || member?.projectRole === 'project_owner' || member?.projectRole === 'project_admin') return; throw new AppError({ statusCode: 403, code: 'PROJECT_MANAGE_DENIED', message: 'You cannot manage this project.' }); }
  private async requireManageMembers(projectId: string, session: StudioSession, createdBy: string) { if (session.permissions.includes('project.manage_members')) return this.requireManage(projectId, session, createdBy); await this.requireManage(projectId, session, createdBy); }
  private requireResult<T>(value: T | null, name: string): T { if (!value) throw new AppError({ statusCode: 404, code: 'PROJECT_NOT_FOUND', message: `${name} not found.` }); return value; }
}

export const projectsService = new ProjectsService();
