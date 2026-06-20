import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PUT as usersPut, POST as usersPost } from '@/app/api/v1/settings/users/route';
import { getRepo } from '@/lib/repo';

vi.mock('@/lib/repo', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/repo')>();
  const { MockRepo } = await import('@/lib/repo/mock');
  const mockInstance = new MockRepo({ persist: false });
  return {
    ...mod,
    getRepo: () => mockInstance,
    isCloudMode: () => false,
  };
});

vi.mock('@/lib/auth/guard', () => ({
  requirePermission: vi.fn().mockResolvedValue({ user: { id: 'u07', role: 'admin' } }),
}));

describe('Settings Users API Route', () => {
  beforeEach(() => {
    const repo = getRepo() as any;
    repo.s = {
      users: [
        {
          id: 'u01',
          email: 'admin@anima.com',
          name: 'Super Admin',
          handle: 'superadmin',
          role: 'admin',
          avatar: 'SA',
          joined: '2026-06',
          isActive: true,
          loginCode: 'SUPER123',
        },
        {
          id: 'u02',
          email: 'staff@anima.com',
          name: 'Staff User',
          handle: 'staff',
          role: 'staff',
          avatar: 'SU',
          joined: '2026-06',
          isActive: true,
          loginCode: 'STAFF123',
        },
      ],
      attendances: [],
      submissions: [],
      kols: [],
      growth: [],
      vault: [],
      contentPlans: [],
      audit: [],
      erTargets: { tiktok: 6.0, instagram: 3.5 },
    };
  });

  it('PUT successfully updates loginCode if it is unique', async () => {
    const req = new Request('http://localhost:3300/api/v1/settings/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'u02', loginCode: 'NEWPIN123' }),
    });

    const res = await usersPut(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.loginCode).toBe('NEWPIN123');

    // Confirm stored user has the code updated
    const user = await getRepo().getUser('u02');
    expect(user?.loginCode).toBe('NEWPIN123');
  });

  it('PUT returns 409 code_already_exists if updated loginCode is already in use by another user', async () => {
    const req = new Request('http://localhost:3300/api/v1/settings/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'u02', loginCode: 'SUPER123' }), // SUPER123 is already used by u01
    });

    const res = await usersPut(req);
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json).toEqual({
      data: null,
      error: 'code_already_exists',
    });
  });

  it('POST successfully creates a user with a unique loginCode', async () => {
    const req = new Request('http://localhost:3300/api/v1/settings/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newuser@anima.com',
        name: 'New User',
        role: 'staff',
        loginCode: 'UNIQUEPIN',
      }),
    });

    const res = await usersPost(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.email).toBe('newuser@anima.com');
    expect(json.data.loginCode).toBe('UNIQUEPIN');

    // Confirm it is persisted in the repository
    const stored = await getRepo().getUserByLoginCode('UNIQUEPIN');
    expect(stored?.email).toBe('newuser@anima.com');
  });

  it('POST returns 409 code_already_exists if new user has a duplicate loginCode', async () => {
    const req = new Request('http://localhost:3300/api/v1/settings/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'anotheruser@anima.com',
        name: 'Another User',
        role: 'staff',
        loginCode: 'SUPER123', // duplicate code
      }),
    });

    const res = await usersPost(req);
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json).toEqual({
      data: null,
      error: 'code_already_exists',
    });
  });
});
