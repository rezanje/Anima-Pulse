import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getRepo } from '@/lib/repo';
import { avgOf, blendedErTarget } from '@/lib/er';
import { DashboardClient } from '@/components/dashboard-client';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const repo = getRepo();
  const userId = session.user.id;

  // Parallel data fetching
  const [todayAttendance, attPct, erHistoryData, submissions, erTargets] = await Promise.all([
    repo.getTodayAttendance(userId),
    repo.attendancePct(userId),
    repo.erHistory(userId),
    repo.listSubmissions({ userId }),
    repo.getErTargets(),
  ]);

  const avgER = avgOf(submissions.map((s) => s.er));
  const erTarget = blendedErTarget(submissions.map((s) => s.platform), erTargets);
  const bestContent = submissions.length
    ? submissions.reduce((best, s) => (s.er > best.er ? s : best), submissions[0])
    : null;

  return (
    <DashboardClient
      user={session.user}
      role={session.role}
      todayAttendance={todayAttendance}
      attPct={attPct}
      erHistory={erHistoryData}
      avgER={avgER}
      erTarget={erTarget}
      totalContent={submissions.length}
      bestContent={bestContent}
    />
  );
}
