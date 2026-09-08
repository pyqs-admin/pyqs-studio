import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/server/db/client";
import {
  studioAuditLog,
  studioPermission,
  studioProfile,
  studioProfilePermission,
  studioProfileRole,
  studioRole,
  studioRolePermission,
} from "@/server/db/schema";

export interface StudioRoleRecord {
  id: string;
  code: string;
  name: string;
  permissions: string[];
}

export interface StudioUserRecord {
  id: string;
  email: string;
  displayName: string;
  status: string;
  roles: string[];
  directPermissions: string[];
}

export class UsersRepository {
  async listRoles(): Promise<StudioRoleRecord[]> {
    const [roles, links] = await Promise.all([
      db.select({ id: studioRole.id, code: studioRole.code, name: studioRole.name }).from(studioRole).orderBy(asc(studioRole.code)),
      db.select({ roleId: studioRolePermission.roleId, code: studioPermission.code }).from(studioRolePermission).innerJoin(studioPermission, eq(studioRolePermission.permissionId, studioPermission.id)),
    ]);
    const byRole = new Map<string, string[]>();
    for (const link of links) {
      const codes = byRole.get(link.roleId) ?? [];
      codes.push(link.code);
      byRole.set(link.roleId, codes);
    }
    return roles.map((role) => ({ ...role, permissions: (byRole.get(role.id) ?? []).sort() }));
  }

  listPermissions() {
    return db.select({ id: studioPermission.id, code: studioPermission.code, name: studioPermission.name }).from(studioPermission).orderBy(asc(studioPermission.code));
  }

  async listUsers(): Promise<StudioUserRecord[]> {
    const [profiles, roleLinks, permissionLinks] = await Promise.all([
      db.select({ id: studioProfile.id, email: studioProfile.email, displayName: studioProfile.displayName, status: studioProfile.status }).from(studioProfile).orderBy(asc(studioProfile.displayName)),
      db.select({ profileId: studioProfileRole.profileId, code: studioRole.code }).from(studioProfileRole).innerJoin(studioRole, eq(studioProfileRole.roleId, studioRole.id)),
      db.select({ profileId: studioProfilePermission.profileId, code: studioPermission.code }).from(studioProfilePermission).innerJoin(studioPermission, eq(studioProfilePermission.permissionId, studioPermission.id)),
    ]);
    const rolesByProfile = new Map<string, string[]>();
    for (const link of roleLinks) {
      const codes = rolesByProfile.get(link.profileId) ?? [];
      codes.push(link.code);
      rolesByProfile.set(link.profileId, codes);
    }
    const permissionsByProfile = new Map<string, string[]>();
    for (const link of permissionLinks) {
      const codes = permissionsByProfile.get(link.profileId) ?? [];
      codes.push(link.code);
      permissionsByProfile.set(link.profileId, codes);
    }
    return profiles.map((profile) => ({
      ...profile,
      roles: (rolesByProfile.get(profile.id) ?? []).sort(),
      directPermissions: (permissionsByProfile.get(profile.id) ?? []).sort(),
    }));
  }

  async findProfile(profileId: string) {
    const [row] = await db.select({ id: studioProfile.id, email: studioProfile.email, displayName: studioProfile.displayName, status: studioProfile.status }).from(studioProfile).where(eq(studioProfile.id, profileId)).limit(1);
    return row ?? null;
  }

  async findRoleIds(codes: string[]) {
    const rows = await db.select({ id: studioRole.id, code: studioRole.code }).from(studioRole).where(inArray(studioRole.code, codes));
    return rows;
  }

  async findPermissionIds(codes: string[]) {
    const rows = await db.select({ id: studioPermission.id, code: studioPermission.code }).from(studioPermission).where(inArray(studioPermission.code, codes));
    return rows;
  }

  async findDirectPermissionCodes(profileId: string) {
    const rows = await db.select({ code: studioPermission.code }).from(studioProfilePermission).innerJoin(studioPermission, eq(studioProfilePermission.permissionId, studioPermission.id)).where(eq(studioProfilePermission.profileId, profileId));
    return rows.map((row) => row.code);
  }

  async countActiveAdmins() {
    const rows = await db.select({ profileId: studioProfileRole.profileId }).from(studioProfileRole).innerJoin(studioRole, eq(studioProfileRole.roleId, studioRole.id)).innerJoin(studioProfile, eq(studioProfileRole.profileId, studioProfile.id)).where(and(eq(studioRole.code, "admin"), eq(studioProfile.status, "active")));
    return new Set(rows.map((row) => row.profileId)).size;
  }

  async replaceRoles(profileId: string, roleIds: string[], actorProfileId: string, roleCodes: string[]) {
    return db.transaction(async (tx) => {
      await tx.delete(studioProfileRole).where(eq(studioProfileRole.profileId, profileId));
      if (roleIds.length) await tx.insert(studioProfileRole).values(roleIds.map((roleId) => ({ profileId, roleId })));
      await tx.insert(studioAuditLog).values({ actorProfileId, action: "user_roles_set", metadata: { profileId, roles: roleCodes } });
    });
  }

  async replaceDirectPermissions(profileId: string, permissionIds: string[], actorProfileId: string, permissionCodes: string[]) {
    return db.transaction(async (tx) => {
      await tx.delete(studioProfilePermission).where(eq(studioProfilePermission.profileId, profileId));
      if (permissionIds.length) await tx.insert(studioProfilePermission).values(permissionIds.map((permissionId) => ({ profileId, permissionId })));
      await tx.insert(studioAuditLog).values({ actorProfileId, action: "user_permissions_set", metadata: { profileId, permissions: permissionCodes } });
    });
  }

  async setStatus(profileId: string, status: string, actorProfileId: string) {
    return db.transaction(async (tx) => {
      const [row] = await tx.update(studioProfile).set({ status }).where(eq(studioProfile.id, profileId)).returning();
      await tx.insert(studioAuditLog).values({ actorProfileId, action: "user_status_set", metadata: { profileId, status } });
      return row ?? null;
    });
  }
}

export const usersRepository = new UsersRepository();
