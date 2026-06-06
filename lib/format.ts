// ============================================================
// Anima Pulse — display formatters (ported from prototype data.jsx)
// ============================================================

export function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + 'K';
  return String(n);
}

export function fmtRupiah(n: number): string {
  if (n >= 1_000_000) return 'Rp ' + (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'jt';
  if (n >= 1_000) return 'Rp ' + (n / 1_000).toFixed(0) + 'rb';
  return 'Rp ' + n;
}

export function fmtAgo(hours: number): string {
  if (hours < 1) return 'baru saja';
  if (hours < 24) return Math.floor(hours) + ' jam lalu';
  const d = Math.floor(hours / 24);
  if (d < 7) return d + ' hari lalu';
  return Math.floor(d / 7) + ' minggu lalu';
}

const WIB_DAYS = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
const WIB_MONTHS = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];

/** "SELASA, 21 MEI 2026" in WIB. */
export function fmtDateWIB(d: Date = new Date()): string {
  // shift to WIB wall clock
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return `${WIB_DAYS[wib.getUTCDay()]}, ${wib.getUTCDate()} ${WIB_MONTHS[wib.getUTCMonth()]} ${wib.getUTCFullYear()}`;
}

/** "09:12" in WIB from an ISO timestamp. */
export function fmtTimeWIB(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return `${String(wib.getUTCHours()).padStart(2, '0')}:${String(wib.getUTCMinutes()).padStart(2, '0')}`;
}
