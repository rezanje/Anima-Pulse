// ============================================================
// Anima Pulse — HTTP helpers + error mapping
// Standard response shape: { data, error } (PRD §08)
// ============================================================
import { NextResponse } from 'next/server';

export function ok(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data, error: null }, init);
}

export function fail(status: number, code: string): NextResponse {
  return NextResponse.json({ data: null, error: code }, { status });
}

export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

const REPO_ERROR_STATUS: Record<string, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  duplicate_url: 409,
  duplicate_handle: 409,
  already_clocked_in: 409,
  not_clocked_in: 400,
  already_clocked_out: 400,
  edit_window_closed: 403,
};

/** Wrap a route body; turns thrown ApiError / repo error strings into responses. */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError) return fail(e.status, e.code);
    const code = e instanceof Error ? e.message : 'internal_error';
    return fail(REPO_ERROR_STATUS[code] ?? 500, code);
  }
}

/** Extract client IP for audit trail. */
export function clientIp(req: Request): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip');
}
