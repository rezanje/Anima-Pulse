// ============================================================
// Anima Pulse — seed dataset (ported from prototype src/data.jsx)
// Fictional but plausible Indonesian data. Used by MockRepo and seed.sql.
// ============================================================
import type {
  User, Submission, Kol, KolGrowthEntry, VaultItem, Attendance, ErTargets, Platform,
} from './types';
import { calcER } from '@/lib/er';

export const SEED_USERS: User[] = [
  { id: 'u00', name: 'Reza Gentanala', handle: '@rezarezanje', email: 'rezarezanje@gmail.com', role: 'admin', avatar: 'RG', joined: '2026-06', isActive: true, loginCode: 'SUPER123' },
  { id: 'u01', name: 'Adit Pranatama', handle: '@aditpr', email: 'adit@animacompanion.com', role: 'staff', avatar: 'AP', joined: '2023-08', isActive: true, loginCode: 'STAFF123' },
  { id: 'u02', name: 'Salsa Aulia', handle: '@salsa.au', email: 'salsa@animacompanion.com', role: 'staff', avatar: 'SA', joined: '2023-04', isActive: true, loginCode: 'STAFF2' },
  { id: 'u03', name: 'Rina Mahardika', handle: '@rinamhd', email: 'rina@animacompanion.com', role: 'staff', avatar: 'RM', joined: '2024-01', isActive: true, loginCode: 'STAFF3' },
  { id: 'u04', name: 'Bagas Nugraha', handle: '@bagas.n', email: 'bagas@animacompanion.com', role: 'staff', avatar: 'BN', joined: '2022-11', isActive: true, loginCode: 'STAFF4' },
  { id: 'u05', name: 'Putri Larasati', handle: '@putrilrs', email: 'putri@animacompanion.com', role: 'staff', avatar: 'PL', joined: '2024-03', isActive: true, loginCode: 'STAFF5' },
  { id: 'u06', name: 'Reza Hidayat', handle: '@rezahd', email: 'reza@animacompanion.com', role: 'manager', avatar: 'RH', joined: '2022-02', isActive: true, loginCode: 'MGR123' },
  { id: 'u07', name: 'Devi Andriani', handle: '@deviand', email: 'devi@animacompanion.com', role: 'admin', avatar: 'DA', joined: '2021-09', isActive: true, loginCode: 'ADMIN123' },
];

// default current user per role (dev-login)
export const DEFAULT_USER_BY_ROLE: Record<'staff' | 'manager' | 'admin', string> = {
  staff: 'u01',
  manager: 'u06',
  admin: 'u07',
};

// default user EMAIL per role — stable across MockRepo (u01..) and SupabaseRepo (UUIDs).
// dev-login resolves the real user id from the active repo via getUserByEmail.
export const DEFAULT_EMAIL_BY_ROLE: Record<'staff' | 'manager' | 'admin', string> = {
  staff: 'adit@animacompanion.com',
  manager: 'reza@animacompanion.com',
  admin: 'devi@animacompanion.com',
};

// 8 ER history points per staff (oldest → newest)
export const SEED_ER_HISTORY: Record<string, number[]> = {
  u01: [4.2, 5.1, 4.8, 6.3, 5.9, 7.1, 6.8, 8.2],
  u02: [6.1, 5.8, 5.4, 4.9, 4.2, 3.8, 4.1, 4.5],
  u03: [3.1, 3.4, 4.0, 4.5, 5.1, 5.4, 5.8, 6.2],
  u04: [7.2, 6.8, 7.5, 8.1, 7.9, 8.4, 7.6, 7.8],
  u05: [2.8, 3.2, 3.5, 3.1, 2.9, 3.4, 3.8, 4.0],
};

interface RawSub {
  id: string; userId: string; platform: Platform; url: string; title: string;
  views: number; likes: number; comments: number; shares: number; followers: number; hoursAgo: number;
}

const RAW_SUBS: RawSub[] = [
  { id: 's01', userId: 'u01', platform: 'tiktok', url: 'https://tiktok.com/@aditpr/video/728001', title: 'POV: lo jadi anak magang minggu pertama', views: 248_300, likes: 18_900, comments: 1_240, shares: 3_810, followers: 42_100, hoursAgo: 3 },
  { id: 's02', userId: 'u02', platform: 'instagram', url: 'https://instagram.com/p/CzX9pK0002', title: 'Skincare routine pagi 7 produk under 200rb', views: 89_400, likes: 4_120, comments: 312, shares: 410, followers: 28_900, hoursAgo: 5 },
  { id: 's03', userId: 'u03', platform: 'tiktok', url: 'https://tiktok.com/@rinamhd/video/729003', title: 'Belanja groceries 100rb selama seminggu', views: 412_800, likes: 31_200, comments: 2_140, shares: 5_900, followers: 18_400, hoursAgo: 11 },
  { id: 's04', userId: 'u04', platform: 'tiktok', url: 'https://tiktok.com/@bagas.n/video/731004', title: 'Reaksi liat harga jajanan SD sekarang', views: 1_120_000, likes: 89_400, comments: 6_310, shares: 14_200, followers: 88_700, hoursAgo: 26 },
  { id: 's05', userId: 'u05', platform: 'instagram', url: 'https://instagram.com/p/CzY1mR0005', title: 'Outfit kondangan budget 300rb thrift mode', views: 56_200, likes: 1_840, comments: 92, shares: 180, followers: 12_300, hoursAgo: 30 },
  { id: 's06', userId: 'u01', platform: 'instagram', url: 'https://instagram.com/p/CzVa3p0006', title: 'Bedah harga kost-kostan Jakarta Selatan', views: 142_900, likes: 9_840, comments: 612, shares: 2_010, followers: 41_800, hoursAgo: 52 },
  { id: 's07', userId: 'u02', platform: 'tiktok', url: 'https://tiktok.com/@salsa.au/video/725007', title: 'Day in my life as content creator full time', views: 78_400, likes: 3_120, comments: 245, shares: 380, followers: 28_700, hoursAgo: 73 },
];

const NOW = Date.UTC(2026, 4, 21, 4, 0, 0); // 2026-05-21 11:00 WIB reference

export const SEED_SUBMISSIONS: Submission[] = RAW_SUBS.map((s) => {
  const submittedAt = new Date(NOW - s.hoursAgo * 3_600_000).toISOString();
  const editableUntil = new Date(NOW - s.hoursAgo * 3_600_000 + 3_600_000).toISOString();
  return {
    id: s.id, userId: s.userId, url: s.url, platform: s.platform, title: s.title,
    views: s.views, likes: s.likes, comments: s.comments, shares: s.shares, followers: s.followers,
    er: calcER(s), submittedAt, editableUntil,
  };
});

export const SEED_KOLS: Kol[] = [
  { id: 'k01', name: 'Mira Sastrawijaya', handle: '@mirasastra', platform: 'tiktok', niche: ['beauty', 'lifestyle'], followers: 412_000, avgViews: 180_000, avgER: 6.8, ratePerContent: 4_500_000, status: 'active', contact: { wa: '+62 812-3456-7890', email: 'mira@talenta.id' }, notes: 'Sudah 3x kerja sama. Negosiasi mudah, deliverable selalu on time. Audience Jabodetabek dominan.', createdBy: 'u06', isDeleted: false },
  { id: 'k02', name: 'Bryan Sutanto', handle: '@bryans', platform: 'tiktok', niche: ['comedy', 'daily-life'], followers: 1_240_000, avgViews: 620_000, avgER: 8.2, ratePerContent: 12_000_000, status: 'active', contact: { wa: '+62 821-9988-7766', email: 'bryan@brymgmt.com' }, notes: 'Top tier comedy. Wajib brief 2 minggu sebelum tayang. Tidak terima brand minuman.', createdBy: 'u06', isDeleted: false },
  { id: 'k03', name: 'Kayla Mahisa', handle: '@kaylamah', platform: 'instagram', niche: ['fashion', 'aesthetic'], followers: 287_000, avgViews: 95_000, avgER: 4.2, ratePerContent: 3_200_000, status: 'prospect', contact: { wa: '+62 813-1122-3344', email: 'kayla.mh@gmail.com' }, notes: 'Belum pernah kerja sama. Tone aestetik cocok untuk brand fashion premium.', createdBy: 'u06', isDeleted: false },
  { id: 'k04', name: 'Faiz Ramadhan', handle: '@faizr.id', platform: 'tiktok', niche: ['finance', 'edukasi'], followers: 580_000, avgViews: 220_000, avgER: 7.4, ratePerContent: 6_800_000, status: 'negotiating', contact: { wa: '+62 856-7788-9900', email: 'faiz@finlit.id' }, notes: 'Diskusi alot soal exclusivity. Mau tier brand finance saja, no fintech P2P.', createdBy: 'u06', isDeleted: false },
  { id: 'k05', name: 'Zara Anindita', handle: '@zaraani', platform: 'instagram', niche: ['parenting', 'food'], followers: 198_000, avgViews: 64_000, avgER: 5.1, ratePerContent: 2_400_000, status: 'active', contact: { wa: '+62 815-4433-2211', email: 'zara@mom.id' }, notes: 'Audience ibu muda 25-34. ROI bagus untuk kategori produk anak & dapur.', createdBy: 'u06', isDeleted: false },
  { id: 'k06', name: 'Damar Pratomo', handle: '@damarpr', platform: 'tiktok', niche: ['gaming', 'tech'], followers: 920_000, avgViews: 380_000, avgER: 9.1, ratePerContent: 8_500_000, status: 'active', contact: { wa: '+62 877-1111-2222', email: 'damar@gg.id' }, notes: 'ER tinggi, audience kuat di sektor gen Z gaming. Cocok brand gadget mid-range.', createdBy: 'u06', isDeleted: false },
  { id: 'k07', name: 'Nadya Khairunnisa', handle: '@nadyakh', platform: 'instagram', niche: ['beauty', 'edukasi'], followers: 156_000, avgViews: 48_000, avgER: 3.8, ratePerContent: 1_900_000, status: 'prospect', contact: { wa: '+62 819-5566-7788', email: 'nadya@beautyedu.id' }, notes: 'Konten kosmetik review jujur. Belum punya rate card resmi.', createdBy: 'u06', isDeleted: false },
  { id: 'k08', name: 'Hafiz Maulana', handle: '@hafizmaul', platform: 'tiktok', niche: ['fitness', 'motivasi'], followers: 340_000, avgViews: 140_000, avgER: 6.2, ratePerContent: 3_400_000, status: 'blacklist', contact: { wa: '+62 822-9988-1100', email: 'hafiz@fit.id' }, notes: 'Pernah delay deliverable 3 minggu. Komunikasi sulit. Tidak direkomendasikan.', createdBy: 'u06', isDeleted: false },
  { id: 'k09', name: 'Salma Putri Dewi', handle: '@salmaputri', platform: 'instagram', niche: ['fashion', 'lifestyle'], followers: 78_400, avgViews: 22_000, avgER: 4.6, ratePerContent: 1_200_000, status: 'active', contact: { wa: '+62 818-3344-5566', email: 'salma@dewi.id' }, notes: 'Micro-influencer, cocok kampanye budget rendah dengan ER decent.', createdBy: 'u06', isDeleted: false },
  { id: 'k10', name: 'Yoga Adiwinata', handle: '@yogaadi', platform: 'tiktok', niche: ['kuliner', 'jalan-jalan'], followers: 720_000, avgViews: 290_000, avgER: 7.8, ratePerContent: 5_600_000, status: 'active', contact: { wa: '+62 813-7777-8888', email: 'yoga@kuliner.id' }, notes: 'Spesialis review tempat makan kaki lima. Sudah 5x repeat dengan brand F&B.', createdBy: 'u06', isDeleted: false },
  { id: 'k11', name: 'Intan Permatasari', handle: '@intanperm', platform: 'instagram', niche: ['interior', 'home'], followers: 112_000, avgViews: 34_000, avgER: 4.4, ratePerContent: 1_600_000, status: 'prospect', contact: { wa: '+62 856-2222-3333', email: 'intan@home.id' }, notes: 'Audience usia 30+, daya beli mid-up. Niche home decor masih jarang kompetitor.', createdBy: 'u06', isDeleted: false },
  { id: 'k12', name: 'Rangga Wibisana', handle: '@ranggawb', platform: 'tiktok', niche: ['otomotif', 'review'], followers: 480_000, avgViews: 180_000, avgER: 6.9, ratePerContent: 4_200_000, status: 'negotiating', contact: { wa: '+62 821-4455-6677', email: 'rangga@oto.id' }, notes: 'Permintaan exclusivity 30 hari. Sedang nego soal ownership rights konten.', createdBy: 'u06', isDeleted: false },
];

export const SEED_KOL_GROWTH: KolGrowthEntry[] = [
  ...['2024-09:312000', '2024-10:338000', '2024-11:361000', '2024-12:384000', '2025-01:398000', '2025-02:412000'].map((p, i) => {
    const [date, f] = p.split(':');
    return { id: `g01-${i}`, kolId: 'k01', date, followers: +f, recordedBy: 'u06' };
  }),
  ...['2024-09:980000', '2024-10:1040000', '2024-11:1120000', '2024-12:1175000', '2025-01:1210000', '2025-02:1240000'].map((p, i) => {
    const [date, f] = p.split(':');
    return { id: `g02-${i}`, kolId: 'k02', date, followers: +f, recordedBy: 'u06' };
  }),
];

interface RawVault { id: string; url: string; title: string; platform: Platform; tags: string[]; savedBy: string; daysAgo: number; color: string; }
const RAW_VAULT: RawVault[] = [
  { id: 'v01', url: 'https://tiktok.com/@xxx/video/aaa', title: 'Hook 3 detik: pertanyaan + jeda', platform: 'tiktok', tags: ['Hook', 'Trend'], savedBy: 'u02', daysAgo: 2, color: '#f9d5c4' },
  { id: 'v02', url: 'https://instagram.com/p/aaa', title: 'Carousel storytelling 8 slide brand lokal', platform: 'instagram', tags: ['Storytelling', 'Format'], savedBy: 'u01', daysAgo: 3, color: '#cfdac3' },
  { id: 'v03', url: 'https://tiktok.com/@yyy/video/bbb', title: 'POV switch transition trick', platform: 'tiktok', tags: ['Format', 'Trend'], savedBy: 'u03', daysAgo: 5, color: '#d7d3eb' },
  { id: 'v04', url: 'https://tiktok.com/@zzz/video/ccc', title: 'Competitor — kompetisi minuman pulpy', platform: 'tiktok', tags: ['Competitor'], savedBy: 'u06', daysAgo: 5, color: '#f5e7c4' },
  { id: 'v05', url: 'https://instagram.com/p/bbb', title: 'CTA halus via voice over akhir video', platform: 'instagram', tags: ['CTA', 'Hook'], savedBy: 'u04', daysAgo: 7, color: '#c9dde6' },
  { id: 'v06', url: 'https://tiktok.com/@aaa/video/ddd', title: 'Trend "tutorial cepat" dengan visual breakdown', platform: 'tiktok', tags: ['Trend', 'Format'], savedBy: 'u01', daysAgo: 8, color: '#e9cfd2' },
  { id: 'v07', url: 'https://tiktok.com/@bbb/video/eee', title: 'Storytelling underdog brand UMKM', platform: 'tiktok', tags: ['Storytelling'], savedBy: 'u05', daysAgo: 9, color: '#d4c9b2' },
  { id: 'v08', url: 'https://instagram.com/p/ccc', title: 'Hook nostalgia 2010-an', platform: 'instagram', tags: ['Hook', 'Trend'], savedBy: 'u02', daysAgo: 11, color: '#bcd0d3' },
  { id: 'v09', url: 'https://tiktok.com/@ccc/video/fff', title: 'Format split-screen reaction', platform: 'tiktok', tags: ['Format'], savedBy: 'u06', daysAgo: 12, color: '#e6d5b8' },
  { id: 'v10', url: 'https://tiktok.com/@ddd/video/ggg', title: 'Competitor analysis: aturan resep', platform: 'tiktok', tags: ['Competitor', 'Format'], savedBy: 'u03', daysAgo: 14, color: '#cdd9e0' },
  { id: 'v11', url: 'https://instagram.com/p/ddd', title: 'CTA dengan "tag temenmu" mekanis', platform: 'instagram', tags: ['CTA'], savedBy: 'u04', daysAgo: 16, color: '#dfd0c5' },
  { id: 'v12', url: 'https://tiktok.com/@eee/video/hhh', title: 'Hook visual: kontras warna ekstrim', platform: 'tiktok', tags: ['Hook'], savedBy: 'u01', daysAgo: 18, color: '#cad6cb' },
];

export const SEED_VAULT: VaultItem[] = RAW_VAULT.map((v) => ({
  id: v.id, url: v.url, title: v.title, platform: v.platform, tags: v.tags,
  savedBy: v.savedBy, savedAt: new Date(NOW - v.daysAgo * 86_400_000).toISOString(),
  color: v.color, thumbnailUrl: null,
}));

// today's attendance (status null/clockedIn handled in mock init)
export const SEED_TODAY_ATTENDANCE: Record<string, { clockInAt: string | null; status: Attendance['status'] }> = {
  u01: { clockInAt: '09:12', status: 'ontime' },
  u02: { clockInAt: '09:38', status: 'late' },
  u03: { clockInAt: '08:54', status: 'ontime' },
  u04: { clockInAt: null, status: null },
  u05: { clockInAt: '09:22', status: 'ontime' },
};

export const SEED_ATTENDANCE_PCT: Record<string, { ontime: number; late: number; absent: number }> = {
  u01: { ontime: 88, late: 9, absent: 3 },
  u02: { ontime: 72, late: 22, absent: 6 },
  u03: { ontime: 94, late: 6, absent: 0 },
  u04: { ontime: 81, late: 14, absent: 5 },
  u05: { ontime: 90, late: 10, absent: 0 },
  u06: { ontime: 95, late: 5, absent: 0 },
  u07: { ontime: 97, late: 3, absent: 0 },
};

export const VAULT_TAGS = ['Hook', 'Storytelling', 'Competitor', 'Trend', 'Format', 'CTA'];
export const KOL_NICHES = ['beauty', 'lifestyle', 'comedy', 'daily-life', 'fashion', 'aesthetic', 'finance', 'edukasi', 'parenting', 'food', 'gaming', 'tech', 'fitness', 'motivasi', 'kuliner', 'jalan-jalan', 'interior', 'home', 'otomotif', 'review'];
export const SEED_ER_TARGETS: ErTargets = { tiktok: 6.0, instagram: 3.5 };

import { ContentPlan } from './types';

export const SEED_CONTENT_PLANS: ContentPlan[] = [
  {
    id: "p01",
    deadline: "2026-06-05",
    funnel: "Top Funnel",
    category: "Trends",
    tanggalUpload: "2026-06-08",
    formatKonten: "Video",
    platform: "tiktok",
    ideKonten: "Lebih pilih pelihara kucing atau anjing? Part 1",
    hook: "Tim kucing atau tim anjing?",
    brief: "Shoot interviewer mendatangi orang random. Pertanyaan: 'Kalian tim anjing atau kucing?' Ambil jawaban cepat beberapa orang. Tambahkan subtitle lucu.",
    caption: "Debat paling damai sedunia. Jadi kalian tim pelihara anjing atau kucing yak? #animacompanion #timanjing #timkucing",
    referensi: "https://vt.tiktok.com/ZSGRCSYCk/",
    progress: "Selesai Editing",
    result: "",
    feedback: "",
    revision: "",
    approval: true,
    createdBy: "u01",
  },
  {
    id: "p02",
    deadline: "2026-06-05",
    funnel: "Mid Funnel",
    category: "Trends",
    tanggalUpload: "2026-06-08",
    formatKonten: "Video",
    platform: "tiktok",
    ideKonten: "POV: Isi hati anak magang",
    hook: "POV: Isi hati anak magang ketika disuruh bikin kopi",
    brief: "Video ekspresi lucu anak magang saat disuruh tugas sederhana. Tampilkan humor relatable.",
    caption: "Semuanya milik Allah! #animacompanion #intern",
    referensi: "https://vt.tiktok.com/ZSGRXPC66/",
    progress: "Selesai Editing",
    result: "",
    feedback: "",
    revision: "",
    approval: false,
    createdBy: "u02",
  },
  {
    id: "p03",
    deadline: "2026-06-05",
    funnel: "Mid Funnel",
    category: "Trends",
    tanggalUpload: "2026-06-09",
    formatKonten: "Video",
    platform: "tiktok",
    ideKonten: "Lebih pilih pelihara kucing atau anjing? Part 2",
    hook: "Tim kucing atau tim anjing?",
    brief: "Shoot interviewer mendatangi orang random. Pertanyaan: 'Kalian tim anjing atau kucing?' Ambil jawaban cepat beberapa orang.",
    caption: "Sekarang giliran kamu jawab jujur nih 🐱 Tim Anjing 🐶 Tim Kucing. Tulis pilihanmu di kolom komentar dan lihat tim mana yang paling banyak!",
    referensi: "https://vt.tiktok.com/ZSGRCSYCk/",
    progress: "Selesai Editing",
    result: "",
    feedback: "",
    revision: "",
    approval: false,
    createdBy: "u03",
  },
  {
    id: "p04",
    deadline: "2026-06-05",
    funnel: "Mid Funnel",
    category: "Trends",
    tanggalUpload: "2026-06-09",
    formatKonten: "Video",
    platform: "tiktok",
    ideKonten: "Anak konten udah punya banyak stok",
    hook: "Ketika anak konten dibilang ga kerja padahal stok video numpuk",
    brief: "Memperlihatkan folder video draft yang penuh di HP kreator.",
    caption: "Kita balas bulan depan!!! #animacompanion #stokkonten",
    referensi: "",
    progress: "Selesai Editing",
    result: "",
    feedback: "",
    revision: "",
    approval: false,
    createdBy: "u04",
  },
  {
    id: "p05",
    deadline: "2026-06-05",
    funnel: "Mid Funnel",
    category: "Trends",
    tanggalUpload: "2026-06-10",
    formatKonten: "Video",
    platform: "instagram",
    ideKonten: "Lebih pilih pelihara kucing atau anjing? Part 3",
    hook: "Tim kucing atau tim anjing?",
    brief: "Interviewer bertanya tentang anabul and menghubungkannya dengan produk Sioren, Falconver+, dan Forevet.",
    caption: "Tanya tanya pertanyaan tersulit hari ini. 👍 = Like 💬 = Comment. Kita lihat tim mana yang menang!\n\n✨ Sioren Skin & Coat\nMembantu menjaga kesehatan kulit dan bulu agar tetap sehat, lembut, dan berkilau.\n\n🥩 Falconver+\nMembantu menjaga kesehatan pencernaan dan mendukung sistem imun.\n\n⚡️ Forevet\nMembantu mengurangi stres dan kecemasan pada anabul.\n\nKomen di bawah ya! 😉",
    referensi: "",
    progress: "Selesai Editing",
    result: "",
    feedback: "feedback dari ivan dan nathan",
    revision: "hasil revisi berdasarkan feedback",
    approval: false,
    createdBy: "u05",
  },
  {
    id: "p06",
    deadline: "2026-06-05",
    funnel: "Top Funnel",
    category: "Trends",
    tanggalUpload: "2026-06-10",
    formatKonten: "Video",
    platform: "tiktok",
    ideKonten: "Cuman dia yg ngerti",
    hook: "Momen ketika dia yang bisa ngertiin segala kondisi gue",
    brief: "Video hangat hubungan manis pemilik kucing/anjing.",
    caption: "Hanya anabul yang ngerti capeknya pulang kerja ❤️ #animacompanion",
    referensi: "",
    progress: "Selesai Editing",
    result: "",
    feedback: "",
    revision: "",
    approval: false,
    createdBy: "u01",
  },
  {
    id: "p07",
    deadline: "2026-06-05",
    funnel: "Top Funnel",
    category: "Trends",
    tanggalUpload: "2026-06-11",
    formatKonten: "Video",
    platform: "tiktok",
    ideKonten: "Kucing ini cocoknya dinamain siapa?",
    hook: "Lebih cocok dinamain siapa guys?",
    brief: "Tampilkan kucing lucu oranye baru di kantor. Tanyakan ide nama ke orang-orang kantor.",
    caption: "Jadi lebih cocok dinamain siapa sih guys? #animacompanion #kucinglucu",
    referensi: "",
    progress: "Sudah take",
    result: "",
    feedback: "",
    revision: "",
    approval: false,
    createdBy: "u02",
  }
];
