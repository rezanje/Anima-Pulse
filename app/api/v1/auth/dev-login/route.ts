import { z } from 'zod';
import { ok, fail, handle } from '@/lib/http';
import { encodeSession, SESSION_COOKIE } from '@/lib/auth/session';
import { isDevLoginAllowed, getRepo } from '@/lib/repo';
import { DEFAULT_EMAIL_BY_ROLE } from '@/lib/repo/seed';

const bodySchema = z.object({ role: z.enum(['staff', 'manager', 'admin']) });

export async function POST(req: Request) {
  return handle(async () => {
    if (!isDevLoginAllowed()) return fail(403, 'dev_login_disabled');
    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) return fail(400, 'invalid_role');
    const role = parsed.data.role;
    // Resolve the real user id from the active repo (mock ids vs Supabase UUIDs).
    const user = await getRepo().getUserByEmail(DEFAULT_EMAIL_BY_ROLE[role]);
    if (!user) return fail(500, 'seed_user_missing');
    const userId = user.id;
    const token = encodeSession(userId, role);
    const res = ok({ role, userId });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8h (FR-AUTH-02)
    });
    return res;
  });
}
