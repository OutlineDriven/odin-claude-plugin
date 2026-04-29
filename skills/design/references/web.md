# web.md — vanilla CSS 2026 baseline

Surface reference for HTML and vanilla CSS. Companion to `references/anti-slop.md` for slop tells specific to web (uniform `rounded-lg`, `transition: all`, default Tailwind ramp, etc.).

> **Snapshot date: April 2026.** Every Baseline status below is a snapshot, not a guarantee. Re-verify on https://web.dev/baseline and https://developer.mozilla.org **before** relying on any feature in production code. Forward-dated "Widely Available" entries (e.g., "Widely Available Sep 2026") are projections — treat them as Newly Available until that date passes and you have confirmed status independently. Browser-conservative environments (enterprise IT, government, embedded) need an extra confirmation pass even on Widely Available features.

## 1. Posture

Vanilla CSS 2026 carries surfaces React used to need a framework for. Container queries, `:has()`, nesting, `color-mix()`, OKLCH, `popover`, View Transitions, and (as of March 15 2026) subgrid are all Widely Available or Newly Available in Baseline — the gap that made build-tooling indispensable around 2020 has closed.

Reach for vanilla first; React only when state crosses surface boundaries (see `references/react.md` §1). Pulling in React for what `:has()` and `@container` already do is ceremony, and ceremony is the first slop tell on `references/anti-slop.md`.

## 2. Baseline-2026 features

Each feature lists Baseline status, one concrete example, and the anti-pattern restraint exists to prevent. Two tiers separate ship-it-now from gate-or-verify.

## 2A. Use by default

Widely Available as of the April 2026 snapshot — no feature query needed in evergreen-browser projects. Re-verify on web.dev/baseline before adopting in browser-conservative environments.

### Container queries (`@container`)

Baseline Newly Available Feb 2023, Widely Available Feb 2025.
```css
.card { container-type: inline-size; }
@container (inline-size > 32rem) {
  .card__body { display: grid; grid-template-columns: 12rem 1fr; }
}
```
Anti-pattern: viewport media queries on component-scoped layout — the component cannot be reused inside a sidebar without rewriting the breakpoints.

### `:has()` selector

Baseline Newly Available Dec 2023, Widely Available Dec 2025.
```css
.card:has(:focus-visible) { outline: 2px solid var(--color-accent); }
.form:has(input:invalid) .submit { opacity: 0.5; }
```
Anti-pattern: a JS handler that toggles a `.is-invalid` class on the parent. `:has()` makes parent-state styling declarative; half a dozen handlers collapse to one selector.

### CSS nesting

Baseline Newly Available Aug 2023, Widely Available Aug 2025.
```css
.card {
  padding: var(--space-16);
  & > .card__title { font-size: var(--type-title); }
  &:hover { background: color-mix(in oklch, var(--bg) 92%, var(--accent)); }
}
```
Anti-pattern: SCSS or Less for nesting alone. The build step earns nothing once the platform ships nesting.

### `color-mix()`

Baseline Newly Available May 2023, Widely Available May 2025.
```css
--color-hover: color-mix(in oklch, var(--color-accent) 88%, var(--color-bg));
--color-disabled: color-mix(in oklch, var(--color-fg) 40%, transparent);
```
Anti-pattern: hand-rolled hex variants for hover, disabled, pressed. Mix in OKLCH and the perceptual lightness stays consistent across hues.

### OKLCH / Lab / LCh color

Baseline Newly Available May 2023, Widely Available May 2025.
```css
--color-accent: oklch(0.62 0.18 256);
--color-accent-strong: oklch(0.52 0.18 256);
```
Anti-pattern: HSL for design tokens. HSL lightness is not perceptual — `hsl(60, 100%, 50%)` and `hsl(240, 100%, 50%)` differ by ~70 in perceptual lightness despite identical L. OKLCH is the only modern token-color choice.

### CSS subgrid

Baseline Newly Available Sep 2023; Widely Available March 15 2026.
```css
.grid { display: grid; grid-template-columns: 1fr 2fr 1fr; }
.grid > .row { display: grid; grid-template-columns: subgrid; }
```
Anti-pattern: passing the parent's column track sizes through CSS variables to grandchild grids. Subgrid preserves alignment without the variable plumbing.

### View Transitions (same-document)

Baseline Newly Available Oct 2025.
```css
::view-transition-old(root), ::view-transition-new(root) {
  animation-duration: 200ms;
  animation-timing-function: ease;
}
```
```js
document.startViewTransition(() => updateDOM());
```
Anti-pattern: Framer Motion or similar imported solely for cross-fade transitions. Same-document transitions are now native.

## 2B. Gate or verify first

Newly Available with a forward-dated Widely Available milestone, or Chromium-only at snapshot time. Use `@supports` or progressive enhancement; re-check status before removing the gate.

### `popover` attribute and `<dialog>`

Baseline Newly Available Apr 2024, Widely Available Apr 2026 — verify against current Baseline before dropping the fallback.
```html
<button popovertarget="menu">Open</button>
<div id="menu" popover>...</div>
```
Anti-pattern: a `position: fixed` div with `z-index: 9999` and a JS click-outside handler. The platform now does top-layer, focus return, and escape-to-close without a library.

### `text-wrap: balance`

Baseline Newly Available Sep 2024, Widely Available Sep 2026 — Newly Available at snapshot time; Safari and older Firefox still need verification.
```css
h1, h2, .lede { text-wrap: balance; }
```
Anti-pattern: manual `<br>` tags in headlines for visual balance. Browsers balance up to ~6 lines automatically; manual breaks fight the engine.

### Anchor positioning

Baseline Newly Available post-Jan 2026 — Firefox 147 default-enabled it. Gate behind `@supports (anchor-name: --x)`; the dependency footprint of fallback libraries is what this feature is meant to eliminate, so swapping the gate for Floating UI on missing support defeats the purpose.
```css
.tooltip { position: absolute; position-anchor: --button; top: anchor(bottom); }
```
Anti-pattern: Floating UI or Popper for simple tooltips when the platform supports anchor positioning. Keep the dependency only as a feature-query fallback.

### Scroll-driven animations

Chromium-stable; Safari Tech Preview / Firefox flag-only as of Apr 2026 — NOT Baseline. Use behind a feature query and supply a fallback.
```css
@supports (animation-timeline: scroll()) {
  .progress { animation: grow linear; animation-timeline: scroll(root); }
}
```
Anti-pattern: a `scroll` listener with `requestAnimationFrame`. Where the platform ships it, the listener is dead weight; where it does not, the listener is what to fall back to — but gate explicitly.

## 3. Token shape

Vanilla custom properties under `:root`. One concrete example:
```css
:root {
  /* Color — OKLCH only. No HSL, no hex, no RGB in tokens. */
  --color-bg-default:    oklch(0.99 0 0);
  --color-text-default:  oklch(0.18 0 0);
  --color-text-muted:    oklch(0.52 0 0);
  --color-accent:        oklch(0.62 0.18 256);
  --color-border:        oklch(0.92 0 0);

  /* Space — committed subset of 4/8/12/16/24/32/48/64. */
  --space-4: 0.25rem; --space-8: 0.5rem; --space-16: 1rem;
  --space-24: 1.5rem; --space-32: 2rem;

  /* Type — at most two families. */
  --font-display: 'Geist Sans', sans-serif;
  --font-text:    'Geist Sans Text', sans-serif;

  /* Motion — named properties, single easing curve. */
  --motion-fast:   120ms;
  --motion-normal: 200ms;
  --ease-out:      cubic-bezier(0.16, 1, 0.3, 1);

  /* Radius — tiered scale, not uniform. */
  --radius-input: 4px; --radius-card: 8px; --radius-modal: 16px;

  /* Shadow — luminosity-aware if elevation matters. */
  --shadow-1: 0 1px 2px oklch(0 0 0 / 0.06);
  --shadow-2: 0 4px 12px oklch(0 0 0 / 0.10);
}
```

## 3.5 Motion timing bands

Time scales are perceptual, not arbitrary. Five bands cover production motion needs:

- **~80ms** — perceptual "instant" threshold. Below this, the user does not register a transition; above, motion becomes communication.
- **100-150ms** — instant feedback (button press, hover state, focus ring).
- **200-300ms** — state changes (panel open, input focus expansion, tab switch).
- **300-500ms** — layout changes (modal entrance, card flip, drawer slide).
- **500-800ms** — page entrance, first paint, hero reveal.

Exit durations run ~75% of entrance — quick to leave, deliberate to arrive. Named easing curves only; no bounce, no elastic (these read as 2015-trendy on production surfaces in 2026):

```css
:root {
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);   /* default */
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);   /* heaviest */
}
```

## 3.6 OKLCH thresholds

Tinted neutrals carry chroma 0.005-0.015 toward the brand hue — pure greys (`oklch(L 0 H)`) read as institutional, not designed. Reduce chroma as lightness approaches 0 or 100; saturated extremes look garish at the boundaries of the lightness range and clip outside common gamuts.

Dark-mode surface scale uses three steps at lightness 15% / 20% / 25%, sharing the same hue and chroma so the steps read as elevation, not as separate colors. Light-on-dark text needs optical compensation: bump line-height by +0.05-0.1, and step weight up one notch (regular → medium, medium → semibold). The same string of body copy that reads at 16px/regular on light backgrounds needs 16px/medium with looser leading on dark to match perceived density.

## 3.7 Typography vertical rhythm

Within text blocks, line-height is the base unit for vertical spacing between consecutive lines, paragraphs, and adjacent headings. Body line-height 1.5 on 16px = 24px, so paragraph spacing inside prose composes from 24px increments and adjacent-element gaps inside long-form content snap to that grid. Vertical alignment between adjacent text blocks emerges for free.

For component layout, padding, and inter-section spacing, defer to the `--space-*` tokens declared in §3 (4 / 8 / 12 / 16 / 24 / 32 / 48 / 64). The line-height rhythm and the spacing scale serve different roles — text rhythm is dense and prose-local; layout spacing is coarse and structural. Conflating them produces either airless prose or chunky layouts.

Type size scale: five steps (xs / sm / base / lg / xl) with a single ratio — 1.25 (gentle), 1.333 (default), or 1.5 (loud). Pick one ratio at the start and commit; mid-build ratio swaps cascade through every component and re-break alignment.

## 4. Layout patterns

**Container queries over breakpoints.** Component CSS sizes itself by container, not viewport. A card placed in a 280px sidebar collapses to single-column without the parent caring; placed in a 960px main column it expands. Reusability follows.

**Subgrid for nested grids.** Subgrid is Widely Available as of March 15 2026 — preserves alignment of grandchild grids against the root column tracks without re-declaring template columns. Use whenever a grandchild's columns must align to the grandparent's.

**`:has()` for parent-state styling.** `.card:has(:focus-visible)`, `.form:has(:invalid)`, `.row:has([aria-current])` — declarative parent reactions that previously required JS state mirroring. Fewer event handlers, fewer race conditions, fewer tests.

**`text-wrap: balance` for headlines.** Automatic visual balance on text blocks of ≤6 lines. Apply globally to `h1`, `h2`, and `.lede`-class blockquotes; do not apply to body paragraphs (browsers cap balanced blocks for performance and the cost on a long article is real).

**`color-mix()` for state variants.** Hover, pressed, disabled, focus-ring tints all compose from the base accent via `color-mix(in oklch, ...)`. The token surface stays small; the variants stay perceptually consistent.

**Breakpoint-free responsive grid.** `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` produces card layouts that reflow without media queries. The card decides its own minimum width; the grid decides how many fit. Pair with `gap` for spacing instead of margins.

## 4.5 Forms patterns

Inputs need `autocomplete` and `name` for autofill engines; semantic `type` and `inputmode` drive the right mobile keyboard. Labels are clickable via `<label for>` association. Submit buttons stay enabled until the request fires (disabling pre-submit blocks debugging); swap the label for a spinner during loading. Inline errors render under the offending field; focus moves to the first invalid input on submit failure.

Placeholders end with `…` when they show a pattern (`Search by name…`, `123-45-6789…`); never substitute placeholders for labels. `autocomplete="off"` belongs on non-auth fields only (one-time codes, captchas); never on passwords or addresses. Warn before navigation with unsaved changes (`beforeunload` or framework equivalent). Never prevent paste — paste-blocking on password fields pushes users toward weaker passwords. Disable spellcheck (`spellcheck="false"`) on usernames, URLs, and code identifiers. Checkboxes and radios are a single hit target — whole label clickable, not just the box.

## 4.6 Touch interaction

`touch-action: manipulation` on tappable elements eliminates the 300ms double-tap-zoom delay on iOS. Set `-webkit-tap-highlight-color` intentionally (token color or `transparent`); default-blue is a Safari default, not a design choice. `overscroll-behavior: contain` on modals and drawers stops scroll-chaining into the page beneath. During drag, disable text selection (`user-select: none`) and apply `inert` to background content so screen readers don't pick up irrelevant nodes. `autoFocus` is desktop-only — on mobile it summons the keyboard and shifts the viewport before the user has read the form.

## 4.7 Safe areas + viewport

`env(safe-area-inset-*)` for notch / dynamic-island / home-indicator padding on iOS and Android. `overflow-x: hidden` on full-bleed containers prevents accidental horizontal scrollbars from long unbreakable strings or transformed elements. `font-variant-numeric: tabular-nums` on numeric columns aligns digit widths so totals, timestamps, and prices stack cleanly.

## 4.8 Dark mode native fixes

`color-scheme: dark` on `<html>` fixes default scrollbar color and native form-input rendering on Windows in one property. Match `<meta name="theme-color">` to the page background per theme — the browser chrome adopts this color on iOS Safari and Android Chrome, and a mismatch reads as a flicker between page and frame. Native `<select>` needs explicit `background-color` and `color` in dark mode on Windows; the OS otherwise picks white-on-white.

## 4.9 i18n + locale

Use `Intl.DateTimeFormat` and `Intl.NumberFormat` for all dates, times, and numbers — never hardcode `MM/DD/YYYY`, `1,000.00`, or currency symbols. Detect locale via `Accept-Language` (server) or `navigator.languages` (client); never IP-based geolocation, which conflates location with language preference (a French speaker in Tokyo wants French, not Japanese). `translate="no"` on brand names, code identifiers, monospace tokens, and proper nouns — Google Translate will otherwise render `Stripe` as `Bande` in French; apply per-element, not site-wide.

Text-expansion budget per locale: German +30%, French +20%, Finnish +30-40%, Chinese -30%. Buttons, labels, and table headers must accommodate the swing without wrapping or truncating; design at the longest expected length and let other locales breathe.

## 5. Forbidden in tokens

- **HSL or RGB for design-token color.** OKLCH-only. HSL lightness is not perceptual and produces uneven ramps across hues.
- **JS scroll listeners for parallax or progress.** Use `animation-timeline: scroll()` where supported, `IntersectionObserver` otherwise. A `scroll` event handler running every frame is a battery and jank tax.
- **Layout-driven media queries on component-scoped content.** Container queries are the right axis once a component can appear in multiple containers.
- **`transition: all`.** Already banned in SKILL.md §4 charter. Restated here because it is the single most common slop tell on web — animates layout, color, and transform together; jank and unintended re-layouts guaranteed. Name the properties.
- **`*-system-ui` font stacks as the type system.** Already banned. A direction with no committed family is no direction; system-ui delegates the type pair to whatever the OS shipped.
- **Default Tailwind `gray-50…900` ramp imported wholesale.** RLHF and template defaults converge on it; the surface reads as preset before the eye finishes scanning.
- **Hardcoded hex or px values in component CSS.** Tokens precede components; components reference tokens. A `git grep '#[0-9a-f]\{3,8\}'` against component files should be empty.

## 6. Cite-and-defer

Citations: caniuse.com, web.dev/baseline, MDN. This is starter density — cross-check Baseline status on web.dev/baseline and the canonical spec surface on MDN before relying on any feature in production. The date a feature crosses Newly to Widely Available shifts as Safari, Firefox, and Chrome stable releases land.