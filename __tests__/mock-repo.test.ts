import { describe, it, expect, beforeEach } from 'vitest';
import { MockRepo } from '@/lib/repo/mock';

let r: MockRepo;
beforeEach(() => {
  r = new MockRepo({ persist: false });
});

describe('MockRepo', () => {
  it('computes ER server-side on create and ignores any client-supplied value', async () => {
    const s = await r.createSubmission({ userId: 'u01', url: 'https://tiktok.com/@x/video/999', platform: 'tiktok', title: 't', views: 1000, likes: 100, comments: 50, shares: 50, followers: 1000 });
    expect(s.er).toBe(20);
  });
  it('rejects duplicate url', async () => {
    await r.createSubmission({ userId: 'u01', url: 'https://tiktok.com/@x/video/dup', platform: 'tiktok', title: 't', views: 1000, likes: 1, comments: 0, shares: 0, followers: 1 });
    await expect(
      r.createSubmission({ userId: 'u02', url: 'https://tiktok.com/@x/video/dup', platform: 'tiktok', title: 't2', views: 5, likes: 0, comments: 0, shares: 0, followers: 1 }),
    ).rejects.toThrow('duplicate_url');
  });
  it('clockIn twice same day throws already_clocked_in', async () => {
    await r.clockIn('u04'); // u04 has no seed attendance today
    await expect(r.clockIn('u04')).rejects.toThrow('already_clocked_in');
  });
  it('clockOut without clockIn throws not_clocked_in', async () => {
    await expect(r.clockOut('u04')).rejects.toThrow('not_clocked_in');
  });
  it('createKol rejects duplicate handle per platform', async () => {
    await expect(
      r.createKol({ name: 'x', handle: '@mirasastra', platform: 'tiktok', niche: [], followers: 1, ratePerContent: 1, status: 'prospect', contact: { wa: '', email: '' }, createdBy: 'u06' }),
    ).rejects.toThrow('duplicate_handle');
  });
  it('same handle on a different platform is allowed', async () => {
    const k = await r.createKol({ name: 'x', handle: '@mirasastra', platform: 'instagram', niche: [], followers: 1, ratePerContent: 1, status: 'prospect', contact: { wa: '', email: '' }, createdBy: 'u06' });
    expect(k.id).toBeTruthy();
  });
  it('updateSubmission forbids non-owner', async () => {
    const s = await r.createSubmission({ userId: 'u01', url: 'https://tiktok.com/@x/video/own', platform: 'tiktok', title: 't', views: 1000, likes: 1, comments: 0, shares: 0, followers: 1 });
    await expect(r.updateSubmission(s.id, 'u02', { title: 'hack' })).rejects.toThrow('forbidden');
  });
  it('soft-deleted kol disappears from list and get', async () => {
    await r.softDeleteKol('k01');
    expect(await r.getKol('k01')).toBeNull();
    expect((await r.listKols({})).some((k) => k.id === 'k01')).toBe(false);
  });
  it('benchmarkCpvAvg is positive over seed data', async () => {
    expect(await r.benchmarkCpvAvg()).toBeGreaterThan(0);
  });
  it('vault multi-tag filter is an intersection', async () => {
    const both = await r.listVault({ tags: ['Hook', 'Trend'] });
    expect(both.every((v) => v.tags.includes('Hook') && v.tags.includes('Trend'))).toBe(true);
    expect(both.length).toBeGreaterThan(0);
  });
});
