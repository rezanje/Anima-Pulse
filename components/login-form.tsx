'use client';
// ============================================================
// Anima Pulse — login (ported from prototype ScreenLogin)
// Local mode: role picker (dev-login). Cloud mode: Google Workspace SSO.
// ============================================================
import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrandMark } from '@/components/widgets';
import { apiPost } from '@/lib/client';
import type { Role } from '@/lib/repo/types';

const errorMsgs: Record<string, string> = {
  invalid_domain: 'Email tidak diizinkan. Gunakan email Google Workspace dengan domain perusahaan.',
  user_inactive: 'Akun Anda telah dinonaktifkan oleh administrator.',
  oauth_failed: 'Gagal melakukan verifikasi dengan Google.',
  oauth_init_failed: 'Gagal menginisialisasi login Google.',
  oauth_exchange_failed: 'Gagal menukar kode otentikasi Google.',
  registration_failed: 'Gagal mendaftarkan akun baru.',
  missing_code: 'Kode otentikasi Google tidak ditemukan.',
  invalid_mock_code: 'Kode otentikasi lokal tidak valid.',
  not_invited: 'Email Anda belum terdaftar atau diundang oleh administrator.',
};

export function LoginForm({ cloudMode, devLoginAllowed = false, companyDomain = 'anima.id' }: { cloudMode: boolean; devLoginAllowed?: boolean; companyDomain?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [busy, setBusy] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

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

  const handleCodeLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy('code');
    setLocalError(null);
    try {
      await apiPost('/auth/code-login', { code: code.trim() });
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      if (err.message === 'user_inactive') {
        setLocalError('Akun Anda telah dinonaktifkan oleh administrator.');
      } else {
        setLocalError('Kode akses salah atau tidak terdaftar.');
      }
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

        {(localError || error) && (
          <div style={{
            background: 'var(--danger-soft)',
            color: 'var(--danger)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            fontSize: '13px',
            marginBottom: 'var(--space-2)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <span>⚠️</span>
            <span>{localError || errorMsgs[error!] || 'Terjadi kesalahan saat login.'}</span>
          </div>
        )}

        <form onSubmit={handleCodeLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
          <p className="login-sub">
            Masukkan kode PIN atau akses Anda untuk masuk ke platform.
          </p>
          <input
            type="text"
            className="input"
            placeholder="Masukkan Kode PIN / Akses"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setLocalError(null);
            }}
            disabled={busy !== ''}
          />
          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            disabled={busy !== '' || !code.trim()}
          >
            {busy === 'code' ? 'Masuk…' : 'Masuk ke Dashboard'}
          </button>
        </form>

        {devLoginAllowed && (
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
            <p className="login-sub" style={{ marginBottom: 'var(--space-2)' }}>
              Developer Bypass (Mode Lokal):
            </p>
            <div className="login-role-grid">
              {(['staff', 'manager', 'admin'] as Role[]).map((r) => (
                <button key={r} className={'login-google login-role ' + (busy === r ? 'busy' : '')} onClick={() => loginAs(r)} disabled={!!busy}>
                  <span className="login-role-name">{busy === r ? 'Masuk…' : `Masuk sebagai ${r}`}</span>
                  <span className="login-magic-arrow">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="login-foot">
          <div className="login-foot-item"><span className="dot dot-positive" /> Kode Akses PIN · login internal</div>
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

