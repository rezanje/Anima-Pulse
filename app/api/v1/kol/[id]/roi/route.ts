import { getRepo } from '@/lib/repo';
import { handle, ok } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { calcCPV, calcCPE } from '@/lib/er';

export async function GET(req: Request) {
  return handle(async () => {
    await requirePermission('kol-roi-read');
    const url = new URL(req.url);
    const rate = Number(url.searchParams.get('rate') ?? 0);
    const estViews = Number(url.searchParams.get('est_views') ?? 0);
    const estEngagement = Number(url.searchParams.get('est_engagement') ?? 0);
    const benchmark = await getRepo().benchmarkCpvAvg();
    return ok({ cpv: calcCPV(rate, estViews), cpe: calcCPE(rate, estEngagement), benchmark_cpv_avg: benchmark });
  });
}
