import type { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  findProfileById: vi.fn(),
  findRoleCodes: vi.fn(),
  findPermissionCodes: vi.fn(),
}));

vi.mock('../../src/database/supabase.js', () => ({
  studioSupabase: {
    auth: {
      getUser: mocks.getUser,
    },
  },
}));

vi.mock('../../src/modules/auth/auth.repository.js', () => ({
  authRepository: {
    findProfileById: mocks.findProfileById,
    findRoleCodes: mocks.findRoleCodes,
    findPermissionCodes: mocks.findPermissionCodes,
  },
}));

import { authService } from '../../src/modules/auth/auth.service.js';

function requestWithToken(token?: string): Request {
  return {
    header: vi.fn((name: string) => (name === 'authorization' && token ? `Bearer ${token}` : undefined)),
  } as unknown as Request;
}

describe('AuthService.resolveCurrentSession', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns null when no bearer token is supplied', async () => {
    await expect(authService.resolveCurrentSession(requestWithToken())).resolves.toBeNull();
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it('returns null when Supabase rejects the token', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error('Invalid JWT') });

    await expect(authService.resolveCurrentSession(requestWithToken('invalid-token'))).resolves.toBeNull();
    expect(mocks.findProfileById).not.toHaveBeenCalled();
  });

  it('rejects a valid Supabase user who has not been provisioned for Studio', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: '1b81a4c9-4c03-4d73-97e2-8f70cce02323' } }, error: null });
    mocks.findProfileById.mockResolvedValue(null);

    await expect(authService.resolveCurrentSession(requestWithToken('valid-token'))).rejects.toMatchObject({
      statusCode: 403,
      code: 'STUDIO_ACCESS_NOT_PROVISIONED',
    });
  });

  it('returns roles and effective permissions for an active Studio profile', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: '1b81a4c9-4c03-4d73-97e2-8f70cce02323' } }, error: null });
    mocks.findProfileById.mockResolvedValue({
      id: '1b81a4c9-4c03-4d73-97e2-8f70cce02323',
      email: 'tutor@example.com',
      displayName: 'Dr Tutor',
      status: 'active',
    });
    mocks.findRoleCodes.mockResolvedValue(['tutor']);
    mocks.findPermissionCodes.mockResolvedValue(['project.create', 'question.create']);

    await expect(authService.resolveCurrentSession(requestWithToken('valid-token'))).resolves.toEqual({
      profileId: '1b81a4c9-4c03-4d73-97e2-8f70cce02323',
      email: 'tutor@example.com',
      displayName: 'Dr Tutor',
      roles: ['tutor'],
      permissions: ['project.create', 'question.create'],
    });
  });
});
