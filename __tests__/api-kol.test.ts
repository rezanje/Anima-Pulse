import { describe, it, expect, beforeEach } from 'vitest';
import { MockRepo } from '@/lib/repo/mock';
import { can } from '@/lib/rbac';
import { calcCPV, calcCPE } from '@/lib/er';
import { stripRate } from '@/lib/kol-visibility';
import type { Kol } from '@/lib/repo/types';

let r: MockRepo;
beforeEach(() => { r = new MockRepo({ persist: false }); });

const sampleKol: Kol = {
  id: 'kx', name: 'X', handle: '@x', platform: 'tiktok', niche: [], followers: 1, avgViews: 100,
  avgER: 1, ratePerContent: 5_000_000, status: 'prospect', contact: { wa: '', email: '' }, notes: '', createdBy: 'u06', isDeleted: false,
};

describe('kol module', () => {
  it('duplicate handle per platform rejected; same handle other platform allowed', async () => {
    await expect(r.createKol({ name: 'x', handle: '@mirasastra', platform: 'tiktok', niche: [], followers: 1, ratePerContent: 1, status: 'prospect', contact: { wa: '', email: '' }, createdBy: 'u06' })).rejects.toThrow('duplicate_handle');
    const k = await r.createKol({ name: 'x', handle: '@mirasastra', platform: 'instagram', niche: [], followers: 1, ratePerContent: 1, status: 'prospect', contact: { wa: '', email: '' }, createdBy: 'u06' });
    expect(k.id).toBeTruthy();
  });
  it('soft delete hides from list and get', async () => {
    await r.softDeleteKol('k01');
    expect(await r.getKol('k01')).toBeNull();
    expect((await r.listKols({})).some((k) => k.id === 'k01')).toBe(false);
  });
  it('ROI math: CPV and CPE', () => {
    expect(calcCPV(1_000_000, 500_000)).toBe(2);
    expect(calcCPE(1_000_000, 50_000)).toBe(20);
  });
  it('RBAC: staff no kol-crud; roi write admin-only', () => {
    expect(can('staff', 'kol-crud')).toBe(false);
    expect(can('manager', 'kol-roi-write')).toBe(false);
    expect(can('admin', 'kol-roi-write')).toBe(true);
  });
  it('stripRate removes ratePerContent for staff but keeps it for manager/admin', () => {
    expect(stripRate(sampleKol, 'staff').ratePerContent).toBeUndefined();
    expect(stripRate(sampleKol, 'manager').ratePerContent).toBe(5_000_000);
    expect(stripRate(sampleKol, 'admin').ratePerContent).toBe(5_000_000);
  });
});
