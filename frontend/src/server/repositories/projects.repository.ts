import { and, asc, eq, or } from "drizzle-orm";

import { db } from "@/server/db/client";
import { studioProfile, studioProject, studioProjectMember, taxonomyExam } from "@/server/db/schema";
import type { CreateMemberBody, CreateProjectBody, UpdateMemberBody, UpdateProjectBody } from "@/server/schemas/projects.schemas";

export class ProjectsRepository {
  async findActiveExam(examId: string) { const [row] = await db.select().from(taxonomyExam).where(and(eq(taxonomyExam.id, examId), eq(taxonomyExam.status, "active"))); return row ?? null; }
  async findActiveProfile(profileId: string) { const [row] = await db.select().from(studioProfile).where(and(eq(studioProfile.id, profileId), eq(studioProfile.status, "active"))); return row ?? null; }
  async createProject(input: CreateProjectBody, createdBy: string) { const [row] = await db.insert(studioProject).values({ ...input, createdBy }).returning(); return row!; }
  async createMember(projectId: string, input: CreateMemberBody, addedBy: string) { const [row] = await db.insert(studioProjectMember).values({ projectId, ...input, addedBy }).returning(); return row!; }
  async listForProfile(profileId: string, includeAll: boolean) {
    return db.select({ project: studioProject, exam: taxonomyExam, memberRole: studioProjectMember.projectRole }).from(studioProject)
      .innerJoin(taxonomyExam, eq(studioProject.examId, taxonomyExam.id))
      .leftJoin(studioProjectMember, and(eq(studioProjectMember.projectId, studioProject.id), eq(studioProjectMember.profileId, profileId), eq(studioProjectMember.status, "active")))
      .where(includeAll ? undefined : or(eq(studioProject.createdBy, profileId), eq(studioProjectMember.profileId, profileId)))
      .orderBy(asc(studioProject.status), asc(studioProject.name));
  }
  async findProject(projectId: string) { const [row] = await db.select({ project: studioProject, exam: taxonomyExam }).from(studioProject).innerJoin(taxonomyExam, eq(studioProject.examId, taxonomyExam.id)).where(eq(studioProject.id, projectId)); return row ?? null; }
  async findMembership(projectId: string, profileId: string) { const [row] = await db.select().from(studioProjectMember).where(and(eq(studioProjectMember.projectId, projectId), eq(studioProjectMember.profileId, profileId), eq(studioProjectMember.status, "active"))); return row ?? null; }
  async updateProject(projectId: string, input: UpdateProjectBody) { const [row] = await db.update(studioProject).set(input).where(eq(studioProject.id, projectId)).returning(); return row ?? null; }
  async listMembers(projectId: string) { return db.select({ member: studioProjectMember, profile: { id: studioProfile.id, email: studioProfile.email, displayName: studioProfile.displayName, status: studioProfile.status } }).from(studioProjectMember).innerJoin(studioProfile, eq(studioProjectMember.profileId, studioProfile.id)).where(eq(studioProjectMember.projectId, projectId)).orderBy(asc(studioProjectMember.joinedAt)); }
  async findMember(memberId: string) { const [row] = await db.select().from(studioProjectMember).where(eq(studioProjectMember.id, memberId)); return row ?? null; }
  async updateMember(memberId: string, input: UpdateMemberBody) { const [row] = await db.update(studioProjectMember).set(input).where(eq(studioProjectMember.id, memberId)).returning(); return row ?? null; }
}

export const projectsRepository = new ProjectsRepository();
