import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST as codeLoginPost } from '@/app/api/v1/auth/code-login/route';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { getRepo } from '@/lib/repo';

// Mock getRepo to always use a fresh in-memory MockRepo for tests
vi.mock('@/lib/repo', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/repo')>();
  const { MockRepo } = await import('@/lib/repo/mock');
  const mockInstance = new MockRepo({ persist: false });
  return {
    ...mod,
    getRepo: () => mockInstance,
    isCloudMode: () => false, // enforce local mode for testing
  };
});

describe('Auth Code-Login API Route', () => {
  beforeEach(() => {
    // Reset the mock repository store for isolation
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
          email: 'inactive@anima.com',
          name: 'Inactive User',
          handle: 'inactive',
          role: 'staff',
          avatar: 'IU',
          joined: '2026-06',
          isActive: false,
          loginCode: 'INACTIVE123',
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

  it('succeeds with a valid active user code (e.g. SUPER123) and returns 200 OK JSON response with role and userId, sets ap_session cookie (8-hour Max-Age), and creates audit log entry', async () => {
    const req = new Request('http://localhost:3300/api/v1/auth/code-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'SUPER123' }),
    });

    const res = await codeLoginPost(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({
      data: { role: 'admin', userId: 'u01' },
      error: null,
    });

    // Check Set-Cookie header for session cookie
    const cookieHeader = res.headers.get('Set-Cookie');
    expect(cookieHeader).toContain(SESSION_COOKIE);
    expect(cookieHeader).toContain('Max-Age=28800'); // 8 hours in seconds is 28800

    // Check that audit trail records the event
    const auditLogs = await getRepo().listAudit();
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0]).toMatchObject({
      userId: 'u01',
      action: 'login_code',
      resourceType: 'user',
      resourceId: 'u01',
    });
  });

  it('fails with 400 validation_error if code is empty', async () => {
    const req = new Request('http://localhost:3300/api/v1/auth/code-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: '' }),
    });

    const res = await codeLoginPost(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json).toEqual({
      data: null,
      error: 'validation_error',
    });
  });

  it('fails with 400 validation_error if code is missing', async () => {
    const req = new Request('http://localhost:3300/api/v1/auth/code-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const res = await codeLoginPost(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json).toEqual({
      data: null,
      error: 'validation_error',
    });
  });

  it('fails with 401 invalid_code if code is incorrect', async () => {
    const req = new Request('http://localhost:3300/api/v1/auth/code-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'WRONGCODE' }),
    });

    const res = await codeLoginPost(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json).toEqual({
      data: null,
      error: 'invalid_code',
    });
  });

  it('fails with 403 user_inactive if code belongs to an inactive user', async () => {
    const req = new Request('http://localhost:3300/api/v1/auth/code-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: 'INACTIVE123' }),
    });

    const res = await codeLoginPost(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json).toEqual({
      data: null,
      error: 'user_inactive',
    });
  });
});
