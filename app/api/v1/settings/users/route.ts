import { z } from 'zod';
import { getRepo } from '@/lib/repo';
import { handle, ok, fail, clientIp } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';

const patchSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['staff', 'manager', 'admin']).optional(),
  isActive: z.boolean().optional(),
  workLat: z.number().nullable().optional(),
  workLng: z.number().nullable().optional(),
  workRadius: z.number().nullable().optional(),
});

export async function GET() {
  return handle(async () => {
    await requirePermission('user-manage');
    return ok(await getRepo().listUsers());
  });
}

export async function PUT(req: Request) {
  return handle(async () => {
    const session = await requirePermission('user-manage');
    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      console.error('Validation error in PUT /settings/users:', parsed.error);
      return fail(400, 'validation_error');
    }
    const repo = getRepo();
    let user = await repo.getUser(parsed.data.id);
    if (!user) return fail(404, 'not_found');
    if (parsed.data.role !== undefined) user = await repo.updateUserRole(parsed.data.id, parsed.data.role);
    if (parsed.data.isActive !== undefined) user = await repo.setUserActive(parsed.data.id, parsed.data.isActive);
    if (parsed.data.workLat !== undefined || parsed.data.workLng !== undefined || parsed.data.workRadius !== undefined) {
      user = await repo.updateUserLocation(
        parsed.data.id, 
        parsed.data.workLat !== undefined ? parsed.data.workLat : (user.workLat ?? null),
        parsed.data.workLng !== undefined ? parsed.data.workLng : (user.workLng ?? null),
        parsed.data.workRadius !== undefined ? parsed.data.workRadius : (user.workRadius ?? null)
      );
    }
    await recordAudit({ userId: session.user.id, action: 'update_user', resourceType: 'user', resourceId: parsed.data.id, ipAddress: clientIp(req) });
    return ok(user);
  });
}
