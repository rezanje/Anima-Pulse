'use client';
// ============================================================
// Anima Pulse — Team Performance table (ported from ScreenTeam)
// Sortable + period filter + CSV export. Manager/Admin only (page guards).
// ============================================================
import { useMemo, useState } from 'react';
import { I } from '@/components/icons';
import { Avatar, Button, Tabs, StatusPill, TrendDelta, Toast } from '@/components/widgets';
import { fmtNum } from '@/lib/format';
import { apiGet } from '@/lib/client';
import type { Role, TeamSummaryRow } from '@/lib/repo/types';

type SortKey = 'er' | 'content';
const ATT_LABEL: Record<string, string> = { ontime: 'Tepat', late: 'Telat', absent: 'Absen' };
const ATT_TONE: Record<string, string> = { ontime: 'positive', late: 'warning', absent: 'danger' };

function periodFrom(period: string): string | undefined {
  if (period === 'all') return undefined;
  const now = Date.now();
  const days = period === 'week' ? 7 : 30;
  return new Date(now - days * 86_400_000).toISOString();
}

export function TeamTable({ initialRows, role }: { initialRows: TeamSummaryRow[]; role: Role }) {
  const [rows, setRows] = useState<TeamSummaryRow[]>(initialRows);
  const [period, setPeriod] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('er');
  const [toast, setToast] = useState('');

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => (sortBy === 'er' ? b.avgER - a.avgER : b.count - a.count));
  }, [rows, sortBy]);

  const summary = useMemo(
    () => ({
      totalSubs: rows.reduce((a, r) => a + r.count, 0),
      avgER: +(rows.reduce((a, r) => a + r.avgER, 0) / (rows.length || 1)).toFixed(2),
      onTarget: rows.filter((r) => r.avgER >= 6).length,
      count: rows.length,
    }),
    [rows],
  );

  const changePeriod = async (p: string) => {
    setPeriod(p);
    const from = periodFrom(p);
    const qs = from ? `?from=${encodeURIComponent(from)}` : '';
    try {
      const next = await apiGet<TeamSummaryRow[]>(`/content/team-summary${qs}`);
      setRows(next);
    } catch {
      setToast('Gagal memuat data periode');
    }
  };

  const exportCsv = async () => {
    const from = periodFrom(period);
    const qs = from ? `?from=${encodeURIComponent(from)}` : '';
    try {
      const res = await fetch(`/api/v1/content/export${qs}`);
      if (!res.ok) throw new Error('export_failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'anima-pulse-team.csv';
      a.click();
      URL.revokeObjectURL(url);
      setToast('CSV berhasil di-download');
    } catch {
      setToast('Export gagal');
    }
  };

  return (
    <div className="screen screen-team">
      <header className="screen-head">
        <div>
          <div className="eyebrow">Manager view · Tim media sosial</div>
          <h1 className="screen-title">Performa tim</h1>
          <p className="screen-sub">Pantau ER, kehadiran, dan tren untuk identifikasi anggota yang butuh support.</p>
        </div>
        <div className="head-actions">
          <Button variant="outline" icon={I.download} onClick={exportCsv}>Export CSV</Button>
        </div>
      </header>

      <div className="kpi-strip">
        <div className="kpi"><div className="eyebrow">Total submission</div><div className="kpi-value mono-num">{summary.totalSubs}</div><div className="kpi-foot">{period === 'all' ? 'semua waktu' : period === 'week' ? 'minggu ini' : 'bulan ini'}</div></div>
        <div className="kpi"><div className="eyebrow">Avg ER tim</div><div className="kpi-value mono-num">{summary.avgER}<span className="kpi-unit">%</span></div><div className="kpi-foot">rata-rata anggota</div></div>
        <div className="kpi"><div className="eyebrow">On target</div><div className="kpi-value mono-num">{summary.onTarget}/{summary.count}</div><div className="kpi-foot">anggota ≥ 6% ER</div></div>
        <div className="kpi"><div className="eyebrow">Anggota tim</div><div className="kpi-value mono-num">{summary.count}</div><div className="kpi-foot">aktif</div></div>
      </div>

      <article className="card card-table">
        <div className="card-toolbar">
          <Tabs value={period} onChange={changePeriod} tabs={[
            { id: 'week', label: 'Minggu ini' },
            { id: 'month', label: 'Bulan ini' },
            { id: 'all', label: 'Semua' },
          ]} />
        </div>

        <div className="t-table t-table-summary">
          <div className="t-row t-head">
            <span>Anggota</span>
            <button className={'t-sort ' + (sortBy === 'content' ? 'active' : '')} onClick={() => setSortBy('content')}>Konten ↓</button>
            <button className={'t-sort ' + (sortBy === 'er' ? 'active' : '')} onClick={() => setSortBy('er')}>Avg ER ↓</button>
            <span>Trend</span>
            <span>Kehadiran</span>
          </div>
          {sorted.map((r) => (
            <div key={r.user.id} className="t-row">
              <span className="t-cell-name">
                <Avatar user={r.user} size={32} />
                <span>
                  <span className="t-name">{r.user.name}</span>
                  <span className="t-handle">{r.user.handle}</span>
                </span>
              </span>
              <span className="mono-num t-cell-num">{r.count}</span>
              <span className="mono-num t-cell-num t-cell-er">{r.avgER.toFixed(2)}<span className="t-pct">%</span></span>
              <span className="t-cell-trend"><TrendDelta value={r.trend} /></span>
              <span><StatusPill tone={r.attendance ? ATT_TONE[r.attendance] : 'neutral'}>{r.attendance ? ATT_LABEL[r.attendance] : '—'}</StatusPill></span>
            </div>
          ))}
        </div>
      </article>

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
