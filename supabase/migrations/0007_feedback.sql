-- ============================================================
-- Anima Pulse — feedback_reports: in-app channel for any role to
-- report a bug, suggest something, or ask a question. Read and
-- triaged by admin; the reporter can follow their own reports.
-- ============================================================

create table if not exists public.feedback_reports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  type         text not null,            -- bug | saran | pertanyaan
  urgency      text not null,            -- rendah | sedang | tinggi
  description  text not null,
  page         text not null default '', -- pathname captured where the drawer was opened
  status       text not null default 'baru', -- baru | diproses | selesai | ditolak
  created_at   timestamptz not null default now()
);
create index if not exists idx_feedback_user on public.feedback_reports(user_id);
create index if not exists idx_feedback_status on public.feedback_reports(status);
create index if not exists idx_feedback_created on public.feedback_reports(created_at);

alter table public.feedback_reports enable row level security;

drop policy if exists feedback_select on public.feedback_reports;
drop policy if exists feedback_insert on public.feedback_reports;
drop policy if exists feedback_update on public.feedback_reports;

-- Reporters see only their own; admin sees everything.
create policy feedback_select on public.feedback_reports for select
  using (auth.uid() = user_id or public.is_admin());
create policy feedback_insert on public.feedback_reports for insert
  with check (auth.uid() = user_id);
-- Only admin triages. Reports are never edited by the reporter after sending.
create policy feedback_update on public.feedback_reports for update
  using (public.is_admin()) with check (public.is_admin());
