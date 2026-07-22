// ============================================================
// Anima Pulse — role display labels
// Stored role values (see repo/types.ts and the Postgres user_role enum):
// 'staff' | 'manager' | 'admin' | 'creator'. Only the label shown to users
// differs — 'admin' is presented as "Super Admin", the top tier of the org;
// 'creator' as "Konten Kreator", a narrower role scoped to content creation
// (no Content Plan Tracker access — see lib/rbac.ts).
// ============================================================
import type { Role } from '@/lib/repo/types';

export const ROLE_LABEL: Record<Role, string> = {
  staff: 'Staff',
  manager: 'Manager',
  admin: 'Super Admin',
  creator: 'Konten Kreator',
};

/** Roles offered in the invite / role-change dropdowns, top tier first. */
export const ASSIGNABLE_ROLES: Role[] = ['admin', 'manager', 'staff', 'creator'];
