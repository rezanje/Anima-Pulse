// ============================================================
// Anima Pulse — KOL Hub list page (server component)
// ============================================================
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { can } from '@/lib/rbac';
import { getRepo } from '@/lib/repo';
import { KolList } from '@/components/kol-list';

export default async function KolPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  if (!can(session.role, 'kol-crud')) {
    return (
      <div className="screen">
        <div className="empty-state">
          <div className="empty-title">Akses Ditolak</div>
          <div className="empty-sub">Anda tidak memiliki izin untuk mengakses halaman ini.</div>
        </div>
      </div>
    );
  }

  const repo = getRepo();
  const [kols, benchmarkCpvAvg] = await Promise.all([
    repo.listKols({}),
    repo.benchmarkCpvAvg(),
  ]);

  return (
    <KolList
      kols={kols}
      role={session.role}
      benchmarkCpvAvg={benchmarkCpvAvg}
    />
  );
}
