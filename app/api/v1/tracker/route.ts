import { getRepo } from '@/lib/repo';
import { handle, ok, fail, clientIp } from '@/lib/http';
import { requirePermission, requireSession } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';
import { contentPlanSchema } from '@/lib/validation/tracker';

export async function GET(req: Request) {
  return handle(async () => {
    // Requires authenticated user to read tracker
    const session = await requirePermission('tracker-view');
    const repo = getRepo();
    const plans = await repo.listContentPlans();
    return ok(plans);
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const session = await requirePermission('submit');
    const body = await req.json().catch(() => null);
    const parsed = contentPlanSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, parsed.error.issues[0]?.message ?? 'validation_error');
    }
    const repo = getRepo();
    const plan = await repo.createContentPlan({
      ...parsed.data,
      createdBy: session.user.id,
    });
    await recordAudit({
      userId: session.user.id,
      action: 'create_content_plan',
      resourceType: 'content_plan',
      resourceId: plan.id,
      ipAddress: clientIp(req),
    });
    return ok(plan);
  });
}
