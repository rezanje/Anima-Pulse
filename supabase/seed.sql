-- ============================================================
-- Anima Pulse — seed data (mirrors lib/repo/seed.ts)
-- Run after migrations:  supabase db reset  (or psql -f seed.sql)
-- Deterministic UUIDs so FKs line up. ER computed in-SQL.
-- ============================================================

-- ---- users ----
insert into public.users (id, email, full_name, handle, role, avatar, joined, is_active, login_code) values
  ('11111111-0000-0000-0000-000000000000', 'rezarezanje@gmail.com',    'Reza Gentanala', '@rezarezanje', 'admin',   'RG', '2026-06', true, 'SUPER123'),
  ('11111111-0000-0000-0000-000000000001', 'adit@animacompanion.com',  'Adit Pranatama', '@aditpr',  'staff',   'AP', '2023-08', true, 'STAFF123'),
  ('11111111-0000-0000-0000-000000000002', 'salsa@animacompanion.com', 'Salsa Aulia',    '@salsa.au', 'staff',   'SA', '2023-04', true, 'STAFF2'),
  ('11111111-0000-0000-0000-000000000003', 'rina@animacompanion.com',  'Rina Mahardika', '@rinamhd',  'staff',   'RM', '2024-01', true, 'STAFF3'),
  ('11111111-0000-0000-0000-000000000004', 'bagas@animacompanion.com', 'Bagas Nugraha',  '@bagas.n',  'staff',   'BN', '2022-11', true, 'STAFF4'),
  ('11111111-0000-0000-0000-000000000005', 'putri@animacompanion.com', 'Putri Larasati', '@putrilrs', 'staff',   'PL', '2024-03', true, 'STAFF5'),
  ('11111111-0000-0000-0000-000000000006', 'reza@animacompanion.com',  'Reza Hidayat',   '@rezahd',   'manager', 'RH', '2022-02', true, 'MGR123'),
  ('11111111-0000-0000-0000-000000000007', 'devi@animacompanion.com',  'Devi Andriani',  '@deviand',  'admin',   'DA', '2021-09', true, 'ADMIN123')
on conflict (id) do nothing;

-- ---- er targets ----
insert into public.er_targets (platform, target) values ('tiktok', 6.0), ('instagram', 3.5)
on conflict (platform) do nothing;

-- ---- kol profiles ----
insert into public.kol_profiles (id, name, handle, platform, niche, followers, avg_views, avg_er, rate_per_content, status, contact, notes, created_by) values
  ('22222222-0000-0000-0000-000000000001','Mira Sastrawijaya','@mirasastra','tiktok','{beauty,lifestyle}',412000,180000,6.8,4500000,'active','{"wa":"+62 812-3456-7890","email":"mira@talenta.id"}','Sudah 3x kerja sama. Negosiasi mudah.', '11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000002','Bryan Sutanto','@bryans','tiktok','{comedy,daily-life}',1240000,620000,8.2,12000000,'active','{"wa":"+62 821-9988-7766","email":"bryan@brymgmt.com"}','Top tier comedy. Wajib brief 2 minggu.', '11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000003','Kayla Mahisa','@kaylamah','instagram','{fashion,aesthetic}',287000,95000,4.2,3200000,'prospect','{"wa":"+62 813-1122-3344","email":"kayla.mh@gmail.com"}','Belum pernah kerja sama.', '11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000004','Faiz Ramadhan','@faizr.id','tiktok','{finance,edukasi}',580000,220000,7.4,6800000,'negotiating','{"wa":"+62 856-7788-9900","email":"faiz@finlit.id"}','Diskusi alot soal exclusivity.', '11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000005','Zara Anindita','@zaraani','instagram','{parenting,food}',198000,64000,5.1,2400000,'active','{"wa":"+62 815-4433-2211","email":"zara@mom.id"}','Audience ibu muda 25-34.', '11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000006','Damar Pratomo','@damarpr','tiktok','{gaming,tech}',920000,380000,9.1,8500000,'active','{"wa":"+62 877-1111-2222","email":"damar@gg.id"}','ER tinggi, gen Z gaming.', '11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000007','Nadya Khairunnisa','@nadyakh','instagram','{beauty,edukasi}',156000,48000,3.8,1900000,'prospect','{"wa":"+62 819-5566-7788","email":"nadya@beautyedu.id"}','Review jujur. Belum ada rate card.', '11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000008','Hafiz Maulana','@hafizmaul','tiktok','{fitness,motivasi}',340000,140000,6.2,3400000,'blacklist','{"wa":"+62 822-9988-1100","email":"hafiz@fit.id"}','Pernah delay deliverable 3 minggu.', '11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000009','Salma Putri Dewi','@salmaputri','instagram','{fashion,lifestyle}',78400,22000,4.6,1200000,'active','{"wa":"+62 818-3344-5566","email":"salma@dewi.id"}','Micro-influencer budget rendah.', '11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000010','Yoga Adiwinata','@yogaadi','tiktok','{kuliner,jalan-jalan}',720000,290000,7.8,5600000,'active','{"wa":"+62 813-7777-8888","email":"yoga@kuliner.id"}','Review kaki lima. 5x repeat F&B.', '11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000011','Intan Permatasari','@intanperm','instagram','{interior,home}',112000,34000,4.4,1600000,'prospect','{"wa":"+62 856-2222-3333","email":"intan@home.id"}','Audience 30+, niche home decor.', '11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000012','Rangga Wibisana','@ranggawb','tiktok','{otomotif,review}',480000,180000,6.9,4200000,'negotiating','{"wa":"+62 821-4455-6677","email":"rangga@oto.id"}','Nego exclusivity 30 hari.', '11111111-0000-0000-0000-000000000006')
on conflict (handle, platform) do nothing;

-- ---- kol growth (k01, k02) ----
insert into public.kol_growth_entries (kol_id, recorded_date, followers_count, recorded_by) values
  ('22222222-0000-0000-0000-000000000001','2024-09',312000,'11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000001','2024-10',338000,'11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000001','2024-11',361000,'11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000001','2024-12',384000,'11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000001','2025-01',398000,'11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000001','2025-02',412000,'11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000002','2024-09',980000,'11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000002','2024-12',1175000,'11111111-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000002','2025-02',1240000,'11111111-0000-0000-0000-000000000006');

-- ---- content submissions (er_rate computed in SQL) ----
insert into public.content_submissions (user_id, url, platform, title, views, likes, comments, shares, followers_at_post, er_rate, submitted_at, editable_until)
select u::uuid, url, p::platform, t, v, l, c, s, f,
       round((l + c + s)::numeric / v * 100, 4),
       now() - (h || ' hours')::interval,
       now() - (h || ' hours')::interval + interval '1 hour'
from (values
  ('11111111-0000-0000-0000-000000000001','https://tiktok.com/@aditpr/video/728001','tiktok','POV anak magang minggu pertama',248300,18900,1240,3810,42100,3),
  ('11111111-0000-0000-0000-000000000002','https://instagram.com/p/CzX9pK0002','instagram','Skincare routine pagi under 200rb',89400,4120,312,410,28900,5),
  ('11111111-0000-0000-0000-000000000003','https://tiktok.com/@rinamhd/video/729003','tiktok','Belanja groceries 100rb seminggu',412800,31200,2140,5900,18400,11),
  ('11111111-0000-0000-0000-000000000004','https://tiktok.com/@bagas.n/video/731004','tiktok','Reaksi harga jajanan SD sekarang',1120000,89400,6310,14200,88700,26),
  ('11111111-0000-0000-0000-000000000005','https://instagram.com/p/CzY1mR0005','instagram','Outfit kondangan budget 300rb',56200,1840,92,180,12300,30),
  ('11111111-0000-0000-0000-000000000001','https://instagram.com/p/CzVa3p0006','instagram','Bedah harga kost Jaksel',142900,9840,612,2010,41800,52),
  ('11111111-0000-0000-0000-000000000002','https://tiktok.com/@salsa.au/video/725007','tiktok','Day in my life content creator',78400,3120,245,380,28700,73)
) as x(u, url, p, t, v, l, c, s, f, h)
on conflict (url) do nothing;

-- ---- fyp vault ----
insert into public.fyp_vault (url, title, platform, tags, saved_by, color, saved_at)
select url, title, p::platform, tags::text[], sb::uuid, color, now() - (d || ' days')::interval
from (values
  ('https://tiktok.com/@xxx/video/aaa','Hook 3 detik: pertanyaan + jeda','tiktok','{Hook,Trend}','11111111-0000-0000-0000-000000000002','#f9d5c4',2),
  ('https://instagram.com/p/aaa','Carousel storytelling 8 slide','instagram','{Storytelling,Format}','11111111-0000-0000-0000-000000000001','#cfdac3',3),
  ('https://tiktok.com/@yyy/video/bbb','POV switch transition trick','tiktok','{Format,Trend}','11111111-0000-0000-0000-000000000003','#d7d3eb',5),
  ('https://tiktok.com/@zzz/video/ccc','Competitor minuman pulpy','tiktok','{Competitor}','11111111-0000-0000-0000-000000000006','#f5e7c4',5),
  ('https://instagram.com/p/bbb','CTA halus via voice over','instagram','{CTA,Hook}','11111111-0000-0000-0000-000000000004','#c9dde6',7),
  ('https://tiktok.com/@aaa/video/ddd','Trend tutorial cepat breakdown','tiktok','{Trend,Format}','11111111-0000-0000-0000-000000000001','#e9cfd2',8),
  ('https://tiktok.com/@bbb/video/eee','Storytelling underdog UMKM','tiktok','{Storytelling}','11111111-0000-0000-0000-000000000005','#d4c9b2',9),
  ('https://instagram.com/p/ccc','Hook nostalgia 2010-an','instagram','{Hook,Trend}','11111111-0000-0000-0000-000000000002','#bcd0d3',11),
  ('https://tiktok.com/@ccc/video/fff','Format split-screen reaction','tiktok','{Format}','11111111-0000-0000-0000-000000000006','#e6d5b8',12),
  ('https://tiktok.com/@ddd/video/ggg','Competitor analysis resep','tiktok','{Competitor,Format}','11111111-0000-0000-0000-000000000003','#cdd9e0',14),
  ('https://instagram.com/p/ddd','CTA tag temenmu mekanis','instagram','{CTA}','11111111-0000-0000-0000-000000000004','#dfd0c5',16),
  ('https://tiktok.com/@eee/video/hhh','Hook visual kontras warna','tiktok','{Hook}','11111111-0000-0000-0000-000000000001','#cad6cb',18)
) as x(url, title, p, tags, sb, color, d)
on conflict (url) do nothing;

-- ---- today attendance (5 staff) ----
insert into public.attendances (user_id, date, clock_in_at, status, ip_address)
select u::uuid, current_date, (current_date || ' ' || tm)::timestamptz, st::attendance_status, '127.0.0.1'::inet
from (values
  ('11111111-0000-0000-0000-000000000001','09:12:00','ontime'),
  ('11111111-0000-0000-0000-000000000002','09:38:00','late'),
  ('11111111-0000-0000-0000-000000000003','08:54:00','ontime'),
  ('11111111-0000-0000-0000-000000000005','09:22:00','ontime')
) as x(u, tm, st)
on conflict (user_id, date) do nothing;

-- ---- content plans ----
insert into public.content_plans (id, deadline, funnel, category, tanggal_upload, format_konten, platform, ide_konten, hook, brief, caption, referensi, progress, result, feedback, revision, approval, created_by) values
  ('33333333-0000-0000-0000-000000000001', '2026-06-05', 'Top Funnel', 'Trends', '2026-06-08', 'Video', 'Mirror', 'Lebih pilih pelihara kucing atau anjing? Part 1', 'Tim kucing atau tim anjing?', 'Shoot interviewer mendatangi orang random. Pertanyaan: ''Kalian tim anjing atau kucing?'' Ambil jawaban cepat beberapa orang. Tambahkan subtitle lucu.', 'Debat paling damai sedunia. Jadi kalian tim pelihara anjing atau kucing yak? #animacompanion #timanjing #timkucing', 'https://vt.tiktok.com/ZSGRCSYCk/', 'Selesai Editing', '', '', '', true, '11111111-0000-0000-0000-000000000001'),
  ('33333333-0000-0000-0000-000000000002', '2026-06-05', 'Mid Funnel', 'Trends', '2026-06-08', 'Video', 'Mirror', 'POV: Isi hati anak magang', 'POV: Isi hati anak magang ketika disuruh bikin kopi', 'Video ekspresi lucu anak magang saat disuruh tugas sederhana. Tampilkan humor relatable.', 'Semuanya milik Allah! #animacompanion #intern', 'https://vt.tiktok.com/ZSGRXPC66/', 'Selesai Editing', '', '', '', false, '11111111-0000-0000-0000-000000000002'),
  ('33333333-0000-0000-0000-000000000003', '2026-06-05', 'Mid Funnel', 'Trends', '2026-06-09', 'Video', 'Mirror', 'Lebih pilih pelihara kucing atau anjing? Part 2', 'Tim kucing atau tim anjing?', 'Shoot interviewer mendatangi orang random. Pertanyaan: ''Kalian tim anjing atau kucing?'' Ambil jawaban cepat beberapa orang.', 'Sekarang giliran kamu jawab jujur nih 🐱 Tim Anjing 🐶 Tim Kucing. Tulis pilihanmu di kolom komentar dan lihat tim mana yang paling banyak!', 'https://vt.tiktok.com/ZSGRCSYCk/', 'Selesai Editing', '', '', '', false, '11111111-0000-0000-0000-000000000003'),
  ('33333333-0000-0000-0000-000000000004', '2026-06-05', 'Mid Funnel', 'Trends', '2026-06-09', 'Video', 'Mirror', 'Anak konten udah punya banyak stok', 'Ketika anak konten dibilang ga kerja padahal stok video numpuk', 'Memperlihatkan folder video draft yang penuh di HP kreator.', 'Kita balas bulan depan!!! #animacompanion #stokkonten', '', 'Selesai Editing', '', '', '', false, '11111111-0000-0000-0000-000000000004'),
  ('33333333-0000-0000-0000-000000000005', '2026-06-05', 'Mid Funnel', 'Trends', '2026-06-10', 'Video', 'Mirror', 'Lebih pilih pelihara kucing atau anjing? Part 3', 'Tim kucing atau tim anjing?', 'Interviewer bertanya tentang anabul dan menghubungkannya dengan produk Sioren, Falconver+, dan Forevet.', 'Tanya tanya pertanyaan tersulit hari ini. 👍 = Like 💬 = Comment. Kita lihat tim mana yang menang!\n\n✨ Sioren Skin & Coat\nMembantu menjaga kesehatan kulit dan bulu agar tetap sehat, lembut, dan berkilau.\n\n🥩 Falconver+\nMembantu menjaga kesehatan pencernaan dan mendukung sistem imun.\n\n⚡️ Forevet\nMembantu mengurangi stres dan kecemasan pada anabul.\n\nKomen di bawah ya! 😉', '', 'Selesai Editing', '', 'feedback dari ivan dan nathan', 'hasil revisi berdasarkan feedback', false, '11111111-0000-0000-0000-000000000005'),
  ('33333333-0000-0000-0000-000000000006', '2026-06-05', 'Top Funnel', 'Trends', '2026-06-10', 'Video', 'Mirror', 'Cuman dia yg ngerti', 'Momen ketika dia yang bisa ngertiin segala kondisi gue', 'Video hangat hubungan manis pemilik kucing/anjing.', 'Hanya anabul yang ngerti capeknya pulang kerja ❤️ #animacompanion', '', 'Selesai Editing', '', '', '', false, '11111111-0000-0000-0000-000000000001'),
  ('33333333-0000-0000-0000-000000000007', '2026-06-05', 'Top Funnel', 'Trends', '2026-06-11', 'Video', 'Mirror', 'Kucing ini cocoknya dinamain siapa?', 'Lebih cocok dinamain siapa guys?', 'Tampilkan kucing lucu oranye baru di kantor. Tanyakan ide nama ke orang-orang kantor.', 'Jadi lebih cocok dinamain siapa sih guys? #animacompanion #kucinglucu', '', 'Sudah take', '', '', '', false, '11111111-0000-0000-0000-000000000002')
on conflict (id) do nothing;
