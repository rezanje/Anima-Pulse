import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getRepo } from '@/lib/repo';
import { avgOf, blendedErTarget } from '@/lib/er';
import { DashboardClient } from '@/components/dashboard-client';

export const metadata = { title: 'Dashboard Anggota Tim · Anima Pulse' };

export default async function TeamUserDashboardPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect('/login');

  // Guard: Staff/Konten Kreator cannot view other team member's dashboards
  if (session.role === 'staff' || session.role === 'creator') {
    redirect('/dashboard');
  }

  const repo = getRepo();
  const userId = params.id;

  const user = await repo.getUser(userId);
  if (!user) {
    notFound();
  }

  // Parallel data fetching for the team member
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
      user={user}
      role={user.role} // Pass the target user's role for UI context
      todayAttendance={todayAttendance}
      attPct={attPct}
      erHistory={erHistoryData}
      avgER={avgER}
      erTarget={erTarget}
      totalContent={submissions.length}
      bestContent={bestContent}
      isOwnDashboard={false} // Renders read-only dashboard
    />
  );
}
