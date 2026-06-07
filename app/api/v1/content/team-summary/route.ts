import { getRepo } from '@/lib/repo';
import { handle, ok } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';

export async function GET(req: Request) {
  return handle(async () => {
    await requirePermission('team-view');
    const url = new URL(req.url);
    const rows = await getRepo().teamSummary(url.searchParams.get('from') ?? undefined, url.searchParams.get('to') ?? undefined);
    return ok(rows);
  });
}
