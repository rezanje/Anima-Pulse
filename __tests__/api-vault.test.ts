import { describe, it, expect, beforeEach } from 'vitest';
import { MockRepo } from '@/lib/repo/mock';
import { can } from '@/lib/rbac';
import { fetchOgImage } from '@/lib/og';

let r: MockRepo;
beforeEach(() => { r = new MockRepo({ persist: false }); });

describe('vault module', () => {
  it('multi-tag filter is an intersection', async () => {
    const both = await r.listVault({ tags: ['Hook', 'Trend'] });
    expect(both.length).toBeGreaterThan(0);
    expect(both.every((v) => v.tags.includes('Hook') && v.tags.includes('Trend'))).toBe(true);
  });
  it('create then retrieve', async () => {
    const item = await r.createVaultItem({ url: 'https://tiktok.com/@x/video/new', title: 'baru', platform: 'tiktok', tags: ['Hook'], savedBy: 'u01' });
    expect((await r.listVault({})).some((v) => v.id === item.id)).toBe(true);
  });
  it('RBAC: all roles can read + write vault', () => {
    for (const role of ['staff', 'manager', 'admin'] as const) {
      expect(can(role, 'vault-read')).toBe(true);
      expect(can(role, 'vault-write')).toBe(true);
    }
  });
  it('fetchOgImage never throws and returns null on bad input', async () => {
    await expect(fetchOgImage('not-a-real-url-xyz://bad')).resolves.toBeNull();
  });
});
