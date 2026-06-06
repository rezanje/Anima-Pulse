import { describe, it, expect } from 'vitest';
import { submissionSchema } from '@/lib/validation/content';
import { vaultSchema } from '@/lib/validation/vault';
import { kolSchema } from '@/lib/validation/kol';

const base = { url: 'https://www.tiktok.com/@x/video/123', platform: 'tiktok' as const, title: 't', views: 1000, likes: 10, comments: 1, shares: 1, followers: 5000 };

describe('submission validation', () => {
  it('accepts valid tiktok + instagram urls', () => {
    expect(submissionSchema.safeParse(base).success).toBe(true);
    expect(submissionSchema.safeParse({ ...base, platform: 'instagram', url: 'https://instagram.com/p/Cabc' }).success).toBe(true);
  });
  it('rejects non-social url', () => {
    expect(submissionSchema.safeParse({ ...base, url: 'https://example.com/x' }).success).toBe(false);
  });
  it('rejects views=0 when likes>0 (PRD risk register)', () => {
    expect(submissionSchema.safeParse({ ...base, views: 0 }).success).toBe(false);
  });
  it('allows views=0 with all-zero metrics', () => {
    expect(submissionSchema.safeParse({ ...base, views: 0, likes: 0, comments: 0, shares: 0 }).success).toBe(true);
  });
});

describe('vault validation', () => {
  it('requires at least one tag', () => {
    expect(vaultSchema.safeParse({ url: 'https://tiktok.com/@x/video/1', title: 'a', platform: 'tiktok', tags: [] }).success).toBe(false);
    expect(vaultSchema.safeParse({ url: 'https://tiktok.com/@x/video/1', title: 'a', platform: 'tiktok', tags: ['Hook'] }).success).toBe(true);
  });
});

describe('kol validation', () => {
  it('accepts a valid kol', () => {
    expect(kolSchema.safeParse({ name: 'X', handle: '@x', platform: 'tiktok', niche: ['beauty'], followers: 1000, ratePerContent: 1_000_000, status: 'prospect', contact: { wa: '+62', email: 'x@y.id' } }).success).toBe(true);
  });
  it('rejects negative rate', () => {
    expect(kolSchema.safeParse({ name: 'X', handle: '@x', platform: 'tiktok', niche: [], followers: 1000, ratePerContent: -5, status: 'prospect', contact: { wa: '', email: '' } }).success).toBe(false);
  });
});
