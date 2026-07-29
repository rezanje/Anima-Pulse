import { describe, it, expect } from 'vitest';
import { calcER, calcCPV, calcCPE, attendanceStatus, momGrowth, trendDelta, blendedErTarget } from '@/lib/er';

describe('er', () => {
  it('blendedErTarget follows the platform mix of the submissions', () => {
    const t = { tiktok: 6, instagram: 4 };
    expect(blendedErTarget([], t)).toEqual({ value: 6, label: 'benchmark TikTok' });
    expect(blendedErTarget(['instagram', 'instagram'], t)).toEqual({ value: 4, label: 'benchmark Instagram' });
    expect(blendedErTarget(['tiktok', 'instagram'], t)).toEqual({ value: 5, label: 'benchmark campuran' });
    // weighted by submission count, not by distinct platform
    expect(blendedErTarget(['tiktok', 'tiktok', 'tiktok', 'instagram'], t).value).toBe(5.5);
  });

  it('ER = (likes+comments+shares)/views*100', () => {
    expect(calcER({ likes: 100, comments: 50, shares: 50, views: 1000 })).toBe(20);
  });
  it('ER rounds to 2 decimals and handles views=0 → 0', () => {
    expect(calcER({ likes: 1, comments: 1, shares: 1, views: 0 })).toBe(0);
    expect(calcER({ likes: 33, comments: 0, shares: 0, views: 1000 })).toBe(3.3);
  });
  it('CPV = rate/views, CPE = rate/engagement', () => {
    expect(calcCPV(1_000_000, 500_000)).toBe(2);
    expect(calcCPE(1_000_000, 50_000)).toBe(20);
    expect(calcCPV(1000, 0)).toBe(0);
  });
  it('attendance late strictly after 09:30 WIB', () => {
    expect(attendanceStatus('2026-06-07T02:31:00.000Z')).toBe('late'); // 09:31 WIB
    expect(attendanceStatus('2026-06-07T02:30:00.000Z')).toBe('ontime'); // 09:30 WIB
    expect(attendanceStatus('2026-06-07T01:00:00.000Z')).toBe('ontime'); // 08:00 WIB
  });
  it('MoM growth percent', () => {
    expect(momGrowth(110, 100)).toBe(10);
    expect(momGrowth(100, 0)).toBe(0);
  });
  it('trendDelta needs >= 8 points', () => {
    expect(trendDelta([1, 2, 3])).toBe(0);
    expect(trendDelta([4, 4, 4, 4, 8, 8, 8, 8])).toBe(100);
  });
});
