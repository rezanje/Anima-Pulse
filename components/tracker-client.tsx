'use client';
// ============================================================
// Anima Pulse — Content Plan Tracker Client Component
// Handles Kanban, Calendar, List views and CRUD mutations.
// ============================================================
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { ContentPlan, NewContentPlan, User, Role, Pillar } from '@/lib/repo/types';
import { api, apiGet, apiPost, apiPut } from '@/lib/client';
import { fmtDateWIB } from '@/lib/format';
import {
  Button,
  PlatformBadge,
  StatusPill,
  Field,
  Toast,
} from '@/components/widgets';
import { I } from '@/components/icons';

const FUNNEL_OPTIONS = ['Top Funnel', 'Mid Funnel', 'Bottom Funnel'];
const PLATFORM_OPTIONS = ['Mirror', 'TikTok', 'Instagram', 'YouTube'];
const FORMAT_OPTIONS = ['Video', 'Image', 'Carousel'];
const PROGRESS_OPTIONS = ['Draft', 'Sudah take', 'Selesai Editing', 'Selesai Upload'];
// Fallback only for environments where /pillars hasn't loaded yet (or has no active pillars).
const CATEGORY_FALLBACK = ['Trends', 'Edukasi', 'Entertainment', 'Promo', 'Product Focus', 'Daily Life'];

interface Props {
  initialPlans: ContentPlan[];
  user: User;
  role: Role;
}

export function TrackerClient({ initialPlans, user, role }: Props) {
  const [plans, setPlans] = useState<ContentPlan[]>(initialPlans);
  const [activeTab, setActiveTab] = useState<'kanban' | 'calendar' | 'list'>('kanban');
  const [q, setQ] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterFunnel, setFilterFunnel] = useState('all');
  const [filterProgress, setFilterProgress] = useState('all');
  const [filterApproval, setFilterApproval] = useState('all');

  const [selectedPlan, setSelectedPlan] = useState<ContentPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewPlan, setIsNewPlan] = useState(false);
  const [toast, setToast] = useState('');

  const canApprove = role === 'manager' || role === 'admin';

  // Filter plans
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchQ = q
        ? (p.ideKonten || '').toLowerCase().includes(q.toLowerCase()) ||
          (p.brief || '').toLowerCase().includes(q.toLowerCase()) ||
          (p.caption || '').toLowerCase().includes(q.toLowerCase()) ||
          (p.category || '').toLowerCase().includes(q.toLowerCase())
        : true;
      const matchPlatform = filterPlatform === 'all' || p.platform.toLowerCase() === filterPlatform.toLowerCase();
      const matchFunnel = filterFunnel === 'all' || p.funnel === filterFunnel;
      const matchProgress = filterProgress === 'all' || p.progress === filterProgress;

      let matchApproval = true;
      if (filterApproval === 'approved') matchApproval = p.approval === true;
      else if (filterApproval === 'pending') matchApproval = p.approval === false;

      return matchQ && matchPlatform && matchFunnel && matchProgress && matchApproval;
    });
  }, [plans, q, filterPlatform, filterFunnel, filterProgress, filterApproval]);

  // Stats
  const stats = useMemo(() => {
    const total = plans.length;
    const approved = plans.filter((p) => p.approval).length;
    const pending = total - approved;
    const videoCount = plans.filter((p) => p.formatKonten === 'Video').length;
    const carouselCount = plans.filter((p) => p.formatKonten === 'Carousel').length;
    const imageCount = plans.filter((p) => p.formatKonten === 'Image').length;

    return { total, approved, pending, videoCount, carouselCount, imageCount };
  }, [plans]);

  // CRUD
  const handleSavePlan = async (form: ContentPlan) => {
    try {
      if (isNewPlan) {
        const payload: NewContentPlan = {
          deadline: form.deadline,
          funnel: form.funnel,
          category: form.category,
          tanggalUpload: form.tanggalUpload,
          formatKonten: form.formatKonten,
          platform: form.platform,
          ideKonten: form.ideKonten,
          hook: form.hook || null,
          brief: form.brief || null,
          caption: form.caption || null,
          referensi: form.referensi || null,
          progress: form.progress,
          result: form.result || null,
          feedback: form.feedback || null,
          revision: form.revision || null,
          approval: form.approval,
        };
        const saved = await apiPost<ContentPlan>('/tracker', payload);
        setPlans((prev) => [...prev, saved]);
        setToast('Rencana konten baru berhasil ditambahkan!');
      } else {
        const patch: Partial<NewContentPlan> = {
          deadline: form.deadline,
          funnel: form.funnel,
          category: form.category,
          tanggalUpload: form.tanggalUpload,
          formatKonten: form.formatKonten,
          platform: form.platform,
          ideKonten: form.ideKonten,
          hook: form.hook || null,
          brief: form.brief || null,
          caption: form.caption || null,
          referensi: form.referensi || null,
          progress: form.progress,
          result: form.result || null,
          feedback: form.feedback || null,
          revision: form.revision || null,
          approval: form.approval,
        };
        const saved = await apiPut<ContentPlan>(`/tracker/${form.id}`, patch);
        setPlans((prev) => prev.map((p) => (p.id === form.id ? saved : p)));
        setToast('Perubahan rencana konten disimpan.');
      }
      setIsModalOpen(false);
      setSelectedPlan(null);
    } catch (e) {
      setToast('Gagal menyimpan rencana konten.');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus rencana konten ini?')) return;
    try {
      await api(`/tracker/${id}`, { method: 'DELETE' });
      setPlans((prev) => prev.filter((p) => p.id !== id));
      setToast('Rencana konten berhasil dihapus.');
    } catch (e) {
      setToast('Gagal menghapus rencana konten.');
    }
  };

  const handleOpenAddModal = (initialDate = '') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const defaultNewPlan: ContentPlan = {
      id: '',
      deadline: todayStr,
      funnel: 'Top Funnel',
      category: 'Trends',
      tanggalUpload: initialDate || todayStr,
      formatKonten: 'Video',
      platform: 'Mirror',
      ideKonten: '',
      hook: '',
      brief: '',
      caption: '',
      referensi: '',
      progress: 'Draft',
      result: '',
      feedback: '',
      revision: '',
      approval: false,
    };
    setSelectedPlan(defaultNewPlan);
    setIsNewPlan(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: ContentPlan) => {
    setSelectedPlan({ ...plan });
    setIsNewPlan(false);
    setIsModalOpen(true);
  };

  const toggleApprovalDirectly = async (id: string, currentVal: boolean) => {
    if (!canApprove) {
      setToast('Akses ditolak: Hanya Manager atau Super Admin yang bisa memberi Approval.');
      return;
    }
    try {
      const saved = await apiPut<ContentPlan>(`/tracker/${id}`, { approval: !currentVal });
      setPlans((prev) => prev.map((p) => (p.id === id ? saved : p)));
      setToast(!currentVal ? 'Konten disetujui (Approved)' : 'Approval ditarik kembali');
    } catch (e) {
      setToast('Gagal mengubah status approval.');
    }
  };

  const updateProgressDirectly = async (id: string, newProgress: string) => {
    try {
      const saved = await apiPut<ContentPlan>(`/tracker/${id}`, { progress: newProgress });
      setPlans((prev) => prev.map((p) => (p.id === id ? saved : p)));
      setToast(`Status progress diperbarui ke: ${newProgress}`);
    } catch (e) {
      setToast('Gagal memperbarui progress.');
    }
  };

  return (
    <div className="screen screen-tracker">
      <Toast message={toast} onDone={() => setToast('')} />

      <header className="screen-head">
        <div>
          <div className="eyebrow">Anima Pulse · Content Operations</div>
          <h1 className="screen-title">Content Plan Tracker</h1>
          <p className="screen-sub">
            Kelola, jadwalkan, pantau, dan beri persetujuan pada rencana konten harian.
          </p>
        </div>
        <div className="head-actions">
          <Button variant="primary" icon={I.plus} onClick={() => handleOpenAddModal()}>
            Tambah Plan
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="tracker-stats-row">
        <div className="tracker-stat-card">
          <div className="eyebrow">Total Rencana</div>
          <div className="tracker-stat-val mono-num">{stats.total}</div>
          <div className="tracker-stat-sub">Semua konten terdaftar</div>
        </div>
        <div className="tracker-stat-card border-positive">
          <div className="eyebrow">Approved</div>
          <div className="tracker-stat-val text-positive mono-num">{stats.approved}</div>
          <div className="tracker-stat-sub">Siap di-publish</div>
        </div>
        <div className="tracker-stat-card border-warning">
          <div className="eyebrow">Pending Approval</div>
          <div className="tracker-stat-val text-warning mono-num">{stats.pending}</div>
          <div className="tracker-stat-sub">Menunggu review manager</div>
        </div>
        <div className="tracker-stat-card border-info">
          <div className="eyebrow">Format Video</div>
          <div className="tracker-stat-val text-info mono-num">{stats.videoCount}</div>
          <div className="tracker-stat-sub">
            Carousel: {stats.carouselCount} · Image: {stats.imageCount}
          </div>
        </div>
      </section>

      {/* Filter and View Selector toolbar */}
      <div className="tracker-toolbar">
        <div className="view-selector-tabs">
          <button className={`view-tab ${activeTab === 'kanban' ? 'active' : ''}`} onClick={() => setActiveTab('kanban')}>
            <span className="tab-icon">{I.kanban}</span>
            <span>Kanban Board</span>
          </button>
          <button className={`view-tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
            <span className="tab-icon">{I.calendar}</span>
            <span>Kalender</span>
          </button>
          <button className={`view-tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
            <span className="tab-icon">{I.list}</span>
            <span>Spreadsheet List</span>
          </button>
        </div>

        <div className="toolbar-search-filter">
          <div className="search-input">
            {I.search}
            <input placeholder="Cari ide, brief, atau caption..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Quick filters row */}
      <div className="tracker-filters-row">
        <div className="filter-group">
          <label className="filter-lbl">Platform</label>
          <select className="select select-sm" value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}>
            <option value="all">Semua Platform</option>
            {PLATFORM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-lbl">Funnel</label>
          <select className="select select-sm" value={filterFunnel} onChange={(e) => setFilterFunnel(e.target.value)}>
            <option value="all">Semua Funnel</option>
            {FUNNEL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-lbl">Progress</label>
          <select className="select select-sm" value={filterProgress} onChange={(e) => setFilterProgress(e.target.value)}>
            <option value="all">Semua Progress</option>
            {PROGRESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-lbl">Approval</label>
          <select className="select select-sm" value={filterApproval} onChange={(e) => setFilterApproval(e.target.value)}>
            <option value="all">Semua Approval</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {(filterPlatform !== 'all' || filterFunnel !== 'all' || filterProgress !== 'all' || filterApproval !== 'all' || q) && (
          <button className="reset-filter-btn" onClick={() => {
            setFilterPlatform('all');
            setFilterFunnel('all');
            setFilterProgress('all');
            setFilterApproval('all');
            setQ('');
          }}>
            Reset Filter
          </button>
        )}
      </div>

      {/* Active View Rendering */}
      <div className="tracker-view-container">
        {activeTab === 'kanban' && (
          <KanbanView
            plans={filteredPlans}
            canApprove={canApprove}
            onEdit={handleOpenEditModal}
            onDelete={handleDeletePlan}
            onToggleApproval={toggleApprovalDirectly}
            onUpdateProgress={updateProgressDirectly}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarView
            plans={filteredPlans}
            onEdit={handleOpenEditModal}
            onAddAtDate={handleOpenAddModal}
          />
        )}
        {activeTab === 'list' && (
          <SpreadsheetView
            plans={filteredPlans}
            canApprove={canApprove}
            onEdit={handleOpenEditModal}
            onDelete={handleDeletePlan}
            onToggleApproval={toggleApprovalDirectly}
            onUpdateProgress={updateProgressDirectly}
          />
        )}
      </div>

      {/* Add / Edit Dialog Modal */}
      {isModalOpen && selectedPlan && (
        <PlanModal
          plan={selectedPlan}
          isNew={isNewPlan}
          canApprove={canApprove}
          onSave={handleSavePlan}
          onClose={() => { setIsModalOpen(false); setSelectedPlan(null); }}
        />
      )}
    </div>
  );
}

// ------------------- KANBAN VIEW -------------------
interface KanbanViewProps {
  plans: ContentPlan[];
  canApprove: boolean;
  onEdit: (plan: ContentPlan) => void;
  onDelete: (id: string) => void;
  onToggleApproval: (id: string, current: boolean) => void;
  onUpdateProgress: (id: string, next: string) => void;
}

function KanbanView({ plans, canApprove, onEdit, onDelete, onToggleApproval, onUpdateProgress }: KanbanViewProps) {
  return (
    <div className="kanban-board">
      {PROGRESS_OPTIONS.map((status) => {
        const columnPlans = plans.filter((p) => p.progress === status);
        const colStyle = {
          contentVisibility: 'auto' as const,
          containIntrinsicSize: 'auto 320px auto 700px',
        };

        return (
          <div key={status} className="kanban-column" style={colStyle}>
            <div className="column-head">
              <h3 className="column-title">{status}</h3>
              <span className="column-count mono-num">{columnPlans.length}</span>
            </div>

            <div className="column-cards-container">
              {columnPlans.map((p) => (
                <div key={p.id} className={`kanban-card ${p.approval ? 'approved-border' : ''}`} onClick={() => onEdit(p)}>
                  <div className="card-top-row">
                    <PlatformBadge platform={p.platform === 'tiktok' ? 'tiktok' : 'instagram'} />
                    <StatusPill tone={p.funnel === 'Top Funnel' ? 'positive' : p.funnel === 'Mid Funnel' ? 'warning' : 'info'}>
                      {p.funnel.split(' ')[0]}
                    </StatusPill>
                  </div>

                  <h4 className="card-title-ide">{p.ideKonten || '(Tanpa Judul)'}</h4>

                  {p.hook && (
                    <div className="card-hook-preview">
                      <strong>Hook:</strong> {p.hook.length > 50 ? p.hook.slice(0, 50) + '...' : p.hook}
                    </div>
                  )}

                  <div className="card-meta-row">
                    <div className="card-date">
                      {I.clock} <span className="mono-num">{formatDateIndo(p.tanggalUpload)}</span>
                    </div>

                    <button
                      className={`card-approval-indicator ${p.approval ? 'is-approved' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleApproval(p.id, p.approval);
                      }}
                      title={p.approval ? 'Approved oleh Manager' : 'Pending Approval'}
                      disabled={!canApprove}
                    >
                      {p.approval ? '✓ Approved' : '⏳ Pending'}
                    </button>
                  </div>

                  <div className="card-action-overlay" onClick={(e) => e.stopPropagation()}>
                    <button className="card-quick-btn" onClick={() => onEdit(p)} title="Edit Detail">
                      {I.edit}
                    </button>

                    <div className="progress-shift-buttons">
                      {status !== PROGRESS_OPTIONS[0] && (
                        <button className="card-quick-btn" title="Pindah sebelumnya" onClick={() => {
                          const idx = PROGRESS_OPTIONS.indexOf(status);
                          onUpdateProgress(p.id, PROGRESS_OPTIONS[idx - 1]);
                        }}>
                          ←
                        </button>
                      )}
                      {status !== PROGRESS_OPTIONS[PROGRESS_OPTIONS.length - 1] && (
                        <button className="card-quick-btn" title="Pindah selanjutnya" onClick={() => {
                          const idx = PROGRESS_OPTIONS.indexOf(status);
                          onUpdateProgress(p.id, PROGRESS_OPTIONS[idx + 1]);
                        }}>
                          →
                        </button>
                      )}
                    </div>

                    <button className="card-quick-btn delete" onClick={() => onDelete(p.id)} title="Hapus">
                      {I.trash}
                    </button>
                  </div>
                </div>
              ))}

              {columnPlans.length === 0 && (
                <div className="column-empty-state">Belum ada konten</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ------------------- CALENDAR VIEW -------------------
interface CalendarViewProps {
  plans: ContentPlan[];
  onEdit: (plan: ContentPlan) => void;
  onAddAtDate: (dateStr: string) => void;
}

function CalendarView({ plans, onEdit, onAddAtDate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)); // Default June 2026

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const calendarCells = [];
  for (let i = 0; i < startOffset; i++) {
    calendarCells.push({ isCurrentMonth: false, dayNum: '', dateString: '', plans: [] });
  }

  for (let d = 1; d <= totalDays; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayPlans = plans.filter((p) => p.tanggalUpload === dStr);
    calendarCells.push({
      isCurrentMonth: true,
      dayNum: String(d),
      dateString: dStr,
      plans: dayPlans,
    });
  }

  const weekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  return (
    <div className="calendar-wrapper">
      <div className="calendar-header-toolbar">
        <h3 className="calendar-month-title">
          {monthNames[month]} {year}
        </h3>
        <div className="calendar-nav-buttons">
          <button className="btn btn-outline btn-sm" onClick={handlePrevMonth}>&lt; Sebelumnya</button>
          <button className="btn btn-outline btn-sm" onClick={() => setCurrentDate(new Date(2026, 5, 1))}>Mei/Juni 2026</button>
          <button className="btn btn-outline btn-sm" onClick={handleNextMonth}>Berikutnya &gt;</button>
        </div>
      </div>

      <div className="calendar-grid">
        {weekdays.map((w) => (
          <div key={w} className="calendar-weekday-header">{w}</div>
        ))}

        {calendarCells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return <div key={`empty-${idx}`} className="calendar-cell empty"></div>;
          }

          return (
            <div
              key={`day-${cell.dayNum}`}
              className="calendar-cell"
              onClick={() => onAddAtDate(cell.dateString)}
            >
              <div className="cell-day-number-row">
                <span className="day-number mono-num">{cell.dayNum}</span>
                {cell.plans.length > 0 && (
                  <span className="day-plan-indicator font-mono">
                    {cell.plans.length} plan
                  </span>
                )}
              </div>

              <div className="cell-plans-list">
                {cell.plans.map((p) => (
                  <div
                    key={p.id}
                    className={`cell-plan-item ${p.approval ? 'approved-line' : ''} ${p.platform.toLowerCase()}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(p);
                    }}
                  >
                    <span className="platform-icon-dot"></span>
                    <span className="plan-item-title">{p.ideKonten || '(Tanpa Judul)'}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ------------------- SPREADSHEET / LIST VIEW -------------------
interface SpreadsheetViewProps {
  plans: ContentPlan[];
  canApprove: boolean;
  onEdit: (plan: ContentPlan) => void;
  onDelete: (id: string) => void;
  onToggleApproval: (id: string, current: boolean) => void;
  onUpdateProgress: (id: string, next: string) => void;
}

function SpreadsheetView({ plans, canApprove, onEdit, onDelete, onToggleApproval, onUpdateProgress }: SpreadsheetViewProps) {
  const [sortKey, setSortKey] = useState<keyof ContentPlan>('tanggalUpload');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: keyof ContentPlan) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      let valA = a[sortKey] ?? '';
      let valB = b[sortKey] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [plans, sortKey, sortAsc]);

  return (
    <div className="spreadsheet-card-table">
      <div className="table-responsive-wrapper">
        <table className="spreadsheet-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('id')}>No {sortKey === 'id' && (sortAsc ? '↑' : '↓')}</th>
              <th className="sortable" onClick={() => handleSort('deadline')}>Deadline {sortKey === 'deadline' && (sortAsc ? '↑' : '↓')}</th>
              <th className="sortable" onClick={() => handleSort('funnel')}>Funnel {sortKey === 'funnel' && (sortAsc ? '↑' : '↓')}</th>
              <th className="sortable" onClick={() => handleSort('category')}>Category {sortKey === 'category' && (sortAsc ? '↑' : '↓')}</th>
              <th className="sortable" onClick={() => handleSort('tanggalUpload')}>Tanggal Upload {sortKey === 'tanggalUpload' && (sortAsc ? '↑' : '↓')}</th>
              <th>Format</th>
              <th className="sortable" onClick={() => handleSort('platform')}>Platform {sortKey === 'platform' && (sortAsc ? '↑' : '↓')}</th>
              <th className="sortable w-ide" onClick={() => handleSort('ideKonten')}>Ide Konten {sortKey === 'ideKonten' && (sortAsc ? '↑' : '↓')}</th>
              <th>Hook 3 Detik</th>
              <th className="w-caption">Caption</th>
              <th>Referensi</th>
              <th>Progress</th>
              <th>Approval</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlans.map((p, idx) => (
              <tr key={p.id} className={p.approval ? 'row-approved' : ''}>
                <td className="mono-num">{idx + 1}</td>
                <td className="mono-num nowrap">{p.deadline}</td>
                <td>
                  <span className={`funnel-badge ${p.funnel.toLowerCase().replace(' ', '-')}`}>
                    {p.funnel}
                  </span>
                </td>
                <td>{p.category}</td>
                <td className="mono-num nowrap">{p.tanggalUpload}</td>
                <td>{p.formatKonten}</td>
                <td>
                  <PlatformBadge platform={p.platform === 'tiktok' ? 'tiktok' : 'instagram'} />
                </td>
                <td className="ide-cell-text" onClick={() => onEdit(p)}>
                  <strong>{p.ideKonten || '(Belum ada ide)'}</strong>
                  {p.brief && <div className="cell-brief-hint">{p.brief.slice(0, 40)}...</div>}
                </td>
                <td className="text-secondary small">{p.hook || '—'}</td>
                <td className="caption-cell-text" title={p.caption || undefined}>
                  {p.caption ? p.caption.slice(0, 60) + (p.caption.length > 60 ? '...' : '') : '—'}
                </td>
                <td>
                  {p.referensi ? (
                    <a href={p.referensi} target="_blank" rel="noopener noreferrer" className="ref-link">
                      Link Ref
                    </a>
                  ) : '—'}
                </td>
                <td>
                  <select
                    className="select select-sm select-progress-inline"
                    value={p.progress}
                    onChange={(e) => onUpdateProgress(p.id, e.target.value)}
                  >
                    {PROGRESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={p.approval}
                    disabled={!canApprove}
                    onChange={() => onToggleApproval(p.id, p.approval)}
                    className="checkbox-approval-inline"
                  />
                </td>
                <td>
                  <div className="row-action-buttons">
                    <button className="row-action-btn edit" onClick={() => onEdit(p)} title="Edit Detail">
                      {I.edit}
                    </button>
                    <button className="row-action-btn delete" onClick={() => onDelete(p.id)} title="Hapus">
                      {I.trash}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {sortedPlans.length === 0 && (
              <tr>
                <td colSpan={14} className="table-empty-state">
                  Tidak ada rencana konten yang cocok dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ------------------- PLAN MODAL (ADD / EDIT) -------------------
interface PlanModalProps {
  plan: ContentPlan;
  isNew: boolean;
  canApprove: boolean;
  onSave: (form: ContentPlan) => void;
  onClose: () => void;
}

function PlanModal({ plan, isNew, canApprove, onSave, onClose }: PlanModalProps) {
  const [form, setForm] = useState<ContentPlan>({ ...plan });
  const [pillars, setPillars] = useState<Pillar[]>([]);

  useEffect(() => {
    apiGet<Pillar[]>('/pillars').then((data) => {
      setPillars(data);
      // New plans default to a stale placeholder category (see handleOpenAddModal)
      // until pillars load — swap it for the first live pillar once available.
      if (isNew) {
        const firstActive = data.find((p) => p.isActive)?.name;
        if (firstActive) setForm((f) => ({ ...f, category: firstActive }));
      }
    }).catch(() => setPillars([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryOptions = useMemo(() => {
    const active = pillars.filter((p) => p.isActive).map((p) => p.name);
    return active.length > 0 ? active : CATEGORY_FALLBACK;
  }, [pillars]);

  const update = (key: keyof ContentPlan, val: unknown) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ideKonten) {
      alert('Ide Konten wajib diisi.');
      return;
    }
    onSave(form);
  };

  return (
    <div className="tracker-modal-backdrop" onClick={onClose}>
      <div className="tracker-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">
            {isNew ? 'Buat Rencana Konten Baru' : 'Edit Rencana Konten'}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            {I.close}
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="modal-form-body">
          <div className="modal-form-grid">
            <div className="form-column">
              <Field label="Ide Konten (Judul Utama)" error={!form.ideKonten ? 'Wajib diisi' : undefined}>
                <input
                  type="text"
                  className="input"
                  value={form.ideKonten}
                  placeholder="Contoh: Lebih pilih pelihara kucing atau anjing?"
                  onChange={(e) => update('ideKonten', e.target.value)}
                />
              </Field>

              <div className="form-grid-2">
                <Field label="Platform">
                  <select className="select" value={form.platform} onChange={(e) => update('platform', e.target.value)}>
                    {PLATFORM_OPTIONS.map((o) => <option key={o} value={o.toLowerCase()}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Format Konten">
                  <select className="select" value={form.formatKonten} onChange={(e) => update('formatKonten', e.target.value)}>
                    {FORMAT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              </div>

              <div className="form-grid-2">
                <Field label="Funnel">
                  <select className="select" value={form.funnel} onChange={(e) => update('funnel', e.target.value)}>
                    {FUNNEL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Kategori" hint="dari Content Pillar">
                  <select className="select" value={form.category} onChange={(e) => update('category', e.target.value)}>
                    {categoryOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              </div>

              <div className="form-grid-2">
                <Field label="Deadline Target">
                  <input type="date" className="input input-mono" value={form.deadline} onChange={(e) => update('deadline', e.target.value)} />
                </Field>
                <Field label="Tanggal Upload">
                  <input type="date" className="input input-mono" value={form.tanggalUpload} onChange={(e) => update('tanggalUpload', e.target.value)} />
                </Field>
              </div>

              <Field label="Hook 3 Detik Pertama (Pancingan Menarik)">
                <input
                  type="text"
                  className="input"
                  value={form.hook || ''}
                  placeholder="Contoh: Tim kucing atau tim anjing?"
                  onChange={(e) => update('hook', e.target.value)}
                />
              </Field>

              <Field label="Brief Deskripsi Konten">
                <textarea
                  className="textarea"
                  rows={3}
                  value={form.brief || ''}
                  placeholder="Tulis alur konten, shotlist, atau detail editing..."
                  onChange={(e) => update('brief', e.target.value)}
                />
              </Field>
            </div>

            <div className="form-column border-left-modal">
              <Field label="Draft Caption / Copywriting">
                <textarea
                  className="textarea font-sans"
                  rows={5}
                  value={form.caption || ''}
                  placeholder="Tulis caption lengkap berserta hashtag..."
                  onChange={(e) => update('caption', e.target.value)}
                />
              </Field>

              <Field label="Link Referensi Konten (Tiktok, Pinterest, dll)">
                <input
                  type="text"
                  className="input input-mono"
                  value={form.referensi || ''}
                  placeholder="https://..."
                  onChange={(e) => update('referensi', e.target.value)}
                />
              </Field>

              <div className="form-grid-2">
                <Field label="Progress Status">
                  <select className="select" value={form.progress} onChange={(e) => update('progress', e.target.value)}>
                    {PROGRESS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Link Result Posting (Analytics/Drive)">
                  <input
                    type="text"
                    className="input input-mono"
                    value={form.result || ''}
                    placeholder="https://..."
                    onChange={(e) => update('result', e.target.value)}
                  />
                </Field>
              </div>

              {/* Approval & Feedback Panel */}
              <div className="modal-approval-box">
                <h4 className="approval-title-box">Review & Approval (Khusus Manager)</h4>

                <div className="approval-check-row">
                  <label className="checkbox-wrap">
                    <input
                      type="checkbox"
                      checked={form.approval}
                      disabled={!canApprove}
                      onChange={(e) => update('approval', e.target.checked)}
                    />
                    <span className="checkbox-lbl"><b>Setujui Konten (Approved)</b></span>
                  </label>
                  {form.approval ? (
                    <span className="badge-approved-status">Approved ✓</span>
                  ) : (
                    <span className="badge-pending-status">Pending Review ⏳</span>
                  )}
                </div>

                <Field label="Feedback / Koreksi Konten">
                  <textarea
                    className="textarea"
                    rows={2}
                    value={form.feedback || ''}
                    placeholder={canApprove ? 'Berikan catatan evaluasi jika ada...' : 'Hanya dapat diisi oleh Manager'}
                    disabled={!canApprove}
                    onChange={(e) => update('feedback', e.target.value)}
                  />
                </Field>

                <Field label="Catatan Revisi">
                  <textarea
                    className="textarea"
                    rows={2}
                    value={form.revision || ''}
                    placeholder={canApprove ? 'Tulis poin revisi yang harus diperbaiki...' : 'Hanya dapat diisi oleh Manager'}
                    disabled={!canApprove}
                    onChange={(e) => update('revision', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="modal-foot-actions">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button variant="primary" type="submit" icon={I.check}>
              Simpan Rencana
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------------------- HELPERS -------------------
function formatDateIndo(dateStr: string) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const d = parseInt(parts[2], 10);
  const m = parseInt(parts[1], 10) - 1;

  return `${d} ${months[m]} ${parts[0]}`;
}
