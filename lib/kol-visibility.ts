import { can } from '@/lib/rbac';
import type { Kol, KolPublic, Role } from '@/lib/repo/types';

/** Strip rate_per_content unless the role may view ratecard (FR-KOL-07). */
export function stripRate(kol: Kol, role: Role): KolPublic {
  if (can(role, 'kol-rate-view')) return kol;
  const { ratePerContent, ...rest } = kol;
  return rest;
}
