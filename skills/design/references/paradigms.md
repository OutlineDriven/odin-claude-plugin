# paradigms.md — five visual paradigms

Five paradigms cover the production-distinct surface space. Each is named, anchored on real exemplars, and has a known failure mode. Pick one per direction; mixing two on a single surface reads as confusion (see `references/anti-slop.md` §2 row 4).

Order matters below — post-minimalism is the ODIN default; the rest are alternatives chosen against a register, not picked from a buffet. Each subsection follows a fixed shape (when-to-use, failure mode, OKLCH palette starter, type pair, motion signature, density signature, taste anchors) so the paradigms can be scanned uniformly and compared without re-reading the prose.

## §0 Register × paradigm matrix

Two axes precede the paradigm pick: **register** (does design IS the product, or design SERVES the product?) and **color strategy** (commitment level on the saturation axis). Land both, then pick the paradigm.

| Register | Surface examples | Color strategy default | Paradigm fit |
|---|---|---|---|
| **Brand** — design IS the product | Marketing / landing / campaign / portfolio / press kit | Committed / Full palette / Drenched | neo-brutalism / glassmorphism / M3 Expressive |
| **Product** — design SERVES the product | App UI / admin / dashboard / settings / one-screen tool | Restrained (one accent ≤10%) | post-minimalism / Fluent 2 |

Detection rule:

- Cue in the task itself ("landing page" vs "dashboard").
- Surface in focus (the page, file, or route being worked on).
- Prior-direction artifact or `odin:contexts` project context if loaded.

First match wins.

Per-paradigm "Register fit":

- **post-minimalism** — product (operator/tool default)
- **neo-brutalism** — brand (indie/creator)
- **glassmorphism** — brand (visual depth, native OS shells)
- **M3 Expressive** — product or brand (ambipolar)
- **Fluent 2** — product (Microsoft ecosystem default)

Quick-pick matrix:

| Paradigm | Surface fit | Audience register | Motion budget | Density |
|---|---|---|---|---|
| Post-minimalism | Tools, dashboards, dev platforms | Operator, time-pressured | 120–200ms | Tight |
| Neo-brutalism | Creator, indie, anti-corporate | Personality-seeking | <100ms or none | Medium |
| Glassmorphism | Native OS shells, focus overlays | Platform-native | 300–400ms | As host |
| Material 3 Expressive | Android, Compose, Workspace | Consumer, expressive | 200–300ms | Standard |
| Fluent 2 | Microsoft ecosystem | Productivity-native | 167ms | Standard |

The matrix is a starting point, not a verdict — read it against the surface goal and the audience register before committing.

## Post-minimalism

**When to use.** Default direction per the SKILL.md `<design>` charter. Tools, dashboards, dev-platform surfaces, B2B SaaS where the user is paying a per-pixel attention tax across a long workday. The mood is competent, fast, and unceremonious — restraint with one accent doing the load-bearing signal work. Appropriate when the user has come to *do* something, not to be impressed.

**Failure mode.** Naive minimalism — restraint without intent reads as unfinished. A grey-on-grey grid with a thin sans body and no accent is not post-minimalism; it is abdication. The discipline requires conviction (one defended accent, one type-pair commitment, one density tier) — without conviction the surface looks like a `create-next-app` default that nobody touched.

The diagnostic: if every removed element makes the surface lighter without making it sharper, the surface was already underweight. Restraint compounds only when there is something underneath worth surfacing.

**OKLCH palette starter.**
```css
--bg:     oklch(0.99 0 0);            /* near-white, no tint */
--fg:     oklch(0.15 0.003 246);      /* near-black, cool undertone */
--muted:  oklch(0.68 0.004 250);      /* muted gray, kept cool to match fg */
--accent: oklch(0.66 0.13 38);        /* warm clay — non-purple/blue per anti-slop */
--border: oklch(0.88 0.002 0);        /* very light neutral border */
```

**Type pair.** Display: Inter Display or Geist Sans (committed weight, tight tracking). Body: Inter Text or Geist Sans Text. Mono: Geist Mono or JetBrains Mono. The pairing collapses display and body into one family at different optical sizes — appropriate because post-minimalism stakes restraint, not editorial contrast.

**Motion signature.** 120–200ms, ease-out, on `opacity` and `transform` only. No `transition: all`. Layout, color, and shadow do not animate. The motion budget is small on purpose — every frame the user spends watching a transition is a frame they are not reading the content the surface exists to communicate.

**Density signature.** Spacing subset 4 / 8 / 16; line-height 1.4–1.5; content-to-chrome ratio 2–3× the LLM default. Vertical rhythm tightens until information lands per scroll.

**Taste anchors.** Linear (velocity-driven density). Vercel (monochrome with mono accents). Stripe docs (editorial type accent on transactional UI).

## Neo-brutalism

**When to use.** Direct-to-consumer surfaces with a register that has earned coarseness — creator tools, indie launches, anti-corporate platforms. Coarse type, harsh borders, raw color blocks read as conviction when the audience expects a personality, not a frictionless funnel. The mood is loud, opinionated, and willing to be ugly in service of being remembered.

**Failure mode.** B2B SaaS context — clients read coarse type as "this is unfinished" rather than "this is intentional". The same 4px black border that signals deliberate craft on Gumroad signals broken stylesheet on an enterprise procurement portal.

Lift the look without inheriting the audience and the brutalism becomes costume — a hostile aesthetic adopted by an institution whose every other signal is conformist.

**OKLCH palette starter.**
```css
--bg:     oklch(1 0 0);               /* raw white */
--fg:     oklch(0 0 0);               /* raw black */
--block-1: oklch(0.65 0.12 165);      /* deep teal — non-purple/blue */
--block-2: oklch(0.71 0.15 29);       /* saturated apricot/coral */
--border: oklch(0 0 0);               /* raw black, 2-4px */
```

**Type pair.** Display: a coarse grotesque or geometric mono (e.g. Space Mono, Departure Mono, IBM Plex Mono Bold) at heavy weight, oversized. Body: a plain neutral sans (Inter, Helvetica). The pairing earns its tension from contrast in *register*, not just size — display reads handmade, body reads industrial.

**Motion signature.** Minimal — 100ms or less, no easing curves (`linear` or no transition). Motion is anathema to the static-poster register; movement breaks the illusion that the page is print, and print is the metaphor neo-brutalism is leaning on.

**Density signature.** Spacing subset 16 / 24 / 48; 2–4px borders; line-height 1.3–1.5. Content-to-chrome ratio is medium-tight — generous block padding inside harsh borders, not cramped.

**Taste anchors.** Read.cv (anti-LinkedIn; acquired by Perplexity 2025 and shut down 2025-05-16 — historical anchor). Gumroad (creator-economy register). Vercel's old blog era (pre-2023 grotesque-display moment).

## Glassmorphism

**When to use.** Sparingly — only as background-layering decoration on top of an opaque host paradigm. Translucence is a depth signal; it works when one floating surface sits over a strongly-colored or photographic ground. Native OS shells (visionOS, Big Sur Notification Center) earn it because the desktop wallpaper underneath provides the contrast. Glass is a guest paradigm, never a host.

**Failure mode.** Glassmorphism on every surface (see `references/anti-slop.md` §1 row 4) — translucence loses meaning when nothing behind it is opaque. A glass card on a glass page on a glass nav reads as fog, not depth.

The decoration only signals when used once; the second instance dilutes the first, and by the third the surface has lost the vocabulary it was reaching for.

**OKLCH palette starter.**
```css
--surface-base: oklch(0.15 0.003 246);          /* opaque dark host (cool near-black) */
--glass-tint:   oklch(0.9 0.01 250 / 0.10);     /* translucent light tint on dark */
--glass-border: oklch(0.9 0.008 250 / 0.20);    /* slightly more opaque edge */
--accent:       oklch(0.66 0.13 38);            /* warm clay — non-purple/blue accent */
```

**Type pair.** Inherit from the host paradigm; glass does not impose its own type system. Pairing typically defers to the platform — SF Pro on Apple surfaces, Segoe UI Variable on Microsoft. Imposing a custom display family on top of glass overloads the surface.

**Motion signature.** 300–400ms ease-in-out, longer than other paradigms because GPU blur cost is real and short transitions look broken under filter compositing. Animate `opacity` and `backdrop-filter` blur radius; never animate transform on a glass surface.

**Density signature.** As host paradigm — glass is decoration on top of structure, not a structural choice. Padding inside the glass surface is generous (1.5–2× host) so the translucence has room to read.

**Taste anchors.** Apple visionOS (native depth-as-affordance). macOS Big Sur+ Notification Center (sidebar floats over wallpaper). Windows 11 Mica (the restrained sibling — tinted, not blurred).

## Material 3 Expressive

**When to use.** Android / Compose surfaces and Google-ecosystem apps, stable since December 2025 (Compose support without experimental flags). The register is consumer, expressive, motion-rich — gestures matter, theming matters, accessibility is enforced by the system. Appropriate when the user expects platform-native feel, not bespoke branding, and when dynamic color from system wallpaper is a feature rather than a leak.

**Failure mode.** M3-default — using the stock palette and component shapes reads as "I used the framework defaults" (the framework-default slop tell, see `references/anti-slop.md` §1 row 9, generalized from Tailwind to Material).

The dynamic-color system is permissive; without an opinionated seed color and a committed shape scale, the result is indistinguishable from every other Compose template — and Compose templates are what the model has been trained to produce.

**OKLCH palette starter.**
```css
--md-sys-primary:    oklch(0.65 0.20 38);       /* warm clay primary */
--md-sys-secondary:  oklch(0.70 0.15 90);       /* warm gold — non-purple/blue */
--md-sys-tertiary:   oklch(0.68 0.18 135);      /* teal-green */
--md-sys-surface:    oklch(0.98 0.002 100);     /* near-white surface, warm undertone */
--md-sys-on-surface: oklch(0.10 0.004 280);     /* dark text, slight cool undertone */
```

**Type pair.** Display: Roboto Flex or a custom variable Google Font keyed to a committed Display Large size. Body: Roboto Flex Body or Google Sans Text. The pairing leans on variable-axis commitment — Material 3 Expressive rewards optical-size discipline over family contrast.

**Motion signature.** Emphasized easing curves at 200–300ms, e.g. `cubic-bezier(0.05, 0.7, 0.1, 1.0)`. Container transforms and shared-element transitions do the heavy narrative work; motion is a first-class material, not a flourish.

**Density signature.** Spacing subset 4 / 8 / 16 / 24 (Material's standard); line-height 1.5; content-to-chrome ratio matches platform conventions — touch targets 48dp minimum, generous padding around primary actions.

**Taste anchors.** Pixel UI (system-canonical M3E reference). Google Workspace 2026 redesign (M3E applied to long-form productivity).

## Fluent 2

**When to use.** Microsoft-ecosystem surfaces — Office 2026, Teams, Windows 11 first-party apps. Luminosity-aware shadows and backplate-driven elevation read as native to the platform. Cross-pollination note: the Liquid Glass roadmap for iOS 26 borrows the luminosity-aware-shadow concept, so the technique is migrating beyond Microsoft, but the *register* (Segoe UI, Fluent acrylics, Office iconography) remains Microsoft-coded.

**Failure mode.** Pasting Fluent shadows onto non-Microsoft contexts reads as "Office in the browser". The luminosity-aware shadow only earns its complexity when the surrounding chrome is Fluent — backplates, acrylics, Segoe glyphs. Stripped of context, the technique looks like Bootstrap with extra steps, and the implementation cost (per-elevation luminosity sampling) buys nothing the surface needed.

**OKLCH palette starter.**
```css
--fluent-bg:        oklch(1 0 0);               /* white background, light theme */
--fluent-fg:        oklch(0.10 0.002 280);      /* near-black text */
--fluent-accent:    oklch(0.568 0.167 251);     /* Microsoft Communication Blue #0078D4 — platform-mandated exception to the anti-purple/blue rule, since Fluent 2 IS the Microsoft platform palette */
--fluent-backplate: oklch(0.95 0.003 100);      /* subtle backplate tint */
--fluent-stroke:    oklch(0.88 0.002 0);        /* hairline stroke / border */
```

**Type pair.** Display: Segoe UI Variable Display. Body: Segoe UI Variable Text. Mono: Cascadia Code. The pairing is platform-inherited — the Variable axes (size, weight, optical) carry the typographic load, and substituting a non-Segoe family breaks the Microsoft-native register the rest of the system depends on.

**Motion signature.** 167ms standard easing as Fluent's published default. Connected Animations pattern for cross-surface continuity — element identity carries across navigation, so the user reads the transition as the same object moving rather than two objects swapping.

**Density signature.** Spacing subset 4 / 8 / 16; line-height 1.5; generous backplate padding (12–16px) inside elevation tiers. Content-to-chrome ratio leans toward chrome — Fluent earns its weight from honest backplates, not from raw density.

**Taste anchors.** Office 2026 (Fluent 2 at scale across productivity surfaces). Teams (real-time collaboration with Fluent acrylics carrying focus state).

## Mixing the paradigms

The five paradigms above are exclusive at the surface level — one direction picks one paradigm and commits. They are not exclusive across the design system: a post-minimalist product surface can host a single glass overlay for a focused notification, and a Fluent 2 desktop app can host a brutalist marketing landing page on its public site. The rule is per-surface, not per-product.

The exception that breaks the rule is M3 Expressive's design-token compatibility: because Material 3 leans on dynamic color and a stable shape scale, an M3 surface can accept Fluent-style luminosity-aware shadows as a token override without reading as confusion. The technique is migrating; the *register* still has to match.

When in doubt, pick post-minimalism. It is the safest default because it makes the fewest claims, and the fewest claims means the fewest opportunities to claim wrongly. The other four paradigms ask the surface to stand for something — coarseness, depth, expression, platform-nativity — and that request only carries when the surface has earned it.

The pick is part of the direction commit, not a runtime choice. Once a paradigm is named in the direction artifact, the palette, type pair, motion budget, and density tier follow from that pick. Switching paradigms mid-build means re-deriving the tokens; the cost is real, so the pick must defend itself before the first surface is wired.

Each paradigm has an opportunity cost as well as a register. Picking post-minimalism forfeits the conviction premium of brutalism; picking M3 Expressive forfeits the editorial precision of post-minimalism; picking Fluent 2 forfeits the cross-platform portability the others retain. There is no neutral pick — only picks whose costs are accepted with the eyes open.

For the full token-extraction discipline (OKLCH ramp derivation, type-pair commitment, density-tier defense), see `references/soul.md` §4 on restraint as positive practice and `references/anti-slop.md` §3 on counter-techniques. The paradigms in this file are the structural shape; the soul and anti-slop references are the philosophy and the negative space that keeps each paradigm honest.

The closing diagnostic: read the named paradigm aloud against the surface itself. If the paradigm name does not survive the reading — if "post-minimalism" sounds like a label glued onto a surface that is doing something else — the paradigm pick was wrong, not the surface. Re-pick before re-decorating.
