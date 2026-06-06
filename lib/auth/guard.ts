// ============================================================
// Anima Pulse — route guards (server-side RBAC, PRD §10.2)
// ============================================================
import { getSession, type Session } from '@/lib/auth/session';
import { can, type Action } from '@/lib/rbac';
import { ApiError } from '@/lib/http';

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new ApiError(401, 'unauthorized');
  return s;
}

export async function requirePermission(action: Action): Promise<Session> {
  const s = await requireSession();
  if (!can(s.role, action)) throw new ApiError(403, 'forbidden');
  return s;
}
