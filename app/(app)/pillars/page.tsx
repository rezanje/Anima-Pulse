import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getRepo } from '@/lib/repo';
import { can } from '@/lib/rbac';
import { PillarsClient } from '@/components/pillars-client';

export default async function PillarsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!can(session.role, 'pillar-view')) redirect('/dashboard');

  const repo = getRepo();
  const pillars = await repo.listPillars();

  return (
    <PillarsClient
      initialPillars={pillars}
      canManage={can(session.role, 'pillar-manage')}
    />
  );
}
