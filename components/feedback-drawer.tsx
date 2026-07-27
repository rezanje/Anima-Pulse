'use client';
// ============================================================
// Anima Pulse — Lapor & Masukan drawer
// Any role reports a bug / suggestion / question without leaving the
// page they are on, so the originating pathname is captured for free.
// Admin gets an extra tab to triage every report.
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { api, apiPost, apiPut } from '@/lib/client';
import { Button, Field, Toast } from '@/components/widgets';
import { I } from '@/components/icons';
import type { FeedbackReport, FeedbackStatus, FeedbackType, FeedbackUrgency } from '@/lib/repo/types';

const TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'bug', label: 'Bug / error' },
  { value: 'saran', label: 'Saran' },
  { value: 'pertanyaan', label: 'Pertanyaan' },
];
const URGENCIES: { value: FeedbackUrgency; label: string }[] = [
  { value: 'rendah', label: 'Rendah' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'tinggi', label: 'Tinggi' },
];
const STATUSES: FeedbackStatus[] = ['baru', 'diproses', 'selesai', 'ditolak'];
const STATUS_LABEL: Record<FeedbackStatus, string> = {
  baru: 'Baru', diproses: 'Diproses', selesai: 'Selesai', ditolak: 'Ditolak',
};

const EMPTY = { type: 'bug' as FeedbackType, urgency: 'sedang' as FeedbackUrgency, description: '' };

function ReportCard({ report, canManage, onStatus }: {
  report: FeedbackReport;
  canManage: boolean;
  onStatus: (id: string, status: FeedbackStatus) => void;
}) {
  return (
    <div className="fb-card">
      <div className="fb-card-top">
        <span className={'fb-tag fb-type-' + report.type}>{report.type}</span>
        <span className={'fb-tag fb-urg-' + report.urgency}>{report.urgency}</span>
        <span className={'fb-tag fb-status-' + report.status}>{STATUS_LABEL[report.status]}</span>
      </div>
      <p className="fb-desc">{report.description}</p>
      <div className="fb-meta">
        {canManage && <span className="fb-meta-name">{report.userName}</span>}
        {report.page && <span className="fb-meta-page">{report.page}</span>}
        <span>{new Date(report.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
      {canManage && (
        <div className="fb-status-row">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={'niche-pill ' + (report.status === s ? 'active' : '')}
              onClick={() => onStatus(report.id, s)}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FeedbackDrawer({ canManage, onClose, onCountChange }: {
  canManage: boolean;
  onClose: () => void;
  onCountChange?: (delta: number) => void;
}) {
  const pathname = usePathname();
  const [tab, setTab] = useState<'new' | 'mine' | 'all'>('new');
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [reports, setReports] = useState<FeedbackReport[] | null>(null);

  const load = useCallback(async (scope: 'mine' | 'all') => {
    setReports(null);
    try {
      setReports(await api<FeedbackReport[]>('/feedback' + (scope === 'all' ? '?scope=all' : '')));
    } catch (err) {
      setReports([]);
      setToast(err instanceof Error ? err.message : 'Gagal memuat laporan');
    }
  }, []);

  useEffect(() => {
    if (tab === 'mine') load('mine');
    if (tab === 'all') load('all');
  }, [tab, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.description.trim().length < 10) {
      setError('Ceritakan minimal 10 karakter biar kebayang masalahnya');
      return;
    }
    setSaving(true);
    try {
      await apiPost<FeedbackReport>('/feedback', {
        type: form.type,
        urgency: form.urgency,
        description: form.description.trim(),
        page: pathname,
      });
      setForm(EMPTY);
      setToast('Laporan terkirim — makasih!');
      onCountChange?.(1);
      setTab('mine');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim laporan');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, status: FeedbackStatus) => {
    const before = reports?.find((r) => r.id === id)?.status;
    if (before === status) return;
    try {
      const updated = await apiPut<FeedbackReport>(`/feedback/${id}`, { status });
      setReports((prev) => (prev ?? []).map((r) => (r.id === id ? updated : r)));
      // the sidebar badge counts 'baru' only
      if (before === 'baru' && status !== 'baru') onCountChange?.(-1);
      if (before !== 'baru' && status === 'baru') onCountChange?.(1);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Gagal mengubah status');
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer drawer-wide" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <div className="eyebrow">Kirim ke developer</div>
            <h3 className="card-h">Lapor &amp; Masukan</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Tutup">{I.close}</button>
        </div>

        <div className="fb-tabs">
          <button type="button" className={'fb-tab ' + (tab === 'new' ? 'active' : '')} onClick={() => setTab('new')}>Lapor baru</button>
          <button type="button" className={'fb-tab ' + (tab === 'mine' ? 'active' : '')} onClick={() => setTab('mine')}>Laporan saya</button>
          {canManage && (
            <button type="button" className={'fb-tab ' + (tab === 'all' ? 'active' : '')} onClick={() => setTab('all')}>Semua laporan</button>
          )}
        </div>

        {tab === 'new' && (
          <form className="form-stack" onSubmit={submit}>
            <Field label="Tipe" hint="ini masalah atau masukan?">
              <div className="niche-select-grid">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={'niche-pill ' + (form.type === t.value ? 'active' : '')}
                    onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Urgensi" hint="seberapa ganggu kerjaan kamu">
              <div className="niche-select-grid">
                {URGENCIES.map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    className={'niche-pill ' + (form.urgency === u.value ? 'active' : '')}
                    onClick={() => setForm((f) => ({ ...f, urgency: u.value }))}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Ceritain masalahnya" hint="makin detail makin cepat dibenerin">
              <textarea
                className="input"
                rows={6}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Contoh: pas klik Simpan di Content Plan, datanya gak kesimpen dan halamannya diam aja."
              />
            </Field>
            <p className="fb-page-note">Halaman <code>{pathname}</code> otomatis ikut terkirim.</p>
            {error && <p className="field-error">{error}</p>}
            <Button type="submit" disabled={saving} full>{saving ? 'Mengirim…' : 'Kirim laporan'}</Button>
          </form>
        )}

        {tab !== 'new' && (
          <div className="fb-list">
            {reports === null && <p className="empty-state">Memuat…</p>}
            {reports?.length === 0 && (
              <p className="empty-state">
                {tab === 'mine' ? 'Kamu belum pernah kirim laporan.' : 'Belum ada laporan masuk.'}
              </p>
            )}
            {reports?.map((r) => (
              <ReportCard key={r.id} report={r} canManage={canManage && tab === 'all'} onStatus={setStatus} />
            ))}
          </div>
        )}

        <Toast message={toast} onDone={() => setToast('')} />
      </div>
    </div>
  );
}
