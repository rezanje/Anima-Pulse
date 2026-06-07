import { describe, it, expect, beforeEach } from 'vitest';
import { MockRepo } from '@/lib/repo/mock';
import { can } from '@/lib/rbac';
import { toCsv } from '@/lib/csv';
import type { TeamSummaryRow } from '@/lib/repo/types';

let r: MockRepo;
beforeEach(() => { r = new MockRepo({ persist: false }); });

describe('content module', () => {
  it('ER is computed server-side on create (client value irrelevant)', async () => {
    const s = await r.createSubmission({ userId: 'u01', url: 'https://tiktok.com/@x/video/c1', platform: 'tiktok', title: 't', views: 1000, likes: 100, comments: 50, shares: 50, followers: 1000 });
    expect(s.er).toBe(20);
  });
  it('duplicate url rejected', async () => {
    await r.createSubmission({ userId: 'u01', url: 'https://tiktok.com/@x/video/c2', platform: 'tiktok', title: 't', views: 10, likes: 1, comments: 0, shares: 0, followers: 1 });
    await expect(r.createSubmission({ userId: 'u02', url: 'https://tiktok.com/@x/video/c2', platform: 'tiktok', title: 't', views: 10, likes: 1, comments: 0, shares: 0, followers: 1 })).rejects.toThrow('duplicate_url');
  });
  it('edit by non-owner forbidden', async () => {
    const s = await r.createSubmission({ userId: 'u01', url: 'https://tiktok.com/@x/video/c3', platform: 'tiktok', title: 't', views: 10, likes: 1, comments: 0, shares: 0, followers: 1 });
    await expect(r.updateSubmission(s.id, 'u02', { title: 'x' })).rejects.toThrow('forbidden');
  });
  it('RBAC: staff cannot view team, manager/admin can export', () => {
    expect(can('staff', 'team-view')).toBe(false);
    expect(can('manager', 'csv-export')).toBe(true);
    expect(can('admin', 'csv-export')).toBe(true);
  });
  it('toCsv yields a header row + one row per member', async () => {
    const rows = await r.teamSummary();
    const csv = toCsv(rows);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Nama,Handle,Role,Jumlah Konten,Avg ER,Trend %,Kehadiran');
    expect(lines.length).toBe(rows.length + 1);
  });
});
