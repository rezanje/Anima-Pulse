import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isCloudMode, getRepo } from '@/lib/repo';
import { encodeSession, SESSION_COOKIE } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit';
import { clientIp } from '@/lib/http';

export const dynamic = 'force-dynamic';

const toUser = (r: any) => ({
  id: r.id,
  email: r.email,
  name: r.full_name,
  handle: r.handle,
  role: r.role,
  avatar: r.avatar,
  joined: r.joined,
  isActive: r.is_active,
  workLat: r.work_lat,
  workLng: r.work_lng,
  workRadius: r.work_radius,
});

const SUPER_ADMIN_EMAIL = 'rezarezanje@gmail.com';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('error', 'missing_code');
    return NextResponse.redirect(loginUrl.toString());
  }

  let email = '';
  let fullName = '';
  let avatarUrl = '';
  let supabaseUserId = '';

  if (!isCloudMode()) {
    // Local / Dev mode simulation
    if (code === 'mock_google_oauth_code') {
      // For local testing, we can simulate either the super admin or another user
      email = SUPER_ADMIN_EMAIL;
      fullName = 'Reza Rejanje';
      avatarUrl = '';
      supabaseUserId = 'u06'; // match seeded user or new UUID
    } else {
      const loginUrl = new URL('/login', url.origin);
      loginUrl.searchParams.set('error', 'invalid_mock_code');
      return NextResponse.redirect(loginUrl.toString());
    }
  } else {
    // Cloud mode: Supabase OAuth code exchange
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data?.session?.user) {
      console.error('Supabase OAuth exchange failed:', error);
      const loginUrl = new URL('/login', url.origin);
      loginUrl.searchParams.set('error', 'oauth_exchange_failed');
      return NextResponse.redirect(loginUrl.toString());
    }

    const user = data.session.user;
    email = user.email || '';
    fullName = user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0];
    avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
    supabaseUserId = user.id;
  }

  const repo = getRepo();
  let dbUser = await repo.getUserByEmail(email);

  // Whitelist checking (FR-AUTH-01/03 Custom Integration)
  if (!dbUser) {
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      // Auto-provision Super Admin on first login
      if (!isCloudMode()) {
        const mockRepo = repo as any;
        dbUser = {
          id: supabaseUserId,
          email: email.toLowerCase(),
          name: fullName,
          handle: email.split('@')[0],
          role: 'admin',
          avatar: avatarUrl,
          joined: new Date().toISOString().slice(0, 10),
          isActive: true,
        };
        if (mockRepo.s && mockRepo.s.users) {
          mockRepo.s.users.push(dbUser);
          mockRepo.save();
        }
      } else {
        const supabaseUrl = process.env.SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const db = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false },
        });

        const { data: newAdmin, error: insertError } = await db
          .from('users')
          .insert({
            id: supabaseUserId,
            email: email.toLowerCase(),
            full_name: fullName,
            handle: email.split('@')[0],
            role: 'admin', // Super Admin gets admin role
            avatar: avatarUrl || null,
            joined: new Date().toISOString().slice(0, 10),
            is_active: true,
          })
          .select('*')
          .single();

        if (insertError) {
          console.error('Failed to register super admin:', insertError);
          const loginUrl = new URL('/login', url.origin);
          loginUrl.searchParams.set('error', 'registration_failed');
          return NextResponse.redirect(loginUrl.toString());
        }

        dbUser = toUser(newAdmin);
      }
    } else {
      // User is not whitelisted/invited
      const loginUrl = new URL('/login', url.origin);
      loginUrl.searchParams.set('error', 'not_invited');
      return NextResponse.redirect(loginUrl.toString());
    }
  }

  // Block inactive users
  if (!dbUser.isActive) {
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('error', 'user_inactive');
    return NextResponse.redirect(loginUrl.toString());
  }

  // Create HMAC session token and set cookie (FR-AUTH-02)
  const token = encodeSession(dbUser.id, dbUser.role);
  const response = NextResponse.redirect(new URL('/dashboard', url.origin));
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8h
  });

  // Record audit log for login event (FR-AUTH-04)
  await recordAudit({
    userId: dbUser.id,
    action: 'login_sso',
    resourceType: 'user',
    resourceId: dbUser.id,
    ipAddress: clientIp(req) ?? null,
  });

  return response;
}
