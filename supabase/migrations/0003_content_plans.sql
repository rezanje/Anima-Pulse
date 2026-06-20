-- ============================================================
-- Anima Pulse — content_plans schema + RLS policies
-- ============================================================

create table if not exists public.content_plans (
  id              uuid primary key default gen_random_uuid(),
  deadline        text not null, -- YYYY-MM-DD
  funnel          text not null,
  category        text not null,
  tanggal_upload  text not null, -- YYYY-MM-DD
  format_konten   text not null,
  platform        text not null,
  ide_konten      text not null,
  hook            text,
  brief           text,
  caption         text,
  referensi       text,
  progress        text not null default 'Draft',
  result          text,
  feedback        text,
  revision        text,
  approval        boolean not null default false,
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_content_plans_upload on public.content_plans(tanggal_upload);
create index if not exists idx_content_plans_created on public.content_plans(created_at);

-- enable RLS
alter table public.content_plans enable row level security;

-- drop if exists first to prevent duplicate policy errors
drop policy if exists plans_select on public.content_plans;
drop policy if exists plans_insert on public.content_plans;
drop policy if exists plans_update on public.content_plans;
drop policy if exists plans_delete on public.content_plans;

-- RLS policies
create policy plans_select on public.content_plans for select using (auth.role() = 'authenticated');
create policy plans_insert on public.content_plans for insert with check (auth.role() = 'authenticated');
create policy plans_update on public.content_plans for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy plans_delete on public.content_plans for delete using (auth.role() = 'authenticated');
