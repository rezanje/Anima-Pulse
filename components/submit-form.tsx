'use client';
// ============================================================
// Anima Pulse — SubmitForm client component (Task 11)
// React Hook Form + Zod. Live ER preview (display only).
// On submit → POST /api/v1/content → Toast, reset.
// Ported layout from prototype ScreenSubmit.
// ============================================================
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { SubmissionInput } from '@/lib/validation/content';
import { submissionSchema } from '@/lib/validation/content';
import { calcER } from '@/lib/er';
import { apiPost } from '@/lib/client';
import { Field, Button, Toast, StatusPill } from '@/components/widgets';
import { I } from '@/components/icons';

const ER_TARGETS_DEFAULT = { tiktok: 7, instagram: 4 };

export function SubmitForm() {
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

  const onSubmit = async (data: SubmissionInput) => {
    setServerError(null);
    try {
      await apiPost('/content', data);
      setToast('Konten ter-submit. ER ' + (er?.toFixed(2) ?? '—') + '% tercatat di scorecard.');
      reset();
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : 'unknown_error';
      if (code === 'duplicate_url') {
        setServerError('URL sudah pernah disubmit. Gunakan URL konten yang berbeda.');
      } else {
        setServerError('Gagal menyimpan: ' + code);
      }
    }
  };

  return (
    <div className="screen screen-submit">
      <header className="screen-head">
        <div>
          <div className="eyebrow">Submit konten · Form</div>
          <h1 className="screen-title">Catat konten baru</h1>
          <p className="screen-sub">
            Isi metrik mentah — Engagement Rate dihitung otomatis di server. Edit terakhir dalam 1 jam.
          </p>
        </div>
      </header>

      {serverError && (
        <div className="alert alert-danger" role="alert">
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

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
