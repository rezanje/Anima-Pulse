// ============================================================
// Anima Pulse — role display labels
// The stored role values stay 'staff' | 'manager' | 'admin' (see repo/types.ts
// and the Postgres user_role enum). Only the label shown to users differs:
// 'admin' is presented as "Super Admin", the top tier of the org.
// ============================================================
import type { Role } from '@/lib/repo/types';

export const ROLE_LABEL: Record<Role, string> = {
  staff: 'Staff',
  manager: 'Manager',
  admin: 'Super Admin',
};

/** Roles offered in the invite / role-change dropdowns, top tier first. */
export const ASSIGNABLE_ROLES: Role[] = ['admin', 'manager', 'staff'];
