// ============================================================
// Anima Pulse — MockRepo (in-memory, no cloud creds)
// Seeded from prototype data, persisted best-effort to .data/store.json
// so writes survive dev hot-reloads. Server-side only.
// ============================================================
import path from 'node:path';
import type {
  Repo, User, Role, Attendance, AttendanceStatus, Submission, NewSubmission,
  Kol, NewKol, KolGrowthEntry, VaultItem, NewVaultItem, AuditLog, ErTargets, TeamSummaryRow,
} from './types';
import { calcER, attendanceStatus, avgOf, trendDelta } from '@/lib/er';
import {
  SEED_USERS, SEED_SUBMISSIONS, SEED_KOLS, SEED_KOL_GROWTH, SEED_VAULT,
  SEED_ER_HISTORY, SEED_ER_TARGETS, SEED_TODAY_ATTENDANCE, SEED_ATTENDANCE_PCT,
} from './seed';

interface Store {
  users: User[];
  attendances: Attendance[];
  submissions: Submission[];
  kols: Kol[];
  growth: KolGrowthEntry[];
  vault: VaultItem[];
  audit: AuditLog[];
  erTargets: ErTargets;
}

const DATA_FILE = path.join(process.cwd(), '.data', 'store.json');

function uid(prefix: string): string {
  const r = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}_${r}`;
}

/** Current WIB calendar date as YYYY-MM-DD. */
function todayWIB(): string {
  const wib = new Date(Date.now() + 7 * 3_600_000);
  return wib.toISOString().slice(0, 10);
}

/** Build a today-ISO timestamp from a "HH:MM" WIB wall-clock string. */
function wibTimeToIso(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const date = todayWIB();
  // WIB wall clock → UTC by subtracting 7h
  const utc = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`).getTime() - 7 * 3_600_000;
  return new Date(utc).toISOString();
}

function seedStore(): Store {
  const today = todayWIB();
  const attendances: Attendance[] = Object.entries(SEED_TODAY_ATTENDANCE)
    .filter(([, v]) => v.clockInAt)
    .map(([userId, v]) => ({
      id: uid('att'),
      userId,
      date: today,
      clockInAt: wibTimeToIso(v.clockInAt as string),
      clockOutAt: null,
      status: v.status,
      ipAddress: '127.0.0.1',
    }));
  return {
    users: structuredClone(SEED_USERS),
    attendances,
    submissions: structuredClone(SEED_SUBMISSIONS),
    kols: structuredClone(SEED_KOLS),
    growth: structuredClone(SEED_KOL_GROWTH),
    vault: structuredClone(SEED_VAULT),
    audit: [],
    erTargets: { ...SEED_ER_TARGETS },
  };
}

export class MockRepo implements Repo {
  private s: Store;
  private persist: boolean;

  constructor(opts: { persist?: boolean } = {}) {
    this.persist = opts.persist ?? true;
    this.s = (this.persist ? this.load() : null) ?? seedStore();
  }

  private load(): Store | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('node:fs') as typeof import('node:fs');
      if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as Store;
      }
    } catch {
      /* read-only FS (serverless) → in-memory only */
    }
    return null;
  }

  private save(): void {
    if (!this.persist) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('node:fs') as typeof import('node:fs');
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.s, null, 2));
    } catch {
      /* ignore in read-only environments */
    }
  }

  // ---------- users ----------
  async listUsers() { return this.s.users; }
  async getUser(id: string) { return this.s.users.find((u) => u.id === id) ?? null; }
  async getUserByEmail(email: string) { return this.s.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null; }
  async updateUserRole(id: string, role: Role) {
    const u = this.s.users.find((x) => x.id === id);
    if (!u) throw new Error('not_found');
    u.role = role; this.save(); return u;
  }
  async setUserActive(id: string, active: boolean) {
    const u = this.s.users.find((x) => x.id === id);
    if (!u) throw new Error('not_found');
    u.isActive = active; this.save(); return u;
  }

  // ---------- attendance ----------
  async getTodayAttendance(userId: string) {
    const today = todayWIB();
    return this.s.attendances.find((a) => a.userId === userId && a.date === today) ?? null;
  }
  async clockIn(userId: string, ip?: string) {
    const today = todayWIB();
    if (this.s.attendances.some((a) => a.userId === userId && a.date === today)) {
      throw new Error('already_clocked_in');
    }
    const nowIso = new Date().toISOString();
    const rec: Attendance = {
      id: uid('att'), userId, date: today, clockInAt: nowIso, clockOutAt: null,
      status: attendanceStatus(nowIso), ipAddress: ip ?? null,
    };
    this.s.attendances.push(rec); this.save(); return rec;
  }
  async clockOut(userId: string) {
    const today = todayWIB();
    const rec = this.s.attendances.find((a) => a.userId === userId && a.date === today);
    if (!rec) throw new Error('not_clocked_in');
    if (rec.clockOutAt) throw new Error('already_clocked_out');
    rec.clockOutAt = new Date().toISOString(); this.save(); return rec;
  }
  async listAttendance(userId: string, month: number, year: number) {
    return this.s.attendances.filter((a) => {
      if (a.userId !== userId) return false;
      const d = new Date(a.date);
      return d.getUTCMonth() + 1 === month && d.getUTCFullYear() === year;
    });
  }
  async attendancePct(userId: string) {
    return SEED_ATTENDANCE_PCT[userId] ?? { ontime: 0, late: 0, absent: 0 };
  }

  // ---------- content ----------
  async createSubmission(s: NewSubmission, ip?: string) {
    if (this.s.submissions.some((x) => x.url.toLowerCase() === s.url.toLowerCase())) {
      throw new Error('duplicate_url');
    }
    const submittedAt = new Date().toISOString();
    const sub: Submission = {
      id: uid('sub'), userId: s.userId, url: s.url, platform: s.platform, title: s.title,
      views: s.views, likes: s.likes, comments: s.comments, shares: s.shares, followers: s.followers,
      er: calcER(s), // server-side; client-supplied er is never trusted
      submittedAt, editableUntil: new Date(Date.now() + 3_600_000).toISOString(),
    };
    this.s.submissions.unshift(sub); this.save(); return sub;
  }
  async getSubmission(id: string) { return this.s.submissions.find((x) => x.id === id) ?? null; }
  async updateSubmission(id: string, userId: string, patch: Partial<NewSubmission>) {
    const sub = this.s.submissions.find((x) => x.id === id);
    if (!sub) throw new Error('not_found');
    if (sub.userId !== userId) throw new Error('forbidden');
    if (Date.now() > new Date(sub.editableUntil).getTime()) throw new Error('edit_window_closed');
    Object.assign(sub, patch);
    sub.er = calcER(sub);
    this.save(); return sub;
  }
  async listSubmissions(q: { userId?: string; platform?: string; from?: string; to?: string; limit?: number; offset?: number; sort?: 'er_rate' | 'submitted_at' }) {
    let rows = this.s.submissions.slice();
    if (q.userId) rows = rows.filter((r) => r.userId === q.userId);
    if (q.platform) rows = rows.filter((r) => r.platform === q.platform);
    if (q.from) rows = rows.filter((r) => r.submittedAt >= q.from!);
    if (q.to) rows = rows.filter((r) => r.submittedAt <= q.to!);
    rows.sort((a, b) => (q.sort === 'er_rate' ? b.er - a.er : b.submittedAt.localeCompare(a.submittedAt)));
    const offset = q.offset ?? 0;
    const limit = q.limit ?? rows.length;
    return rows.slice(offset, offset + limit);
  }
  async erHistory(userId: string) { return SEED_ER_HISTORY[userId] ?? []; }
  async teamSummary(from?: string, to?: string): Promise<TeamSummaryRow[]> {
    const today = todayWIB();
    const staffish = this.s.users.filter((u) => u.role === 'staff' || u.role === 'manager');
    return staffish.map((user) => {
      let subs = this.s.submissions.filter((s) => s.userId === user.id);
      if (from) subs = subs.filter((s) => s.submittedAt >= from);
      if (to) subs = subs.filter((s) => s.submittedAt <= to);
      const att = this.s.attendances.find((a) => a.userId === user.id && a.date === today);
      return {
        user,
        count: subs.length,
        avgER: avgOf(subs.map((s) => s.er)),
        trend: trendDelta(SEED_ER_HISTORY[user.id] ?? []),
        attendance: (att?.status ?? null) as AttendanceStatus | null,
      };
    });
  }

  // ---------- kol ----------
  async createKol(k: NewKol) {
    if (this.s.kols.some((x) => !x.isDeleted && x.handle.toLowerCase() === k.handle.toLowerCase() && x.platform === k.platform)) {
      throw new Error('duplicate_handle');
    }
    const kol: Kol = {
      id: uid('kol'), name: k.name, handle: k.handle, platform: k.platform, niche: k.niche,
      followers: k.followers, avgViews: k.avgViews ?? 0, avgER: k.avgER ?? 0,
      ratePerContent: k.ratePerContent, status: k.status, contact: k.contact,
      notes: k.notes ?? '', createdBy: k.createdBy, isDeleted: false,
    };
    this.s.kols.unshift(kol); this.save(); return kol;
  }
  async getKol(id: string) { return this.s.kols.find((x) => x.id === id && !x.isDeleted) ?? null; }
  async listKols(q: { status?: string; platform?: string; niche?: string; q?: string }) {
    let rows = this.s.kols.filter((k) => !k.isDeleted);
    if (q.status) rows = rows.filter((k) => k.status === q.status);
    if (q.platform) rows = rows.filter((k) => k.platform === q.platform);
    if (q.niche) rows = rows.filter((k) => k.niche.includes(q.niche!));
    if (q.q) { const t = q.q.toLowerCase(); rows = rows.filter((k) => k.name.toLowerCase().includes(t) || k.handle.toLowerCase().includes(t)); }
    return rows;
  }
  async updateKol(id: string, patch: Partial<NewKol>) {
    const kol = this.s.kols.find((x) => x.id === id);
    if (!kol) throw new Error('not_found');
    Object.assign(kol, patch); this.save(); return kol;
  }
  async softDeleteKol(id: string) {
    const kol = this.s.kols.find((x) => x.id === id);
    if (kol) { kol.isDeleted = true; this.save(); }
  }
  async addGrowth(kolId: string, followers: number, date: string, recordedBy: string) {
    const entry: KolGrowthEntry = { id: uid('grw'), kolId, followers, date, recordedBy };
    this.s.growth.push(entry);
    const kol = this.s.kols.find((x) => x.id === kolId);
    if (kol) kol.followers = followers;
    this.save(); return entry;
  }
  async listGrowth(kolId: string) {
    return this.s.growth.filter((g) => g.kolId === kolId).sort((a, b) => a.date.localeCompare(b.date));
  }
  async benchmarkCpvAvg() {
    const live = this.s.kols.filter((k) => !k.isDeleted && k.avgViews > 0);
    if (!live.length) return 0;
    return +avgOf(live.map((k) => +(k.ratePerContent / k.avgViews).toFixed(2))).toFixed(2);
  }

  // ---------- vault ----------
  async createVaultItem(v: NewVaultItem) {
    const item: VaultItem = {
      id: uid('vlt'), url: v.url, title: v.title, platform: v.platform, tags: v.tags,
      savedBy: v.savedBy, savedAt: new Date().toISOString(), thumbnailUrl: v.thumbnailUrl ?? null,
      color: undefined,
    };
    this.s.vault.unshift(item); this.save(); return item;
  }
  async listVault(q: { tags?: string[]; platform?: string; q?: string; savedBy?: string }) {
    let rows = this.s.vault.slice();
    if (q.tags && q.tags.length) rows = rows.filter((v) => q.tags!.every((t) => v.tags.includes(t)));
    if (q.platform) rows = rows.filter((v) => v.platform === q.platform);
    if (q.savedBy) rows = rows.filter((v) => v.savedBy === q.savedBy);
    if (q.q) { const t = q.q.toLowerCase(); rows = rows.filter((v) => v.title.toLowerCase().includes(t)); }
    return rows;
  }

  // ---------- settings ----------
  async getErTargets() { return this.s.erTargets; }
  async setErTargets(t: ErTargets) { this.s.erTargets = t; this.save(); return t; }
  async listAudit(limit = 100) { return this.s.audit.slice(-limit).reverse(); }
  async recordAudit(log: Omit<AuditLog, 'id' | 'at'>) {
    this.s.audit.push({ ...log, id: uid('aud'), at: new Date().toISOString() });
    this.save();
  }
}
