import { getRepo } from '@/lib/repo';
import { handle, ok, fail, clientIp } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';
import { can } from '@/lib/rbac';
import { feedbackSchema } from '@/lib/validation/feedback';

export async function POST(req: Request) {
  return handle(async () => {
    const session = await requirePermission('feedback-submit');
    const body = await req.json().catch(() => null);
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? 'validation_error');

    const report = await getRepo().createFeedback({ ...parsed.data, userId: session.user.id });

    await recordAudit({
      userId: session.user.id,
      action: 'create_feedback',
      resourceType: 'feedback',
      resourceId: report.id,
      ipAddress: clientIp(req),
    });

    return ok(report);
  });
}

export async function GET(req: Request) {
  return handle(async () => {
    const session = await requirePermission('feedback-submit');
    const scope = new URL(req.url).searchParams.get('scope');
    // 'all' is the admin triage view; everyone else only ever sees their own.
    const wantsAll = scope === 'all' && can(session.role, 'feedback-manage');
    const rows = await getRepo().listFeedback(wantsAll ? {} : { userId: session.user.id });
    return ok(rows);
  });
}
