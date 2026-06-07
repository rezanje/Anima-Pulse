import { getRepo } from '@/lib/repo';
import { handle, ok } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';

export async function GET(req: Request) {
  return handle(async () => {
    await requirePermission('audit-view');
    const url = new URL(req.url);
    const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : 100;
    return ok(await getRepo().listAudit(limit));
  });
}
