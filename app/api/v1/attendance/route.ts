// ============================================================
// GET /api/v1/attendance?user_id=<id>&month=<1-12>&year=<yyyy>
// Staff may only query their own attendance.
// Manager/Admin may query any.
// ============================================================
import { getRepo } from '@/lib/repo';
import { handle, ok, fail } from '@/lib/http';
import { requireSession } from '@/lib/auth/guard';

export async function GET(req: Request) {
  return handle(async () => {
    const session = await requireSession();
    const url = new URL(req.url);

    const requestedUserId = url.searchParams.get('user_id') ?? session.user.id;
    const month = parseInt(url.searchParams.get('month') ?? String(new Date().getMonth() + 1), 10);
    const year = parseInt(url.searchParams.get('year') ?? String(new Date().getFullYear()), 10);

    // Staff/Konten Kreator may only query their own attendance
    if ((session.role === 'staff' || session.role === 'creator') && requestedUserId !== session.user.id) {
      return fail(403, 'forbidden');
    }

    const repo = getRepo();
    const records = await repo.listAttendance(requestedUserId, month, year);
    return ok(records);
  });
}
