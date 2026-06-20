import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getRepo } from '@/lib/repo';
import { TrackerClient } from '@/components/tracker-client';

export default async function TrackerPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const repo = getRepo();
  const plans = await repo.listContentPlans();

  return (
    <TrackerClient
      initialPlans={plans}
      user={session.user}
      role={session.role}
    />
  );
}
