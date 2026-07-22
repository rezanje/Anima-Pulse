import { describe, it, expect } from 'vitest';
import { can, type Action } from '@/lib/rbac';

describe('rbac (PRD §10.1)', () => {
  it('staff can clock/submit/scorecard/vault', () => {
    for (const a of ['clock', 'submit', 'scorecard', 'vault-read', 'vault-write'] as Action[]) {
      expect(can('staff', a)).toBe(true);
    }
  });
  it('staff denied team/kol/export/admin', () => {
    for (const a of ['team-view', 'csv-export', 'kol-crud', 'kol-rate-view', 'user-manage', 'er-target-set', 'audit-view'] as Action[]) {
      expect(can('staff', a)).toBe(false);
    }
  });
  it('manager can team/kol/export but not admin-only', () => {
    expect(can('manager', 'team-view')).toBe(true);
    expect(can('manager', 'kol-crud')).toBe(true);
    expect(can('manager', 'kol-rate-view')).toBe(true);
    expect(can('manager', 'csv-export')).toBe(true);
    expect(can('manager', 'user-manage')).toBe(false);
    expect(can('manager', 'er-target-set')).toBe(false);
    expect(can('manager', 'audit-view')).toBe(false);
  });
  it('admin can everything', () => {
    for (const a of ['team-view', 'kol-crud', 'user-manage', 'er-target-set', 'audit-view', 'kol-roi-write'] as Action[]) {
      expect(can('admin', a)).toBe(true);
    }
  });
  it('kol-roi: manager read-only, admin write', () => {
    expect(can('manager', 'kol-roi-read')).toBe(true);
    expect(can('manager', 'kol-roi-write')).toBe(false);
    expect(can('admin', 'kol-roi-write')).toBe(true);
  });
  it('creator (Konten Kreator) can clock/submit/scorecard/vault/pillar-view, like staff', () => {
    for (const a of ['clock', 'submit', 'scorecard', 'vault-read', 'vault-write', 'pillar-view'] as Action[]) {
      expect(can('creator', a)).toBe(true);
    }
  });
  it('creator is denied the Content Plan Tracker, unlike staff', () => {
    expect(can('creator', 'tracker-view')).toBe(false);
    expect(can('staff', 'tracker-view')).toBe(true);
  });
  it('creator denied team/kol/export/admin/pillar-manage', () => {
    for (const a of ['team-view', 'csv-export', 'kol-crud', 'kol-rate-view', 'user-manage', 'er-target-set', 'audit-view', 'pillar-manage'] as Action[]) {
      expect(can('creator', a)).toBe(false);
    }
  });
});
