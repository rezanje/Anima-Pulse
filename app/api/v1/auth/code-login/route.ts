import { z } from 'zod';
import { ok, fail, handle, clientIp } from '@/lib/http';
import { encodeSession, SESSION_COOKIE } from '@/lib/auth/session';
import { getRepo } from '@/lib/repo';
import { recordAudit } from '@/lib/audit';

const bodySchema = z.object({
  code: z.string().min(1, 'Kode PIN wajib diisi'),
});

export async function POST(req: Request) {
  return handle(async () => {
    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return fail(400, 'validation_error');
    }
    
    const code = parsed.data.code.trim();
    const repo = getRepo();
    const user = await repo.getUserByLoginCode(code);
    
    if (!user) {
      return fail(401, 'invalid_code');
    }
    
    if (!user.isActive) {
      return fail(403, 'user_inactive');
    }

    const token = encodeSession(user.id, user.role);
    const res = ok({ role: user.role, userId: user.id });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8h
    });

    await recordAudit({
      userId: user.id,
      action: 'login_code',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: clientIp(req) ?? null,
    });

    return res;
  });
}
