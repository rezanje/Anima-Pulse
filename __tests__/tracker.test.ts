import { describe, it, expect, beforeEach } from 'vitest';
import { contentPlanSchema } from '@/lib/validation/tracker';
import { MockRepo } from '@/lib/repo/mock';
import { NewContentPlan } from '@/lib/repo/types';

const validPlanBase: NewContentPlan = {
  deadline: '2026-06-15',
  funnel: 'Top Funnel',
  category: 'Review',
  tanggalUpload: '2026-06-18',
  formatKonten: 'Video',
  platform: 'tiktok',
  ideKonten: 'Unboxing product X dengan transisi aesthetic',
  hook: 'Kalian nyesel beli ini kalau...',
  brief: 'Tunjukkan kelebihan utama produk secara detail',
  caption: 'Jangan beli ini sebelum nonton video ini! #aesthetic #unboxing',
  referensi: 'https://tiktok.com/@example/video/123456',
  progress: 'Not Started',
  result: '',
  feedback: '',
  revision: '',
  approval: false,
};

describe('Content Plan Validation Schema', () => {
  it('should validate a correct content plan input', () => {
    const res = contentPlanSchema.safeParse(validPlanBase);
    expect(res.success).toBe(true);
  });

  it('should reject when required fields are missing', () => {
    const missingFields = ['deadline', 'funnel', 'category', 'tanggalUpload', 'formatKonten', 'platform', 'ideKonten', 'progress'];
    for (const field of missingFields) {
      const copy = { ...validPlanBase } as any;
      delete copy[field];
      const res = contentPlanSchema.safeParse(copy);
      expect(res.success).toBe(false);
    }
  });

  it('should reject when ideKonten exceeds 280 characters', () => {
    const longIde = 'a'.repeat(281);
    const res = contentPlanSchema.safeParse({
      ...validPlanBase,
      ideKonten: longIde,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.errors[0].message).toContain('Ide konten terlalu panjang');
    }
  });

  it('should allow optional fields to be null or empty', () => {
    const res = contentPlanSchema.safeParse({
      ...validPlanBase,
      hook: null,
      brief: null,
      caption: '',
      referensi: '',
      result: null,
      feedback: null,
      revision: null,
    });
    expect(res.success).toBe(true);
  });
});

describe('MockRepo Content Plan CRUD Operations', () => {
  let r: MockRepo;

  beforeEach(() => {
    r = new MockRepo({ persist: false });
  });

  it('should list initial seeded content plans', async () => {
    const plans = await r.listContentPlans();
    expect(plans.length).toBeGreaterThan(0);
    expect(plans[0].id).toContain('p');
  });

  it('should create a new content plan', async () => {
    const created = await r.createContentPlan(validPlanBase);
    expect(created.id).toContain('plan');
    expect(created.createdAt).toBeDefined();
    expect(created.ideKonten).toBe(validPlanBase.ideKonten);

    const plans = await r.listContentPlans();
    expect(plans.some((p) => p.id === created.id)).toBe(true);
  });

  it('should update an existing content plan', async () => {
    const created = await r.createContentPlan(validPlanBase);
    const updated = await r.updateContentPlan(created.id, {
      progress: 'In Progress',
      approval: true,
      feedback: 'Bagus, lanjut!',
    });

    expect(updated.progress).toBe('In Progress');
    expect(updated.approval).toBe(true);
    expect(updated.feedback).toBe('Bagus, lanjut!');

    // Re-verify from list
    const plans = await r.listContentPlans();
    const found = plans.find((p) => p.id === created.id);
    expect(found?.progress).toBe('In Progress');
    expect(found?.approval).toBe(true);
    expect(found?.feedback).toBe('Bagus, lanjut!');
  });

  it('should throw when updating a non-existent plan ID', async () => {
    await expect(
      r.updateContentPlan('plan-nonexistent', { progress: 'Completed' })
    ).rejects.toThrow('not_found');
  });

  it('should delete a content plan', async () => {
    const created = await r.createContentPlan(validPlanBase);
    const initialList = await r.listContentPlans();
    expect(initialList.some((p) => p.id === created.id)).toBe(true);

    await r.deleteContentPlan(created.id);
    const postDeleteList = await r.listContentPlans();
    expect(postDeleteList.some((p) => p.id === created.id)).toBe(false);
  });
});
