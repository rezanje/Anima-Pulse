'use client';
// ============================================================
// Anima Pulse — Settings client component (Task 14)
// Three sections: Users & Roles, Target ER, Audit Logs
// ============================================================
import { useState, useCallback } from 'react';
import { Avatar, Button, StatusPill, Tabs, Toast, PlatformBadge, Field } from '@/components/widgets';
import { I } from '@/components/icons';
import { apiPut } from '@/lib/client';
import { fmtAgo } from '@/lib/format';
import type { User, ErTargets, AuditLog, Role } from '@/lib/repo/types';

interface Props {
  users: User[];
  erTargets: ErTargets;
  auditLogs: AuditLog[];
}

export function SettingsClient({ users: initialUsers, erTargets: initialTargets, auditLogs }: Props) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [erTargets, setErTargets] = useState<ErTargets>(initialTargets);
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

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
          <div className="card-head">
            <div>
              <h3 className="card-h">User &amp; role assignment</h3>
              <span className="card-sub">{users.length} user terdaftar · login via Google Workspace</span>
            </div>
          </div>
          <div className="t-table">
            <div className="t-row t-head">
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span>Joined</span>
              <span>Status</span>
              <span></span>
            </div>
            {users.map((u) => (
              <div key={u.id} className="t-row">
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
                <span><button className="icon-btn">{I.more}</button></span>
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
