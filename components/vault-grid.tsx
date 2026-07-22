'use client';
// ============================================================
// Anima Pulse — FYP Vault grid + slide-over save form
// Ported from ScreenVault in src/screens-b.jsx.
// ============================================================
import { useState, useMemo, useCallback, useRef } from 'react';
import type { VaultItem, User, Platform } from '@/lib/repo/types';
import { VAULT_TAGS } from '@/lib/repo/seed';
import { Avatar, Button, PlatformBadge, Toast } from '@/components/widgets';
import { I } from '@/components/icons';
import { apiPost } from '@/lib/client';
import { fmtAgo } from '@/lib/format';

// --- helpers ---

function hoursAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

/** Pastel placeholder color from item id/color field. */
function thumbColor(item: VaultItem): string {
  if (item.color) return item.color;
  // generate a pastel hue from the item id
  let hash = 0;
  for (const ch of item.id) hash = hash * 31 + ch.charCodeAt(0);
  const hue = Math.abs(hash) % 360;
  return `oklch(0.88 0.06 ${hue})`;
}

// --- slide-over save form ---

interface SaveFormProps {
  onClose: () => void;
  onSaved: (item: VaultItem) => void;
}

function SaveForm({ onClose, onSaved }: SaveFormProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<Platform>('tiktok');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const allTags = useMemo(() => {
    const extra = customTag.trim() ? [customTag.trim()] : [];
    return [...VAULT_TAGS, ...extra.filter((t) => !VAULT_TAGS.includes(t))];
  }, [customTag]);

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!url || !/^https?:\/\/.+/.test(url)) errs.url = 'URL tidak valid';
    else if (!/tiktok\.com|instagram\.com|vt\.tiktok\.com|instagr\.am/.test(url))
      errs.url = 'URL harus link TikTok atau Instagram';
    if (!title.trim()) errs.title = 'Judul wajib diisi';
    if (selectedTags.length === 0) errs.tags = 'Pilih minimal 1 tag';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const item = await apiPost<VaultItem>('/vault', {
        url,
        title: title.trim(),
        platform,
        tags: selectedTags,
      });
      onSaved(item);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Gagal menyimpan' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer">
        <div className="drawer-head">
          <h2 className="card-h">Simpan konten baru</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup">
            {I.close}
          </button>
        </div>

        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          {/* URL */}
          <label className="field">
            <span className="field-label">URL konten</span>
            <div className="field-input-wrap">
              <span className="field-prefix">{I.link}</span>
              <input
                className="input"
                type="url"
                placeholder="https://tiktok.com/@... atau https://instagram.com/p/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={busy}
              />
            </div>
            {errors.url && <span className="field-error">{errors.url}</span>}
          </label>

          {/* Title */}
          <label className="field">
            <span className="field-label">Judul / deskripsi</span>
            <div className="field-input-wrap">
              <input
                className="input"
                type="text"
                placeholder="Deskripsi singkat konten ini…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={280}
                disabled={busy}
              />
            </div>
            {errors.title && <span className="field-error">{errors.title}</span>}
          </label>

          {/* Platform */}
          <label className="field">
            <span className="field-label">Platform</span>
            <div className="field-input-wrap">
              <div className="seg-control">
                <button
                  type="button"
                  className={platform === 'tiktok' ? 'active' : ''}
                  onClick={() => setPlatform('tiktok')}
                  disabled={busy}
                >
                  TikTok
                </button>
                <button
                  type="button"
                  className={platform === 'instagram' ? 'active' : ''}
                  onClick={() => setPlatform('instagram')}
                  disabled={busy}
                >
                  Instagram
                </button>
              </div>
            </div>
          </label>

          {/* Tags multi-select */}
          <div className="field">
            <span className="field-label">Tags</span>
            <div className="vault-tags" style={{ marginTop: 4 }}>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={'tag-chip ' + (selectedTags.includes(tag) ? 'active' : '')}
                  onClick={() => toggleTag(tag)}
                  disabled={busy}
                >
                  #{tag}
                </button>
              ))}
            </div>
            {/* Custom tag input */}
            <div className="field-input-wrap" style={{ marginTop: 6 }}>
              <input
                className="input"
                type="text"
                placeholder="+ Tag kustom (tekan Enter untuk tambah)"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const t = customTag.trim();
                    if (t && !selectedTags.includes(t)) {
                      setSelectedTags((prev) => [...prev, t]);
                    }
                    setCustomTag('');
                  }
                }}
                disabled={busy}
              />
            </div>
            {errors.tags && <span className="field-error">{errors.tags}</span>}
          </div>

          {errors.form && <div className="field-error">{errors.form}</div>}

          <div className="form-row">
            <Button variant="outline" onClick={onClose} disabled={busy}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={I.check} disabled={busy}>
              {busy ? 'Menyimpan…' : 'Simpan konten'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- main grid component ---

interface VaultGridProps {
  initialItems: VaultItem[];
  users: User[];
  currentUserId: string;
}

export function VaultGrid({ initialItems, users, currentUserId }: VaultGridProps) {
  const [items, setItems] = useState<VaultItem[]>(initialItems);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [platform, setPlatform] = useState<'all' | Platform>('all');
  const [savedByFilter, setSavedByFilter] = useState<string>('all');
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');

  const userMap = useMemo(() => {
    const m: Record<string, User> = {};
    for (const u of users) m[u.id] = u;
    return m;
  }, [users]);

  const toggleTag = useCallback(
    (tag: string) =>
      setActiveTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
      ),
    [],
  );

  // AND-intersection filter on tags
  const filtered = useMemo(() => {
    return items.filter((v) => {
      if (activeTags.length && !activeTags.every((t) => v.tags.includes(t))) return false;
      if (platform !== 'all' && v.platform !== platform) return false;
      if (savedByFilter !== 'all' && v.savedBy !== savedByFilter) return false;
      if (q && !v.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [items, activeTags, platform, savedByFilter, q]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tag of VAULT_TAGS) counts[tag] = items.filter((v) => v.tags.includes(tag)).length;
    return counts;
  }, [items]);

  const handleSaved = useCallback((item: VaultItem) => {
    setItems((prev) => [item, ...prev]);
    setShowForm(false);
    setToast('Konten berhasil disimpan ke vault!');
  }, []);

  return (
    <div className="screen screen-vault">
      <header className="screen-head">
        <div>
          <div className="eyebrow">FYP Vault · Swipe file tim</div>
          <h1 className="screen-title">Bank inspirasi konten</h1>
          <p className="screen-sub">
            {items.length} referensi tersimpan. Tagged by hook, storytelling, format, dan lainnya untuk dipakai saat brainstorming.
          </p>
        </div>
        <div className="head-actions">
          <Button variant="primary" icon={I.plus} onClick={() => setShowForm(true)}>
            + Simpan konten
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="vault-toolbar">
        <div className="vault-tags">
          {VAULT_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={'tag-chip ' + (activeTags.includes(tag) ? 'active' : '')}
            >
              #{tag}
              <span className="tag-count">{tagCounts[tag] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          {/* Platform filter */}
          <div className="seg-control sm">
            <button
              className={platform === 'all' ? 'active' : ''}
              onClick={() => setPlatform('all')}
            >
              Semua
            </button>
            <button
              className={platform === 'tiktok' ? 'active' : ''}
              onClick={() => setPlatform('tiktok')}
            >
              TikTok
            </button>
            <button
              className={platform === 'instagram' ? 'active' : ''}
              onClick={() => setPlatform('instagram')}
            >
              IG
            </button>
          </div>

          {/* Saved-by filter */}
          <select
            className="select"
            value={savedByFilter}
            onChange={(e) => setSavedByFilter(e.target.value)}
          >
            <option value="all">Disimpan oleh semua</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Title search */}
          <div className="search-input">
            {I.search}
            <input
              placeholder="Cari judul…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="vault-grid">
        {filtered.map((v) => {
          const owner = userMap[v.savedBy];
          const firstName = owner ? owner.name.split(' ')[0] : 'Tim';
          const ago = fmtAgo(hoursAgo(v.savedAt));

          return (
            <article key={v.id} className="vault-card">
              {/* Thumbnail */}
              <div className="vault-thumb" style={{ background: v.thumbnailUrl ? undefined : thumbColor(v) }}>
                {v.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnailUrl}
                    alt={v.title}
                    className="vault-thumb-img"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <>
                    <div className="vault-thumb-pattern" />
                    <div className="vault-thumb-platform">
                      {v.platform === 'tiktok' ? I.tiktok : I.ig}
                    </div>
                    <div className="vault-thumb-play">&#9654;</div>
                  </>
                )}
              </div>

              {/* Body */}
              <div className="vault-card-body">
                <h4 className="vault-title">{v.title}</h4>

                <div className="vault-tags-row">
                  {v.tags.map((t) => (
                    <span key={t} className="tag-pill">
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="vault-meta">
                  {owner && <Avatar user={owner} size={18} />}
                  <span>
                    {firstName}
                  </span>
                  <span>·</span>
                  <span>{ago}</span>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vault-open"
                    aria-label="Buka konten"
                  >
                    {I.external}
                  </a>
                </div>

                {/* Platform badge */}
                <div style={{ marginTop: 4 }}>
                  <PlatformBadge platform={v.platform} />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-title">Tidak ada referensi yang cocok</div>
          <div className="empty-sub">Coba hapus beberapa tag atau ganti kata kunci.</div>
        </div>
      )}

      {/* Slide-over form */}
      {showForm && (
        <SaveForm onClose={() => setShowForm(false)} onSaved={handleSaved} />
      )}

      {/* Toast */}
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
