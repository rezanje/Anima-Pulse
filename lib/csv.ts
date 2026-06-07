import type { TeamSummaryRow } from '@/lib/repo/types';

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: TeamSummaryRow[]): string {
  const header = ['Nama', 'Handle', 'Role', 'Jumlah Konten', 'Avg ER', 'Trend %', 'Kehadiran'];
  const lines = rows.map((r) =>
    [r.user.name, r.user.handle, r.user.role, r.count, r.avgER, r.trend, r.attendance ?? 'absent'].map(csvEscape).join(','),
  );
  return [header.join(','), ...lines].join('\n');
}
