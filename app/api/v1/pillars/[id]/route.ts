import { getRepo } from '@/lib/repo';
import { handle, ok, fail, clientIp } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';
import { pillarEditSchema } from '@/lib/validation/pillar';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const session = await requirePermission('pillar-manage');
    const body = await req.json().catch(() => null);
    const parsed = pillarEditSchema.safeParse(body);
    if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? 'validation_error');

    const repo = getRepo();
    const pillar = await repo.updatePillar(params.id, parsed.data);

    await recordAudit({
      userId: session.user.id,
      action: 'update_pillar',
      resourceType: 'content_pillar',
      resourceId: pillar.id,
      ipAddress: clientIp(req),
    });

    return ok(pillar);
  });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const session = await requirePermission('pillar-manage');
    const repo = getRepo();
    await repo.deletePillar(params.id);

    await recordAudit({
      userId: session.user.id,
      action: 'delete_pillar',
      resourceType: 'content_pillar',
      resourceId: params.id,
      ipAddress: clientIp(req),
    });

    return ok({ success: true });
  });
}
