import { z } from 'zod';
import { ok, fail, handle, clientIp } from '@/lib/http';
import { encodeSession, SESSION_COOKIE } from '@/lib/auth/session';
import { getRepo } from '@/lib/repo';
import { recordAudit } from '@/lib/audit';

const bodySchema = z.object({
  code: z.string().min(1, 'Kode PIN wajib diisi'),
});

// In-memory rate limiter to protect against code brute-forcing
const loginAttempts = new Map<string, { count: number; lockUntil: number }>();

export async function POST(req: Request) {
  return handle(async () => {
    const ip = clientIp(req) || '127.0.0.1';
    const now = Date.now();
    const attempts = loginAttempts.get(ip);

    if (attempts && attempts.lockUntil > now) {
      return fail(429, 'too_many_attempts');
    }

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return fail(400, 'validation_error');
    }
    
    const code = parsed.data.code.trim();
    const repo = getRepo();
    const user = await repo.getUserByLoginCode(code);
    
    if (!user) {
      const record = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
      record.count += 1;
      if (record.count >= 5) {
        record.lockUntil = now + 60 * 1000; // 1 minute lockout
      }
      loginAttempts.set(ip, record);
      return fail(401, 'invalid_code');
    }
    
    if (!user.isActive) {
      return fail(403, 'user_inactive');
    }

    // Clear attempts on success
    loginAttempts.delete(ip);

    const token = encodeSession(user.id, user.role);
    const res = ok({ role: user.role, userId: user.id });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8, // 8h
    });

    await recordAudit({
      userId: user.id,
      action: 'login_code',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: ip,
    });

    return res;
  });
}
