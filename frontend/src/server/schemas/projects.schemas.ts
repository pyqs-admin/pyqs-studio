import { z } from "zod";

const id = z.string().uuid();
const name = z.string().trim().min(1).max(180);
const projectStatus = z.enum(["active", "archived"]);
const projectRole = z.enum(["project_owner", "tutor", "explanation_editor", "reviewer", "project_admin", "viewer"]);
const memberStatus = z.enum(["active", "inactive"]);

export const projectIdParamsSchema = z.object({ projectId: id }).strict();
export const memberIdParamsSchema = z.object({ projectId: id, memberId: id }).strict();
export const createProjectBodySchema = z.object({
  name,
  examId: id,
  year: z.number().int().min(2000).max(2100),
  session: z.string().trim().min(1).max(80).optional(),
  templateCode: z.string().trim().min(1).max(80).default("standard_4_option_mcq"),
  targetQuestionCount: z.number().int().positive().optional(),
  deadline: z.coerce.date().optional(),
  projectLeadProfileId: id.optional(),
}).strict();
export const updateProjectBodySchema = z.object({
  name: name.optional(),
  session: z.string().trim().min(1).max(80).nullable().optional(),
  status: projectStatus.optional(),
  templateCode: z.string().trim().min(1).max(80).optional(),
  targetQuestionCount: z.number().int().positive().nullable().optional(),
  deadline: z.coerce.date().nullable().optional(),
  projectLeadProfileId: id.nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);
export const createMemberBodySchema = z.object({ profileId: id, projectRole }).strict();
export const updateMemberBodySchema = z.object({ projectRole: projectRole.optional(), status: memberStatus.optional() }).strict().refine((value) => Object.keys(value).length > 0);

export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;
export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>;
export type CreateMemberBody = z.infer<typeof createMemberBodySchema>;
export type UpdateMemberBody = z.infer<typeof updateMemberBodySchema>;
