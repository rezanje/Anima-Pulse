import { describe, it, expect, beforeEach } from 'vitest';
import { MockRepo } from '@/lib/repo/mock';
import { can } from '@/lib/rbac';

let r: MockRepo;
beforeEach(() => { r = new MockRepo({ persist: false }); });

describe('settings module', () => {
  it('RBAC: admin-only for user-manage and er-target-set', () => {
    expect(can('manager', 'user-manage')).toBe(false);
    expect(can('admin', 'user-manage')).toBe(true);
    expect(can('manager', 'er-target-set')).toBe(false);
    expect(can('admin', 'audit-view')).toBe(true);
  });
  it('setErTargets persists and getErTargets returns them', async () => {
    await r.setErTargets({ tiktok: 7, instagram: 4 });
    expect(await r.getErTargets()).toEqual({ tiktok: 7, instagram: 4 });
  });
  it('updateUserRole changes role', async () => {
    const u = await r.updateUserRole('u01', 'manager');
    expect(u.role).toBe('manager');
  });
  it('recordAudit then listAudit returns entry (newest first)', async () => {
    await r.recordAudit({ userId: 'u07', action: 'update_user', resourceType: 'user', resourceId: 'u01', ipAddress: null });
    const logs = await r.listAudit();
    expect(logs[0].action).toBe('update_user');
    expect(logs[0].resourceId).toBe('u01');
  });
});
