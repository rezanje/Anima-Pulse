import { getRepo } from '@/lib/repo';
import { handle, ok, fail, clientIp } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';
import { growthSchema } from '@/lib/validation/kol';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const session = await requirePermission('kol-crud');
    const body = await req.json().catch(() => null);
    const parsed = growthSchema.safeParse(body);
    if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? 'validation_error');
    const entry = await getRepo().addGrowth(params.id, parsed.data.followers, parsed.data.date, session.user.id);
    await recordAudit({ userId: session.user.id, action: 'add_kol_growth', resourceType: 'kol', resourceId: params.id, ipAddress: clientIp(req) });
    return ok(entry);
  });
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    await requirePermission('kol-crud');
    return ok(await getRepo().listGrowth(params.id));
  });
}
