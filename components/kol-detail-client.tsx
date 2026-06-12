'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Kol, KolGrowthEntry, Role } from '@/lib/repo/types';
import { calcCPV, calcCPE } from '@/lib/er';
import { fmtNum, fmtRupiah } from '@/lib/format';
import { apiPut, apiPost } from '@/lib/client';
import { kolEditSchema, growthSchema } from '@/lib/validation/kol';
import {
  Avatar,
  Button,
  PlatformBadge,
  StatusPill,
  Field,
  Toast,
  GrowthChart,
} from '@/components/widgets';
import { I } from '@/components/icons';
import { KOL_NICHES } from '@/lib/repo/seed';

interface Props {
  initialKol: Kol;
  growthHistory: KolGrowthEntry[];
  benchmarkCpvAvg: number;
  role: Role;
}

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

export function KolDetailClient({
  initialKol,
  growthHistory: initialGrowthHistory,
  benchmarkCpvAvg,
  role,
}: Props) {
  const router = useRouter();
  const [kol, setKol] = useState<Kol>(initialKol);
  const [growthList, setGrowthList] = useState<KolGrowthEntry[]>(initialGrowthHistory);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [showAddGrowth, setShowAddGrowth] = useState(false);
  const [toast, setToast] = useState('');
  
  const canEdit = role !== 'staff';

  // State for Add Growth Form
  const [growthForm, setGrowthForm] = useState({
    followers: '',
    date: new Date().toISOString().slice(0, 7), // YYYY-MM
  });
  const [growthError, setGrowthError] = useState('');
  const [growthLoading, setGrowthLoading] = useState(false);

  // State for Edit KOL Form
  const [editForm, setEditForm] = useState({
    name: kol.name,
    handle: kol.handle,
    platform: kol.platform,
    niche: kol.niche,
    followers: kol.followers,
    avgViews: kol.avgViews,
    avgER: kol.avgER,
    ratePerContent: kol.ratePerContent,
    status: kol.status,
    contact: { wa: kol.contact.wa, email: kol.contact.email },
    notes: kol.notes,
  });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Growth history sorted by date for chart
  const chartData = useMemo(() => {
    const combined = [
      ...growthList.map((g) => ({ date: g.date, followers: g.followers })),
      // Include current follower state if not already present
      ...(growthList.some((g) => g.date === new Date().toISOString().slice(0, 7))
        ? []
        : [{ date: 'Sekarang', followers: kol.followers }]),
    ];
    return combined.sort((a, b) => a.date.localeCompare(b.date));
  }, [growthList, kol.followers]);

  // CPV and CPE calculations
  const cpv = calcCPV(kol.ratePerContent, kol.avgViews);
  const cpe = calcCPE(kol.ratePerContent, Math.round((kol.avgViews * kol.avgER) / 100));
  const cpvDelta = benchmarkCpvAvg > 0 ? ((cpv - benchmarkCpvAvg) / benchmarkCpvAvg) * 100 : 0;

  // Toggle niche in edit form
  const toggleEditNiche = (n: string) => {
    setEditForm((f) => ({
      ...f,
      niche: f.niche.includes(n) ? f.niche.filter((x) => x !== n) : [...f.niche, n],
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    const parsed = kolEditSchema.safeParse({
      ...editForm,
      followers: Number(editForm.followers),
      avgViews: Number(editForm.avgViews),
      avgER: Number(editForm.avgER),
      ratePerContent: Number(editForm.ratePerContent),
    });
    if (!parsed.success) {
      setEditError(parsed.error.errors[0]?.message ?? 'Validasi gagal');
      return;
    }
    setEditLoading(true);
    try {
      const updated = await apiPut<Kol>(`/kol/${kol.id}`, parsed.data);
      setKol(updated);
      setToast('Profil KOL berhasil diupdate');
      setShowEditDrawer(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'error';
      setEditError(msg === 'duplicate_handle' ? 'Handle sudah terdaftar di platform ini' : 'Gagal menyimpan perubahan');
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddGrowthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrowthError('');
    const parsed = growthSchema.safeParse({
      followers: Number(growthForm.followers),
      date: growthForm.date,
    });
    if (!parsed.success) {
      setGrowthError(parsed.error.errors[0]?.message ?? 'Validasi gagal');
      return;
    }
    setGrowthLoading(true);
    try {
      const entry = await apiPost<KolGrowthEntry>(`/kol/${kol.id}/growth`, parsed.data);
      setGrowthList((prev) => [...prev, entry]);
      setToast('Riwayat pertumbuhan berhasil ditambahkan');
      setGrowthForm({ followers: '', date: new Date().toISOString().slice(0, 7) });
      setShowAddGrowth(false);
      router.refresh();
    } catch (err: unknown) {
      setGrowthError('Gagal menambahkan riwayat pertumbuhan');
    } finally {
      setGrowthLoading(false);
    }
  };

  return (
    <div className="screen screen-kol-detail">
      <Toast message={toast} onDone={() => setToast('')} />

      <Link href="/kol" className="back-link">
        ← KEMBALI KE DATABASE KOL
      </Link>

      <header className="kol-detail-head">
        <div className="kdh-id">
          <div className="kdh-name-row">
            <h1 className="screen-title">{kol.name}</h1>
            <StatusPill tone={statusTone(kol.status)}>{statusLabel(kol.status)}</StatusPill>
          </div>
          <div className="kdh-handle">
            <PlatformBadge platform={kol.platform} />
            <span>·</span>
            <span>@{kol.handle}</span>
          </div>
          <div className="kdh-niche">
            {kol.niche.map((n) => (
              <span key={n} className="niche-pill">{n}</span>
            ))}
          </div>
        </div>

        {canEdit && (
          <div className="kdh-actions">
            <Button variant="outline" onClick={() => setShowEditDrawer(true)} icon={I.settings}>
              Edit KOL
            </Button>
          </div>
        )}
      </header>

      <div className="kdetail-grid">
        {/* Followers Growth Chart & History */}
        <article className="card card-growth">
          <div className="card-head">
            <div>
              <h3 className="card-h">Pertumbuhan Followers</h3>
              <span className="card-sub">Visualisasi historis total pengikut</span>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" icon={I.plus} onClick={() => setShowAddGrowth(true)}>
                Tambah Record
              </Button>
            )}
          </div>

          <div className="growth-chart-wrap">
            <GrowthChart data={chartData} />
          </div>

          <div className="growth-table">
            <div className="growth-row" style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
              <span>Bulan</span>
              <span>Jumlah Followers</span>
              <span>Dicatat Oleh</span>
            </div>
            {[...growthList]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((g) => (
                <div key={g.id} className="growth-row">
                  <span className="mono-num">{g.date}</span>
                  <span className="mono-num" style={{ fontWeight: 500 }}>{fmtNum(g.followers)}</span>
                  <span className="mono-num">{g.recordedBy || 'System'}</span>
                </div>
              ))}
          </div>
        </article>

        {/* ROI Calculator Card */}
        <article className="card card-roi">
          <h3 className="card-h">Kalkulator ROI &amp; Biaya</h3>
          <span className="card-sub">Analisis efisiensi biaya berdasarkan engagement</span>

          <div className="roi-inputs" style={{ padding: '0 0 var(--space-3)' }}>
            <div className="bench-row" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <span>Followers saat ini</span>
              <span className="mono-num" style={{ fontWeight: 500 }}>{fmtNum(kol.followers)}</span>
            </div>
            <div className="bench-row" style={{ borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
              <span>Rata-rata views</span>
              <span className="mono-num" style={{ fontWeight: 500 }}>{fmtNum(kol.avgViews)}</span>
            </div>
            <div className="bench-row" style={{ borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
              <span>Rata-rata ER</span>
              <span className="mono-num" style={{ fontWeight: 500 }}>{kol.avgER.toFixed(2)}%</span>
            </div>
            {role !== 'staff' && (
              <div className="bench-row" style={{ padding: '12px 0' }}>
                <span>Harga per konten</span>
                <span className="mono-num" style={{ fontWeight: 500 }}>{fmtRupiah(kol.ratePerContent)}</span>
              </div>
            )}
          </div>

          {role !== 'staff' ? (
            <div className="roi-results" style={{ gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
              <div className="roi-result" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div className="eyebrow">CPV · Cost per view</div>
                <div className="roi-result-val mono-num">Rp {cpv.toFixed(0)}</div>
                <div className={'roi-result-bench ' + (cpvDelta < 0 ? 'good' : 'bad')}>
                  {cpvDelta < 0 ? '↓' : '↑'} {Math.abs(cpvDelta).toFixed(0)}% vs database benchmark (Rp {benchmarkCpvAvg.toFixed(0)})
                </div>
              </div>
              <div className="roi-result">
                <div className="eyebrow">CPE · Cost per engagement</div>
                <div className="roi-result-val mono-num">Rp {cpe.toFixed(0)}</div>
                <div className="roi-result-bench">
                  Estimasi {fmtNum(Math.round((kol.avgViews * kol.avgER) / 100))} engagement per postingan
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-3)' }}>
              Biaya dan detail ROI tersembunyi untuk akun Staff.
            </div>
          )}
        </article>

        {/* Notes Card */}
        <article className="card card-notes">
          <h3 className="card-h">Catatan Khusus</h3>
          {kol.notes ? (
            <div className="notes-body">{kol.notes}</div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-3)' }}>
              Tidak ada catatan tambahan untuk KOL ini.
            </div>
          )}
        </article>

        {/* Contact Details Card */}
        <article className="card card-contact">
          <h3 className="card-h">Informasi Kontak</h3>
          <div className="contact-list">
            <div className="contact-row">
              <span>WhatsApp</span>
              <span className="mono-num">{kol.contact.wa || '—'}</span>
            </div>
            <div className="contact-row">
              <span>Email</span>
              <span className="mono-num">{kol.contact.email || '—'}</span>
            </div>
            <div className="contact-row">
              <span>Ditambahkan Oleh</span>
              <span className="mono-num">{kol.createdBy || 'System'}</span>
            </div>
          </div>
        </article>
      </div>

      {/* Add Growth Modal Drawer */}
      {showAddGrowth && (
        <div className="drawer-overlay" onClick={() => setShowAddGrowth(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <div className="eyebrow">Growth History</div>
                <h3 className="card-h">Tambah Data Pertumbuhan</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddGrowth(false)}>
                {I.close}
              </button>
            </div>

            <form onSubmit={handleAddGrowthSubmit} className="form-stack" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Field label="Jumlah Followers">
                <input
                  type="number"
                  required
                  className="input input-mono"
                  value={growthForm.followers}
                  onChange={(e) => setGrowthForm((f) => ({ ...f, followers: e.target.value }))}
                  placeholder="Contoh: 150000"
                />
              </Field>
              <Field label="Bulan Pencatatan" hint="Format YYYY-MM">
                <input
                  type="month"
                  required
                  className="input input-mono"
                  value={growthForm.date}
                  onChange={(e) => setGrowthForm((f) => ({ ...f, date: e.target.value }))}
                />
              </Field>
              {growthError && <div className="field-error">{growthError}</div>}
              <Button type="submit" variant="primary" full disabled={growthLoading}>
                {growthLoading ? 'Menyimpan…' : 'Simpan data'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Edit KOL Modal Drawer */}
      {showEditDrawer && (
        <div className="drawer-overlay" onClick={() => setShowEditDrawer(false)}>
          <div className="drawer drawer-wide" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <div className="eyebrow">Database KOL</div>
                <h3 className="card-h">Edit Detail Profil KOL</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEditDrawer(false)}>
                {I.close}
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="form-stack" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Field label="Nama KOL">
                <input
                  className="input"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </Field>
              
              <div className="form-row" style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <Field label="Handle">
                  <input
                    className="input"
                    placeholder="@namahandle"
                    value={editForm.handle}
                    onChange={(e) => setEditForm((f) => ({ ...f, handle: e.target.value }))}
                    required
                  />
                </Field>
                <Field label="Platform">
                  <select
                    className="select"
                    value={editForm.platform}
                    onChange={(e) => setEditForm((f) => ({ ...f, platform: e.target.value as 'tiktok' | 'instagram' }))}
                  >
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </Field>
              </div>

              <div className="form-row" style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <Field label="Followers">
                  <input
                    className="input input-mono"
                    type="number"
                    min={0}
                    value={editForm.followers}
                    onChange={(e) => setEditForm((f) => ({ ...f, followers: Number(e.target.value) }))}
                  />
                </Field>
                <Field label="Rata-rata views">
                  <input
                    className="input input-mono"
                    type="number"
                    min={0}
                    value={editForm.avgViews ?? 0}
                    onChange={(e) => setEditForm((f) => ({ ...f, avgViews: Number(e.target.value) }))}
                  />
                </Field>
              </div>

              <div className="form-row" style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <Field label="Avg ER (%)">
                  <input
                    className="input input-mono"
                    type="number"
                    step="0.01"
                    min={0}
                    value={editForm.avgER ?? 0}
                    onChange={(e) => setEditForm((f) => ({ ...f, avgER: Number(e.target.value) }))}
                  />
                </Field>
                <Field label="Rate per konten (Rp)">
                  <input
                    className="input input-mono"
                    type="number"
                    min={0}
                    value={editForm.ratePerContent}
                    onChange={(e) => setEditForm((f) => ({ ...f, ratePerContent: Number(e.target.value) }))}
                  />
                </Field>
              </div>

              <Field label="Status">
                <select
                  className="select"
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as any }))}
                >
                  <option value="prospect">Prospek</option>
                  <option value="negotiating">Negosiasi</option>
                  <option value="active">Aktif</option>
                  <option value="blacklist">Blacklist</option>
                </select>
              </Field>

              <div className="form-row" style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <Field label="WhatsApp">
                  <input
                    className="input"
                    value={editForm.contact.wa}
                    onChange={(e) => setEditForm((f) => ({ ...f, contact: { ...f.contact, wa: e.target.value } }))}
                  />
                </Field>
                <Field label="Email">
                  <input
                    className="input"
                    type="email"
                    value={editForm.contact.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, contact: { ...f.contact, email: e.target.value } }))}
                  />
                </Field>
              </div>

              <div className="field">
                <span className="field-label">Niche</span>
                <div className="niche-select-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {KOL_NICHES.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={'niche-pill ' + (editForm.niche.includes(n) ? 'active' : '')}
                      onClick={() => toggleEditNiche(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Catatan">
                <textarea
                  className="input textarea"
                  rows={3}
                  value={editForm.notes ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </Field>

              {editError && <div className="field-error">{editError}</div>}
              <Button type="submit" variant="primary" full disabled={editLoading}>
                {editLoading ? 'Menyimpan…' : 'Simpan Perubahan'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
