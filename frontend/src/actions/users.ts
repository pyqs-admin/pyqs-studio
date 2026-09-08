"use server";

import { requireUser } from "@/server/auth/session";
import { runAction } from "@/server/lib/action-result";
import { usersService } from "@/server/services/users.service";
import { profileIdParamsSchema, setPermissionsBodySchema, setRolesBodySchema, setStatusBodySchema } from "@/server/schemas/users.schemas";

export async function listRoles() {
  return runAction(async () => usersService.listRoles(await requireUser()));
}

export async function listPermissions() {
  return runAction(async () => usersService.listPermissions(await requireUser()));
}

export async function listUsersWithAccess() {
  return runAction(async () => usersService.listUsers(await requireUser()));
}

export async function setUserRoles(profileId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = profileIdParamsSchema.parse({ profileId });
    return usersService.setRoles(params.profileId, setRolesBodySchema.parse(input), session);
  });
}

export async function setUserPermissions(profileId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = profileIdParamsSchema.parse({ profileId });
    return usersService.setPermissions(params.profileId, setPermissionsBodySchema.parse(input), session);
  });
}

export async function setUserStatus(profileId: string, input: unknown) {
  return runAction(async () => {
    const session = await requireUser();
    const params = profileIdParamsSchema.parse({ profileId });
    return usersService.setStatus(params.profileId, setStatusBodySchema.parse(input), session);
  });
}
