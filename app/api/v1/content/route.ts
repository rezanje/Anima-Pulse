import { getRepo } from '@/lib/repo';
import { handle, ok, fail, clientIp } from '@/lib/http';
import { requirePermission, requireSession } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';
import { submissionSchema } from '@/lib/validation/content';
import type { Platform } from '@/lib/repo/types';

export async function POST(req: Request) {
  return handle(async () => {
    const session = await requirePermission('submit');
    const body = await req.json().catch(() => null);
    const parsed = submissionSchema.safeParse(body);
    if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? 'validation_error');
    const repo = getRepo();
    const sub = await repo.createSubmission({ ...parsed.data, userId: session.user.id }, clientIp(req) ?? undefined);
    await recordAudit({ userId: session.user.id, action: 'create_submission', resourceType: 'content', resourceId: sub.id, ipAddress: clientIp(req) });
    return ok(sub);
  });
}

export async function GET(req: Request) {
  return handle(async () => {
    const session = await requireSession();
    const url = new URL(req.url);
    const repo = getRepo();
    // staff may only list their own submissions
    let userId = url.searchParams.get('user_id') ?? undefined;
    if (session.role === 'staff') userId = session.user.id;
    const sort = url.searchParams.get('sort');
    const rows = await repo.listSubmissions({
      userId,
      platform: (url.searchParams.get('platform') as Platform) ?? undefined,
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
      limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
      offset: url.searchParams.get('offset') ? Number(url.searchParams.get('offset')) : undefined,
      sort: sort === 'er_rate' || sort === 'submitted_at' ? sort : undefined,
    });
    return ok(rows);
  });
}
