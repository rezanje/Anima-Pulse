'use client';
// ============================================================
// Anima Pulse — shared UI primitives (ported from prototype components.jsx)
// ============================================================
import { useEffect, type ReactNode } from 'react';
import { fmtNum } from '@/lib/format';
import { I } from '@/components/icons';
import type { User, Platform } from '@/lib/repo/types';

export function BrandMark({ size = 28 }: { size?: number }) {
  const gid = 'ap-g';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-deep)" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="29" height="29" rx="9" fill={`url(#${gid})`} />
      <path d="M7 18 L11 18 L13 13 L17 22 L19 17 L25 17" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Sparkline({ data, width = 96, height = 28, target = null, color = 'var(--accent)' }: { data: number[]; width?: number; height?: number; target?: number | null; color?: string }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data, target ?? 0) * 1.1;
  const min = Math.min(...data, target ?? Infinity) * 0.9;
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 4) + 2;
    const y = height - 2 - ((v - min) / range) * (height - 4);
    return [x, y] as [number, number];
  });
  const pathD = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
  const areaD = pathD + ` L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`;
  return (
    <svg width={width} height={height} aria-hidden="true" style={{ display: 'block' }}>
      <path d={areaD} fill={color} opacity="0.10" />
      <path d={pathD} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {target != null && (
        <line x1="0" x2={width} y1={height - 2 - ((target - min) / range) * (height - 4)} y2={height - 2 - ((target - min) / range) * (height - 4)} stroke="var(--border)" strokeDasharray="2 2" />
      )}
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.2" fill={color} />
    </svg>
  );
}

export function PlatformBadge({ platform, size = 'sm' }: { platform: Platform; size?: string }) {
  const isTikTok = platform === 'tiktok';
  return (
    <span className={'platform-badge ' + platform + ' ' + size}>
      <span className="pb-dot" aria-hidden="true">{isTikTok ? I.tiktok : I.ig}</span>
      <span>{isTikTok ? 'TikTok' : 'Instagram'}</span>
    </span>
  );
}

export function StatusPill({ tone = 'neutral', children }: { tone?: string; children: ReactNode }) {
  return <span className={'status-pill tone-' + tone}>{children}</span>;
}

export function TrendDelta({ value, suffix = '%' }: { value: number | null | undefined; suffix?: string }) {
  if (value === 0 || value === null || value === undefined) return <span className="delta neutral">—</span>;
  const positive = value > 0;
  return (
    <span className={'delta ' + (positive ? 'up' : 'down')}>
      <span className="delta-arrow">{positive ? '↑' : '↓'}</span>
      <span>{Math.abs(value).toFixed(1)}{suffix}</span>
    </span>
  );
}

export function Avatar({ user, size = 32 }: { user: Pick<User, 'name' | 'avatar'> | null | undefined; size?: number }) {
  if (!user) return null;
  const hue = (user.name.charCodeAt(0) * 31 + (user.name.charCodeAt(1) || 0)) % 360;
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36, background: `oklch(0.72 0.08 ${hue})` }}>
      {user.avatar}
    </span>
  );
}

export function Button({ children, variant = 'primary', size = 'md', icon, onClick, type = 'button', disabled, full }: {
  children: ReactNode; variant?: string; size?: string; icon?: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; full?: boolean;
}) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={'btn btn-' + variant + ' btn-' + size + (full ? ' btn-full' : '')}>
      {icon && <span className="btn-icon">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

export function Tabs({ tabs, value, onChange }: { tabs: { id: string; label: string; count?: number }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className={'tab ' + (value === t.id ? 'active' : '')} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count !== undefined && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function SectionHead({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2 className="section-title">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Field({ label, hint, error, children, suffix }: { label: string; hint?: string; error?: string; children: ReactNode; suffix?: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {hint && <span className="field-hint">{hint}</span>}
      </span>
      <div className="field-input-wrap">
        {children}
        {suffix && <span className="field-suffix">{suffix}</span>}
      </div>
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <span className="toast-icon">{I.check}</span>
      <span>{message}</span>
    </div>
  );
}

/** Recharts-based growth area chart (PRD §06 Recharts; replaces prototype inline SVG). */
export { GrowthChart } from '@/components/growth-chart';
