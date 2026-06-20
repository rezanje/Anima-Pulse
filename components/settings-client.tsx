'use client';
// ============================================================
// Anima Pulse — Settings client component (Task 14)
// Three sections: Users & Roles, Target ER, Audit Logs
// ============================================================
import { useState, useCallback, useEffect } from 'react';
import { Avatar, Button, StatusPill, Tabs, Toast, PlatformBadge, Field } from '@/components/widgets';
import { I } from '@/components/icons';
import { apiPut, apiPost } from '@/lib/client';
import { fmtAgo } from '@/lib/format';
import type { User, ErTargets, AuditLog, Role } from '@/lib/repo/types';

interface Props {
  users: User[];
  erTargets: ErTargets;
  auditLogs: AuditLog[];
}

function PinInput({
  userId,
  initialValue,
  onSave,
}: {
  userId: string;
  initialValue: string;
  onSave: (id: string, val: string) => Promise<void>;
}) {
  const [val, setVal] = useState(initialValue);
  
  // Update local value if initialValue changes externally
  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  return (
    <input
      type="text"
      className="input select-sm"
      value={val}
      placeholder="—"
      onChange={(e) => setVal(e.target.value)}
      onBlur={async () => {
        if (val.trim() !== initialValue.trim()) {
          try {
            await onSave(userId, val.trim());
          } catch {
            setVal(initialValue);
          }
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      style={{ width: '90px', height: '28px', padding: '2px 6px', fontSize: '12px' }}
    />
  );
}

export function SettingsClient({ users: initialUsers, erTargets: initialTargets, auditLogs }: Props) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [erTargets, setErTargets] = useState<ErTargets>(initialTargets);
  const [toast, setToast] = useState('');
  
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [locForm, setLocForm] = useState({ lat: '', lng: '', radius: '' });

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'staff' as Role, loginCode: '' });
  const [busyInvite, setBusyInvite] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  async function handleInviteUser() {
    if (!inviteForm.name.trim() || !inviteForm.email.trim() || !inviteForm.loginCode.trim()) {
      showToast('Nama, Email, dan Kode PIN harus diisi');
      return;
    }
    
    setBusyInvite(true);
    try {
      const newUser = await apiPost<User>('/settings/users', inviteForm);
      setUsers((prev) => [...prev, newUser]);
      setInviteForm({ email: '', name: '', role: 'staff', loginCode: '' });
      setShowInviteForm(false);
      showToast('User baru berhasil didaftarkan');
    } catch (e: any) {
      showToast(`Gagal menambahkan user: ${e.message || 'Error'}`);
    } finally {
      setBusyInvite(false);
    }
  }

  // ---- User login code change ----
  async function handleLoginCodeChange(id: string, code: string) {
    try {
      const updated = await apiPut<User>('/settings/users', { id, loginCode: code });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      showToast('Kode akses berhasil diperbarui');
    } catch (err) {
      showToast('Gagal memperbarui kode akses');
      throw err;
    }
  }

  // ---- User role change ----
  async function handleRoleChange(id: string, role: Role) {
    try {
      const updated = await apiPut<User>('/settings/users', { id, role });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      showToast('Role berhasil diperbarui');
    } catch {
      showToast('Gagal memperbarui role');
    }
  }

  // ---- User active toggle ----
  async function handleActiveToggle(id: string, isActive: boolean) {
    try {
      const updated = await apiPut<User>('/settings/users', { id, isActive });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      showToast(isActive ? 'User diaktifkan' : 'User dinonaktifkan');
    } catch {
      showToast('Gagal memperbarui status user');
    }
  }

  // ---- User location change ----
  function openLoc(u: User) {
    setEditingLocId(u.id);
    setLocForm({
      lat: u.workLat != null ? String(u.workLat) : '',
      lng: u.workLng != null ? String(u.workLng) : '',
      radius: u.workRadius != null ? String(u.workRadius) : '30',
    });
  }

  async function handleSaveLoc(id: string) {
    try {
      const lat = locForm.lat ? parseFloat(locForm.lat) : null;
      const lng = locForm.lng ? parseFloat(locForm.lng) : null;
      const radius = locForm.radius ? parseFloat(locForm.radius) : null;
      const updated = await apiPut<User>('/settings/users', { id, workLat: lat, workLng: lng, workRadius: radius });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setEditingLocId(null);
      showToast('Lokasi absen berhasil disimpan');
    } catch (e: any) {
      showToast(`Gagal menyimpan lokasi: ${e.message || 'Error'}`);
    }
  }

  function handleGetLocation() {
    if (!navigator.geolocation) {
      showToast('Geolocation tidak didukung browser ini');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocForm((prev) => ({
          ...prev,
          lat: String(pos.coords.latitude),
          lng: String(pos.coords.longitude)
        }));
        showToast('Koordinat GPS didapatkan');
      },
      () => showToast('Gagal mendapatkan lokasi GPS. Pastikan izin lokasi aktif.')
    );
  }

  // ---- ER targets save ----
  async function handleSaveTargets() {
    try {
      await apiPut('/settings/er-targets', erTargets);
      showToast('Target ER berhasil disimpan');
    } catch {
      showToast('Gagal menyimpan target ER');
    }
  }

  return (
    <div className="screen screen-settings">
      <header className="screen-head">
        <div>
          <div className="eyebrow">Admin · Pengaturan sistem</div>
          <h1 className="screen-title">Settings</h1>
          <p className="screen-sub">Kelola user, role, target ER per platform, dan audit log.</p>
        </div>
      </header>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'users', label: 'Users & Role', count: users.length },
          { id: 'targets', label: 'Target ER' },
          { id: 'audit', label: 'Audit log', count: auditLogs.length },
        ]}
      />

      {/* ---- USERS TAB ---- */}
      {tab === 'users' && (
        <article className="card">
          <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="card-h">User &amp; role assignment</h3>
              <span className="card-sub">{users.length} user terdaftar · login via Google Workspace</span>
            </div>
            <Button variant="primary" icon={I.plus} onClick={() => setShowInviteForm(!showInviteForm)} disabled={busyInvite}>
              {showInviteForm ? 'Batal' : 'Tambah User'}
            </Button>
          </div>

          {showInviteForm && (
            <div style={{
              background: 'var(--bg-deep)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              margin: '0 var(--space-6) var(--space-4) var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)'
            }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>Tambah User Baru (Whitelist)</h4>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <Field label="Nama Lengkap">
                  <input
                    type="text"
                    className="input"
                    placeholder="Nama Lengkap"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  />
                </Field>
                <Field label="Email Google">
                  <input
                    type="email"
                    className="input"
                    placeholder="nama@gmail.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  />
                </Field>
                <Field label="Role">
                  <select
                    className="select"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as Role })}
                    style={{ height: '36px' }}
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </Field>
                <Field label="Kode PIN / Akses">
                  <input
                    type="text"
                    className="input"
                    placeholder="1234"
                    value={inviteForm.loginCode}
                    onChange={(e) => setInviteForm({ ...inviteForm, loginCode: e.target.value })}
                  />
                </Field>
                <Button variant="primary" onClick={handleInviteUser} disabled={busyInvite}>
                  {busyInvite ? 'Menyimpan...' : 'Simpan User'}
                </Button>
              </div>
            </div>
          )}

          <div className="t-table">
            <div className="t-row t-head">
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span>PIN</span>
              <span>Joined</span>
              <span>Status</span>
              <span></span>
            </div>
            {users.map((u) => (
              <div key={u.id} style={{ display: 'contents' }}>
                <div className="t-row">
                  <span className="t-cell-name">
                  <Avatar user={u} size={32} />
                  <span>
                    <span className="t-name">{u.name}</span>
                    <span className="t-handle">{u.handle}</span>
                  </span>
                </span>
                <span className="mono-num t-cell-num">{u.email}</span>
                <span>
                  <select
                    className="select select-sm"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </span>
                <span>
                  <PinInput userId={u.id} initialValue={u.loginCode || ''} onSave={handleLoginCodeChange} />
                </span>
                <span className="mono-num t-cell-num">{u.joined}</span>
                <span>
                  <button
                    className="icon-btn"
                    title={u.isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                    onClick={() => handleActiveToggle(u.id, !u.isActive)}
                  >
                    <StatusPill tone={u.isActive ? 'positive' : 'neutral'}>
                      {u.isActive ? 'Aktif' : 'Nonaktif'}
                    </StatusPill>
                  </button>
                </span>
                <span>
                  <button className="icon-btn" title="Atur Lokasi Absen" onClick={() => openLoc(u)}>
                    📍
                  </button>
                </span>
              </div>
              {editingLocId === u.id && (
                <div className="t-row" style={{ gridColumn: '1 / -1', background: 'var(--bg-subtle)', padding: '16px' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <Field label="Latitude">
                      <input type="text" className="input" value={locForm.lat} onChange={(e) => setLocForm({...locForm, lat: e.target.value})} placeholder="-6.200000" />
                    </Field>
                    <Field label="Longitude">
                      <input type="text" className="input" value={locForm.lng} onChange={(e) => setLocForm({...locForm, lng: e.target.value})} placeholder="106.816666" />
                    </Field>
                    <Field label="Radius (m)">
                      <input type="number" className="input" value={locForm.radius} onChange={(e) => setLocForm({...locForm, radius: e.target.value})} placeholder="30" style={{ width: 100 }} />
                    </Field>
                    <Button variant="outline" onClick={handleGetLocation}>📍 Lokasi Saya</Button>
                    <Button variant="primary" onClick={() => handleSaveLoc(u.id)}>Simpan</Button>
                    <Button variant="ghost" onClick={() => setEditingLocId(null)}>Batal</Button>
                  </div>
                </div>
              )}
              </div>
            ))}
          </div>
        </article>
      )}

      {/* ---- ER TARGETS TAB ---- */}
      {tab === 'targets' && (
        <article className="card">
          <div className="card-head">
            <div>
              <h3 className="card-h">Target ER per platform</h3>
              <span className="card-sub">Digunakan sebagai benchmark di scorecard staff dan team dashboard</span>
            </div>
          </div>
          <div className="targets-grid">
            {(['tiktok', 'instagram'] as const).map((p) => (
              <div key={p} className="target-card">
                <div className="target-head">
                  <PlatformBadge platform={p} />
                  <span className="mono-num target-val">
                    {erTargets[p].toFixed(1)}<span className="kpi-unit">%</span>
                  </span>
                </div>
                <Field label={`Target ER ${p === 'tiktok' ? 'TikTok' : 'Instagram'}`} suffix="%">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={erTargets[p]}
                    onChange={(e) =>
                      setErTargets((prev) => ({ ...prev, [p]: parseFloat(e.target.value) || 0 }))
                    }
                    className="input input-mono"
                  />
                </Field>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.1"
                  value={erTargets[p]}
                  onChange={(e) =>
                    setErTargets((prev) => ({ ...prev, [p]: parseFloat(e.target.value) }))
                  }
                  className="target-slider"
                />
                <div className="target-scale">
                  <span>1%</span><span>5%</span><span>10%</span><span>15%</span>
                </div>
                <div className="target-note">
                  Industri rata-rata: {p === 'tiktok' ? '5.7%' : '3.2%'} · Top tier: {p === 'tiktok' ? '12%+' : '6%+'}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <Button variant="primary" icon={I.check} onClick={handleSaveTargets}>
              Simpan target ER
            </Button>
          </div>
        </article>
      )}

      {/* ---- AUDIT LOG TAB ---- */}
      {tab === 'audit' && (
        <article className="card">
          <div className="card-head">
            <div>
              <h3 className="card-h">Audit log</h3>
              <span className="card-sub">Semua write action tercatat selama 1 tahun</span>
            </div>
          </div>
          <div className="audit-list">
            {auditLogs.length === 0 && (
              <div className="empty-state">
                <div className="empty-title">Belum ada log</div>
                <div className="empty-sub">Aktivitas write akan muncul di sini.</div>
              </div>
            )}
            {auditLogs.map((row) => {
              const hoursAgo = (Date.now() - new Date(row.at).getTime()) / 3_600_000;
              return (
                <div key={row.id} className="audit-row">
                  <span className="audit-t">{fmtAgo(hoursAgo)}</span>
                  <span className="audit-who">
                    <b>{row.userId}</b> {row.action}
                  </span>
                  <span className="audit-target">
                    {row.resourceType} · {row.resourceId}
                  </span>
                  <span className="audit-ip mono-num">{row.ipAddress ?? '—'}</span>
                </div>
              );
            })}
          </div>
        </article>
      )}

      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}
