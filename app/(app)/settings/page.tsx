import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { can } from '@/lib/rbac';
import { getRepo } from '@/lib/repo';
import { SettingsClient } from '@/components/settings-client';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  if (!can(session.role, 'user-manage')) {
    return (
      <div className="screen">
        <header className="screen-head">
          <div>
            <h1 className="screen-title">Settings</h1>
            <p className="screen-sub">Halaman ini hanya untuk role Admin.</p>
          </div>
        </header>
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div className="empty-title">Akses terbatas</div>
          <div className="empty-sub">Anda tidak memiliki izin untuk melihat halaman ini. Hubungi Admin untuk mendapatkan akses.</div>
        </div>
      </div>
    );
  }

  const repo = getRepo();
  const [users, erTargets, auditLogs] = await Promise.all([
    repo.listUsers(),
    repo.getErTargets(),
    repo.listAudit(50),
  ]);

  return (
    <SettingsClient
      users={users}
      erTargets={erTargets}
      auditLogs={auditLogs}
    />
  );
}
