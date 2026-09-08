import "server-only";

import type { StudioSession } from "@/lib/api/types";
import { AppError } from "@/server/lib/AppError";
import { authRepository } from "@/server/repositories/auth.repository";
import { usersRepository, type StudioRoleRecord } from "@/server/repositories/users.repository";
import type { SetPermissionsBody, SetRolesBody, SetStatusBody } from "@/server/schemas/users.schemas";

export class UsersService {
  async listRoles(session: StudioSession) {
    this.requireManage(session);
    return usersRepository.listRoles();
  }

  async listPermissions(session: StudioSession) {
    this.requireManage(session);
    return usersRepository.listPermissions();
  }

  async listUsers(session: StudioSession) {
    this.requireManage(session);
    return usersRepository.listUsers();
  }

  async setRoles(profileId: string, input: SetRolesBody, session: StudioSession) {
    this.requireManage(session);
    const target = await this.requireProfile(profileId);
    const roles = await usersRepository.listRoles();
    const requested = this.validateCodes(input.roles, roles.map((role) => role.code), "role");

    const currentRoles = await authRepository.findRoleCodes(profileId);
    if (currentRoles.includes("admin") && !requested.includes("admin") && target.status === "active" && (await usersRepository.countActiveAdmins()) <= 1) {
      throw new AppError({ statusCode: 400, code: "LAST_ADMIN_REQUIRED", message: "At least one active admin must remain." });
    }
    if (session.profileId === profileId) {
      const directPermissions = await usersRepository.findDirectPermissionCodes(profileId);
      if (!this.hasManageAccess(roles, requested, directPermissions)) {
        throw new AppError({ statusCode: 400, code: "SELF_MANAGE_REQUIRED", message: "You cannot revoke your own access to manage users." });
      }
    }

    const roleIds = (await usersRepository.findRoleIds(requested)).map((role) => role.id);
    await usersRepository.replaceRoles(profileId, roleIds, session.profileId, requested);
  }

  async setPermissions(profileId: string, input: SetPermissionsBody, session: StudioSession) {
    this.requireManage(session);
    await this.requireProfile(profileId);
    const permissions = await usersRepository.listPermissions();
    const requested = this.validateCodes(input.permissions, permissions.map((permission) => permission.code), "permission");

    if (session.profileId === profileId) {
      const roles = await usersRepository.listRoles();
      const currentRoles = await authRepository.findRoleCodes(profileId);
      if (!this.hasManageAccess(roles, currentRoles, requested)) {
        throw new AppError({ statusCode: 400, code: "SELF_MANAGE_REQUIRED", message: "You cannot revoke your own access to manage users." });
      }
    }

    const permissionIds = (await usersRepository.findPermissionIds(requested)).map((permission) => permission.id);
    await usersRepository.replaceDirectPermissions(profileId, permissionIds, session.profileId, requested);
  }

  async setStatus(profileId: string, input: SetStatusBody, session: StudioSession) {
    this.requireManage(session);
    const target = await this.requireProfile(profileId);
    if (input.status === "inactive") {
      if (session.profileId === profileId) {
        throw new AppError({ statusCode: 400, code: "SELF_DEACTIVATE_DENIED", message: "You cannot deactivate your own account." });
      }
      const roles = await authRepository.findRoleCodes(profileId);
      if (roles.includes("admin") && target.status === "active" && (await usersRepository.countActiveAdmins()) <= 1) {
        throw new AppError({ statusCode: 400, code: "LAST_ADMIN_REQUIRED", message: "At least one active admin must remain." });
      }
    }
    await usersRepository.setStatus(profileId, input.status, session.profileId);
  }

  private requireManage(session: StudioSession) {
    if (!session.permissions.includes("users.manage")) {
      throw new AppError({ statusCode: 403, code: "PERMISSION_DENIED", message: "A users.manage permission is required to manage users." });
    }
  }

  private async requireProfile(profileId: string) {
    const profile = await usersRepository.findProfile(profileId);
    if (!profile) throw new AppError({ statusCode: 404, code: "USER_NOT_FOUND", message: "Studio user not found." });
    return profile;
  }

  private validateCodes(codes: string[], validCodes: string[], kind: string): string[] {
    const unique = Array.from(new Set(codes));
    const valid = new Set(validCodes);
    const unknown = unique.find((code) => !valid.has(code));
    if (unknown) throw new AppError({ statusCode: 400, code: "INVALID_ROLE_OR_PERMISSION", message: `Unknown ${kind}: ${unknown}` });
    return unique;
  }

  private hasManageAccess(roles: StudioRoleRecord[], roleCodes: string[], directPermissions: string[]): boolean {
    const effective = new Set<string>(directPermissions);
    for (const role of roles) {
      if (roleCodes.includes(role.code)) for (const permission of role.permissions) effective.add(permission);
    }
    return effective.has("users.manage");
  }
}

export const usersService = new UsersService();
