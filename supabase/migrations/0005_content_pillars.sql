-- ============================================================
-- Anima Pulse — content_pillars: guide categories staff pick
-- from before deciding what content to make. Tagged onto
-- content_submissions via nullable pillar_id.
-- ============================================================

create table if not exists public.content_pillars (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  description    text not null default '',
  example_angle  text default '',
  is_active      boolean not null default true,
  created_by     uuid references public.users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_pillars_created on public.content_pillars(created_at);

alter table public.content_submissions
  add column if not exists pillar_id uuid references public.content_pillars(id) on delete set null;

alter table public.content_pillars enable row level security;

drop policy if exists pillars_select on public.content_pillars;
drop policy if exists pillars_write on public.content_pillars;

create policy pillars_select on public.content_pillars for select using (auth.role() = 'authenticated');
create policy pillars_write on public.content_pillars for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
