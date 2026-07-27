import { describe, it, expect, beforeEach } from 'vitest';
import { pillarSchema, pillarEditSchema } from '@/lib/validation/pillar';
import { submissionSchema } from '@/lib/validation/content';
import { MockRepo } from '@/lib/repo/mock';
import { can } from '@/lib/rbac';
import { NewPillar } from '@/lib/repo/types';

const validPillar: NewPillar = {
  name: 'Edukasi',
  description: 'Konten yang ngajarin sesuatu ke audiens.',
  exampleAngle: '3 kesalahan skincare pemula',
};

describe('Pillar validation schema', () => {
  it('accepts a valid pillar', () => {
    expect(pillarSchema.safeParse(validPillar).success).toBe(true);
  });

  it('rejects missing name or description', () => {
    expect(pillarSchema.safeParse({ ...validPillar, name: '' }).success).toBe(false);
    expect(pillarSchema.safeParse({ ...validPillar, description: '' }).success).toBe(false);
  });

  it('allows exampleAngle to be omitted', () => {
    const { exampleAngle, ...rest } = validPillar;
    expect(pillarSchema.safeParse(rest).success).toBe(true);
  });

  it('edit schema allows partial patch including isActive', () => {
    const res = pillarEditSchema.safeParse({ isActive: false });
    expect(res.success).toBe(true);
  });
});

describe('Pillar RBAC', () => {
  it('staff can view but not manage pillars', () => {
    expect(can('staff', 'pillar-view')).toBe(true);
    expect(can('staff', 'pillar-manage')).toBe(false);
  });

  it('manager and admin can manage pillars', () => {
    expect(can('manager', 'pillar-manage')).toBe(true);
    expect(can('admin', 'pillar-manage')).toBe(true);
  });
});

describe('Submission schema — pillarId tagging', () => {
  const baseSubmission = {
    url: 'https://tiktok.com/@user/video/123',
    platform: 'tiktok' as const,
    title: 'Judul konten',
    views: 1000,
    likes: 10,
    comments: 1,
    shares: 1,
    followers: 500,
  };

  it('treats an empty-string pillarId (unmarked select) as no pillar', () => {
    const res = submissionSchema.safeParse({ ...baseSubmission, pillarId: '' });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.pillarId).toBeUndefined();
  });

  it('accepts a real pillarId', () => {
    const res = submissionSchema.safeParse({ ...baseSubmission, pillarId: 'pil01' });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.pillarId).toBe('pil01');
  });
});

describe('MockRepo pillar CRUD', () => {
  let r: MockRepo;

  beforeEach(() => {
    r = new MockRepo({ persist: false });
  });

  it('lists seeded pillars, all active', async () => {
    const pillars = await r.listPillars();
    expect(pillars.length).toBeGreaterThan(0);
    expect(pillars.every((p) => p.isActive)).toBe(true);
  });

  it('creates a new pillar', async () => {
    const created = await r.createPillar({ ...validPillar, createdBy: 'u06' });
    expect(created.id).toContain('pil');
    expect(created.isActive).toBe(true);
    expect(created.name).toBe(validPillar.name);
  });

  it('deactivates and reactivates a pillar', async () => {
    const created = await r.createPillar(validPillar);
    const deactivated = await r.updatePillar(created.id, { isActive: false });
    expect(deactivated.isActive).toBe(false);

    const reactivated = await r.updatePillar(created.id, { isActive: true });
    expect(reactivated.isActive).toBe(true);
  });

  it('throws not_found when updating a non-existent pillar', async () => {
    await expect(r.updatePillar('pil-nonexistent', { isActive: false })).rejects.toThrow('not_found');
  });

  it('tags a submission with a pillarId', async () => {
    const pillar = await r.createPillar(validPillar);
    const sub = await r.createSubmission({
      userId: 'u01',
      url: 'https://tiktok.com/@user/video/999',
      platform: 'tiktok',
      title: 'Konten edukasi',
      views: 1000,
      likes: 10,
      comments: 1,
      shares: 1,
      followers: 500,
      pillarId: pillar.id,
    });
    expect(sub.pillarId).toBe(pillar.id);
  });

  it('deletes a pillar and un-tags its submissions instead of losing them', async () => {
    const pillar = await r.createPillar(validPillar);
    const sub = await r.createSubmission({
      userId: 'u01',
      url: 'https://tiktok.com/@user/video/998',
      platform: 'tiktok',
      title: 'Konten edukasi',
      views: 1000,
      likes: 10,
      comments: 1,
      shares: 1,
      followers: 500,
      pillarId: pillar.id,
    });

    await r.deletePillar(pillar.id);

    const pillars = await r.listPillars();
    expect(pillars.find((p) => p.id === pillar.id)).toBeUndefined();

    const kept = await r.getSubmission(sub.id);
    expect(kept).not.toBeNull();
    expect(kept?.pillarId).toBeNull();
  });

  it('deleting a non-existent pillar is a no-op', async () => {
    await expect(r.deletePillar('pil-nonexistent')).resolves.toBeUndefined();
  });
});
