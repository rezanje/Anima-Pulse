# Anima Pulse

**Internal Operations & Social Intelligence Dashboard** untuk tim media sosial Anima Companion.
Phase-1 MVP per `AnimaPulse_PRD_v2.0.md` — absensi, tracking konten + Engagement Rate, KOL Intelligence Hub, dan FYP Vault dalam satu platform.

Built with **Next.js 14 (App Router) · TypeScript · Tailwind · Recharts · React Hook Form + Zod · Supabase**.

---

## Quickstart (zero credentials)

```bash
cd anima-pulse
npm install
npm run dev
```

Open http://localhost:3000. No `.env` needed — the app runs in **local mode**:

- **Data:** an in-memory `MockRepo` seeded with realistic data, persisted to `.data/store.json` so your changes survive reloads.
- **Auth:** a **dev login** screen lets you enter as **Staff / Manager / Admin** to explore each role. A floating ⚙ switcher (bottom-right) lets you flip role/theme/accent on the fly.

```bash
npm run test       # 55 unit tests (ER, RBAC, validation, repo, modules)
npm run typecheck  # tsc --noEmit
npm run build      # production build
```

---

## How it works

### Local-first data layer
All data access goes through one `Repo` interface (`lib/repo/types.ts`). `getRepo()` picks the backend at runtime:

| Backend | When | What |
|---|---|---|
| `MockRepo` | default | in-memory + `.data/store.json` |
| `SupabaseRepo` | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set | real Postgres + RLS |

UI and API never import a concrete backend — switching to cloud is a config change, no code change.

### Server-side everything that matters
- **ER is computed server-side** (`lib/er.ts`) on every submit/edit — a client-supplied `er` is ignored.
- **RBAC is enforced in every API route** via `requirePermission(action)` (`lib/rbac.ts` encodes the PRD §10.1 matrix). UI hiding is never the only gate.
- **Audit trail**: every write calls `recordAudit(...)` → `audit_logs`.
- **Ratecard visibility** (FR-KOL-07): `rate_per_content` is stripped from KOL responses for roles without `kol-rate-view`.

### Project map
```
app/(app)/…           dashboard, submit, team, kol, kol/[id], vault, settings
app/api/v1/…          route handlers (PRD §08): attendance, content, kol, vault, settings, auth
lib/repo/             types (contract), index (selector), mock, supabase, seed
lib/er, lib/rbac      pure logic (ER/CPV/CPE/attendance; permission matrix)
lib/validation/       zod schemas (content, kol, vault)
lib/auth/             session (dev-login HMAC cookie + cloud hook), route guards
components/           ported design-system UI (shell, login, dashboard, kol, vault, settings…)
supabase/migrations/  0001_init.sql (schema §07), 0002_rls.sql (RLS §10)
supabase/seed.sql     seed data for cloud
__tests__/            vitest
```

---

## Going to production (connect the cloud)

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Apply the schema:
   ```bash
   # with the Supabase CLI linked to your project
   supabase db push                     # runs supabase/migrations/*
   psql "$DATABASE_URL" -f supabase/seed.sql   # optional seed
   ```
   (or paste `0001_init.sql`, `0002_rls.sql`, `seed.sql` into the Supabase SQL editor in order.)
3. Copy `.env.example` → `.env.local` and fill:
   ```
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   DEV_SESSION_SECRET=<random long string>
   ```
   Once `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are present, the app uses `SupabaseRepo` automatically and the dev-login is disabled.

### 2. Google Workspace SSO (FR-AUTH-01)
1. In Supabase → Authentication → Providers → enable **Google**, paste your Google OAuth client ID/secret.
2. In Google Cloud Console create an OAuth client; authorized redirect URI = `https://<your-app>/auth/callback` (and the Supabase callback URL shown in the dashboard).
3. Set `COMPANY_DOMAIN` (e.g. `animacompanion.com`) — only that domain may sign in.
4. The login screen shows the Google button in cloud mode. (Wiring the Supabase OAuth callback into `getSession` is the one remaining cloud task — the `lib/auth/session.ts` hook is marked for it.)

### 3. Vercel
```bash
vercel link
vercel env add SUPABASE_URL          # repeat for each var
vercel deploy --prod
```
Auto-deploys on git push; preview URL per PR.

---

## Feature → PRD mapping

| PRD | Where |
|---|---|
| FR-AUTH-01/02/03 · RBAC §10 | `lib/auth/*`, `lib/rbac.ts`, `middleware.ts` |
| FR-PERF-01 Clock-in/out | `app/api/v1/attendance/*`, `components/dashboard-client.tsx` |
| FR-PERF-02/03 Submit + ER | `app/api/v1/content`, `lib/er.ts`, `components/submit-form.tsx` |
| FR-PERF-04 Scorecard | `app/(app)/dashboard`, `components/dashboard-client.tsx` |
| FR-PERF-05/06 Team + CSV | `app/(app)/team`, `app/api/v1/content/team-summary`, `/export` |
| FR-PERF-07 Edit window | `MockRepo.updateSubmission` / `SupabaseRepo` (`editable_until`) |
| FR-PERF-08 ER targets | `app/api/v1/settings/er-targets`, `er_targets` table |
| FR-KOL-01..07 KOL Hub | `app/(app)/kol/*`, `app/api/v1/kol/*`, `lib/kol-visibility.ts` |
| FR-FYP-01..04 Vault | `app/(app)/vault`, `app/api/v1/vault`, `lib/og.ts` |
| Audit §10.2 | `lib/audit.ts`, `audit_logs` |

## Out of scope (Phase 2/3 per PRD §1.4)
Real TikTok/IG scraping & auto-pull · payroll integration · native mobile app · AI content analysis · email digests · Sentry. The repo layer and OG-thumbnail hook leave seams for these.
