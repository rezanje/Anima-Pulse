import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getRepo, isCloudMode } from '@/lib/repo';
import { can } from '@/lib/rbac';
import { AppShell } from '@/components/shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  // Only the triager sees the badge, so nobody else pays for the count query.
  const newFeedback = can(session.role, 'feedback-manage') ? await getRepo().countNewFeedback() : 0;
  return (
    <AppShell user={session.user} role={session.role} cloudMode={isCloudMode()} newFeedback={newFeedback}>
      {children}
    </AppShell>
  );
}
