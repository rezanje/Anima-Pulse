'use client';
// ============================================================
// Anima Pulse — KOL Hub list + filter + ROI drawer + add form
// ============================================================
import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Kol, Role } from '@/lib/repo/types';
import { KOL_NICHES } from '@/lib/repo/seed';
import { calcCPV, calcCPE } from '@/lib/er';
import { fmtNum, fmtRupiah } from '@/lib/format';
import { apiPost } from '@/lib/client';
import { kolSchema } from '@/lib/validation/kol';
import {
  Avatar, Button, PlatformBadge, StatusPill, Tabs, SectionHead, Field, Toast,
} from '@/components/widgets';
import { I } from '@/components/icons';

// ---- helpers ----
function statusTone(s: string) {
  if (s === 'active') return 'positive';
  if (s === 'prospect') return 'info';
  if (s === 'negotiating') return 'warning';
  if (s === 'blacklist') return 'danger';
  return 'neutral';
}
function statusLabel(s: string) {
  const MAP: Record<string, string> = {
    active: 'Aktif',
    prospect: 'Prospek',
    negotiating: 'Negosiasi',
    blacklist: 'Blacklist',
  };
  return MAP[s] ?? s;
}

// ---- ROI Drawer ----
function RoiDrawer({
  onClose,
  benchmarkCpvAvg,
}: {
  onClose: () => void;
  benchmarkCpvAvg: number;
}) {
  const [rate, setRate] = useState(1_000_000);
  const [estViews, setEstViews] = useState(100_000);
  const [estER, setEstER] = useState(5.0);

  const estEngagement = Math.round((estViews * estER) / 100);
  const cpv = calcCPV(rate, estViews);
  const cpe = calcCPE(rate, estEngagement);
  const cpvDelta = benchmarkCpvAvg > 0 ? ((cpv - benchmarkCpvAvg) / benchmarkCpvAvg) * 100 : 0;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <div className="eyebrow">ROI Calculator · CPV &amp; CPE</div>
            <h3 className="card-h">Simulasikan biaya hire KOL</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>{I.close}</button>
        </div>

        <div className="roi-inputs">
          <Field label="Harga per konten" suffix="IDR">
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="input input-mono"
            />
          </Field>
          <Field label="Estimasi views" suffix="views">
            <input
              type="number"
              value={estViews}
              onChange={(e) => setEstViews(Number(e.target.value))}
              className="input input-mono"
            />
          </Field>
          <Field label="Estimasi ER" suffix="%">
            <input
              type="number"
              step="0.1"
              value={estER}
              onChange={(e) => setEstER(Number(e.target.value))}
              className="input input-mono"
            />
          </Field>
        </div>

        <div className="roi-results">
          <div className="roi-result">
            <div className="eyebrow">CPV · Cost per view</div>
            <div className="roi-result-val mono-num">Rp {cpv.toFixed(0)}</div>
            <div className={'roi-result-bench ' + (cpvDelta < 0 ? 'good' : 'bad')}>
              {cpvDelta < 0 ? '↓' : '↑'} {Math.abs(cpvDelta).toFixed(0)}% vs benchmark database (Rp {benchmarkCpvAvg.toFixed(0)})
            </div>
          </div>
          <div className="roi-result">
            <div className="eyebrow">CPE · Cost per engagement</div>
            <div className="roi-result-val mono-num">Rp {cpe.toFixed(0)}</div>
            <div className="roi-result-bench">
              Estimasi {fmtNum(estEngagement)} engagement
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Add KOL Drawer ----
function AddKolDrawer({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    handle: '',
    platform: 'tiktok' as 'tiktok' | 'instagram',
    niche: [] as string[],
    followers: 0,
    avgViews: 0,
    avgER: 0,
    ratePerContent: 0,
    status: 'prospect' as 'prospect' | 'negotiating' | 'active' | 'blacklist',
    contact: { wa: '', email: '' },
    notes: '',
  });

  const toggleNiche = (n: string) => {
    setForm((f) => ({
      ...f,
      niche: f.niche.includes(n) ? f.niche.filter((x) => x !== n) : [...f.niche, n],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = kolSchema.safeParse({
      ...form,
      followers: Number(form.followers),
      avgViews: Number(form.avgViews),
      avgER: Number(form.avgER),
      ratePerContent: Number(form.ratePerContent),
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Validasi gagal');
      return;
    }
    setLoading(true);
    try {
      await apiPost('/kol', parsed.data);
      onSuccess('KOL berhasil ditambahkan');
      router.refresh();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'error';
      setError(msg === 'duplicate_handle' ? 'Handle sudah terdaftar di platform ini' : 'Gagal menyimpan KOL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer drawer-wide" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <div className="eyebrow">KOL Hub</div>
            <h3 className="card-h">Tambah KOL Baru</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>{I.close}</button>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          <Field label="Nama KOL">
            <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </Field>
          <div className="form-row">
            <Field label="Handle">
              <input className="input" placeholder="@namahandle" value={form.handle} onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))} required />
            </Field>
            <Field label="Platform">
              <select className="select" value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value as 'tiktok' | 'instagram' }))}>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
              </select>
            </Field>
          </div>
          <div className="form-row">
            <Field label="Followers">
              <input className="input input-mono" type="number" min={0} value={form.followers} onChange={(e) => setForm((f) => ({ ...f, followers: Number(e.target.value) }))} />
            </Field>
            <Field label="Rata-rata views">
              <input className="input input-mono" type="number" min={0} value={form.avgViews} onChange={(e) => setForm((f) => ({ ...f, avgViews: Number(e.target.value) }))} />
            </Field>
          </div>
          <div className="form-row">
            <Field label="Avg ER (%)">
              <input className="input input-mono" type="number" step="0.1" min={0} value={form.avgER} onChange={(e) => setForm((f) => ({ ...f, avgER: Number(e.target.value) }))} />
            </Field>
            <Field label="Rate per konten (Rp)">
              <input className="input input-mono" type="number" min={0} value={form.ratePerContent} onChange={(e) => setForm((f) => ({ ...f, ratePerContent: Number(e.target.value) }))} />
            </Field>
          </div>
          <Field label="Status">
            <select className="select" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof form.status }))}>
              <option value="prospect">Prospek</option>
              <option value="negotiating">Negosiasi</option>
              <option value="active">Aktif</option>
              <option value="blacklist">Blacklist</option>
            </select>
          </Field>
          <div className="form-row">
            <Field label="WhatsApp">
              <input className="input" value={form.contact.wa} onChange={(e) => setForm((f) => ({ ...f, contact: { ...f.contact, wa: e.target.value } }))} />
            </Field>
            <Field label="Email">
              <input className="input" type="email" value={form.contact.email} onChange={(e) => setForm((f) => ({ ...f, contact: { ...f.contact, email: e.target.value } }))} />
            </Field>
          </div>
          <div className="field">
            <span className="field-label">Niche</span>
            <div className="niche-select-grid">
              {KOL_NICHES.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={'niche-pill ' + (form.niche.includes(n) ? 'active' : '')}
                  onClick={() => toggleNiche(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <Field label="Catatan">
            <textarea className="input textarea" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
          {error && <div className="field-error">{error}</div>}
          <Button type="submit" variant="primary" full disabled={loading}>
            {loading ? 'Menyimpan…' : 'Simpan KOL'}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ---- Main KolList component ----
export function KolList({
  kols,
  role,
  benchmarkCpvAvg,
}: {
  kols: Kol[];
  role: Role;
  benchmarkCpvAvg: number;
}) {
  const canSeeRate = role !== 'staff';

  const [q, setQ] = useState('');
  const [platform, setPlatform] = useState<'all' | 'tiktok' | 'instagram'>('all');
  const [niche, setNiche] = useState('all');
  const [status, setStatus] = useState('all');
  const [showRoi, setShowRoi] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState('');

  const statusTabs = useMemo(() => [
    { id: 'all', label: 'Semua', count: kols.length },
    { id: 'prospect', label: 'Prospek', count: kols.filter((k) => k.status === 'prospect').length },
    { id: 'negotiating', label: 'Negosiasi', count: kols.filter((k) => k.status === 'negotiating').length },
    { id: 'active', label: 'Aktif', count: kols.filter((k) => k.status === 'active').length },
    { id: 'blacklist', label: 'Blacklist', count: kols.filter((k) => k.status === 'blacklist').length },
  ], [kols]);

  const filtered = useMemo(() => {
    return kols.filter((k) => {
      if (q && !(k.name + k.handle).toLowerCase().includes(q.toLowerCase())) return false;
      if (platform !== 'all' && k.platform !== platform) return false;
      if (niche !== 'all' && !k.niche.includes(niche)) return false;
      if (status !== 'all' && k.status !== status) return false;
      return true;
    });
  }, [kols, q, platform, niche, status]);

  const onToast = useCallback((msg: string) => setToast(msg), []);

  return (
    <div className="screen screen-kol">
      <header className="screen-head">
        <div>
          <div className="eyebrow">KOL &amp; Affiliator Hub</div>
          <h1 className="screen-title">Database KOL</h1>
          <p className="screen-sub">
            {kols.length} kreator terdaftar · {kols.filter((k) => k.status === 'active').length} aktif kerja sama. Cari, filter, hitung ROI sebelum hire.
          </p>
        </div>
        <div className="head-actions">
          <Button variant="outline" icon={I.pulse} onClick={() => setShowRoi(true)}>
            Kalkulator ROI
          </Button>
          {canSeeRate && (
            <Button variant="primary" icon={I.plus} onClick={() => setShowAdd(true)}>
              Tambah KOL
            </Button>
          )}
        </div>
      </header>

      <div className="kol-toolbar">
        <Tabs value={status} onChange={setStatus} tabs={statusTabs} />
        <div className="toolbar-right">
          <div className="search-input">
            {I.search}
            <input
              placeholder="Cari nama atau handle…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="kol-filters">
        <div className="seg-control">
          <button className={platform === 'all' ? 'active' : ''} onClick={() => setPlatform('all')}>Semua platform</button>
          <button className={platform === 'tiktok' ? 'active' : ''} onClick={() => setPlatform('tiktok')}>TikTok</button>
          <button className={platform === 'instagram' ? 'active' : ''} onClick={() => setPlatform('instagram')}>Instagram</button>
        </div>
        <select className="select" value={niche} onChange={(e) => setNiche(e.target.value)}>
          <option value="all">Semua niche</option>
          {KOL_NICHES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="kol-grid">
        {filtered.map((k) => {
          const cpv = canSeeRate && k.avgViews > 0 ? calcCPV(k.ratePerContent, k.avgViews) : null;
          const cpe = canSeeRate && k.avgViews > 0 && k.avgER > 0
            ? calcCPE(k.ratePerContent, Math.round((k.avgViews * k.avgER) / 100))
            : null;
          return (
            <Link href={`/kol/${k.id}`} key={k.id} className="kol-card-link">
              <article className="kol-card">
                <div className="kol-card-head">
                  <Avatar user={{ name: k.name, avatar: k.name.split(' ').map((w) => w[0]).slice(0, 2).join('') }} size={44} />
                  <div className="kol-card-id">
                    <div className="kol-card-name">{k.name}</div>
                    <div className="kol-card-handle">
                      {k.handle} · <PlatformBadge platform={k.platform} />
                    </div>
                  </div>
                  <StatusPill tone={statusTone(k.status)}>{statusLabel(k.status)}</StatusPill>
                </div>
                <div className="kol-niche">
                  {k.niche.map((n) => (
                    <span key={n} className="niche-pill">{n}</span>
                  ))}
                </div>
                <div className="kol-metrics">
                  <div className="kol-metric">
                    <span className="eyebrow">Followers</span>
                    <span className="mono-num kol-metric-v">{fmtNum(k.followers)}</span>
                  </div>
                  <div className="kol-metric">
                    <span className="eyebrow">Avg views</span>
                    <span className="mono-num kol-metric-v">{fmtNum(k.avgViews)}</span>
                  </div>
                  <div className="kol-metric">
                    <span className="eyebrow">Avg ER</span>
                    <span className="mono-num kol-metric-v">
                      {k.avgER.toFixed(1)}<span className="kol-unit">%</span>
                    </span>
                  </div>
                  {canSeeRate ? (
                    <div className="kol-metric kol-metric-rate">
                      <span className="eyebrow">Rate / konten</span>
                      <span className="mono-num kol-metric-v">{fmtRupiah(k.ratePerContent)}</span>
                    </div>
                  ) : (
                    <div className="kol-metric kol-metric-gated">
                      <span className="eyebrow">Rate / konten</span>
                      <span className="kol-gated">🔒 Restricted</span>
                    </div>
                  )}
                </div>
                {canSeeRate && cpv !== null && (
                  <div className="kol-foot">
                    <span className="eyebrow">CPV</span>
                    <span className="mono-num">Rp {cpv.toFixed(0)}</span>
                    {cpe !== null && (
                      <>
                        <span className="kol-foot-sep">·</span>
                        <span className="eyebrow">CPE</span>
                        <span className="mono-num">Rp {cpe.toFixed(0)}</span>
                      </>
                    )}
                  </div>
                )}
              </article>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-title">Tidak ada KOL ditemukan</div>
          <div className="empty-sub">Coba sesuaikan filter atau kata kunci pencarian.</div>
        </div>
      )}

      {showRoi && (
        <RoiDrawer benchmarkCpvAvg={benchmarkCpvAvg} onClose={() => setShowRoi(false)} />
      )}
      {showAdd && (
        <AddKolDrawer onClose={() => setShowAdd(false)} onSuccess={onToast} />
      )}

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
