'use client';
// ============================================================
// Anima Pulse — Content Pillar guide
// Categories staff consult before deciding what content to make.
// Manager/Super Admin can add pillars and toggle them active/inactive.
// ============================================================
import { useState } from 'react';
import { api, apiPost, apiPut } from '@/lib/client';
import { Button, Field, Toast } from '@/components/widgets';
import { I } from '@/components/icons';
import type { Pillar } from '@/lib/repo/types';

const EMPTY_FORM = { name: '', description: '', exampleAngle: '' };

export function PillarsClient({ initialPillars, canManage }: { initialPillars: Pillar[]; canManage: boolean }) {
  const [pillars, setPillars] = useState(initialPillars);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const active = pillars.filter((p) => p.isActive);
  const inactive = pillars.filter((p) => !p.isActive);

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.description.trim()) {
      setError('Nama dan deskripsi wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const created = await apiPost<Pillar>('/pillars', {
        name: form.name.trim(),
        description: form.description.trim(),
        exampleAngle: form.exampleAngle.trim() || undefined,
      });
      setPillars((prev) => [...prev, created]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setToast('Pillar ditambahkan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (pillar: Pillar) => {
    try {
      const updated = await apiPut<Pillar>(`/pillars/${pillar.id}`, { isActive: !pillar.isActive });
      setPillars((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setToast(updated.isActive ? 'Pillar diaktifkan' : 'Pillar dinonaktifkan');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Gagal mengubah status');
    }
  };

  const removePillar = async (pillar: Pillar) => {
    if (!confirm(`Hapus pillar "${pillar.name}"? Konten yang sudah ditandai pillar ini tetap ada, tapi tagnya hilang.`)) return;
    try {
      await api(`/pillars/${pillar.id}`, { method: 'DELETE' });
      setPillars((prev) => prev.filter((p) => p.id !== pillar.id));
      setToast('Pillar dihapus');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Gagal menghapus pillar');
    }
  };

  return (
    <div className="screen screen-pillars">
      <header className="screen-head">
        <div>
          <div className="eyebrow">Panduan konten</div>
          <h1 className="screen-title">Content Pillar</h1>
          <p className="screen-sub">
            Cek dulu sebelum nentuin mau bikin konten apa hari ini — {active.length} pillar aktif.
          </p>
        </div>
        {canManage && (
          <div className="head-actions">
            <Button variant="primary" icon={I.plus} onClick={() => setShowForm((s) => !s)}>
              {showForm ? 'Batal' : 'Tambah pillar'}
            </Button>
          </div>
        )}
      </header>

      {showForm && (
        <form className="card" onSubmit={submitNew}>
          <Field label="Nama pillar" hint="misal: Edukasi, Hiburan, Promo">
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nama pillar"
            />
          </Field>
          <Field label="Deskripsi" hint="konten seperti apa yang masuk pillar ini">
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Deskripsi pillar"
            />
          </Field>
          <Field label="Contoh angle/hook" hint="opsional — biar staff ada gambaran konkret">
            <textarea
              className="input"
              rows={2}
              value={form.exampleAngle}
              onChange={(e) => setForm((f) => ({ ...f, exampleAngle: e.target.value }))}
              placeholder="Contoh hook atau ide konten"
            />
          </Field>
          {error && <p className="field-error">{error}</p>}
          <Button type="submit" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan pillar'}</Button>
        </form>
      )}

      <div className="pillar-grid">
        {active.map((p) => (
          <div key={p.id} className="card pillar-card">
            <h3 className="card-h">{p.name}</h3>
            <p className="pillar-desc">{p.description}</p>
            {p.exampleAngle && (
              <div className="pillar-example">
                <span className="field-hint">Contoh angle</span>
                <p>{p.exampleAngle}</p>
              </div>
            )}
            {canManage && (
              <div className="pillar-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleActive(p)}>
                  Nonaktifkan
                </button>
                <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => removePillar(p)}>
                  Hapus
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {active.length === 0 && <p className="empty-state">Belum ada pillar aktif.</p>}

      {canManage && inactive.length > 0 && (
        <details className="pillar-inactive">
          <summary>Pillar nonaktif ({inactive.length})</summary>
          <div className="pillar-grid">
            {inactive.map((p) => (
              <div key={p.id} className="card pillar-card pillar-card-inactive">
                <h3 className="card-h">{p.name}</h3>
                <p className="pillar-desc">{p.description}</p>
                <div className="pillar-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleActive(p)}>
                    Aktifkan
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => removePillar(p)}>
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
