// ============================================================
// Anima Pulse — domain types + Repo interface (FROZEN CONTRACT)
// Every module/route depends on these. Do not break signatures.
// ============================================================

export type Role = 'staff' | 'manager' | 'admin';
export type Platform = 'tiktok' | 'instagram';
export type AttendanceStatus = 'ontime' | 'late' | 'absent';
export type KolStatus = 'prospect' | 'negotiating' | 'active' | 'blacklist';

export interface User {
  id: string;
  email: string;
  name: string;
  handle: string;
  role: Role;
  avatar: string; // initials
  joined: string; // YYYY-MM
  isActive: boolean;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD (WIB)
  clockInAt: string | null; // ISO
  clockOutAt: string | null; // ISO
  status: AttendanceStatus | null;
  ipAddress?: string | null;
}

export interface Submission {
  id: string;
  userId: string;
  url: string;
  platform: Platform;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  followers: number;
  er: number; // computed server-side
  submittedAt: string; // ISO
  editableUntil: string; // ISO (submittedAt + 1h)
}

export interface KolContact {
  wa: string;
  email: string;
}

export interface Kol {
  id: string;
  name: string;
  handle: string;
  platform: Platform;
  niche: string[];
  followers: number;
  avgViews: number;
  avgER: number;
  ratePerContent: number; // Manager/Admin only at API layer
  status: KolStatus;
  contact: KolContact;
  notes: string;
  createdBy: string;
  isDeleted: boolean;
}

// Kol with ratePerContent stripped for staff responses
export type KolPublic = Omit<Kol, 'ratePerContent'> & { ratePerContent?: number };

export interface KolGrowthEntry {
  id: string;
  kolId: string;
  date: string; // YYYY-MM
  followers: number;
  recordedBy: string;
}

export interface VaultItem {
  id: string;
  url: string;
  title: string;
  platform: Platform;
  thumbnailUrl?: string | null;
  tags: string[];
  savedBy: string;
  savedAt: string; // ISO
  color?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string | null;
  at: string; // ISO
}

export interface ErTargets {
  tiktok: number;
  instagram: number;
}

export interface TeamSummaryRow {
  user: User;
  count: number;
  avgER: number;
  trend: number;
  attendance: AttendanceStatus | null;
}

export interface RoiResult {
  cpv: number;
  cpe: number;
  benchmark_cpv_avg: number;
}

// ---- input shapes ----
export interface NewSubmission {
  userId: string;
  url: string;
  platform: Platform;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  followers: number;
}

export interface NewKol {
  name: string;
  handle: string;
  platform: Platform;
  niche: string[];
  followers: number;
  avgViews?: number;
  avgER?: number;
  ratePerContent: number;
  status: KolStatus;
  contact: KolContact;
  notes?: string;
  createdBy: string;
}

export interface NewVaultItem {
  url: string;
  title: string;
  platform: Platform;
  tags: string[];
  savedBy: string;
  thumbnailUrl?: string | null;
}

export interface Repo {
  // users
  listUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUserRole(id: string, role: Role): Promise<User>;
  setUserActive(id: string, active: boolean): Promise<User>;

  // attendance
  getTodayAttendance(userId: string): Promise<Attendance | null>;
  clockIn(userId: string, ip?: string): Promise<Attendance>; // throws 'already_clocked_in'
  clockOut(userId: string): Promise<Attendance>; // throws 'not_clocked_in' | 'already_clocked_out'
  listAttendance(userId: string, month: number, year: number): Promise<Attendance[]>;
  attendancePct(userId: string): Promise<{ ontime: number; late: number; absent: number }>;

  // content
  createSubmission(s: NewSubmission, ip?: string): Promise<Submission>; // throws 'duplicate_url'
  getSubmission(id: string): Promise<Submission | null>;
  updateSubmission(id: string, userId: string, patch: Partial<NewSubmission>): Promise<Submission>; // throws 'edit_window_closed' | 'forbidden' | 'not_found'
  listSubmissions(q: {
    userId?: string;
    platform?: Platform;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
    sort?: 'er_rate' | 'submitted_at';
  }): Promise<Submission[]>;
  teamSummary(from?: string, to?: string): Promise<TeamSummaryRow[]>;
  erHistory(userId: string): Promise<number[]>;

  // kol
  createKol(k: NewKol): Promise<Kol>; // throws 'duplicate_handle'
  getKol(id: string): Promise<Kol | null>;
  listKols(q: { status?: KolStatus; platform?: Platform; niche?: string; q?: string }): Promise<Kol[]>;
  updateKol(id: string, patch: Partial<NewKol>): Promise<Kol>; // throws 'not_found'
  softDeleteKol(id: string): Promise<void>;
  addGrowth(kolId: string, followers: number, date: string, recordedBy: string): Promise<KolGrowthEntry>;
  listGrowth(kolId: string): Promise<KolGrowthEntry[]>;
  benchmarkCpvAvg(): Promise<number>;

  // vault
  createVaultItem(v: NewVaultItem): Promise<VaultItem>;
  listVault(q: { tags?: string[]; platform?: Platform; q?: string; savedBy?: string }): Promise<VaultItem[]>;

  // settings
  getErTargets(): Promise<ErTargets>;
  setErTargets(t: ErTargets): Promise<ErTargets>;
  listAudit(limit?: number): Promise<AuditLog[]>;
  recordAudit(log: Omit<AuditLog, 'id' | 'at'>): Promise<void>;
}
