// ============================================================
// Anima Pulse — middleware route gate
// Soft session presence check (full HMAC verify happens server-side in
// getSession). Redirects unauthenticated users to /login and authenticated
// users away from /login.
// ============================================================
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'ap_session';

const PUBLIC_PATHS = ['/login'];

function hasSessionShape(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = hasSessionShape(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (!authed && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if (authed && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // protect everything except api, static, and assets
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
