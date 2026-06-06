'use client';
// ============================================================
// Anima Pulse — login (ported from prototype ScreenLogin)
// Local mode: role picker (dev-login). Cloud mode: Google Workspace SSO.
// ============================================================
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/components/widgets';
import { apiPost } from '@/lib/client';
import type { Role } from '@/lib/repo/types';

const GoogleGlyph = () => (
  <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.5 1.2 8.9 3.5l6.6-6.6C35.4 2.3 30 0 24 0 14.6 0 6.5 5.4 2.5 13.2l7.7 6c1.9-5.6 7.1-9.7 13.8-9.7z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.6c-.6 2.9-2.2 5.4-4.7 7.1l7.3 5.7c4.3-4 6.8-9.9 6.8-17.3z" /><path fill="#FBBC05" d="M10.2 28.7c-.5-1.5-.7-3-.7-4.7s.3-3.2.7-4.7l-7.7-6C.9 16.6 0 20.2 0 24s.9 7.4 2.5 10.7l7.7-6z" /><path fill="#34A853" d="M24 48c6 0 11.4-2 15.2-5.4l-7.3-5.7c-2 1.4-4.6 2.2-7.9 2.2-6.7 0-12.4-4.1-14.3-9.7l-7.7 6C6.5 42.6 14.6 48 24 48z" /></svg>
);

export function LoginForm({ cloudMode }: { cloudMode: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string>('');

  const loginAs = async (role: Role) => {
    setBusy(role);
    try {
      await apiPost('/auth/dev-login', { role });
      router.push('/dashboard');
      router.refresh();
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="screen-login">
      <div className="login-bg">
        <div className="login-bg-grid" />
        <div className="login-bg-glow" />
      </div>
      <div className="login-card">
        <BrandMark size={36} />
        <div className="login-brand">
          <div className="login-brand-name">Anima Pulse</div>
          <div className="login-brand-tag">Operations dashboard · Anima Companion</div>
        </div>
        <h1 className="login-h1">Selamat datang kembali.</h1>

        {cloudMode ? (
          <>
            <p className="login-sub">
              Login dengan akun Google Workspace perusahaan. Domain selain{' '}
              <span className="mono-num">@{process.env.NEXT_PUBLIC_COMPANY_DOMAIN || 'anima.id'}</span> akan ditolak otomatis.
            </p>
            <a className="login-google" href="/api/v1/auth/google">
              <GoogleGlyph />
              <span>Lanjutkan dengan Google Workspace</span>
            </a>
          </>
        ) : (
          <>
            <p className="login-sub">
              Mode lokal (tanpa kredensial cloud). Pilih role untuk masuk dan menjelajahi platform.
            </p>
            <div className="login-role-grid">
              {(['staff', 'manager', 'admin'] as Role[]).map((r) => (
                <button key={r} className={'login-google login-role ' + (busy === r ? 'busy' : '')} onClick={() => loginAs(r)} disabled={!!busy}>
                  <span className="login-role-name">{busy === r ? 'Masuk…' : `Masuk sebagai ${r}`}</span>
                  <span className="login-magic-arrow">→</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="login-foot">
          <div className="login-foot-item"><span className="dot dot-positive" /> SSO via Google · domain locked</div>
          <div className="login-foot-item"><span className="dot dot-positive" /> Session 8 jam · refresh otomatis</div>
          <div className="login-foot-item"><span className="dot dot-positive" /> Audit log on · login tercatat</div>
        </div>
      </div>

      <div className="login-meta">
        <span>Anima Pulse v2.0 · Internal · 🔴 Confidential</span>
        <span>Need help? internal-it@anima.id</span>
      </div>
    </div>
  );
}
