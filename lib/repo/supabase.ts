// ============================================================
// Anima Pulse — SupabaseRepo (cloud backend)
// Active when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set.
// Column names are snake_case to match supabase/migrations/0001_init.sql.
// ER is always computed server-side here too — client values ignored.
// ============================================================
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Repo, User, Role, Attendance, Submission, NewSubmission, Kol, NewKol,
  KolGrowthEntry, VaultItem, NewVaultItem, AuditLog, ErTargets, TeamSummaryRow,
} from './types';
import { calcER, avgOf, trendDelta, attendanceStatus } from '@/lib/er';

function client(): SupabaseClient {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

// row → domain mappers
const toUser = (r: any): User => ({ id: r.id, email: r.email, name: r.full_name, handle: r.handle, role: r.role, avatar: r.avatar, joined: r.joined, isActive: r.is_active });
const toAtt = (r: any): Attendance => ({ id: r.id, userId: r.user_id, date: r.date, clockInAt: r.clock_in_at, clockOutAt: r.clock_out_at, status: r.status, ipAddress: r.ip_address });
const toSub = (r: any): Submission => ({ id: r.id, userId: r.user_id, url: r.url, platform: r.platform, title: r.title, views: r.views, likes: r.likes, comments: r.comments, shares: r.shares, followers: r.followers_at_post, er: Number(r.er_rate), submittedAt: r.submitted_at, editableUntil: r.editable_until });
const toKol = (r: any): Kol => ({ id: r.id, name: r.name, handle: r.handle, platform: r.platform, niche: r.niche ?? [], followers: r.followers, avgViews: r.avg_views, avgER: Number(r.avg_er), ratePerContent: Number(r.rate_per_content), status: r.status, contact: r.contact ?? { wa: '', email: '' }, notes: r.notes ?? '', createdBy: r.created_by, isDeleted: r.is_deleted });
const toGrowth = (r: any): KolGrowthEntry => ({ id: r.id, kolId: r.kol_id, date: r.recorded_date, followers: r.followers_count, recordedBy: r.recorded_by });
const toVault = (r: any): VaultItem => ({ id: r.id, url: r.url, title: r.title, platform: r.platform, thumbnailUrl: r.thumbnail_url, tags: r.tags ?? [], savedBy: r.saved_by, savedAt: r.saved_at, color: r.color ?? undefined });
const toAudit = (r: any): AuditLog => ({ id: r.id, userId: r.user_id, action: r.action, resourceType: r.resource_type, resourceId: r.resource_id, ipAddress: r.ip_address, at: r.created_at });

export class SupabaseRepo implements Repo {
  private db = client();

  // ---------- users ----------
  async listUsers() { const { data } = await this.db.from('users').select('*').order('full_name'); return (data ?? []).map(toUser); }
  async getUser(id: string) { const { data } = await this.db.from('users').select('*').eq('id', id).maybeSingle(); return data ? toUser(data) : null; }
  async getUserByEmail(email: string) { const { data } = await this.db.from('users').select('*').ilike('email', email).maybeSingle(); return data ? toUser(data) : null; }
  async updateUserRole(id: string, role: Role) { const { data, error } = await this.db.from('users').update({ role }).eq('id', id).select('*').single(); if (error) throw new Error('not_found'); return toUser(data); }
  async setUserActive(id: string, active: boolean) { const { data, error } = await this.db.from('users').update({ is_active: active }).eq('id', id).select('*').single(); if (error) throw new Error('not_found'); return toUser(data); }

  // ---------- attendance ----------
  async getTodayAttendance(userId: string) {
    const today = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
    const { data } = await this.db.from('attendances').select('*').eq('user_id', userId).eq('date', today).maybeSingle();
    return data ? toAtt(data) : null;
  }
  async clockIn(userId: string, ip?: string) {
    const today = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
    const existing = await this.getTodayAttendance(userId);
    if (existing) throw new Error('already_clocked_in');
    const nowIso = new Date().toISOString();
    const { data, error } = await this.db.from('attendances')
      .insert({ user_id: userId, date: today, clock_in_at: nowIso, status: attendanceStatus(nowIso), ip_address: ip ?? null })
      .select('*').single();
    if (error) throw new Error('already_clocked_in');
    return toAtt(data);
  }
  async clockOut(userId: string) {
    const rec = await this.getTodayAttendance(userId);
    if (!rec) throw new Error('not_clocked_in');
    if (rec.clockOutAt) throw new Error('already_clocked_out');
    const { data } = await this.db.from('attendances').update({ clock_out_at: new Date().toISOString() }).eq('id', rec.id).select('*').single();
    return toAtt(data);
  }
  async listAttendance(userId: string, month: number, year: number) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const to = `${year}-${String(month).padStart(2, '0')}-31`;
    const { data } = await this.db.from('attendances').select('*').eq('user_id', userId).gte('date', from).lte('date', to);
    return (data ?? []).map(toAtt);
  }
  async attendancePct(userId: string) {
    const { data } = await this.db.from('attendances').select('status').eq('user_id', userId);
    const rows = data ?? [];
    const total = rows.length || 1;
    const c = (s: string) => Math.round((rows.filter((r: any) => r.status === s).length / total) * 100);
    return { ontime: c('ontime'), late: c('late'), absent: c('absent') };
  }

  // ---------- content ----------
  async createSubmission(s: NewSubmission, ip?: string) {
    const dup = await this.db.from('content_submissions').select('id').ilike('url', s.url).maybeSingle();
    if (dup.data) throw new Error('duplicate_url');
    const submittedAt = new Date();
    const { data, error } = await this.db.from('content_submissions').insert({
      user_id: s.userId, url: s.url, platform: s.platform, title: s.title,
      views: s.views, likes: s.likes, comments: s.comments, shares: s.shares, followers_at_post: s.followers,
      er_rate: calcER(s), submitted_at: submittedAt.toISOString(),
      editable_until: new Date(submittedAt.getTime() + 3_600_000).toISOString(),
    }).select('*').single();
    if (error) throw new Error('duplicate_url');
    return toSub(data);
  }
  async getSubmission(id: string) { const { data } = await this.db.from('content_submissions').select('*').eq('id', id).maybeSingle(); return data ? toSub(data) : null; }
  async updateSubmission(id: string, userId: string, patch: Partial<NewSubmission>) {
    const cur = await this.getSubmission(id);
    if (!cur) throw new Error('not_found');
    if (cur.userId !== userId) throw new Error('forbidden');
    if (Date.now() > new Date(cur.editableUntil).getTime()) throw new Error('edit_window_closed');
    const merged = { ...cur, ...patch };
    const { data } = await this.db.from('content_submissions').update({
      url: merged.url, platform: merged.platform, title: merged.title, views: merged.views,
      likes: merged.likes, comments: merged.comments, shares: merged.shares, followers_at_post: merged.followers,
      er_rate: calcER(merged),
    }).eq('id', id).select('*').single();
    return toSub(data);
  }
  async listSubmissions(q: { userId?: string; platform?: string; from?: string; to?: string; limit?: number; offset?: number; sort?: 'er_rate' | 'submitted_at' }) {
    let query = this.db.from('content_submissions').select('*');
    if (q.userId) query = query.eq('user_id', q.userId);
    if (q.platform) query = query.eq('platform', q.platform);
    if (q.from) query = query.gte('submitted_at', q.from);
    if (q.to) query = query.lte('submitted_at', q.to);
    query = query.order(q.sort === 'er_rate' ? 'er_rate' : 'submitted_at', { ascending: false });
    if (q.limit != null) query = query.range(q.offset ?? 0, (q.offset ?? 0) + q.limit - 1);
    const { data } = await query;
    return (data ?? []).map(toSub);
  }
  async erHistory(userId: string) {
    const { data } = await this.db.from('content_submissions').select('er_rate, submitted_at').eq('user_id', userId).order('submitted_at', { ascending: true });
    return (data ?? []).map((r: any) => Number(r.er_rate));
  }
  async teamSummary(from?: string, to?: string): Promise<TeamSummaryRow[]> {
    const users = (await this.listUsers()).filter((u) => u.role === 'staff' || u.role === 'manager');
    const out: TeamSummaryRow[] = [];
    for (const user of users) {
      const subs = await this.listSubmissions({ userId: user.id, from, to });
      const history = await this.erHistory(user.id);
      const att = await this.getTodayAttendance(user.id);
      out.push({ user, count: subs.length, avgER: avgOf(subs.map((s) => s.er)), trend: trendDelta(history), attendance: att?.status ?? null });
    }
    return out;
  }

  // ---------- kol ----------
  async createKol(k: NewKol) {
    const dup = await this.db.from('kol_profiles').select('id').ilike('handle', k.handle).eq('platform', k.platform).eq('is_deleted', false).maybeSingle();
    if (dup.data) throw new Error('duplicate_handle');
    const { data, error } = await this.db.from('kol_profiles').insert({
      name: k.name, handle: k.handle, platform: k.platform, niche: k.niche, followers: k.followers,
      avg_views: k.avgViews ?? 0, avg_er: k.avgER ?? 0, rate_per_content: k.ratePerContent,
      status: k.status, contact: k.contact, notes: k.notes ?? '', created_by: k.createdBy, is_deleted: false,
    }).select('*').single();
    if (error) throw new Error('duplicate_handle');
    return toKol(data);
  }
  async getKol(id: string) { const { data } = await this.db.from('kol_profiles').select('*').eq('id', id).eq('is_deleted', false).maybeSingle(); return data ? toKol(data) : null; }
  async listKols(q: { status?: string; platform?: string; niche?: string; q?: string }) {
    let query = this.db.from('kol_profiles').select('*').eq('is_deleted', false);
    if (q.status) query = query.eq('status', q.status);
    if (q.platform) query = query.eq('platform', q.platform);
    if (q.niche) query = query.contains('niche', [q.niche]);
    if (q.q) query = query.or(`name.ilike.%${q.q}%,handle.ilike.%${q.q}%`);
    const { data } = await query;
    return (data ?? []).map(toKol);
  }
  async updateKol(id: string, patch: Partial<NewKol>) {
    const row: any = {};
    if (patch.name != null) row.name = patch.name;
    if (patch.handle != null) row.handle = patch.handle;
    if (patch.platform != null) row.platform = patch.platform;
    if (patch.niche != null) row.niche = patch.niche;
    if (patch.followers != null) row.followers = patch.followers;
    if (patch.avgViews != null) row.avg_views = patch.avgViews;
    if (patch.avgER != null) row.avg_er = patch.avgER;
    if (patch.ratePerContent != null) row.rate_per_content = patch.ratePerContent;
    if (patch.status != null) row.status = patch.status;
    if (patch.contact != null) row.contact = patch.contact;
    if (patch.notes != null) row.notes = patch.notes;
    const { data, error } = await this.db.from('kol_profiles').update(row).eq('id', id).select('*').single();
    if (error) throw new Error('not_found');
    return toKol(data);
  }
  async softDeleteKol(id: string) { await this.db.from('kol_profiles').update({ is_deleted: true }).eq('id', id); }
  async addGrowth(kolId: string, followers: number, date: string, recordedBy: string) {
    const { data } = await this.db.from('kol_growth_entries').insert({ kol_id: kolId, followers_count: followers, recorded_date: date, recorded_by: recordedBy }).select('*').single();
    await this.db.from('kol_profiles').update({ followers }).eq('id', kolId);
    return toGrowth(data);
  }
  async listGrowth(kolId: string) {
    const { data } = await this.db.from('kol_growth_entries').select('*').eq('kol_id', kolId).order('recorded_date', { ascending: true });
    return (data ?? []).map(toGrowth);
  }
  async benchmarkCpvAvg() {
    const kols = await this.listKols({});
    const live = kols.filter((k) => k.avgViews > 0);
    if (!live.length) return 0;
    return +avgOf(live.map((k) => +(k.ratePerContent / k.avgViews).toFixed(2))).toFixed(2);
  }

  // ---------- vault ----------
  async createVaultItem(v: NewVaultItem) {
    const { data } = await this.db.from('fyp_vault').insert({
      url: v.url, title: v.title, platform: v.platform, tags: v.tags, saved_by: v.savedBy,
      thumbnail_url: v.thumbnailUrl ?? null, saved_at: new Date().toISOString(),
    }).select('*').single();
    return toVault(data);
  }
  async listVault(q: { tags?: string[]; platform?: string; q?: string; savedBy?: string }) {
    let query = this.db.from('fyp_vault').select('*');
    if (q.tags && q.tags.length) query = query.contains('tags', q.tags);
    if (q.platform) query = query.eq('platform', q.platform);
    if (q.savedBy) query = query.eq('saved_by', q.savedBy);
    if (q.q) query = query.ilike('title', `%${q.q}%`);
    query = query.order('saved_at', { ascending: false });
    const { data } = await query;
    return (data ?? []).map(toVault);
  }

  // ---------- settings ----------
  async getErTargets() {
    const { data } = await this.db.from('er_targets').select('*');
    const t: ErTargets = { tiktok: 6.0, instagram: 3.5 };
    for (const r of data ?? []) { if (r.platform === 'tiktok') t.tiktok = Number(r.target); if (r.platform === 'instagram') t.instagram = Number(r.target); }
    return t;
  }
  async setErTargets(t: ErTargets) {
    await this.db.from('er_targets').upsert([
      { platform: 'tiktok', target: t.tiktok },
      { platform: 'instagram', target: t.instagram },
    ], { onConflict: 'platform' });
    return t;
  }
  async listAudit(limit = 100) {
    const { data } = await this.db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
    return (data ?? []).map(toAudit);
  }
  async recordAudit(log: Omit<AuditLog, 'id' | 'at'>) {
    await this.db.from('audit_logs').insert({
      user_id: log.userId, action: log.action, resource_type: log.resourceType,
      resource_id: log.resourceId, ip_address: log.ipAddress ?? null,
    });
  }
}
