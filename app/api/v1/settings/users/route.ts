import { createClient } from '@supabase/supabase-js';
import { getRepo, isCloudMode } from '@/lib/repo';
import type { User, Role } from '@/lib/repo/types';
import { handle, ok, fail, clientIp } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { recordAudit } from '@/lib/audit';
import { patchSchema, inviteSchema } from '@/lib/validation/users';

const toUser = (r: any): User => ({
  id: r.id,
  email: r.email,
  name: r.full_name,
  handle: r.handle,
  role: r.role,
  avatar: r.avatar || '',
  joined: r.joined,
  isActive: r.is_active,
  workLat: r.work_lat,
  workLng: r.work_lng,
  workRadius: r.work_radius,
  loginCode: r.login_code || undefined,
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
    if (parsed.data.loginCode !== undefined) {
      const existingWithCode = await repo.getUserByLoginCode(parsed.data.loginCode);
      if (existingWithCode && existingWithCode.id !== parsed.data.id) {
        return fail(409, 'code_already_exists');
      }
      if (!isCloudMode()) {
        const mockRepo = repo as any;
        if (mockRepo.s && mockRepo.s.users) {
          const u = mockRepo.s.users.find((x: any) => x.id === parsed.data.id);
          if (u) {
            u.loginCode = parsed.data.loginCode;
            mockRepo.save();
          }
        }
      } else {
        const supabaseUrl = process.env.SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const db = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false },
        });
        const { error } = await db.from('users').update({ login_code: parsed.data.loginCode }).eq('id', parsed.data.id);
        if (error) {
          console.error('Failed to update login code in Supabase:', error);
          return fail(500, 'database_error');
        }
      }
      const updatedUser = await repo.getUser(parsed.data.id);
      if (updatedUser) user = updatedUser;
    }
    await recordAudit({ userId: session.user.id, action: 'update_user', resourceType: 'user', resourceId: parsed.data.id, ipAddress: clientIp(req) });
    return ok(user);
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const session = await requirePermission('user-manage');
    const body = await req.json().catch(() => null);
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      console.error('Validation error in POST /settings/users:', parsed.error);
      return fail(400, 'validation_error');
    }
    
    const email = parsed.data.email.toLowerCase();
    const name = parsed.data.name;
    const role = parsed.data.role;
    const loginCode = parsed.data.loginCode;
    
    const repo = getRepo();
    const existing = await repo.getUserByEmail(email);
    if (existing) return fail(409, 'user_already_exists');

    if (loginCode) {
      const existingWithCode = await repo.getUserByLoginCode(loginCode);
      if (existingWithCode) return fail(409, 'code_already_exists');
    }
    
    const joined = new Date().toISOString().slice(0, 10);
    // Since we don't have Supabase Auth ID yet, we generate a UUID for cloud mode and a normal ID for mock mode
    const newId = isCloudMode() ? crypto.randomUUID() : `u_${Math.random().toString(36).slice(2)}`;
    
    let newUser: User;
    
    if (!isCloudMode()) {
      const mockRepo = repo as any;
      newUser = {
        id: newId,
        email,
        name,
        handle: email.split('@')[0],
        role,
        avatar: '',
        joined,
        isActive: true,
        loginCode
      };
      if (mockRepo.s && mockRepo.s.users) {
        mockRepo.s.users.push(newUser);
        mockRepo.save();
      }
    } else {
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const db = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      });
      
      const { data, error } = await db.from('users').insert({
        id: newId,
        email,
        full_name: name,
        handle: email.split('@')[0],
        role,
        avatar: null,
        joined,
        is_active: true,
        login_code: loginCode
      }).select('*').single();
      
      if (error) {
        console.error('Failed to create user in Supabase:', error);
        return fail(500, 'database_error');
      }
      newUser = toUser(data);
    }
    
    await recordAudit({
      userId: session.user.id,
      action: 'invite_user',
      resourceType: 'user',
      resourceId: newUser.id,
      ipAddress: clientIp(req)
    });
    
    return ok(newUser);
  });
}
