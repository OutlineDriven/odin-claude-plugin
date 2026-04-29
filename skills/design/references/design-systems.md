# Design Systems Reference

**Snapshot date: April 2026.** Re-verify versions and capability tables before relying on them in production. Specs evolve; the citations below are correct as of the snapshot date.

## §1. Posture

Design systems are tokens + behavior, expressed as code. The token spec (DTCG) is now W3C-stable; the export tooling (Style Dictionary 4) is mature; the production exemplars (Radix Colors, Material 3 Expressive, Fluent 2, Apple HIG 2025-2026) each commit to a different *register* — pick by what the picked direction needs, not by familiarity. Direction comes first, framework second; see `references/paradigms.md` for paradigm-to-system fit before reaching for a library. A system imported without a direction yields the default-Material-palette tell — recognizable to anyone who has seen Compose's defaults more than twice.

## §2. DTCG W3C Tokens 2025.10

The W3C Design Tokens Format Module (DTCG) reached its first stable spec on **Oct 28 2025**. **10+ tools** ship support — Figma, Sketch, Framer, Penpot, Tokens Studio, Style Dictionary, and others. File extension: `.tokens.json`.

Shape: JSON with `$type` discriminator (`color`, `dimension`, `typography`, `shadow`, `gradient`, `cubicBezier`, `duration`, `fontFamily`, `fontWeight`, `number`, `strokeStyle`, `transition`), `$value`, `$description`. Aliases reference siblings via `{group.name}` braces. Groups nest arbitrarily.

```json
{
  "color": {
    "brand": {
      "primary": { "$type": "color", "$value": "#5B5BD6", "$description": "Brand primary, step 9" },
      "primary-hover": { "$type": "color", "$value": "{color.brand.primary}" }
    },
    "text": {
      "default": { "$type": "color", "$value": "#1B1B18" }
    }
  },
  "dimension": {
    "space": {
      "section-y": { "$type": "dimension", "$value": "48px" }
    }
  },
  "typography": {
    "heading-l": {
      "$type": "typography",
      "$value": {
        "fontFamily": "Inter",
        "fontWeight": 600,
        "fontSize": "32px",
        "lineHeight": "1.2"
      }
    }
  }
}
```

Aliases compose; a token whose `$value` is `{group.name}` resolves transitively. Avoid alias cycles — most resolvers detect them but error messages vary.

## §2.5. DTCG transition tokens

DTCG 2025.10 introduces `$type: "transition"` for motion tokens, composed from `cubicBezier`, `duration`, and `delay` sub-types. A transition token references its parts via DTCG aliases — the result is a single named transition that token transforms can target without reverse-engineering the constituent properties.

```json
{
  "motion": {
    "ease-out-quart":  { "$type": "cubicBezier", "$value": [0.25, 1, 0.5, 1] },
    "fast":            { "$type": "duration",    "$value": "120ms" },
    "no-delay":        { "$type": "duration",    "$value": "0ms" },
    "transition-fast": {
      "$type": "transition",
      "$value": {
        "duration":       "{motion.fast}",
        "delay":          "{motion.no-delay}",
        "timingFunction": "{motion.ease-out-quart}"
      }
    }
  }
}
```

Style Dictionary 4.x recognizes the `transition` discriminator out of the box; older 3.x configs need a custom transform that flattens the composite type into platform-native syntax (CSS `transition`, iOS `UIView.animate`, Android `AnimatorSet`).

## §3. Style Dictionary 4.x + Tokens Studio

**Style Dictionary 4.x** is stable; transforms DTCG-shaped JSON into platform-specific outputs (CSS custom properties, iOS Swift, Android XML, Flutter, JS objects). **Tokens Studio** (formerly Figma Tokens) is the design-tool integration layer; sync DTCG tokens between Figma and code so the source-of-truth lives in JSON, not in a Figma library.

Pipeline: DTCG source → SD config → platform outputs. Pick a `transformGroup` per target (`css`, `ios-swift`, `android`, `compose`); drop to custom transforms when the built-in group misses a project-specific naming rule.

```js
// config.js
export default {
  source: ['tokens/**/*.tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'build/css/',
      files: [{
        destination: 'tokens.css',
        format: 'css/variables',
        options: { outputReferences: true }
      }]
    }
  }
}
```

`outputReferences: true` preserves DTCG aliases as CSS `var()` references in the build, so theme switches at runtime work. Posture: keep DTCG source as the source of truth; never edit derived outputs — they regenerate.

## §3.5. Style Dictionary v4 worked example

Two flags carry most of the v4-specific weight in production token pipelines:

- **`outputReferences: true`** — preserves DTCG aliases as CSS `var()` references rather than flattening them. Critical for runtime theme switches (light / dark / high-contrast); without it, every theme ships its own concrete values and the cascade cannot pivot on a single root variable.
- **Custom transforms** — when the built-in `transformGroup` misses a project-specific naming convention (e.g., kebab-case-but-not-the-tailwind-flavor, or per-platform prefixes), register a one-off transform. v4's transform API is async-aware; previous versions required workarounds for asynchronous color-space conversion or remote-asset resolution.

```js
// style-dictionary.config.js (v4)
export default {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [{
        destination: 'tokens.css',
        format: 'css/variables',
        options: { outputReferences: true },
      }],
    },
  },
};
```

The output preserves `var(--motion-fast)` references through the `transition-fast` token from §2.5, so swapping the root duration token swaps every dependent transition simultaneously.

## §4. Radix Colors

**Radix Colors** ships **46 scales × 12-step semantic ramps**, P3 wide-gamut variants, and alpha-blend variants per step. Maintenance moved under **WorkOS** as of 2026; the unified **`radix-ui`** package shipped **Feb 2026**, consolidating `@radix-ui/colors` with the rest of the Radix surface.

12-step ramp meaning: 1 = app background, 2 = subtle background, 3 = UI element background, 4 = hovered UI element, 5 = active UI element, 6 = subtle borders/separators, 7 = UI element border, 8 = hovered UI element border / focus rings, 9 = solid backgrounds (the brand step), 10 = hovered solid, 11 = low-contrast text, 12 = high-contrast text. Step 9 vs step 10 distinguishes filled vs hovered solid surfaces. Light and dark variants pair by name (`blue` / `blueDark`); semantic step preserves meaning across the swap.

Radix's internal color tooling uses **APCA** for design-input perceptual checks. Do NOT claim APCA-WCAG-3 compliance: **APCA was REMOVED from WCAG 3 in July 2023.** APCA remains a useful internal heuristic; it is not a conformance target.

```css
:root {
  --color-bg: var(--blue-1);
  --color-surface: var(--blue-2);
  --color-border: var(--blue-7);
  --color-solid: var(--blue-9);          /* brand fill */
  --color-solid-hover: var(--blue-10);
  --color-text-low: var(--blue-11);
  --color-text-high: var(--blue-12);
}
```

P3 + alpha-blend variants are drop-in replacements for the same semantic steps; consumers do not change.

## §4.5. Color quality controls

Three quality controls that catch the most common color-system bugs.

### Dangerous color combinations

These commonly fail contrast, vibrate visually, or fail color-vision testing.

| Combination | Why it fails |
|-------------|--------------|
| Light gray text on white | The #1 accessibility fail; nearly always sub-AA |
| Gray text on any colored background | Gray reads washed-out and dead next to color — use a darker shade of the background hue, or a tinted-neutral aligned to the same hue |
| Red text on green (or vice versa) | ~8% of men cannot distinguish |
| Blue text on red background | Visual vibration; chromatic aberration |
| Yellow text on white | Almost always fails AA |
| Thin light text over photographic images | Unpredictable per-pixel contrast |

Placeholder text is bound by the same WCAG rule as body text — 4.5:1 against the input background. The default light-gray placeholder rendered by most form libraries usually fails.

### Dark mode is not inverted light mode

Color swap alone does not produce a working dark theme. Dark mode requires different design decisions on each axis.

| Axis | Light mode posture | Dark mode posture |
|------|-------------------|-------------------|
| Depth | Shadows | Surface-lightness layering — no shadows |
| Text | Dark on light, normal weight | Light on dark, *reduced* weight (e.g. 350 instead of 400) — light-on-dark reads heavier |
| Accents | Vibrant chroma | Slightly desaturated; high chroma on dark backgrounds glares |
| Background | Pure or near-pure white | Never pure black — use dark gray (oklch L 0.12–0.18) with the brand hue tint |

Build a 3-step elevation scale where higher elevations are *lighter* (e.g. L 0.15 / 0.20 / 0.25). Hold the brand hue and chroma constant; only vary L. Dark-mode contrast against a true black surface (`oklch(0 0 0)`) creates harsh edges that read as broken.

### Alpha is a design smell

Heavy use of `rgba()` / `hsla()` / OKLCH alpha usually means an incomplete palette. Alpha creates unpredictable contrast against whatever surface ends up underneath, performance overhead from per-pixel compositing, and inconsistency when the underlying surface changes.

Define explicit overlay tokens for each context (`--surface-overlay-light`, `--surface-overlay-dark`) instead of leaning on `bg-black/10`. Exceptions where alpha is correct: focus rings (must show through to the underlying focused element), backdrop dims under modals, and translucent paradigm surfaces (glassmorphism — see `paradigms.md §3`, where translucence is the design choice not a workaround).

## §5. Material 3 Expressive

**Material 3 Expressive** went stable **Dec 2025**. Compose support landed without experimental flags in the same release. Adds emphasized motion curves, an expanded expressive type scale, and color-role tonal palettes generated from a seed via **HCT** (Hue / Chroma / Tone) — perceptually uniform unlike HSL.

Color roles: `primary`, `onPrimary`, `primaryContainer`, `onPrimaryContainer`, `secondary`, `tertiary`, `surface`, `surfaceVariant`, `surfaceContainer`, `error`, `outline`. Pair every fill with its `on*` for foreground; pair surfaces with their `surfaceVariant` for adjacency.

```kotlin
val seed = Color(0xFF5B5BD6)
val scheme = dynamicColorScheme(seed = seed, isDark = false, isAmoled = false)

MaterialTheme(colorScheme = scheme, typography = expressiveTypography()) {
  Surface(color = MaterialTheme.colorScheme.surfaceContainer) { /* … */ }
}
```

Failure mode: shipping with the default Material 3 palette and `MaterialTheme()` defaults reads as "I used Compose's defaults" — see `references/anti-slop.md` §1 row 9. A seed color and a token override at minimum.

## §6. Fluent 2

**Fluent 2** is the current Microsoft design system. **Liquid Glass** is on the **iOS 26** roadmap; the term is Apple's, but the underlying *luminosity-aware shadow* concept cross-pollinates Microsoft Design and Apple HIG. Fluent 2 ships per-platform token files (`.json`) for web, Windows, and macOS targets.

Defining trait: backplate-driven elevation. Shadow intensity matches the backplate luminosity instead of the uniform `shadow-md` flat tell. Connected Animations carry the same element across surface boundaries; the shared element retains identity through the transition rather than fading and re-instantiating.

```css
/* Light backplate: lighter, larger, more diffuse shadow */
.elevated-on-light {
  box-shadow:
    0 1px 2px rgb(0 0 0 / 0.06),
    0 8px 24px rgb(0 0 0 / 0.08);
}

/* Dark backplate: tighter, denser shadow — luminosity-honest */
.elevated-on-dark {
  box-shadow:
    0 1px 2px rgb(0 0 0 / 0.4),
    0 6px 16px rgb(0 0 0 / 0.55);
}
```

The two values are not two themes of the same shadow; they are two shadows for two backplates. Same `elevation-2` semantic token, different rendered output.

## §7. Apple HIG 2025-2026

**Apple HIG 2025** introduced visionOS spatial design — depth, materials, gaze + pinch input. **Apple HIG 2026** rolls **Liquid Glass** across iOS 26, iPadOS, macOS, and watchOS: luminosity-aware translucent layers that respond to the underlying content rather than apply uniform blur. **Adaptivity** is the through-line — design must scale across all Apple platforms, and tokens drive the adaptation.

Liquid Glass posture: translucent layers respond to underlying content; never blur for blur's sake. Glass overdose is the slop tell — see `references/anti-slop.md` §1 row 4. visionOS spatial considerations: depth ≠ z-index; physical layers occupy 3D space, with parallax and gaze-driven affordances tied to actual distance. Platform-adaptive typography uses the SF Pro family; size and weight scale per platform (compact on watchOS, generous on visionOS).

```swift
ZStack {
  Color.clear.background(.regularMaterial)            // luminosity-aware glass
    .clipShape(RoundedRectangle(cornerRadius: 16))
  VStack { Text("Now Playing").font(.headline) }
}
```

`.regularMaterial` adapts opacity to the backplate; `.thinMaterial` and `.thickMaterial` express different glass weights without reaching for ad-hoc `backdrop-filter: blur(20px)`.

## §8. Token naming: semantic over output

The non-negotiable bit: name tokens by what they MEAN, not by what they look like. Output-named tokens couple consumers to the look; semantic-named tokens decouple. This is the Radix Colors lesson — semantic step naming (1, 9, 12) is what makes Radix portable across themes; pure-grayscale naming would not.

```css
/* Bad — output-named; couples to a specific shade and pixel count */
--color-gray-900: #1B1B18;
--space-48: 48px;

/* Good — semantic; decouples from look, names role */
--color-text-default: #1B1B18;
--space-section-y: 48px;
```

When the brand shifts cooler or the section breathes wider, semantic names absorb the change at the token layer. Output names force a find-and-replace through every consumer.

**Two-layer pattern.** Pair primitive tokens (`--blue-500`, `--gray-50`) with semantic tokens that reference them (`--color-primary: var(--blue-500)`, `--color-bg: var(--gray-50)`). Theming swaps redefine *only* the semantic layer — primitives stay constant. This is the same lesson Radix encodes through its 12-step semantic ramps; the two-layer pattern generalizes it to design-token files.

## §8.5. Component state matrix

Every interactive component ships the full state matrix — token-driven, never hardcoded. Missing states surface as bugs the first time a user hits the unhandled path; the matrix is the contract a component design must satisfy before shipping.

| State | Trigger | Token shape |
|---|---|---|
| default | resting | `--color-bg-default`, `--color-text-default` |
| hover | pointer over | `color-mix()` of accent + bg |
| focus-visible | keyboard navigation | distinct ring color, ≥3:1 contrast vs adjacent |
| active | mid-press | darker tint, brief duration |
| disabled | non-interactive | reduced opacity, no hover/active response |
| loading | request in flight | spinner or skeleton; submit stays enabled until error |
| error | validation failed | `--color-error-*` tokens, inline message |
| success | post-action confirmation | `--color-success-*` tokens, dismissible |
| empty | no data yet | empty-state copy + CTA |
| overflow | content exceeds container | scroll, truncate, or expand |
| long-text | content longer than design baseline | wrap gracefully without breaking layout |
| short-text | content shorter than baseline | maintain min-width or align meaningfully |
| first-run | onboarding | ship the "this is what this is" affordance |

The 13 states are not optional. A button with default + hover only is ~15% complete; the other 85% surfaces as the components-that-broke-on-Tuesday list.

## §8.6. Typography rhythm and font loading

### Modular scale

Too many sizes that are too close together produce muddy hierarchy. Commit to a 5-size system. Apply the ≥1.25 ratio rule to the *hierarchy* end of the scale (body → subheading → heading → display); the micro end (xs / sm / base) intentionally uses tighter ratios because those steps are functional differentiators (caption vs. metadata vs. body — different *roles*, not different hierarchy levels), not visual hierarchy steps.

| Role | Typical size | Use | Adjacent ratio |
|------|--------------|-----|----------------|
| `xs` | 0.75rem | Captions, legal, footnotes | — |
| `sm` | 0.875rem | Secondary UI, metadata | 1.167 (functional) |
| `base` | 1rem | Body text | 1.143 (functional) |
| `lg` | 1.25–1.5rem | Subheadings, lead text | ≥1.25 (hierarchy) |
| `xl+` | 2–4rem | Headlines, hero text | ≥1.6 (hierarchy) |

Common ratios for the hierarchy end: 1.25 (major third), 1.333 (perfect fourth), 1.5 (perfect fifth). Pick one ratio for the body→heading→display sequence and commit; mixed ratios across hierarchy steps read as inconsistent. The functional micro-steps stay tight because their job is "different *role*" not "louder *voice*".

### Vertical rhythm

Line-height is the base unit for *all* vertical spacing. If body text runs `font-size: 1rem` with `line-height: 1.5` (= 1.5rem effective), then spacing tokens should fall on multiples of 1.5rem (or its half: 0.75rem). Text and space share a mathematical foundation; anchor your `--space-*` scale to the body line-height unit, not to arbitrary pixel values.

### Paragraph rhythm

Pick *one* of: space between paragraphs, OR first-line indentation. Never both. Digital UI typically wants space (the indent reads as a typo on screen); editorial / long-form print can earn indent-only (the space reads as a section break). Mixing the two double-encodes a single signal.

### ALL-CAPS tracking

Capitals at default spacing sit too close — letterforms designed for mixed-case rhythm pile up when the descenders disappear. Add 5–12% letter-spacing on short all-caps labels, eyebrows, and small headings.

```css
.eyebrow { text-transform: uppercase; letter-spacing: 0.08em; }
```

Real small-caps (`font-variant-caps: all-small-caps`) need the same treatment, slightly gentler (~0.05em).

### Fluid type, with bounds

`clamp(min, preferred, max)` scales smoothly with the viewport — fine for headings and display on marketing surfaces where text dominates the layout. Keep `max ≤ ~2.5 × min`. Wider ratios break the browser's zoom and reflow behavior and make large viewports feel like the page is shouting.

```css
h1 { font-size: clamp(2rem, 5vw + 1rem, 5rem); } /* max/min = 2.5; OK */
```

App UIs, dashboards, and data-dense interfaces use *fixed* `rem` scales — Material, Polaris, Primer, and Carbon all do. Spatial predictability matters more than fluid scaling for container-based layouts. Body text stays fixed even on marketing pages; the per-viewport size difference is too small to be worth the layout-shift cost.

### Web font loading

Custom web fonts arrive late, so without compensation the browser swaps fallback → web font and the layout shifts.

```css
/* The web font itself */
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2') format('woff2');
  font-display: swap;
}

/* A fallback with overridden metrics so the swap is invisible */
@font-face {
  font-family: 'CustomFont-Fallback';
  src: local('Arial');
  size-adjust:        105%;     /* match x-height */
  ascent-override:    90%;      /* match ascender height */
  descent-override:   20%;      /* match descender depth */
  line-gap-override:  10%;      /* match line spacing */
}

body { font-family: 'CustomFont', 'CustomFont-Fallback', sans-serif; }
```

`size-adjust` + `ascent/descent/line-gap-override` align the fallback's metrics to the web font, so when the swap happens the layout boxes are already the right size. Tools like [Fontaine](https://github.com/unjs/fontaine) calculate the overrides automatically per-font; do not eyeball them.

**`font-display`: swap vs. optional.** `swap` shows fallback text immediately and switches to the web font when it arrives (FOUT). `optional` uses the fallback if the web font misses a tight ~100ms budget and *avoids* the swap entirely. Pick `optional` when zero layout shift matters more than seeing the branded font on slow networks.

**Preload only the critical weight.** Typically the regular-weight body font used above the fold. Preloading every weight pre-loads bandwidth you do not save anywhere else.

**Variable fonts when the surface needs ≥3 weights or styles.** One variable file is usually smaller than three static weight files, gives fractional weight control, and pairs with `font-optical-sizing: auto` so the optical-size axis follows your size scale automatically. For 1–2 weights, static is fine and the wire-format diff is minor.

### Token shape

Name typography tokens semantically — `--text-body`, `--text-heading-lg`, `--text-eyebrow` — not by value. Include the font stack, size scale, weights, line-heights, and letter-spacing in the token system; light-text-on-dark compensation (see §4.5 "Dark mode is not inverted light mode") becomes a per-theme override on the line-height and letter-spacing tokens.

## §9. Cite-and-defer

Citations: w3c.github.io/design-tokens, amzn.github.io/style-dictionary, www.radix-ui.com/colors, m3.material.io, fluent2.microsoft.design, developer.apple.com/design.

Specs and tooling here move quarterly; defer to upstream for current API surface before relying on a feature in production.
