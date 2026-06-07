import { getRepo } from '@/lib/repo';
import { handle, ok, fail, clientIp } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';
import { submissionEditSchema } from '@/lib/validation/content';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const session = await requirePermission('submit');
    const body = await req.json().catch(() => null);
    const parsed = submissionEditSchema.safeParse(body);
    if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? 'validation_error');
    const repo = getRepo();
    const updated = await repo.updateSubmission(params.id, session.user.id, parsed.data);
    await recordAudit({ userId: session.user.id, action: 'update_submission', resourceType: 'content', resourceId: params.id, ipAddress: clientIp(req) });
    return ok(updated);
  });
}
