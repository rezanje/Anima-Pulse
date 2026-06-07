import { describe, it, expect, beforeEach } from 'vitest';
import { MockRepo } from '@/lib/repo/mock';
import { can } from '@/lib/rbac';

let repo: MockRepo;

beforeEach(() => {
  repo = new MockRepo({ persist: false });
});

describe('Attendance — repo logic', () => {
  it('(1) clockIn then clockIn again rejects already_clocked_in', async () => {
    // u04 has no seed attendance for today, so first clock-in succeeds
    await repo.clockIn('u04');
    await expect(repo.clockIn('u04')).rejects.toThrow('already_clocked_in');
  });

  it('(2) clockOut before clockIn rejects not_clocked_in', async () => {
    // u04 has no seed attendance today
    await expect(repo.clockOut('u04')).rejects.toThrow('not_clocked_in');
  });

  it('(3) clock status is recorded correctly on clockIn', async () => {
    // u04 has no seed attendance — clock in fresh
    const record = await repo.clockIn('u04', '127.0.0.1');

    expect(record.userId).toBe('u04');
    expect(record.clockInAt).toBeTruthy();
    // status must be either 'ontime' or 'late' (not null)
    expect(['ontime', 'late']).toContain(record.status);
    expect(record.ipAddress).toBe('127.0.0.1');

    // getTodayAttendance also reflects it
    const today = await repo.getTodayAttendance('u04');
    expect(today).not.toBeNull();
    expect(today!.id).toBe(record.id);
  });

  it('(4) can("staff", "clock") === true', () => {
    expect(can('staff', 'clock')).toBe(true);
  });
});

describe('Attendance — additional edge cases', () => {
  it('manager and admin can also clock', () => {
    expect(can('manager', 'clock')).toBe(true);
    expect(can('admin', 'clock')).toBe(true);
  });

  it('clockOut after clockIn succeeds and records clockOutAt', async () => {
    await repo.clockIn('u04');
    const record = await repo.clockOut('u04');
    expect(record.clockOutAt).toBeTruthy();
  });

  it('clockOut twice throws already_clocked_out', async () => {
    await repo.clockIn('u04');
    await repo.clockOut('u04');
    await expect(repo.clockOut('u04')).rejects.toThrow('already_clocked_out');
  });

  it('listAttendance returns correct month/year records', async () => {
    // u01 has a seed attendance for today (which is in the current month/year)
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const records = await repo.listAttendance('u01', month, year);
    // u01 has a seeded clock-in so there should be at least one record
    expect(records.length).toBeGreaterThanOrEqual(1);
    expect(records.every((r) => r.userId === 'u01')).toBe(true);
  });

  it('attendancePct returns seeded percentages for known user', async () => {
    const pct = await repo.attendancePct('u01');
    expect(pct.ontime).toBe(88);
    expect(pct.late).toBe(9);
    expect(pct.absent).toBe(3);
    expect(pct.ontime + pct.late + pct.absent).toBe(100);
  });
});
