// ============================================================
// POST /api/v1/attendance/clock-in
// ============================================================
import { getRepo } from '@/lib/repo';
import { handle, ok, clientIp } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';

export async function POST(req: Request) {
  return handle(async () => {
    const session = await requirePermission('clock');
    
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const repo = getRepo();
    const record = await repo.clockIn(session.user.id, clientIp(req) ?? undefined, body.lat, body.lng);
    await recordAudit({
      userId: session.user.id,
      action: 'clock_in',
      resourceType: 'attendance',
      resourceId: record.id,
      ipAddress: clientIp(req),
    });
    return ok(record);
  });
}
