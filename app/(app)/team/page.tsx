// ============================================================
// Anima Pulse — Team Performance page (server component)
// Requires 'team-view' permission; loads initial team summary.
// ============================================================
import { getSession } from '@/lib/auth/session';
import { getRepo } from '@/lib/repo';
import { can } from '@/lib/rbac';
import { TeamTable } from '@/components/team-table';
import type { TeamSummaryRow } from '@/lib/repo/types';

export const metadata = { title: 'Performa Tim · Anima Pulse' };

export default async function TeamPage() {
  const session = await getSession();
  if (!session) {
    return (
      <div className="page">
        <p className="page-sub">Anda perlu login untuk mengakses halaman ini.</p>
      </div>
    );
  }

  if (!can(session.role, 'team-view')) {
    return (
      <div className="page">
        <h1 className="page-title">Akses Terbatas</h1>
        <p className="page-sub">Halaman ini hanya tersedia untuk Manager dan Super Admin.</p>
      </div>
    );
  }

  const rows: TeamSummaryRow[] = await getRepo().teamSummary();

  return <TeamTable initialRows={rows} role={session.role} />;
}
