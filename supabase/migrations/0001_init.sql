-- ============================================================
-- Anima Pulse — schema (PRD §07) + audit_logs + er_targets
-- All PKs are UUID; all tables carry created_at. Soft delete on KOLs.
-- ============================================================
create extension if not exists "pgcrypto";

-- ---- enums ----
do $$ begin
  create type user_role as enum ('admin', 'manager', 'staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type platform as enum ('tiktok', 'instagram');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attendance_status as enum ('ontime', 'late', 'absent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type kol_status as enum ('prospect', 'negotiating', 'active', 'blacklist');
exception when duplicate_object then null; end $$;

-- ---- users ----
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  full_name   text,
  handle      text,
  role        user_role not null default 'staff',
  avatar      text,
  joined      text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---- attendances ----
create table if not exists public.attendances (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  date          date not null,
  clock_in_at   timestamptz,
  clock_out_at  timestamptz,
  status        attendance_status,
  ip_address    inet,
  created_at    timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists idx_attendances_user on public.attendances(user_id);
create index if not exists idx_attendances_created on public.attendances(created_at);

-- ---- content_submissions ----
create table if not exists public.content_submissions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  url                text unique not null,
  platform           platform not null,
  title              text,
  views              bigint not null default 0,
  likes              bigint not null default 0,
  comments           bigint not null default 0,
  shares             bigint not null default 0,
  followers_at_post  bigint not null default 0,
  er_rate            numeric(6,4) not null default 0, -- computed server-side
  submitted_at       timestamptz not null default now(),
  editable_until     timestamptz not null default (now() + interval '1 hour'),
  created_at         timestamptz not null default now()
);
create index if not exists idx_content_user on public.content_submissions(user_id);
create index if not exists idx_content_created on public.content_submissions(created_at);
create index if not exists idx_content_submitted on public.content_submissions(submitted_at);

-- ---- kol_profiles ----
create table if not exists public.kol_profiles (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  handle            text not null,
  platform          platform not null,
  niche             text[] not null default '{}',
  followers         bigint not null default 0,
  avg_views         bigint not null default 0,
  avg_er            numeric(6,4) not null default 0,
  rate_per_content  numeric not null default 0,   -- Manager/Admin only at API layer
  status            kol_status not null default 'prospect',
  contact           jsonb not null default '{}'::jsonb,
  notes             text default '',
  created_by        uuid references public.users(id),
  is_deleted        boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (handle, platform)
);
create index if not exists idx_kol_created on public.kol_profiles(created_at);

-- ---- kol_growth_entries ----
create table if not exists public.kol_growth_entries (
  id              uuid primary key default gen_random_uuid(),
  kol_id          uuid not null references public.kol_profiles(id) on delete cascade,
  recorded_date   text not null,           -- YYYY-MM
  followers_count bigint not null,
  recorded_by     uuid references public.users(id),
  created_at      timestamptz not null default now()
);
create index if not exists idx_growth_kol on public.kol_growth_entries(kol_id);

-- ---- fyp_vault ----
create table if not exists public.fyp_vault (
  id            uuid primary key default gen_random_uuid(),
  url           text unique not null,
  title         text,
  platform      platform not null,
  thumbnail_url text,
  tags          text[] not null default '{}',
  saved_by      uuid references public.users(id),
  saved_at      timestamptz not null default now(),
  color         text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_vault_saved_by on public.fyp_vault(saved_by);

-- ---- audit_logs (PRD §10.2) ----
create table if not exists public.audit_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.users(id),
  action         text not null,
  resource_type  text not null,
  resource_id    text,
  ip_address     inet,
  created_at     timestamptz not null default now()
);
create index if not exists idx_audit_created on public.audit_logs(created_at);

-- ---- er_targets (FR-PERF-08) ----
create table if not exists public.er_targets (
  platform  platform primary key,
  target    numeric(6,4) not null
);
