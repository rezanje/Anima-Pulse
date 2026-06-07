import { getRepo } from '@/lib/repo';
import { handle, ok, fail, clientIp } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';
import { vaultSchema } from '@/lib/validation/vault';
import { fetchOgImage } from '@/lib/og';
import type { Platform } from '@/lib/repo/types';

export async function POST(req: Request) {
  return handle(async () => {
    const session = await requirePermission('vault-write');
    const body = await req.json().catch(() => null);
    const parsed = vaultSchema.safeParse(body);
    if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? 'validation_error');
    const thumbnailUrl = parsed.data.thumbnailUrl ?? (await fetchOgImage(parsed.data.url));
    const item = await getRepo().createVaultItem({ ...parsed.data, thumbnailUrl, savedBy: session.user.id });
    await recordAudit({ userId: session.user.id, action: 'save_vault', resourceType: 'vault', resourceId: item.id, ipAddress: clientIp(req) });
    return ok(item);
  });
}

export async function GET(req: Request) {
  return handle(async () => {
    await requirePermission('vault-read');
    const url = new URL(req.url);
    const tagsParam = url.searchParams.get('tags');
    const rows = await getRepo().listVault({
      tags: tagsParam ? tagsParam.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      platform: (url.searchParams.get('platform') as Platform) ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      savedBy: url.searchParams.get('saved_by') ?? undefined,
    });
    return ok(rows);
  });
}
