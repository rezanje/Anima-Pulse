import { describe, it, expect, beforeEach } from 'vitest';
import { feedbackSchema, feedbackStatusSchema } from '@/lib/validation/feedback';
import { MockRepo } from '@/lib/repo/mock';
import { can } from '@/lib/rbac';
import type { NewFeedbackReport } from '@/lib/repo/types';

const validReport: NewFeedbackReport = {
  type: 'bug',
  urgency: 'tinggi',
  description: 'Tombol simpan di Content Plan tidak menyimpan apa-apa.',
  page: '/tracker',
};

describe('Feedback validation schema', () => {
  it('accepts a valid report', () => {
    expect(feedbackSchema.safeParse(validReport).success).toBe(true);
  });

  it('rejects a description that is too short to act on', () => {
    expect(feedbackSchema.safeParse({ ...validReport, description: 'error' }).success).toBe(false);
  });

  it('rejects unknown type or urgency', () => {
    expect(feedbackSchema.safeParse({ ...validReport, type: 'curhat' }).success).toBe(false);
    expect(feedbackSchema.safeParse({ ...validReport, urgency: 'kiamat' }).success).toBe(false);
  });

  it('defaults page to empty when omitted', () => {
    const { page, ...rest } = validReport;
    const res = feedbackSchema.safeParse(rest);
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.page).toBe('');
  });

  it('status schema only accepts the four known statuses', () => {
    expect(feedbackStatusSchema.safeParse({ status: 'diproses' }).success).toBe(true);
    expect(feedbackStatusSchema.safeParse({ status: 'pending' }).success).toBe(false);
  });
});

describe('Feedback RBAC', () => {
  it('every role can submit', () => {
    for (const role of ['staff', 'manager', 'admin', 'creator'] as const) {
      expect(can(role, 'feedback-submit')).toBe(true);
    }
  });

  it('only admin can triage', () => {
    expect(can('admin', 'feedback-manage')).toBe(true);
    expect(can('manager', 'feedback-manage')).toBe(false);
    expect(can('staff', 'feedback-manage')).toBe(false);
    expect(can('creator', 'feedback-manage')).toBe(false);
  });
});

describe('MockRepo feedback', () => {
  let r: MockRepo;

  beforeEach(() => {
    r = new MockRepo({ persist: false });
  });

  it('starts with no reports', async () => {
    expect(await r.listFeedback()).toEqual([]);
    expect(await r.countNewFeedback()).toBe(0);
  });

  it('creates a report as "baru" and resolves the reporter name', async () => {
    const created = await r.createFeedback({ ...validReport, userId: 'u01' });
    expect(created.status).toBe('baru');
    expect(created.page).toBe('/tracker');
    expect(created.userName).not.toBe('—');
    expect(await r.countNewFeedback()).toBe(1);
  });

  it('scopes listFeedback to one reporter when userId is given', async () => {
    await r.createFeedback({ ...validReport, userId: 'u01' });
    await r.createFeedback({ ...validReport, userId: 'u02' });

    expect(await r.listFeedback()).toHaveLength(2);
    const mine = await r.listFeedback({ userId: 'u01' });
    expect(mine).toHaveLength(1);
    expect(mine[0].userId).toBe('u01');
  });

  it('changing status off "baru" drops the unread count', async () => {
    const created = await r.createFeedback({ ...validReport, userId: 'u01' });
    expect(await r.countNewFeedback()).toBe(1);

    const updated = await r.updateFeedbackStatus(created.id, 'selesai');
    expect(updated.status).toBe('selesai');
    expect(await r.countNewFeedback()).toBe(0);
  });

  it('throws not_found for an unknown report', async () => {
    await expect(r.updateFeedbackStatus('fb-nope', 'selesai')).rejects.toThrow('not_found');
  });
});
