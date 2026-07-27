# Anima Pulse — Glass Theme Redesign

**Date:** 2026-07-28
**Status:** approved, ready for implementation plan

## Goal

Retheme Anima Pulse to match a glassmorphism dashboard reference: lavender-to-pink
gradient background, a floating frosted card holding the whole app, indigo-violet
accent, larger radii, soft wide shadows.

## Decisions

These were settled during brainstorming. Each records the trade-off accepted.

| Decision | Choice | Why |
|---|---|---|
| Brand colour | Full switch to indigo-violet | Maximum fidelity to the reference; the emerald brand is dropped deliberately |
| Status colours | Keep green / red / amber | The app is read by scanning numbers. Making "below target" and "above target" both violet would destroy that. The reference does the same — its `+$250` is green and `-$250` is red under a violet theme |
| Layout | Floating card on a gradient | Accepted cost: ~56px of horizontal working room, which the wide tables on Performa tim and Content Plan can least afford |
| Glass strength | Frame and sidebar frosted, content cards solid | Keeps 10–12px labels and dense tables on guaranteed contrast, and keeps `backdrop-filter` off 20+ scrolling elements |
| Approach | Token rewrite plus one layout wrapper | `globals.css` is already almost fully tokenised — only ~13 hard-coded hex values outside `:root`, several of them TikTok/Instagram brand colours that must not change |

## Scope

**In scope:** `app/globals.css` token block, `.app-shell` layout, six components
listed below, one gradient summary card on Dashboard.

**Out of scope:** the `[data-theme="dark"]` block. It is currently unreachable —
`app/layout.tsx` hard-codes `data-theme="light"` and no toggle exists. Porting it
to violet would mean maintaining a second token set nobody can see.

## Design

### 1. Tokens

Rewrite the `:root` block. Variable *names* stay identical, so the remaining
~2700 lines inherit the new theme without edits.

| Token | From | To |
|---|---|---|
| `--accent` | `#1D9E75` | `#5B4BE8` |
| `--accent-deep` | `#0F7252` | `#4536C4` |
| `--accent-soft` | `rgba(29,158,117,.10)` | `rgba(91,75,232,.10)` |
| `--bg` | `#F8F7F2` | `#EEEBF9` |
| `--bg-deep` | `#F1EFE8` | `#E4DFF8` |
| `--surface` | `#FFFFFF` | `#FFFFFF` (unchanged — cards stay solid) |
| `--surface-2` | `#FBFAF6` | `#F7F5FE` |
| `--surface-3` | `#F4F2EC` | `#EFECFB` |
| `--text-primary` | `#15201A` | `#1E1B33` |
| `--text-secondary` | `#5C6258` | `#5A5675` |
| `--text-tertiary` | `#8B9085` | `#8C88A6` |
| `--border` | `rgba(20,24,16,.08)` | `rgba(91,75,232,.10)` |
| `--border-strong` | `rgba(20,24,16,.14)` | `rgba(91,75,232,.18)` |

Unchanged: `--positive`, `--danger`, `--warning`, `--info` and their `-soft`
variants.

New tokens:

```css
--app-gradient: linear-gradient(135deg, #C9C2F5 0%, #E4DFF8 45%, #F6DCE8 100%);
--glass:        rgba(255, 255, 255, 0.55);
--glass-2:      rgba(255, 255, 255, 0.35);  /* sidebar — lighter, so it reads as a layer */
--glass-brd:    rgba(255, 255, 255, 0.65);
--glass-blur:   18px;
--frame-gap:    28px;
```

Adjusted: `--radius-lg` 14→18px, `--radius-xl` 18→24px, and all three
`--shadow-*` widened and softened with a violet tint.

### 2. Floating frame

```
body        →  --app-gradient, background-attachment: fixed
.app-shell  →  margin: var(--frame-gap); border-radius: 28px;
               border: 1px solid var(--glass-brd);
               box-shadow: var(--shadow-lg); overflow: hidden;
```

**The glass goes on a pseudo-element, not on `.app-shell` itself:**

```css
.app-shell::before {
  content: ''; position: absolute; inset: 0; z-index: -1;
  background: var(--glass);
  backdrop-filter: blur(var(--glass-blur));
}
```

This is not stylistic. `backdrop-filter` makes an element a containing block for
`position: fixed` descendants. Applied directly to `.app-shell`, every drawer
(`.drawer-overlay`), toast, and the dev switch would be clipped to the frame —
including the Lapor & Masukan drawer. Keeping the filter on a pseudo-element
leaves `.app-shell` filter-free, so fixed children still resolve against the
viewport. `overflow: hidden` does not clip fixed descendants.

Three consequences of the frame that must be handled:

1. **Height.** `.app-shell` is `min-height: 100vh` and `.sidebar` is
   `height: 100vh`. With a 28px margin on both sides that overflows by 56px and
   produces a phantom scrollbar. Both become `calc(100vh - (var(--frame-gap) * 2))`,
   with the content column owning the scroll.
2. **Sticky sidebar.** `position: sticky; top: 0` becomes meaningless once the
   frame is exactly viewport-height. Replaced by a plain flex column with its own
   `overflow-y: auto`.
3. **Mobile.** Below 900px, `--frame-gap` becomes 0 and the radius flattens, so
   the app returns to full-bleed. 900px is already a breakpoint in three other
   places. Staff submit content and clock in from phones; a decorative margin
   there costs real working room.

### 3. Components

Inherit with no edits: every page, all buttons, nav, pills, and the Recharts
graphs — `growth-chart.tsx` already draws with `stroke="var(--accent)"` and
`stroke="var(--border)"`.

Need manual edits (6):

| Target | Change |
|---|---|
| `.topbar` | Solid → transparent, so it merges into the frame |
| `.drawer` | Pin to opaque white; drawers hold forms and must not go translucent |
| `.bottom-tabs` | Frosted (mobile nav) |
| `.login` | Sits outside `.app-shell`; needs the gradient applied directly |
| `.dev-switch-fab` | Re-check contrast against the gradient |
| `.card-clock` (Dashboard) | Violet gradient fill with light-on-dark text, echoing the reference's balance card. Chosen because it is the first card every role sees and it carries a primary action |

## Verification

CSS-only work, so the 109 existing tests neither help nor hurt — they must stay
green but prove nothing about appearance. Do not count them as evidence.

Actual checks, per page (Dashboard, Content Pillar, Submit, Content Plan,
Performa tim, KOL Hub, FYP Vault, Settings, Login):

1. Screenshot at 1440px and at 390px.
2. Confirm no phantom scrollbar from the frame height maths.
3. Open the Lapor & Masukan drawer and a KOL drawer — confirm both render full
   height and are not clipped by the frame. This is the regression the
   pseudo-element exists to prevent.
4. Check 10–12px mono labels on frosted surfaces for legible contrast.
5. Confirm status colours still read: a below-target ER must still look wrong at
   a glance.

## Risks

- **Contrast on frosted surfaces.** The gradient shifts hue across the viewport,
  so a label legible at the left edge may not be at the right. Mitigated by
  keeping content cards solid, but the sidebar still carries text over glass.
- **Frame height arithmetic.** The most likely source of a visible bug; covered
  by check 2.
- **Brand departure.** Emerald disappears from the product. Recorded here as a
  deliberate choice, not an oversight.
