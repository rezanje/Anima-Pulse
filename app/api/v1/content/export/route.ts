import { getRepo } from '@/lib/repo';
import { fail, ApiError } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { toCsv } from '@/lib/csv';

export async function GET(req: Request) {
  try {
    await requirePermission('csv-export');
    const url = new URL(req.url);
    const rows = await getRepo().teamSummary(url.searchParams.get('from') ?? undefined, url.searchParams.get('to') ?? undefined);
    const csv = toCsv(rows);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="anima-pulse-team.csv"',
      },
    });
  } catch (e) {
    if (e instanceof ApiError) return fail(e.status, e.code);
    return fail(500, 'internal_error');
  }
}
