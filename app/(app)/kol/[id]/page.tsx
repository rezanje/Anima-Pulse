import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getRepo } from '@/lib/repo';
import { KolDetailClient } from '@/components/kol-detail-client';

export const metadata = { title: 'Detail KOL · Anima Pulse' };

export default async function KolDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const repo = getRepo();
  const [kol, growthHistory, benchmarkCpvAvg] = await Promise.all([
    repo.getKol(params.id),
    repo.listGrowth(params.id),
    repo.benchmarkCpvAvg(),
  ]);

  if (!kol) {
    notFound();
  }

  return (
    <KolDetailClient
      initialKol={kol}
      growthHistory={growthHistory}
      benchmarkCpvAvg={benchmarkCpvAvg}
      role={session.role}
    />
  );
}
