// ============================================================
// PUT /api/v1/attendance/clock-out
// ============================================================
import { getRepo } from '@/lib/repo';
import { handle, ok, clientIp } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';

export async function PUT(req: Request) {
  return handle(async () => {
    const session = await requirePermission('clock');
    const repo = getRepo();
    const record = await repo.clockOut(session.user.id);
    await recordAudit({
      userId: session.user.id,
      action: 'clock_out',
      resourceType: 'attendance',
      resourceId: record.id,
      ipAddress: clientIp(req),
    });
    return ok(record);
  });
}
