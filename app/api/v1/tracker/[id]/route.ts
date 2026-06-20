import { getRepo } from '@/lib/repo';
import { handle, ok, fail, clientIp } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';
import { contentPlanEditSchema } from '@/lib/validation/tracker';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const session = await requirePermission('submit');
    const body = await req.json().catch(() => null);
    const parsed = contentPlanEditSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, parsed.error.issues[0]?.message ?? 'validation_error');
    }

    const patch = parsed.data;
    const hasManagerFields =
      patch.approval !== undefined ||
      patch.feedback !== undefined ||
      patch.revision !== undefined;

    const isManagerOrAdmin = session.role === 'manager' || session.role === 'admin';

    if (hasManagerFields && !isManagerOrAdmin) {
      return fail(403, 'forbidden');
    }

    const repo = getRepo();
    const plan = await repo.updateContentPlan(params.id, patch);

    await recordAudit({
      userId: session.user.id,
      action: 'update_content_plan',
      resourceType: 'content_plan',
      resourceId: plan.id,
      ipAddress: clientIp(req),
    });

    return ok(plan);
  });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const session = await requirePermission('submit');
    const repo = getRepo();
    await repo.deleteContentPlan(params.id);

    await recordAudit({
      userId: session.user.id,
      action: 'delete_content_plan',
      resourceType: 'content_plan',
      resourceId: params.id,
      ipAddress: clientIp(req),
    });

    return ok({ success: true });
  });
}
