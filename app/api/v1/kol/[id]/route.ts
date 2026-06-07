import { getRepo } from '@/lib/repo';
import { handle, ok, fail, clientIp } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';
import { kolEditSchema } from '@/lib/validation/kol';
import { stripRate } from '@/lib/kol-visibility';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const session = await requirePermission('kol-crud');
    const kol = await getRepo().getKol(params.id);
    if (!kol) return fail(404, 'not_found');
    return ok(stripRate(kol, session.role));
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const session = await requirePermission('kol-crud');
    const body = await req.json().catch(() => null);
    const parsed = kolEditSchema.safeParse(body);
    if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? 'validation_error');
    const kol = await getRepo().updateKol(params.id, parsed.data);
    await recordAudit({ userId: session.user.id, action: 'update_kol', resourceType: 'kol', resourceId: params.id, ipAddress: clientIp(req) });
    return ok(stripRate(kol, session.role));
  });
}
