import { z } from "zod";

const id = z.string().uuid();
const code = z.string().trim().min(1).max(100);
const profileStatus = z.enum(["active", "inactive"]);

export const profileIdParamsSchema = z.object({ profileId: id }).strict();
export const setRolesBodySchema = z.object({ roles: z.array(code).max(50) }).strict();
export const setPermissionsBodySchema = z.object({ permissions: z.array(code).max(100) }).strict();
export const setStatusBodySchema = z.object({ status: profileStatus }).strict();

export type SetRolesBody = z.infer<typeof setRolesBodySchema>;
export type SetPermissionsBody = z.infer<typeof setPermissionsBodySchema>;
export type SetStatusBody = z.infer<typeof setStatusBodySchema>;
