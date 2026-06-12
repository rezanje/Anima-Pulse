'use client';
// ============================================================
// Anima Pulse — SubmitForm client component (Task 11)
// React Hook Form + Zod. Live ER preview (display only).
// On submit → POST /api/v1/content → Toast, reset.
// Ported layout from prototype ScreenSubmit.
// ============================================================
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { SubmissionInput } from '@/lib/validation/content';
import { submissionSchema } from '@/lib/validation/content';
import { calcER } from '@/lib/er';
import { apiPost, apiGet, apiPut } from '@/lib/client';
import { Field, Button, Toast, StatusPill, Tabs, PlatformBadge } from '@/components/widgets';
import { I } from '@/components/icons';
import type { Submission } from '@/lib/repo/types';
import { avgOf } from '@/lib/er';
import { fmtNum } from '@/lib/format';

const ER_TARGETS_DEFAULT = { tiktok: 7, instagram: 4 };

export function SubmitForm() {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);

  const [toast, setToast] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionInput>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      platform: 'tiktok',
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      followers: 0,
      title: '',
      url: '',
    },
  });

  const wViews = watch('views');
  const wLikes = watch('likes');
  const wComments = watch('comments');
  const wShares = watch('shares');
  const wPlatform = watch('platform');
  const wUrl = watch('url');

  const er = useMemo(() => {
    const v = Number(wViews), l = Number(wLikes), c = Number(wComments), sh = Number(wShares);
    if (!v || v <= 0) return null;
    return calcER({ likes: l, comments: c, shares: sh, views: v });
  }, [wViews, wLikes, wComments, wShares]);

  const target = ER_TARGETS_DEFAULT[wPlatform as 'tiktok' | 'instagram'] ?? 7;
  const erVerdict = er == null ? null : (er >= target ? 'good' : er >= target * 0.7 ? 'mid' : 'low');

  const urlValid = useMemo(() => {
    if (!wUrl) return null;
    const re = wPlatform === 'tiktok' ? /tiktok\.com/i : /instagram\.com/i;
    return re.test(wUrl);
  }, [wUrl, wPlatform]);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await apiGet<Submission[]>('/content');
      setSubmissions(data);
    } catch (err) {
      console.error('Gagal memuat riwayat:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onSubmit = async (data: SubmissionInput) => {
    setServerError(null);
    try {
      await apiPost('/content', data);
      setToast('Konten ter-submit. ER ' + (er?.toFixed(2) ?? '—') + '% tercatat di scorecard.');
      reset();
      fetchHistory(); // refresh submissions history count & list
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : 'unknown_error';
      if (code === 'duplicate_url') {
        setServerError('URL sudah pernah disubmit. Gunakan URL konten yang berbeda.');
      } else {
        setServerError('Gagal menyimpan: ' + code);
      }
    }
  };

  const handleEditSuccess = (updated: Submission) => {
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setToast('Submission berhasil diperbarui');
    fetchHistory();
  };

  // KPI calculations for staff
  const avgER = useMemo(() => avgOf(submissions.map((s) => s.er)), [submissions]);
  const bestContent = useMemo(() => {
    if (!submissions.length) return null;
    return submissions.reduce((best, s) => (s.er > best.er ? s : best), submissions[0]);
  }, [submissions]);

  const tabs = useMemo(() => [
    { id: 'form', label: 'Submit Konten Baru' },
    { id: 'history', label: 'Riwayat Submisi', count: submissions.length },
  ], [submissions.length]);

  return (
    <div className="screen screen-submit">
      <header className="screen-head">
        <div>
          <div className="eyebrow">Workspace · Staff media sosial</div>
          <h1 className="screen-title">Pekerjaan Saya</h1>
          <p className="screen-sub">
            Catat konten baru yang Anda rilis atau lihat performa submisi Anda sebelumnya.
          </p>
        </div>
      </header>

      <div className="submit-toolbar" style={{ marginBottom: 'var(--space-4)' }}>
        <Tabs value={activeTab} onChange={(id) => setActiveTab(id as any)} tabs={tabs} />
      </div>

      <Toast message={toast} onDone={() => setToast('')} />

      {activeTab === 'form' ? (
        <>
          {serverError && (
            <div className="alert alert-danger" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="submit-grid">
            <div className="card card-form">
              {/* Section 1: Konten */}
              <div className="form-section">
                <div className="form-section-head">
                  <span className="step-num">1</span>
                  <div>
                    <h3 className="card-h">Konten</h3>
                    <span className="card-sub">URL TikTok atau Instagram</span>
                  </div>
                </div>

                <Controller
                  name="platform"
                  control={control}
                  render={({ field }) => (
                    <div className="platform-toggle" role="tablist">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={field.value === 'tiktok'}
                        className={'pt-opt ' + (field.value === 'tiktok' ? 'active' : '')}
                        onClick={() => field.onChange('tiktok')}
                      >
                        {I.tiktok}<span>TikTok</span>
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={field.value === 'instagram'}
                        className={'pt-opt ' + (field.value === 'instagram' ? 'active' : '')}
                        onClick={() => field.onChange('instagram')}
                      >
                        {I.ig}<span>Instagram</span>
                      </button>
                    </div>
                  )}
                />

                <Field
                  label="Judul konten"
                  hint="deskripsi singkat"
                  error={errors.title?.message}
                >
                  <input
                    {...register('title')}
                    type="text"
                    className={'input' + (errors.title ? ' has-error' : '')}
                    placeholder="Misal: Tutorial skincare pagi hari"
                  />
                </Field>

                <Field
                  label="URL konten"
                  hint="paste link dari aplikasi"
                  error={errors.url?.message ?? (urlValid === false ? 'Format URL ' + wPlatform + ' tidak valid' : undefined)}
                >
                  <input
                    {...register('url')}
                    type="text"
                    className={'input ' + (urlValid === false ? 'has-error' : urlValid ? 'has-success' : '')}
                    placeholder={wPlatform === 'tiktok' ? 'https://tiktok.com/@username/video/...' : 'https://instagram.com/p/...'}
                  />
                </Field>
              </div>

              {/* Section 2: Metrik mentah */}
              <div className="form-section">
                <div className="form-section-head">
                  <span className="step-num">2</span>
                  <div>
                    <h3 className="card-h">Metrik mentah</h3>
                    <span className="card-sub">Ambil dari analytics platform pada saat snapshot</span>
                  </div>
                </div>

                <div className="form-grid-2">
                  <Field label="Views" hint="total tayangan" error={errors.views?.message}>
                    <input
                      {...register('views', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      className="input input-mono"
                      placeholder="0"
                    />
                  </Field>

                  <Field label="Followers saat posting" hint="untuk audit historis" error={errors.followers?.message}>
                    <input
                      {...register('followers', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      className="input input-mono"
                      placeholder="0"
                    />
                  </Field>

                  <Field label="Likes" error={errors.likes?.message}>
                    <input
                      {...register('likes', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      className="input input-mono"
                      placeholder="0"
                    />
                  </Field>

                  <Field label="Comments" error={errors.comments?.message}>
                    <input
                      {...register('comments', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      className="input input-mono"
                      placeholder="0"
                    />
                  </Field>

                  <Field label="Shares" error={errors.shares?.message}>
                    <input
                      {...register('shares', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      className="input input-mono"
                      placeholder="0"
                    />
                  </Field>
                </div>
              </div>

              <div className="form-foot">
                <span className="form-foot-hint">{I.clock} Edit window 1 jam aktif setelah submit</span>
                <div className="form-foot-actions">
                  <Button variant="outline" onClick={() => reset()}>Batal</Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isSubmitting}
                    icon={isSubmitting ? undefined : I.check}
                  >
                    {isSubmitting ? 'Menyimpan…' : 'Simpan submission'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Live ER preview panel */}
            <aside className="card card-preview">
              <div className="eyebrow">Preview · live</div>
              <h3 className="card-h">Engagement Rate</h3>
              <div className={'preview-er ' + (erVerdict || 'empty')}>
                <span className="mono-num preview-er-val">{er != null ? er.toFixed(2) : '0.00'}</span>
                <span className="preview-er-unit">%</span>
              </div>
              <div className="preview-formula mono-num">
                (likes + comments + shares) / views × 100
              </div>
              <div className="preview-bench">
                <div className="bench-row">
                  <span>Target {wPlatform === 'tiktok' ? 'TikTok' : 'Instagram'}</span>
                  <span className="mono-num">{target.toFixed(1)}%</span>
                </div>
                {er != null && (
                  <div className="bench-row">
                    <span>Selisih vs target</span>
                    <span className={'mono-num ' + (er >= target ? 'pos' : 'neg')}>
                      {er >= target ? '+' : ''}{(er - target).toFixed(2)} pt
                    </span>
                  </div>
                )}
              </div>

              <div className="preview-formula-detail">
                <div className="formula-line"><span>Likes</span><span className="mono-num">{Number(wLikes) || 0}</span></div>
                <div className="formula-line"><span>+ Comments</span><span className="mono-num">{Number(wComments) || 0}</span></div>
                <div className="formula-line"><span>+ Shares</span><span className="mono-num">{Number(wShares) || 0}</span></div>
                <div className="formula-line formula-divide"><span>÷ Views</span><span className="mono-num">{Number(wViews) || 0}</span></div>
                <div className="formula-line formula-result">
                  <span>= ER</span>
                  <span className="mono-num">{er != null ? er.toFixed(2) + '%' : '—'}</span>
                </div>
              </div>

              <div className="preview-verdict">
                {erVerdict === 'good' && <StatusPill tone="positive">Di atas target — kerja bagus!</StatusPill>}
                {erVerdict === 'mid' && <StatusPill tone="warning">Mendekati target — masih bisa dioptimasi</StatusPill>}
                {erVerdict === 'low' && <StatusPill tone="danger">Di bawah 70% target — perlu review konten</StatusPill>}
                {erVerdict === null && <span className="preview-empty-msg">Isi views &amp; engagement untuk lihat hasil</span>}
              </div>
            </aside>
          </form>
        </>
      ) : (
        /* History Dashboard Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* KPI Strip */}
          <div className="kpi-strip">
            <div className="kpi">
              <div className="eyebrow">Total Submisi</div>
              <div className="kpi-value mono-num">{submissions.length}</div>
              <div className="kpi-foot">semua waktu</div>
            </div>
            <div className="kpi">
              <div className="eyebrow">Rata-rata ER</div>
              <div className="kpi-value mono-num">
                {avgER.toFixed(2)}
                <span className="kpi-unit">%</span>
              </div>
              <div className="kpi-foot">kualitas performa</div>
            </div>
            <div className="kpi">
              <div className="eyebrow">ER Konten Terbaik</div>
              <div className="kpi-value mono-num">
                {bestContent ? bestContent.er.toFixed(2) : '—'}
                {bestContent && <span className="kpi-unit">%</span>}
              </div>
              <div className="kpi-foot">
                {bestContent ? bestContent.title.slice(0, 28) + '...' : 'belum ada data'}
              </div>
            </div>
          </div>

          <article className="card card-table">
            <div className="card-toolbar" style={{ paddingBottom: 'var(--space-3)' }}>
              <div>
                <h3 className="card-h">Daftar Pekerjaan</h3>
                <span className="card-sub">Semua konten yang telah Anda rekam</span>
              </div>
            </div>

            {loadingHistory ? (
              <div className="empty-state">Memuat riwayat pekerjaan…</div>
            ) : submissions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-title">Belum ada konten</div>
                <div className="empty-sub">Silakan gunakan form untuk mengirimkan pekerjaan pertama Anda.</div>
              </div>
            ) : (
              <div className="t-table">
                <div className="t-row t-head" style={{ gridTemplateColumns: '120px 2fr 1fr 1fr 1fr 1.5fr 1fr', gap: 'var(--space-3)' }}>
                  <span>Platform</span>
                  <span>Judul Konten</span>
                  <span>Views</span>
                  <span>Likes</span>
                  <span>ER</span>
                  <span>Tanggal Kirim</span>
                  <span>Aksi</span>
                </div>
                {submissions.map((s) => {
                  const isEditable = new Date(s.editableUntil) > new Date();
                  const erVerdict = s.er >= target ? 'positive' : s.er >= target * 0.7 ? 'warning' : 'danger';
                  return (
                    <div key={s.id} className="t-row" style={{ gridTemplateColumns: '120px 2fr 1fr 1fr 1fr 1.5fr 1fr', gap: 'var(--space-3)', alignItems: 'center' }}>
                      <span><PlatformBadge platform={s.platform} /></span>
                      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span className="t-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.title}>{s.title}</span>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="t-handle"
                          style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginTop: '2px' }}
                        >
                          Link Video {I.external}
                        </a>
                      </span>
                      <span className="mono-num t-cell-num">{fmtNum(s.views)}</span>
                      <span className="mono-num t-cell-num">{fmtNum(s.likes)}</span>
                      <span>
                        <StatusPill tone={erVerdict}>{s.er.toFixed(2)}%</StatusPill>
                      </span>
                      <span className="mono-num" style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {new Date(s.submittedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span>
                        {isEditable ? (
                          <Button variant="outline" size="sm" onClick={() => setEditingSubmission(s)}>
                            Edit
                          </Button>
                        ) : (
                          <span className="field-hint" style={{ fontSize: '11px' }}>Terkunci</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </div>
      )}

      {/* Edit Submission Modal overlay */}
      {editingSubmission && (
        <EditSubmissionModal
          submission={editingSubmission}
          onClose={() => setEditingSubmission(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

// standalone Edit Submission modal dialog
function EditSubmissionModal({
  submission,
  onClose,
  onSuccess,
}: {
  submission: Submission;
  onClose: () => void;
  onSuccess: (updated: Submission) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    title: submission.title,
    url: submission.url,
    views: submission.views,
    likes: submission.likes,
    comments: submission.comments,
    shares: submission.shares,
    followers: submission.followers,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Judul konten wajib diisi');
      return;
    }
    if (!form.url.trim()) {
      setError('URL konten wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const updated = await apiPut<Submission>(`/content/${submission.id}`, {
        ...form,
        views: Number(form.views),
        likes: Number(form.likes),
        comments: Number(form.comments),
        shares: Number(form.shares),
        followers: Number(form.followers),
      });
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'error';
      setError(msg === 'edit_window_closed' ? 'Waktu edit (1 jam setelah submit) telah kedaluwarsa.' : 'Gagal menyimpan perubahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer drawer-wide" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <div className="eyebrow">Edit Submission</div>
            <h3 className="card-h">Koreksi Data Metrik</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            {I.close}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-stack" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Field label="Judul Konten">
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </Field>
          
          <Field label="URL Konten">
            <input
              className="input"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              required
            />
          </Field>

          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Field label="Views">
              <input
                className="input input-mono"
                type="number"
                min={0}
                value={form.views}
                onChange={(e) => setForm((f) => ({ ...f, views: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Followers saat posting">
              <input
                className="input input-mono"
                type="number"
                min={0}
                value={form.followers}
                onChange={(e) => setForm((f) => ({ ...f, followers: Number(e.target.value) }))}
              />
            </Field>
          </div>

          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <Field label="Likes">
              <input
                className="input input-mono"
                type="number"
                min={0}
                value={form.likes}
                onChange={(e) => setForm((f) => ({ ...f, likes: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Comments">
              <input
                className="input input-mono"
                type="number"
                min={0}
                value={form.comments}
                onChange={(e) => setForm((f) => ({ ...f, comments: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Shares">
              <input
                className="input input-mono"
                type="number"
                min={0}
                value={form.shares}
                onChange={(e) => setForm((f) => ({ ...f, shares: Number(e.target.value) }))}
              />
            </Field>
          </div>

          {error && <div className="field-error">{error}</div>}
          <Button type="submit" variant="primary" full disabled={loading}>
            {loading ? 'Menyimpan…' : 'Simpan Perubahan'}
          </Button>
        </form>
      </div>
    </div>
  );
}
