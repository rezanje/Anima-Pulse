// ============================================================
// Anima Pulse — RBAC permission matrix (PRD §10.1)
// Single source of truth for both API guards and UI nav filtering.
// ============================================================
import type { Role } from '@/lib/repo/types';

export type Action =
  | 'clock'
  | 'submit'
  | 'scorecard'
  | 'vault-read'
  | 'vault-write'
  | 'team-view'
  | 'csv-export'
  | 'kol-crud'
  | 'kol-rate-view'
  | 'kol-roi-read'
  | 'kol-roi-write'
  | 'user-manage'
  | 'er-target-set'
  | 'audit-view'
  | 'tracker-view'
  | 'pillar-view'
  | 'pillar-manage'
  | 'feedback-submit'
  | 'feedback-manage';

const M: Record<Action, Role[]> = {
  clock: ['staff', 'manager', 'admin', 'creator'],
  submit: ['staff', 'manager', 'admin', 'creator'],
  scorecard: ['staff', 'manager', 'admin', 'creator'],
  'vault-read': ['staff', 'manager', 'admin', 'creator'],
  'vault-write': ['staff', 'manager', 'admin', 'creator'],
  'team-view': ['manager', 'admin'],
  'csv-export': ['manager', 'admin'],
  'kol-crud': ['manager', 'admin'],
  'kol-rate-view': ['manager', 'admin'],
  'kol-roi-read': ['manager', 'admin'],
  'kol-roi-write': ['admin'],
  'user-manage': ['admin'],
  'er-target-set': ['admin'],
  'audit-view': ['admin'],
  'tracker-view': ['staff', 'manager', 'admin'], // creator excluded — no planning/strategy access
  'pillar-view': ['staff', 'manager', 'admin', 'creator'],
  'pillar-manage': ['manager', 'admin'],
  'feedback-submit': ['staff', 'manager', 'admin', 'creator'], // everyone can reach the developer
  'feedback-manage': ['admin'], // only the developer triages
};

export function can(role: Role, action: Action): boolean {
  return M[action].includes(role);
}
