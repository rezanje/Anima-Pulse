import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { isCloudMode, isDevLoginAllowed } from '@/lib/repo';
import { LoginForm } from '@/components/login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect('/dashboard');

  return (
    <Suspense fallback={null}>
      <LoginForm devLoginAllowed={isDevLoginAllowed()} />
    </Suspense>
  );
}

