// ============================================================
// Anima Pulse — repo backend selector
// MockRepo by default; SupabaseRepo when SUPABASE_URL is set.
// ============================================================
import type { Repo } from './types';
import { MockRepo } from './mock';

let _repo: Repo | null = null;

export function getRepo(): Repo {
  if (_repo) return _repo;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Lazy require keeps supabase-js out of the bundle in local mode.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SupabaseRepo } = require('./supabase') as typeof import('./supabase');
    _repo = new SupabaseRepo();
  } else {
    _repo = new MockRepo();
  }
  return _repo;
}

export function isCloudMode(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Dev-login (the role picker) grants a session with no credential at all, so it
 * is confined to local MockRepo mode. Against a real database, access-code
 * login is the only way in — there is no env var to re-open this door.
 */
export function isDevLoginAllowed(): boolean {
  return !isCloudMode();
}

export * from './types';
