// ============================================================
// Anima Pulse — session (dev-login HMAC cookie + cloud hook)
// Dev mode: signed { userId, role } cookie (role picker login).
// Cloud mode: same cookie set after Supabase Google SSO resolves the user.
// ============================================================
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { getRepo } from '@/lib/repo';
import type { Role, User } from '@/lib/repo/types';

export const SESSION_COOKIE = 'ap_session';
const SECRET = process.env.DEV_SESSION_SECRET || 'dev-only-change-me';

export interface Session {
  user: User;
  role: Role;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function encodeSession(userId: string, role: Role): string {
  const payload = Buffer.from(JSON.stringify({ userId, role })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string): { userId: string; role: Role } | null {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  if (sign(payload) !== sig) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const decoded = decodeSession(token);
  if (!decoded) return null;
  const user = await getRepo().getUser(decoded.userId);
  if (!user || !user.isActive) return null;
  return { user, role: user.role };
}
