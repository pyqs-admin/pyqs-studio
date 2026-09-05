"use server";

import { requireUser } from "@/server/auth/session";
import { runAction } from "@/server/lib/action-result";
import { projectsService } from "@/server/services/projects.service";
import {
  createMemberBodySchema,
  createProjectBodySchema,
  memberIdParamsSchema,
  projectIdParamsSchema,
  updateMemberBodySchema,
  updateProjectBodySchema,
} from "@/server/schemas/projects.schemas";

export async function listProjects() {
  return runAction(async () => {
    const session = await requireUser();
    return projectsService.list(session);
  });
}

export async function getProject(projectId: string) {
  return runAction(async () => {
    const session = await requireUser();
    return projectsService.get(projectId, session);
  });
}

export async function createProject(input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    return projectsService.create(createProjectBodySchema.parse(input), session);
  });
}

export async function updateProject(projectId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = projectIdParamsSchema.parse({ projectId });
    return projectsService.update(params.projectId, updateProjectBodySchema.parse(input), session);
  });
}

export async function listProjectMembers(projectId: string) {
  return runAction(async () => {
    const session = await requireUser();
    const params = projectIdParamsSchema.parse({ projectId });
    return projectsService.listMembers(params.projectId, session);
  });
}

export async function addProjectMember(projectId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = projectIdParamsSchema.parse({ projectId });
    return projectsService.addMember(params.projectId, createMemberBodySchema.parse(input), session);
  });
}

export async function updateProjectMember(projectId: string, memberId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = memberIdParamsSchema.parse({ projectId, memberId });
    return projectsService.updateMember(params.projectId, params.memberId, updateMemberBodySchema.parse(input), session);
  });
}
