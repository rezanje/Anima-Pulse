import { getSession } from '@/lib/auth/session';
import { fmtDateWIB } from '@/lib/format';

// Foundation stub — replaced by the Dashboard module (plan Task 10).
export default async function DashboardPage() {
  const session = await getSession();
  return (
    <div className="page">
      <div className="page-eyebrow">{fmtDateWIB()} · WIB</div>
      <h1 className="page-title">Halo, {session?.user.name.split(' ')[0]}.</h1>
      <p className="page-sub">Foundation siap. Modul dashboard akan dipasang.</p>
    </div>
  );
}
