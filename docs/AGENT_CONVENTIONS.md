# Anima Pulse — Module Agent Conventions

You are building ONE module of the Anima Pulse app (Next.js 14 App Router + TypeScript, local-first). The foundation is done and committed. Read this fully before writing code.

## Project
- Root: `/Users/rezanje/Gen_Dev_Studio/ANIMA_ANIMA PULSE_Marketing KOL_ERP/anima-pulse`
- Dev server is already running at `http://localhost:3300` (MockRepo, seeded). It hot-reloads.
- Language of all UI text: **Indonesian** (match existing).
- PRD: `/Users/rezanje/Gen_Dev_Studio/ANIMA_ANIMA PULSE_Marketing KOL_ERP/uploads/AnimaPulse_PRD_v2.0.md`
- Full plan (your task numbers): `/Users/rezanje/Gen_Dev_Studio/ANIMA_ANIMA PULSE_Marketing KOL_ERP/docs/superpowers/plans/2026-06-07-anima-pulse-phase1.md`

## Read these foundation files first (DO NOT MODIFY THEM)
- `lib/repo/types.ts` — `Repo` interface + all domain types. This is the data contract.
- `lib/repo/index.ts` — `getRepo()` returns the active backend; `isCloudMode()`.
- `lib/rbac.ts` — `can(role, action)` + `Action` union (the permission matrix).
- `lib/er.ts` — `calcER`, `calcCPV`, `calcCPE`, `momGrowth`, `avgOf`, `trendDelta`.
- `lib/http.ts` — `ok(data)`, `fail(status, code)`, `handle(fn)`, `ApiError`, `clientIp(req)`.
- `lib/auth/guard.ts` — `requireSession()`, `requirePermission(action)` (throw 401/403).
- `lib/auth/session.ts` — `getSession()` → `{ user, role } | null` (use in server components).
- `lib/audit.ts` — `recordAudit({ userId, action, resourceType, resourceId, ipAddress })`.
- `lib/client.ts` — `apiGet`, `apiPost`, `apiPut` (browser fetch; throws `Error(code)` on failure).
- `lib/format.ts` — `fmtNum`, `fmtRupiah`, `fmtAgo`, `fmtDateWIB`, `fmtTimeWIB`.
- `lib/repo/seed.ts` — exports `VAULT_TAGS`, `KOL_NICHES`, `SEED_ER_TARGETS` etc. (import constants from here if needed).
- `components/widgets.tsx` — `Avatar, Button, Sparkline, PlatformBadge, StatusPill, TrendDelta, SectionHead, Field, Tabs, Toast, BrandMark, GrowthChart`.
- `components/icons.tsx` — `I.home, I.pulse, I.team, I.kol, I.vault, I.settings, I.plus, I.check, I.search, I.filter, I.download, I.clock, I.external, I.arrowUp, I.arrowDn, I.trending, I.bell, I.close, I.menu, I.more, I.user, I.link, I.copy, I.tiktok, I.ig, I.flag, I.logout` (ReactNode each).
- `app/(app)/dashboard/page.tsx` — example page; `app/(app)/layout.tsx` — the shell wraps all `(app)` pages (auth + sidebar already handled, just render page content).

## Hard rules
1. **Only create/edit files in YOUR assigned paths** (listed in your task prompt). Do NOT touch `lib/*` (except a NEW file explicitly assigned to you), `components/widgets.tsx`, `components/icons.tsx`, `components/shell.tsx`, `app/globals.css`, `app/layout.tsx`, `app/(app)/layout.tsx`, `middleware.ts`, or other modules' files.
2. **Styling:** Port the JSX + `className`s from the matching prototype screen — those classes already exist in `app/globals.css`. Read the prototype file and reuse its structure. For genuinely NEW styles, create a co-located **CSS Module** (e.g. `submit.module.css`) and import it. NEVER edit the global stylesheet.
3. **RBAC is server-side.** Every API route guards with `requireSession()` or `requirePermission('<action>')` BEFORE doing work. UI hiding is not enough.
4. **ER is server-side.** Never trust client-supplied `er`. The repo computes it. (For client live-preview you may call `calcER` for display only.)
5. Keep files focused. Server component pages fetch initial data via `getRepo()` directly; interactive bits are `'use client'` children that mutate via `apiPost`/`apiPut`.

## Prototype source files to port from
- `/Users/rezanje/Gen_Dev_Studio/ANIMA_ANIMA PULSE_Marketing KOL_ERP/src/screens-a.jsx` (ScreenDashboard, ScreenSubmit, ScreenTeam)
- `/Users/rezanje/Gen_Dev_Studio/ANIMA_ANIMA PULSE_Marketing KOL_ERP/src/screens-b.jsx` (ScreenKolList, ScreenKolDetail, ScreenVault, ScreenSettings)
- `/Users/rezanje/Gen_Dev_Studio/ANIMA_ANIMA PULSE_Marketing KOL_ERP/src/data.jsx` (mock data shapes — already ported to `lib/repo/seed.ts`)

## API route pattern (copy this)
```ts
import { getRepo } from '@/lib/repo';
import { handle, ok, fail, clientIp } from '@/lib/http';
import { requirePermission } from '@/lib/auth/guard';
import { someSchema } from '@/lib/validation/...';
import { recordAudit } from '@/lib/audit';

export async function POST(req: Request) {
  return handle(async () => {
    const session = await requirePermission('submit'); // or requireSession()
    const body = await req.json().catch(() => null);
    const parsed = someSchema.safeParse(body);
    if (!parsed.success) return fail(400, 'validation_error');
    const repo = getRepo();
    const result = await repo.createSomething({ ...parsed.data, userId: session.user.id }, clientIp(req) ?? undefined);
    await recordAudit({ userId: session.user.id, action: 'create_x', resourceType: 'x', resourceId: result.id, ipAddress: clientIp(req) });
    return ok(result);
  });
}
```
Repo throws plain Error strings (`duplicate_url`, `already_clocked_in`, `duplicate_handle`, `edit_window_closed`, `forbidden`, `not_found`, `not_clocked_in`, `already_clocked_out`) — `handle()` maps them to 409/403/404/400 automatically. Just let them propagate.

### Dynamic route params (Next 14)
```ts
export async function GET(req: Request, { params }: { params: { id: string } }) { ... }
```

## GET query parsing
```ts
const url = new URL(req.url);
const platform = url.searchParams.get('platform') ?? undefined;
```

## Testing your work
- Unit test: `cd anima-pulse && npx vitest run __tests__/<your-test>.test.ts`
  - For repo behavior use `new MockRepo({ persist: false })` (import from `@/lib/repo/mock`).
  - For RBAC denials, assert `can('staff', 'team-view') === false` etc. (route-level request mocking is not required).
- API smoke (optional): get a cookie then curl:
  ```bash
  curl -c /tmp/c.txt -X POST localhost:3300/api/v1/auth/dev-login -H 'Content-Type: application/json' -d '{"role":"manager"}'
  curl -b /tmp/c.txt 'localhost:3300/api/v1/<your-endpoint>'
  ```
- **Do NOT run `next build` or whole-project `tsc`** — the integrator does that. Run only your vitest file.

## When done, report
- List of files you created/edited.
- Your vitest result (pass/fail counts).
- Any deviation from the plan or assumption you made.
