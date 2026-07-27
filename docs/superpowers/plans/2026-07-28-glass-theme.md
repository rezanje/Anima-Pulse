# Glass Theme Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retheme Anima Pulse to a glassmorphism look — lavender-to-pink gradient background, the whole app inside a floating frosted card, indigo-violet accent — without losing the status colours the app is read by.

**Architecture:** `app/globals.css` is already almost fully tokenised, so the bulk of the work is rewriting the `:root` block; roughly 2700 lines of component CSS inherit the new theme untouched. On top of that sit one layout change (`.app-shell` becomes a floating frame) and six targeted component edits.

**Tech Stack:** Next.js 14 App Router, plain CSS with custom properties, Recharts (already draws with `var(--accent)`).

## Global Constraints

- **Status colours are never violet.** `--positive`, `--danger`, `--warning`, `--info` and their `-soft` variants keep their current hues. A below-target ER must still read as wrong at a glance.
- **Brand colours of third parties are never touched.** The TikTok/Instagram hexes (`#E1306C`, `#C13584`, `#F38BCE`, `#FF0000`) stay exactly as they are.
- **`backdrop-filter` never goes on `.app-shell` itself.** It makes the element a containing block for `position: fixed` descendants, which would clip every drawer, toast, and the dev switch to the frame. The blur lives on `.app-shell::before`.
- **`[data-theme="dark"]` is out of scope.** It is unreachable (`app/layout.tsx` hard-codes `data-theme="light"`, no toggle exists). Leave it alone.
- **Content cards stay solid.** Only the frame, sidebar, topbar and mobile tab bar are translucent.
- **Tests prove nothing here.** The 109 existing tests must stay green, but they do not touch CSS. Never cite them as evidence the theme is correct.

## Verification Tooling

Every task verifies through the running dev server. Start it once:

```
preview_start { name: "anima-pulse" }
```

Computed-style assertions run via `javascript_tool` against `http://localhost:3307`. The session is already logged in as an admin, so all pages are reachable.

If the dev overlay shows `Cannot read properties of undefined (reading 'call')`, that is a stale webpack chunk, not your change. Fix with `rm -rf .next` and restart the server.

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `app/globals.css` | All design tokens, shell layout, every component rule | Modified — the only file with substantive edits |
| `docs/superpowers/specs/2026-07-28-glass-theme-design.md` | Approved spec | Read-only reference |

No new files. No component `.tsx` edits: the markup already carries the class names each task needs, and `growth-chart.tsx` already draws with `stroke="var(--accent)"`.

---

### Task 1: Rewrite the token block

**Files:**
- Modify: `app/globals.css:5-56` (the `:root` block)

**Interfaces:**
- Consumes: nothing.
- Produces: the custom properties every later task and every existing rule reads — `--accent`, `--accent-deep`, `--accent-soft`, `--bg`, `--bg-deep`, `--surface`, `--surface-2`, `--surface-3`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--border`, `--border-strong`, `--shadow-sm/md/lg`, `--radius-sm/md/lg/xl`, plus six new ones: `--app-gradient`, `--glass`, `--glass-2`, `--glass-brd`, `--glass-blur`, `--frame-gap`.

- [ ] **Step 1: Replace the colour tokens in `:root`**

In `app/globals.css`, inside `:root`, replace the light-token and accent lines with:

```css
  /* Light tokens (default) */
  --bg:          #EEEBF9;
  --bg-deep:     #E4DFF8;
  --surface:     #FFFFFF;
  --surface-2:   #F7F5FE;
  --surface-3:   #EFECFB;
  --border:      rgba(91, 75, 232, 0.10);
  --border-strong: rgba(91, 75, 232, 0.18);
  --text-primary:   #1E1B33;
  --text-secondary: #5A5675;
  --text-tertiary:  #8C88A6;

  --accent:      #5B4BE8;
  --accent-deep: #4536C4;
  --accent-soft: rgba(91, 75, 232, 0.10);
```

Leave the `--positive` / `--warning` / `--danger` / `--info` block exactly as it is.

- [ ] **Step 2: Widen and tint the shadows**

Replace the three `--shadow-*` lines in `:root` with:

```css
  --shadow-sm: 0 1px 2px rgba(46, 38, 100, 0.05);
  --shadow-md: 0 2px 6px rgba(46, 38, 100, 0.06), 0 8px 24px rgba(46, 38, 100, 0.06);
  --shadow-lg: 0 8px 40px rgba(46, 38, 100, 0.12);
```

- [ ] **Step 3: Grow the two large radii**

Replace the matching lines in `:root`:

```css
  --radius-lg: 18px;
  --radius-xl: 24px;
```

`--radius-sm: 6px` and `--radius-md: 10px` are unchanged.

- [ ] **Step 4: Add the glass tokens**

Immediately after `--topbar-h: 56px;` and before the closing `}` of `:root`, add:

```css

  /* glass theme */
  --app-gradient: linear-gradient(135deg, #C9C2F5 0%, #E4DFF8 45%, #F6DCE8 100%);
  --glass:      rgba(255, 255, 255, 0.55);
  --glass-2:    rgba(255, 255, 255, 0.35);
  --glass-brd:  rgba(255, 255, 255, 0.65);
  --glass-blur: 18px;
  --frame-gap:  28px;
```

- [ ] **Step 5: Verify the tokens resolve**

Reload `http://localhost:3307/dashboard`, then run via `javascript_tool`:

```js
(()=>{const s=getComputedStyle(document.documentElement);
return JSON.stringify({
  accent:s.getPropertyValue('--accent').trim(),
  positive:s.getPropertyValue('--positive').trim(),
  frameGap:s.getPropertyValue('--frame-gap').trim(),
  radiusXl:s.getPropertyValue('--radius-xl').trim()
});})()
```

Expected exactly: `{"accent":"#5B4BE8","positive":"#1D9E75","frameGap":"28px","radiusXl":"24px"}`

`positive` staying `#1D9E75` is the check that matters — it proves the status palette survived.

- [ ] **Step 6: Confirm the suite still passes**

Run: `npx vitest run`
Expected: `PASS (109) FAIL (0)`

- [ ] **Step 7: Commit**

```bash
git add app/globals.css
git commit -m "style: repoint design tokens to the violet glass palette"
```

---

### Task 2: Float the app shell on the gradient

**Files:**
- Modify: `app/globals.css:91-98` (the `body` rule)
- Modify: `app/globals.css:110-125` (`.app-shell`, `.sidebar`)
- Modify: `app/globals.css:2681` region (the existing `@media (max-width: 900px)` block)

**Interfaces:**
- Consumes: `--app-gradient`, `--glass`, `--glass-brd`, `--glass-blur`, `--frame-gap`, `--shadow-lg` from Task 1.
- Produces: `.app-shell` as a fixed-height rounded frame; `.sidebar` scrolling independently. Later tasks style surfaces *inside* this frame and must not reintroduce `backdrop-filter` on `.app-shell`.

- [ ] **Step 1: Put the gradient on the body**

Replace the `background: var(--bg);` line inside the `body` rule with:

```css
  background: var(--app-gradient);
  background-attachment: fixed;
```

- [ ] **Step 2: Turn `.app-shell` into the floating frame**

Replace the whole `.app-shell` rule with:

```css
.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr;
  height: calc(100vh - (var(--frame-gap) * 2));
  margin: var(--frame-gap);
  border-radius: 28px;
  border: 1px solid var(--glass-brd);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  position: relative;
  isolation: isolate;
}
/* The blur lives here, never on .app-shell itself: backdrop-filter would make
   the shell a containing block for position:fixed children, clipping every
   drawer and toast to the frame. */
.app-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--glass);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
}
```

- [ ] **Step 3: Free the sidebar from viewport-height sticking**

Replace the whole `.sidebar` rule with:

```css
.sidebar {
  background: var(--glass-2);
  border-right: 1px solid var(--glass-brd);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  z-index: 20;
}
```

`position: sticky; top: 0; height: 100vh` is gone — the frame is already exactly viewport height, so sticking did nothing but overflow it.

- [ ] **Step 4: Collapse the frame on phones**

Inside the existing `@media (max-width: 900px)` block near line 2681, add:

```css
  :root { --frame-gap: 0px; }
  .app-shell { border-radius: 0; border: 0; box-shadow: none; }
```

- [ ] **Step 5: Verify there is no phantom scrollbar**

Reload `http://localhost:3307/dashboard` at a 1440x900 viewport, then run:

```js
(()=>{const d=document.documentElement;
return JSON.stringify({
  pageScrolls: d.scrollHeight > d.clientHeight,
  shellH: Math.round(document.querySelector('.app-shell').getBoundingClientRect().height),
  viewportH: window.innerHeight
});})()
```

Expected: `pageScrolls` is `false`, and `shellH` equals `viewportH - 56`.

- [ ] **Step 6: Verify drawers are not clipped by the frame**

This is the regression the pseudo-element exists to prevent. Open the feedback drawer and compare its height to the viewport:

```js
(()=>{document.querySelector('.nav-item-btn')
  .dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
return new Promise(r=>setTimeout(()=>{
  const d=document.querySelector('.drawer-overlay');
  r(JSON.stringify({
    present: !!d,
    fullHeight: d ? Math.round(d.getBoundingClientRect().height) === window.innerHeight : null
  }));
},150));})()
```

Expected: `{"present":true,"fullHeight":true}`

If `fullHeight` is `false`, a `backdrop-filter` or `transform` has leaked onto `.app-shell` — remove it rather than working around it.

- [ ] **Step 7: Verify the mobile collapse**

Resize the viewport to 390x844, reload, then run:

```js
(()=>{const s=document.querySelector('.app-shell');
const cs=getComputedStyle(s);
return JSON.stringify({margin:cs.marginLeft, radius:cs.borderRadius});})()
```

Expected: `{"margin":"0px","radius":"0px"}`

- [ ] **Step 8: Commit**

```bash
git add app/globals.css
git commit -m "style: float the app shell on the gradient backdrop"
```

---

### Task 3: Restyle the chrome surfaces

**Files:**
- Modify: `app/globals.css:226-238` (`.topbar`)
- Modify: `app/globals.css:1799-1809` (`.bottom-tabs`, inside the 900px media block)
- Modify: `app/globals.css:1837-1843` (`.dev-switch-fab`)
- Modify: `app/globals.css:2528` region (`.drawer`)

**Interfaces:**
- Consumes: `--glass`, `--glass-2`, `--glass-brd`, `--surface` from Task 1; the frame from Task 2.
- Produces: no new selectors. Later tasks depend on `.drawer` being opaque.

- [ ] **Step 1: Make the topbar merge into the frame**

In the `.topbar` rule, replace `background: var(--bg);` with:

```css
  background: transparent;
```

and replace `border-bottom: 1px solid var(--border);` with:

```css
  border-bottom: 1px solid var(--glass-brd);
```

Keep `backdrop-filter: blur(8px)` — `.topbar` has no fixed-position descendants, so the containing-block trap does not apply here.

- [ ] **Step 2: Frost the mobile tab bar**

In the `.bottom-tabs` rule inside the 900px media block, replace `background: var(--surface);` with:

```css
    background: var(--glass);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
```

and replace `border-top: 1px solid var(--border);` with `border-top: 1px solid var(--glass-brd);`.

- [ ] **Step 3: Keep drawers opaque**

Drawers hold forms; translucent form fields are unreadable. In the `.drawer` rule, replace `background: var(--surface);` with:

```css
  background: #FFFFFF;
```

Using the literal rather than `var(--surface)` documents that this must not follow the token if `--surface` ever becomes translucent.

- [ ] **Step 4: Keep the dev-switch button legible on the gradient**

In `.dev-switch-fab`, replace `box-shadow: 0 4px 16px rgba(0,0,0,0.12);` with:

```css
  box-shadow: var(--shadow-md);
```

- [ ] **Step 5: Verify the chrome**

Reload `http://localhost:3307/dashboard` at 1440x900 and run:

```js
(()=>{return JSON.stringify({
  topbar: getComputedStyle(document.querySelector('.topbar')).backgroundColor,
  sidebar: getComputedStyle(document.querySelector('.sidebar')).backgroundColor
});})()
```

Expected: `topbar` is `rgba(0, 0, 0, 0)`, `sidebar` is `rgba(255, 255, 255, 0.35)`.

- [ ] **Step 6: Verify drawer opacity**

Open the feedback drawer as in Task 2 Step 6, then:

```js
JSON.stringify({drawer: getComputedStyle(document.querySelector('.drawer')).backgroundColor})
```

Expected: `{"drawer":"rgb(255, 255, 255)"}` — fully opaque, no alpha channel.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css
git commit -m "style: frost the chrome, keep drawers opaque"
```

---

### Task 4: Bring the login screen onto the gradient

**Files:**
- Modify: `app/globals.css:1571-1604` (`.screen-login`, `.login-bg-grid`, `.login-bg-glow`)

**Interfaces:**
- Consumes: `--app-gradient`, `--accent-soft` from Task 1.
- Produces: nothing later tasks depend on.

The login page renders outside `.app-shell`, so it inherits the body gradient but not the frame. The existing grid overlay was drawn for a flat cream background and reads as noise over a gradient.

- [ ] **Step 1: Put the gradient on the login screen**

In `.screen-login`, add after `overflow: hidden;`:

```css
  background: var(--app-gradient);
```

- [ ] **Step 2: Soften the grid overlay**

In `.login-bg-grid`, change `opacity: 0.6;` to:

```css
  opacity: 0.25;
```

- [ ] **Step 3: Frost the login card**

In `.login-card`, replace `background: var(--surface);` with:

```css
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
```

and replace `border: 1px solid var(--border);` with `border: 1px solid var(--glass-brd);`.

The login card carries only a heading, one input and one button — large type on a small surface — so translucency here does not risk the dense-label problem that keeps content cards solid.

- [ ] **Step 4: Verify**

Open `http://localhost:3307/login` in a fresh tab (the session is logged in, so use a logged-out check: read the page rather than expecting a redirect) and screenshot at 1440x900. Confirm by eye: gradient visible, card legible, grid overlay subtle rather than busy.

Then confirm the input is still readable:

```js
(()=>{const i=document.querySelector('.screen-login input');
return JSON.stringify({bg:getComputedStyle(i).backgroundColor, color:getComputedStyle(i).color});})()
```

Expected: a solid (alpha-free) `bg`. If it is translucent, the input inherited the card's alpha — pin it to `#FFFFFF`.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "style: bring the login screen onto the gradient"
```

---

### Task 5: Give the Dashboard clock card a violet gradient

**Files:**
- Modify: `app/globals.css:364-375` (`.card-clock-left`, `.card-clock.is-in .card-clock-left`)

**Interfaces:**
- Consumes: `--accent`, `--accent-deep` from Task 1.
- Produces: nothing later tasks depend on.

This is the one borrowed flourish from the reference's balance card. `.card-clock` is the first card every role sees on Dashboard and it carries a primary action, so it earns the emphasis.

- [ ] **Step 1: Fill the card with the accent gradient**

Replace the `background:` line in `.card-clock-left` with:

```css
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%);
  color: #FFFFFF;
```

- [ ] **Step 2: Keep the clocked-in state distinguishable**

Replace the `.card-clock.is-in .card-clock-left` rule body with:

```css
  background: linear-gradient(135deg, var(--accent-deep) 0%, #2E2470 100%);
```

Clocked-in reads as the deeper of the two, so the state change is still visible.

- [ ] **Step 3: Lift the text that sits on the gradient**

Immediately after the `.card-clock.is-in .card-clock-left` rule, add:

```css
.card-clock-left .card-clock-sub,
.card-clock-left .eyebrow { color: rgba(255, 255, 255, 0.75); }
.card-clock-left .mono-num { color: #FFFFFF; }
```

- [ ] **Step 4: Verify contrast**

Reload `http://localhost:3307/dashboard` and run:

```js
(()=>{const l=document.querySelector('.card-clock-left');
const sub=l.querySelector('.card-clock-sub');
return JSON.stringify({
  cardBg:getComputedStyle(l).backgroundImage.slice(0,60),
  subColor:getComputedStyle(sub).color
});})()
```

Expected: `cardBg` starts with `linear-gradient`, `subColor` is `rgba(255, 255, 255, 0.75)`.

Then screenshot and confirm by eye that the "Clock-in sekarang" button is still visible against the gradient. If it disappears, give `.card-clock-left .btn-primary` a white background with accent text.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "style: fill the clock card with the accent gradient"
```

---

### Task 6: Verification sweep across every page

**Files:**
- Modify: `app/globals.css` (only if the sweep finds defects)

**Interfaces:**
- Consumes: everything from Tasks 1-5.
- Produces: the evidence that the retheme is actually done.

No task before this one has looked at more than the Dashboard. This task is where the other eight pages get checked, and it is the only place regressions in dense tables will surface.

- [ ] **Step 1: Screenshot every page at desktop width**

Set the viewport to 1440x900. For each of `/dashboard`, `/pillars`, `/submit`, `/tracker`, `/team`, `/kol`, `/vault`, `/settings`: navigate, wait for load, screenshot.

Record for each: does the frame hold its shape, does content overflow it, is any text unreadable.

- [ ] **Step 2: Screenshot every page at phone width**

Set the viewport to 390x844 and repeat the eight pages. Confirm on each that the frame is collapsed (no margin, no radius) and the bottom tab bar is frosted and legible.

- [ ] **Step 3: Check the widest tables specifically**

The floating frame costs 56px of horizontal room, and `/team` and `/tracker` hold the widest tables. At 1440x900 on each, run:

```js
(()=>{const t=document.querySelector('table') || document.querySelector('.main-scroll > *');
return JSON.stringify({
  contentW: Math.round(t.scrollWidth),
  visibleW: Math.round(document.querySelector('.main-scroll').clientWidth),
  overflows: t.scrollWidth > document.querySelector('.main-scroll').clientWidth
});})()
```

If `overflows` is `true`, the table must scroll inside its own container — it must never push the frame out of shape. Fix by giving the table wrapper `overflow-x: auto`.

- [ ] **Step 4: Check small-label contrast on glass**

The sidebar is the only place small text sits on a translucent surface. At 1440x900:

```js
(()=>{const el=document.querySelector('.nav-group-label');
const cs=getComputedStyle(el);
return JSON.stringify({color:cs.color, size:cs.fontSize});})()
```

Then screenshot the sidebar and judge by eye whether the label is comfortably readable against the gradient behind it. If not, darken `--text-tertiary` rather than making the sidebar more opaque — the layering is the point of the design.

- [ ] **Step 5: Confirm status colours still read**

Go to `/team` at 1440x900 and screenshot. The ER column must still show below-target rows in a colour that reads as wrong at a glance. This is the constraint the whole redesign was scoped around — if violet has crept into the status column, fix it before proceeding.

- [ ] **Step 6: Open both drawers one more time**

Open the Lapor & Masukan drawer from the sidebar, then a KOL drawer from `/kol`. Confirm both reach full viewport height and neither is clipped by the frame.

- [ ] **Step 7: Run the suite and build**

```bash
npx vitest run && npm run build
```

Expected: `PASS (109) FAIL (0)` and `✓ Compiled successfully`. Neither proves the theme is right — they only prove nothing else broke.

- [ ] **Step 8: Commit any fixes the sweep produced**

```bash
git add app/globals.css
git commit -m "style: fix defects found in the glass theme sweep"
```

If the sweep found nothing, skip this step rather than making an empty commit.

---

## Self-Review

**Spec coverage.** Token table → Task 1. Floating frame, height maths, sticky sidebar, mobile collapse → Task 2. Six component edits: `.topbar`, `.bottom-tabs`, `.drawer`, `.dev-switch-fab` → Task 3; `.login` → Task 4; `.card-clock` → Task 5. Verification checklist (per-page screenshots, phantom scrollbar, drawer clipping, small-label contrast, status colours) → Tasks 2 and 6. The spec's three risks each map to a check: contrast → Task 6 Step 4, frame arithmetic → Task 2 Step 5, brand departure → recorded, no check needed.

**Placeholders.** None. Every CSS step carries the literal declarations; every verification step carries a runnable snippet and its expected output.

**Type consistency.** Token names used in Tasks 2-5 (`--glass`, `--glass-2`, `--glass-brd`, `--glass-blur`, `--frame-gap`, `--app-gradient`) are all defined in Task 1 Step 4. `--radius-xl` is asserted in Task 1 Step 5 with the value set in Step 3. `.card-clock-left`, `.card-clock-sub`, `.mono-num` and `.eyebrow` all exist in the current markup.
