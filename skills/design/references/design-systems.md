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

## §9. Cite-and-defer

Citations: w3c.github.io/design-tokens, amzn.github.io/style-dictionary, www.radix-ui.com/colors, m3.material.io, fluent2.microsoft.design, developer.apple.com/design.

Specs and tooling here move quarterly; defer to upstream for current API surface before relying on a feature in production.
