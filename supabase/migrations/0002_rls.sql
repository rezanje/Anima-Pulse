-- ============================================================
-- Anima Pulse — Row Level Security (PRD §10)
-- Defense in depth: the API enforces RBAC with the service role (which
-- bypasses RLS). These policies protect any direct/anon client access and
-- mirror the permission matrix. role is resolved from public.users by auth.uid().
-- ============================================================

create or replace function public.auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.is_manager_or_admin() returns boolean
language sql stable as $$
  select public.auth_role() in ('manager', 'admin')
$$;

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select public.auth_role() = 'admin'
$$;

-- enable RLS
alter table public.users               enable row level security;
alter table public.attendances         enable row level security;
alter table public.content_submissions enable row level security;
alter table public.kol_profiles        enable row level security;
alter table public.kol_growth_entries  enable row level security;
alter table public.fyp_vault           enable row level security;
alter table public.audit_logs          enable row level security;
alter table public.er_targets          enable row level security;

-- ---- users ----
create policy users_select on public.users for select using (auth.role() = 'authenticated');
create policy users_admin_update on public.users for update using (public.is_admin()) with check (public.is_admin());

-- ---- attendances: own, or manager/admin see all; insert/update own ----
create policy att_select on public.attendances for select
  using (user_id = auth.uid() or public.is_manager_or_admin());
create policy att_insert on public.attendances for insert
  with check (user_id = auth.uid());
create policy att_update on public.attendances for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- content: own, or manager/admin see all; insert own; update own ----
create policy content_select on public.content_submissions for select
  using (user_id = auth.uid() or public.is_manager_or_admin());
create policy content_insert on public.content_submissions for insert
  with check (user_id = auth.uid());
create policy content_update on public.content_submissions for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---- kol_profiles: manager/admin only (rate hidden from staff by no-access) ----
create policy kol_select on public.kol_profiles for select using (public.is_manager_or_admin());
create policy kol_insert on public.kol_profiles for insert with check (public.is_manager_or_admin());
create policy kol_update on public.kol_profiles for update using (public.is_manager_or_admin()) with check (public.is_manager_or_admin());

-- ---- kol_growth: manager/admin ----
create policy growth_select on public.kol_growth_entries for select using (public.is_manager_or_admin());
create policy growth_insert on public.kol_growth_entries for insert with check (public.is_manager_or_admin());

-- ---- fyp_vault: all authenticated read + write ----
create policy vault_select on public.fyp_vault for select using (auth.role() = 'authenticated');
create policy vault_insert on public.fyp_vault for insert with check (auth.role() = 'authenticated');

-- ---- audit_logs: admin read; inserts via service role only ----
create policy audit_admin_select on public.audit_logs for select using (public.is_admin());

-- ---- er_targets: all read, admin write ----
create policy ertargets_select on public.er_targets for select using (auth.role() = 'authenticated');
create policy ertargets_admin_write on public.er_targets for all using (public.is_admin()) with check (public.is_admin());
