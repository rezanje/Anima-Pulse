import { getRepo } from '@/lib/repo';
import { handle, ok, fail, clientIp } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';
import { kolSchema } from '@/lib/validation/kol';
import { stripRate } from '@/lib/kol-visibility';
import type { KolStatus, Platform } from '@/lib/repo/types';

export async function POST(req: Request) {
  return handle(async () => {
    const session = await requirePermission('kol-crud');
    const body = await req.json().catch(() => null);
    const parsed = kolSchema.safeParse(body);
    if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? 'validation_error');
    const kol = await getRepo().createKol({ ...parsed.data, createdBy: session.user.id });
    await recordAudit({ userId: session.user.id, action: 'create_kol', resourceType: 'kol', resourceId: kol.id, ipAddress: clientIp(req) });
    return ok(kol);
  });
}

export async function GET(req: Request) {
  return handle(async () => {
    const session = await requirePermission('kol-crud');
    const url = new URL(req.url);
    const rows = await getRepo().listKols({
      status: (url.searchParams.get('status') as KolStatus) ?? undefined,
      platform: (url.searchParams.get('platform') as Platform) ?? undefined,
      niche: url.searchParams.get('niche') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
    });
    return ok(rows.map((k) => stripRate(k, session.role)));
  });
}
