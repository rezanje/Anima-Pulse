// ============================================================
// Anima Pulse — FYP Vault page (server component)
// Accessible to ALL roles (vault-read permission).
// ============================================================
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getRepo } from '@/lib/repo';
import { VaultGrid } from '@/components/vault-grid';

export default async function VaultPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const repo = getRepo();

  const [items, users] = await Promise.all([
    repo.listVault({}),
    repo.listUsers(),
  ]);

  return (
    <VaultGrid
      initialItems={items}
      users={users}
      currentUserId={session.user.id}
    />
  );
}
