import { z } from 'zod';
import { getRepo } from '@/lib/repo';
import { handle, ok, fail, clientIp } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';

const targetsSchema = z.object({
  tiktok: z.number().nonnegative(),
  instagram: z.number().nonnegative(),
});

export async function GET() {
  return handle(async () => {
    await requirePermission('er-target-set');
    return ok(await getRepo().getErTargets());
  });
}

export async function PUT(req: Request) {
  return handle(async () => {
    const session = await requirePermission('er-target-set');
    const body = await req.json().catch(() => null);
    const parsed = targetsSchema.safeParse(body);
    if (!parsed.success) return fail(400, 'validation_error');
    const t = await getRepo().setErTargets(parsed.data);
    await recordAudit({ userId: session.user.id, action: 'set_er_targets', resourceType: 'er_targets', resourceId: 'global', ipAddress: clientIp(req) });
    return ok(t);
  });
}
