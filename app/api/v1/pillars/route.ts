import { getRepo } from '@/lib/repo';
import { handle, ok, fail, clientIp } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';
import { pillarSchema } from '@/lib/validation/pillar';

export async function GET(req: Request) {
  return handle(async () => {
    await requirePermission('pillar-view');
    const repo = getRepo();
    const pillars = await repo.listPillars();
    return ok(pillars);
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const session = await requirePermission('pillar-manage');
    const body = await req.json().catch(() => null);
    const parsed = pillarSchema.safeParse(body);
    if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? 'validation_error');
    const repo = getRepo();
    const pillar = await repo.createPillar({ ...parsed.data, createdBy: session.user.id });
    await recordAudit({
      userId: session.user.id,
      action: 'create_pillar',
      resourceType: 'content_pillar',
      resourceId: pillar.id,
      ipAddress: clientIp(req),
    });
    return ok(pillar);
  });
}
