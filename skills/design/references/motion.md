# motion.md — cross-runtime motion ref

How motion behaves across web, React, TUI, and desktop runtimes. Each runtime has a different cost model for motion (frame budget, GPU offload, retained vs immediate mode); the timing bands and easing curves are constants because they map to perception, not implementation.

This file is loaded only via the SKILL.md surface-routing table — surface references (web.md, react.md, tui.md, desktop.md) do not backlink here. A reader needing cross-runtime motion guidance re-enters via SKILL.md.

## 1. Motion-budget doctrine

One intentional moment per surface, the same posture as restraint elsewhere in the design skill (`references/soul.md` §4). Motion is the sharpest tool for surfacing a hierarchy decision — animate the element you want the eye to follow; everything else stays still.

Two failure modes:

- **No motion at all** — state changes feel jarring; the user loses continuity between before and after.
- **Motion on every element** — every animation cancels every other, the eye finds no anchor, and battery drains for noise.

The middle path is one animated transition per state change, with everything else holding the previous frame.

## 2. Timing bands

Time scales are perceptual, not arbitrary. Five bands cover production motion needs across runtimes:

- **~80ms** — perceptual "instant" threshold. Below this, the user does not register a transition; above, motion becomes communication.
- **100-150ms** — instant feedback (button press, hover state, focus ring).
- **200-300ms** — state changes (panel open, input focus, tab switch).
- **300-500ms** — layout changes (modal entrance, card flip, drawer slide).
- **500-800ms** — page entrance, hero reveal, first paint.

Exit durations run ~75% of entrance — quick to leave, deliberate to arrive.

## 3. Named easing curves

Three curves cover production motion needs. Bounce and elastic curves are banned — they read as 2015-trendy on production surfaces in 2026, and they undermine the credibility of the surface they decorate.

```css
:root {
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);   /* default */
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);   /* heaviest */
}
```

Pick one curve per surface and commit; switching curves between adjacent components reads as inconsistency.

## 4. Web (vanilla CSS)

Animate `transform` and `opacity` only. Animating layout properties (`width`, `height`, `top`, `left`, `padding`, `margin`, `font-size`) forces synchronous layout on every frame; the result is jank, not motion.

```css
/* Good — composited transform + opacity. */
.card {
  transition: transform 200ms var(--ease-out-quart),
              opacity   200ms var(--ease-out-quart);
}

/* Bad — layout-property animation. */
.card { transition: width 200ms; }  /* forces reflow every frame */
```

View Transitions API (same-document: Chromium 111+, Safari 18.2+, Firefox 144+) handles cross-state morphs without manual paired keyframes — declare which elements share identity across states; the browser interpolates the rest.

`animation-timeline: scroll()` for scroll-driven progress without a JS scroll listener (Chromium stable, Safari 26+, Firefox flag-gated). Falls back gracefully — scroll-driven becomes "animation runs once" on engines that do not yet implement it.

SVG transforms quirk: `transform-origin` on SVG elements inside a parent `<svg>` is interpreted in user-coordinate space by default. Set `transform-box: fill-box; transform-origin: center;` on a wrapping `<g>` to scale or rotate around the element's own center rather than the SVG's origin.

`prefers-reduced-motion: reduce` is non-optional — browsers expose the OS-level reduce-motion preference, and a substantial fraction of users (see §8) need it honored. Skipping the media query is an accessibility regression, not an aesthetic preference.

## 5. React

`<ViewTransition>` and `addTransitionType()` ship in React's Experimental / Canary channel as of 19.2 (not stable). Treat as preview APIs. The browser primitive (View Transitions API) is the stable substrate; React's wrapper layers on top.

Reserve `name` for shared-element transitions only; non-shared enter / exit omits `name` and React picks per-render IDs.

For the per-type animation map, motion-budget priority table, and CSS recipes targeting the spec-defined `:active-view-transition-type()` pseudo-class, see `references/react.md` §6 — that section is the canonical specification for React-specific View Transition usage.

Outside View Transitions, the same web rules apply: animate `transform` / `opacity`, defer to `useLayoutEffect` for measurement-driven motion (never read layout in render), and budget the motion within a single React commit.

## 6. TUI (terminal UI)

Terminal UIs budget motion in **frames**, not milliseconds. A 60fps terminal is rare; assume 30fps as the realistic ceiling on modern terminals (Kitty, WezTerm, Ghostty, Alacritty) with a substantial latency floor on iTerm2 and Windows Terminal under heavy I/O.

Bubble Tea v2's Cursed Renderer (stable Feb 2026) is ~10× faster on update-heavy frames vs the v1 renderer — partial-redraw + cursor diff replaces full-screen rewrite. For high-update TUIs (live logs, real-time graphs, animated status indicators), the v1 → v2 upgrade lifts the realistic frame budget out of the "noticeable lag" band.

Ratatui (Rust) is immediate-mode — every frame redraws from state; motion budget is "do less work per frame" rather than "schedule fewer animations". Textual (Python) shares the immediate-mode posture but adds a CSS-like layout layer that pays its own per-frame cost.

Animated motion in TUIs earns its weight when used and is rare by default:

- Spinners on long-running operations (subtle, single-character cycle).
- Progress bars that fill (a single line, no cursor jumps).
- Selection highlight that fades on focus change (only when the renderer guarantees flicker-free repaint).

Avoid motion entirely when the terminal cannot guarantee atomic redraws — flicker is louder than the affordance the motion was supposed to surface.

## 7. Desktop (Tauri / Slint / egui / Iced)

Retained-mode runtimes (Tauri, Slint, Iced) maintain a scene graph between frames; motion is a property mutation that the framework interpolates. Token discipline matters: hardcoded durations or curves embedded in components defeat the framework's reuse story. Push timings to a tokens file; reference by name.

Immediate-mode runtimes (egui) rebuild the UI tree every frame; motion is achieved by mutating styled state per frame and letting the immediate-mode loop redraw. Egui's animation helpers (`ctx.animate_value_with_time()`) abstract the per-frame mutation; reach for them rather than rolling a manual time accumulator.

Cross-platform native menus and system dialogs respect OS-level reduce-motion preferences automatically (macOS / Windows / GNOME). In-app motion does NOT — implement the same `prefers-reduced-motion` semantics manually via the framework's accessibility API:

- Tauri: `window.matchMedia('(prefers-reduced-motion: reduce)')` from the webview.
- Slint: read the system preference via the platform integration; `1.18` ships an explicit `Window::reduce-motion` property on supported backends.
- Iced: read OS accessibility settings via the `iced::system` module.

## 8. Reduced motion

Roughly 35% of adults aged 40+ report vestibular sensitivity to large-area parallax, spinning, or zooming animations (CDC and interaction-design research). The browser, OS, and several frameworks expose a "reduce motion" preference that the user sets globally; honoring it is non-optional.

Web: `@media (prefers-reduced-motion: reduce)` scopes suppression to vestibular-trigger patterns (large-area transforms, parallax, page transitions) rather than every transition globally:

```css
@media (prefers-reduced-motion: reduce) {
  /* Suppress motions that risk a vestibular trigger — large-area transforms,
     parallax, autoplay video, full-page transitions. */
  .hero-parallax,
  .page-transition,
  [data-motion="parallax"] {
    animation: none !important;
    transform: none !important;
    transition: none !important;
  }

  /* Swap suppressed entrances to a 120ms crossfade. !important on every
     sibling property so component-level transitions cannot fight the
     fallback. */
  .modal-entrance,
  .panel-slide,
  [data-motion="entrance"] {
    animation: simple-fade 120ms ease both !important;
    transform: none !important;
    transition: none !important;
  }

  /* Subtle feedback (focus ring, hover, button press) is left alone —
     these do not trigger vestibular responses and are part of normal
     state communication. */
}

@keyframes simple-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

The pattern is "honor the preference for motions that risk a vestibular trigger; do not blanket-suppress every transition." A focus ring fading in 120ms is safe; a full-screen parallax scrolling at 60% of viewport height is not. Crossfade is the universal safe fallback for the suppressed surfaces.
