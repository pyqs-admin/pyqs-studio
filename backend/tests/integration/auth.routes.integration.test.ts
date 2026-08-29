import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

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

import { app } from '../../src/app.js';

describe('GET /api/v1/auth/me', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 401 without a Studio bearer token', async () => {
    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, code: 'UNAUTHORIZED' });
  });

  it('returns 403 when the authenticated user is not provisioned for Studio', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: '1b81a4c9-4c03-4d73-97e2-8f70cce02323' } }, error: null });
    mocks.findProfileById.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ success: false, code: 'STUDIO_ACCESS_NOT_PROVISIONED' });
  });

  it('returns the active Studio user with roles and permissions', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: '1b81a4c9-4c03-4d73-97e2-8f70cce02323' } }, error: null });
    mocks.findProfileById.mockResolvedValue({
      id: '1b81a4c9-4c03-4d73-97e2-8f70cce02323',
      email: 'reviewer@example.com',
      displayName: 'Dr Reviewer',
      status: 'active',
    });
    mocks.findRoleCodes.mockResolvedValue(['reviewer']);
    mocks.findPermissionCodes.mockResolvedValue(['question.review']);

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        profileId: '1b81a4c9-4c03-4d73-97e2-8f70cce02323',
        email: 'reviewer@example.com',
        displayName: 'Dr Reviewer',
        roles: ['reviewer'],
        permissions: ['question.review'],
      },
    });
  });
});
