'use client';
// ============================================================
// Anima Pulse — browser fetch helper for /api/v1
// Returns `data` on success; throws Error(code) on { error } responses.
// ============================================================

const BASE = '/api/v1';

export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  let body: { data: T; error: string | null } | null = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON (e.g. CSV) handled by caller via fetch directly */
  }
  if (!res.ok || (body && body.error)) {
    throw new Error((body && body.error) || `http_${res.status}`);
  }
  return (body as { data: T }).data;
}

export const apiGet = <T = unknown>(path: string) => api<T>(path);
export const apiPost = <T = unknown>(path: string, payload?: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(payload ?? {}) });
export const apiPut = <T = unknown>(path: string, payload?: unknown) =>
  api<T>(path, { method: 'PUT', body: JSON.stringify(payload ?? {}) });
