// ============================================================
// Anima Pulse — engagement / ROI / attendance math (pure)
// PRD §FR-PERF-03, §US-006, §US-001, §FR-KOL-03
// ============================================================

export function calcER(m: { likes: number; comments: number; shares: number; views: number }): number {
  if (!m.views || m.views <= 0) return 0;
  return +(((m.likes + m.comments + m.shares) / m.views) * 100).toFixed(2);
}

export function calcCPV(rate: number, views: number): number {
  return views > 0 ? +(rate / views).toFixed(2) : 0;
}

export function calcCPE(rate: number, engagement: number): number {
  return engagement > 0 ? +(rate / engagement).toFixed(2) : 0;
}

/**
 * Attendance status from a clock-in timestamp.
 * "late" when clock-in is strictly after 09:30 WIB (UTC+7). (US-001)
 */
export function attendanceStatus(iso: string): 'ontime' | 'late' {
  const d = new Date(iso);
  const wibMin = (d.getUTCHours() * 60 + d.getUTCMinutes() + 7 * 60) % (24 * 60);
  return wibMin > 9 * 60 + 30 ? 'late' : 'ontime';
}

export function momGrowth(curr: number, prev: number): number {
  return prev > 0 ? +(((curr - prev) / prev) * 100).toFixed(1) : 0;
}

export function avgOf(nums: number[]): number {
  return nums.length ? +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : 0;
}

/**
 * Target ER to compare against an average taken over `platforms` (one entry per
 * submission). Mixed platforms → mean target over the same submissions, so the
 * target and the average are measured the same way. Empty → TikTok fallback.
 */
export function blendedErTarget(
  platforms: ('tiktok' | 'instagram')[],
  targets: { tiktok: number; instagram: number },
): { value: number; label: string } {
  const known = platforms.filter((p) => p === 'tiktok' || p === 'instagram');
  if (!known.length) return { value: targets.tiktok, label: 'benchmark TikTok' };
  const uniq = [...new Set(known)];
  if (uniq.length === 1) {
    return {
      value: targets[uniq[0]],
      label: uniq[0] === 'tiktok' ? 'benchmark TikTok' : 'benchmark Instagram',
    };
  }
  return { value: avgOf(known.map((p) => targets[p])), label: 'benchmark campuran' };
}

/** Compare avg of last 4 vs first 4 ER history points → % delta. */
export function trendDelta(history: number[]): number {
  if (history.length < 8) return 0;
  const recent = avgOf(history.slice(-4));
  const prev = avgOf(history.slice(0, 4));
  return prev > 0 ? +(((recent - prev) / prev) * 100).toFixed(1) : 0;
}
