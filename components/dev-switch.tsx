'use client';
// ============================================================
// Anima Pulse — dev-only switcher (role / theme / accent / density)
// Mirrors the prototype Tweaks panel. Rendered only in local (no-creds) mode.
// ============================================================
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/client';
import type { Role } from '@/lib/repo/types';

const ACCENTS: Record<string, { accent: string; deep: string; soft: string }> = {
  emerald: { accent: '#1D9E75', deep: '#0F7252', soft: 'rgba(29, 158, 117, 0.10)' },
  indigo: { accent: '#4F5AE8', deep: '#2E3BC7', soft: 'rgba(79, 90, 232, 0.10)' },
  amber: { accent: '#D98B1E', deep: '#A66510', soft: 'rgba(217, 139, 30, 0.12)' },
  rose: { accent: '#D14D6F', deep: '#A33454', soft: 'rgba(209, 77, 111, 0.10)' },
};

function setAttr(name: string, value: string) {
  document.documentElement.dataset[name] = value;
}

export function DevSwitch({ role }: { role: Role }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [accent, setAccent] = useState('emerald');
  const [density, setDensity] = useState('comfortable');

  const switchRole = async (r: Role) => {
    await apiPost('/auth/dev-login', { role: r });
    router.push('/dashboard');
    router.refresh();
  };
  const applyTheme = (t: string) => { setTheme(t); setAttr('theme', t); };
  const applyDensity = (d: string) => { setDensity(d); setAttr('density', d); };
  const applyAccent = (a: string) => {
    setAccent(a);
    const p = ACCENTS[a];
    const root = document.documentElement;
    root.style.setProperty('--accent', p.accent);
    root.style.setProperty('--accent-deep', p.deep);
    root.style.setProperty('--accent-soft', p.soft);
  };

  if (!open) {
    return (
      <button className="dev-switch-fab" onClick={() => setOpen(true)} title="Dev switcher" aria-label="Dev switcher">
        ⚙
      </button>
    );
  }

  return (
    <div className="dev-switch-panel">
      <div className="dev-switch-head">
        <strong>Dev switcher</strong>
        <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Tutup">×</button>
      </div>

      <div className="dev-switch-section">
        <span className="dev-switch-label">Role (lihat sebagai)</span>
        <div className="dev-switch-row">
          {(['staff', 'manager', 'admin'] as Role[]).map((r) => (
            <button key={r} className={'dev-chip ' + (role === r ? 'active' : '')} onClick={() => switchRole(r)}>{r}</button>
          ))}
        </div>
      </div>

      <div className="dev-switch-section">
        <span className="dev-switch-label">Theme</span>
        <div className="dev-switch-row">
          {['light', 'dark'].map((t) => (
            <button key={t} className={'dev-chip ' + (theme === t ? 'active' : '')} onClick={() => applyTheme(t)}>{t}</button>
          ))}
        </div>
      </div>

      <div className="dev-switch-section">
        <span className="dev-switch-label">Accent</span>
        <div className="dev-switch-row">
          {Object.entries(ACCENTS).map(([name, p]) => (
            <button key={name} className={'dev-swatch ' + (accent === name ? 'active' : '')} style={{ background: p.accent }} onClick={() => applyAccent(name)} aria-label={name} />
          ))}
        </div>
      </div>

      <div className="dev-switch-section">
        <span className="dev-switch-label">Density</span>
        <div className="dev-switch-row">
          {['comfortable', 'compact'].map((d) => (
            <button key={d} className={'dev-chip ' + (density === d ? 'active' : '')} onClick={() => applyDensity(d)}>{d}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
