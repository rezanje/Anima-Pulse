import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { isCloudMode } from '@/lib/repo';
import { AppShell } from '@/components/shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  return (
    <AppShell user={session.user} role={session.role} cloudMode={isCloudMode()}>
      {children}
    </AppShell>
  );
}
