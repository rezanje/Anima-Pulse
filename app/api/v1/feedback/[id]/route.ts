import { getRepo } from '@/lib/repo';
import { handle, ok, fail, clientIp } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';
import { feedbackStatusSchema } from '@/lib/validation/feedback';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const session = await requirePermission('feedback-manage');
    const body = await req.json().catch(() => null);
    const parsed = feedbackStatusSchema.safeParse(body);
    if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? 'validation_error');

    const report = await getRepo().updateFeedbackStatus(params.id, parsed.data.status);

    await recordAudit({
      userId: session.user.id,
      action: 'update_feedback_status',
      resourceType: 'feedback',
      resourceId: report.id,
      ipAddress: clientIp(req),
    });

    return ok(report);
  });
}
