import { eq } from 'drizzle-orm';

import { db } from '../../database/client.js';
import {
  studioPermission,
  studioProfile,
  studioProfilePermission,
  studioProfileRole,
  studioRole,
  studioRolePermission,
} from '../../database/schema.js';
import type { StudioProfileRecord } from './auth.types.js';

export class AuthRepository {
  async findProfileById(profileId: string): Promise<StudioProfileRecord | null> {
    const [profile] = await db
      .select({
        id: studioProfile.id,
        email: studioProfile.email,
        displayName: studioProfile.displayName,
        status: studioProfile.status,
      })
      .from(studioProfile)
      .where(eq(studioProfile.id, profileId))
      .limit(1);

    return profile ?? null;
  }

  async findRoleCodes(profileId: string): Promise<string[]> {
    const rows = await db
      .select({ code: studioRole.code })
      .from(studioProfileRole)
      .innerJoin(studioRole, eq(studioProfileRole.roleId, studioRole.id))
      .where(eq(studioProfileRole.profileId, profileId));

    return rows.map((row) => row.code).sort();
  }

  async findPermissionCodes(profileId: string): Promise<string[]> {
    const [roleRows, directRows] = await Promise.all([
      db
        .select({ code: studioPermission.code })
        .from(studioProfileRole)
        .innerJoin(studioRolePermission, eq(studioProfileRole.roleId, studioRolePermission.roleId))
        .innerJoin(studioPermission, eq(studioRolePermission.permissionId, studioPermission.id))
        .where(eq(studioProfileRole.profileId, profileId)),
      db
        .select({ code: studioPermission.code })
        .from(studioProfilePermission)
        .innerJoin(studioPermission, eq(studioProfilePermission.permissionId, studioPermission.id))
        .where(eq(studioProfilePermission.profileId, profileId)),
    ]);

    return Array.from(new Set([...roleRows, ...directRows].map((row) => row.code))).sort();
  }
}

export const authRepository = new AuthRepository();
