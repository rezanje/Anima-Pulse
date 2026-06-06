'use client';
// ============================================================
// Anima Pulse — KOL follower growth chart (Recharts, PRD §06)
// ============================================================
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fmtNum } from '@/lib/format';

export function GrowthChart({ data, height = 240 }: { data: { date: string; followers: number }[]; height?: number }) {
  if (!data || data.length === 0) {
    return <div className="empty-state">Belum ada data pertumbuhan follower.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id="growth-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={(v) => fmtNum(v as number)} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} width={48} />
        <Tooltip
          formatter={(v) => [fmtNum(v as number), 'Followers']}
          contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 12 }}
        />
        <Area type="monotone" dataKey="followers" stroke="var(--accent)" strokeWidth={2} fill="url(#growth-fill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
