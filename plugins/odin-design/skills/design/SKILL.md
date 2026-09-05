---
name: design
description: 'Use when starting UI work, defining palettes or tokens, fixing AI-generic UI, or persisting a design system to DESIGN.md (modes: implement, persist). Not for live URLs: use web-design-review.'
---

# Design

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Starting UI work, defining palettes or design tokens, correcting AI-generic, vibe-coded, or default-framework design, or persisting an approved design system to DESIGN.md. |
| Authority | Reversible local: writes only local UI direction, token, and implementation artifacts; persist mode also writes DESIGN.md, CLAUDE.md pointers, and preview artifacts. Rollback is version control. No remote mutation. |
| Side effect | Local writes to the picked mode's artifacts only, bounded to the current project directory. |
| Done | Implement mode: one defensible direction is implemented consistently across palette, typography, spacing, density, and motion, and the audit passes clean. Persist mode: an approved design system is persisted in DESIGN.md. |

## Inputs

- Mode: `implement` (direction and token implementation) or `persist` (propose, preview, and persist an approved system to DESIGN.md). Required; default `implement` when unstated.
- The surface being designed (landing, dashboard, settings, docs, one-screen tool, TUI, CLI, desktop app). Required.
- The runtime or framework in use (vanilla CSS/HTML, React/Tailwind/shadcn, Bubble Tea/Ratatui/Textual, clap/cobra/cmdliner/typer, Tauri/Slint/egui/Iced, Qt/QML). Required before step 6 in implement mode.
- Primary user and density target. Required for framing; state assumptions if not supplied.
- Existing project context (PRD, brand brief, design tokens, component library, an existing DESIGN.md to extend). Optional; load when present.
- Persist mode only: user approval is the in-loop gate. No design system is persisted until the user approves it.

## Procedure

Direction precedes tokens; tokens precede code. The picked direction is the contract. Restraint is the default; reach for decoration only when a named surface goal demands it. Balance, not maximalism, not minimalism.

1. **Frame the surface.** Identify register first: **brand** (marketing, landing, campaign, long-form, portfolio; design IS the product) or **product** (app UI, admin, dashboard, tool; design SERVES the product). Detection rule, first match wins: (a) cue in the task ("landing page" / "campaign hero" → brand; "dashboard" / "settings panel" → product); (b) surface in focus or route segment (`/marketing/*` vs `/app/*`); (c) register field in project context. Then capture surface, primary user, density target, and motion budget in ms. Write one sentence of physical scene (who, where, ambient light, mood) that forces the dark/light decision; category names alone do not force the answer. Mode persist: read any existing DESIGN.md, tokens, and brand guidance first; name missing context rather than inventing it. **Done when:** register is named, the four framing fields are captured, and the dark/light sentence is written.

2. **Diverge: 3-4 directions in parallel with forced contrast.** Dispatch one exploration per direction with a constraint that forces contrast (post-minimalism vs neo-brutalism vs Material 3 vs Fluent, or named taste anchors pulling in opposite directions). Reject converged outputs; re-dispatch with sharpened constraints if two directions read alike. Diversity techniques: verbalized sampling, actor-critic per candidate, persona injection, temperature, most-unlikely reframing, anti-pattern catalog. **Done when:** 3-4 directions are produced and no two read alike under a headline-swap test.

3. **Return a fixed shape per direction.** Each direction states: name (one or two words), 1-2 taste anchors (Linear / Stripe / Things 3 / Rosé Pine / Are.na; name the references), OKLCH palette stub (4-6 swatches, never the default Tailwind ramp), type pair (display + text, named families), spacing scale subset committed (e.g. 4/8/16/24/48), motion budget in ms with one easing curve. Mode persist: the fixed plan also covers component primitives and interaction states. **Done when:** every direction carries all six fields (eight in persist mode) with no defaults borrowed from a framework ramp.

4. **Pick via per-axis single-select.** Each axis (direction, density, motion budget, type pair) is its own single-select question; the recommended option carries `(Recommended)` and is placed first. Ticking `(Recommended)` is accepting the default. Never use multiSelect for axis-with-default override semantics: it collapses N independent decisions into one ambiguous checklist. Reserve multiSelect for additive picks only. **Done when:** one option is selected per axis and the picked direction is named.

5. **Derive tokens from the picked direction.** Color, type, space, radius, shadow, motion: each a token, each referenced, not hardcoded. Pick the color strategy before picking colors: **Restrained** (tinted neutrals plus one accent at ≤10% surface coverage; product default), **Committed** (one saturated color carries 30-60% of the surface; brand default for identity pages), **Full palette** (3-4 named roles, each deliberate; brand campaigns, product data viz), **Drenched** (the surface IS the color; brand heroes, campaign pages). The ≤10% accent cap applies only to Restrained. Express tokens in the runtime's native token system: CSS custom properties for web, theme or design-token objects for React, style structs for TUI and desktop, palette constants for CLI. Tokens precede component code; component code references tokens. **Done when:** the six token families are expressed in the runtime's native system and referenced, not hardcoded.

6. **Apply the picked mode.**
   - Mode implement: implement against the runtime. Apply the cross-surface invariants regardless of runtime. Audit the result against the anti-slop charter. **Done when:** implementation references the committed tokens and the audit flags no Side A or Side B tell and no invariant violation.
   - Mode persist: produce a preview the user can react to (mockups or a self-contained HTML preview for the target surface) that reflects the proposed tokens, not generic defaults. Present the proposal and preview and request approval; approval is the gate, so do not write DESIGN.md before it. On approval, persist the system in DESIGN.md (tokens, component primitives, application rules), add CLAUDE.md pointers naming DESIGN.md as the design source of truth, and keep the preview artifacts alongside DESIGN.md. **Done when:** DESIGN.md and the CLAUDE.md pointers are written and the artifacts sit alongside DESIGN.md.

Cross-surface invariants (apply on every runtime):

- Color as input, never as default: custom OKLCH palette derived from the picked direction; never the default Tailwind, Material, or Bootstrap ramp.
- Spacing scale is 4/8/12/16/24/32/48/64. Pick a subset matching the density target; commit and stick. A new value mid-build is a smell.
- At most two type families: display plus text. A third is a smell unless the direction explicitly demands it (e.g. a mono accent for code).
- Motion is budgeted in milliseconds. One easing curve per surface. `transition: all` is forbidden. Name the properties (`transition: opacity 120ms ease, transform 120ms ease`) so layout and paint do not animate together.
- Semantic structure precedes class names: `<nav>` / `<main>` / `<article>` first; utility classes second. Class soup over weak structure is slop.

Anti-slop charter (audit both sides):

Side A: slop tells (the AI-generic look):

- Purple-blue or purple-pink gradient: RLHF over-aligns to this; betrays self-generated palette.
- Inter alone as the type system: default of every template; no commitment, no contrast.
- Centered hero plus 3-column feature grid: the landing-page silhouette; reads as preset.
- Glassmorphism on every surface: translucence loses meaning when nothing is opaque.
- `rounded-lg` uniform on every element: radius without hierarchy is decoration, not signal.
- `shadow-md` uniform across the surface: elevation that conveys nothing.
- `transition: all`: animates layout, color, and transform together; jank guaranteed.
- `font-family: system-ui`: abdicates the type decision; reads as "did not pick".
- Default Tailwind palette (slate-500 / blue-500): the costume of "I used the framework defaults".
- Colored card borders to assert structure: borders are not the right tool for hierarchy.
- Emoji icons in production UI: accessibility hostile; locale-fragile; reads as draft.

Side B: overkill compensation (slop's louder cousin):

- Sprites on every empty pixel: decoration substituting for missing information density.
- Gradient on every section background: every section "important" means none are.
- Animation on every element entrance: motion budget is a budget; spend it once.
- Multi-paradigm mash (neo-brutalism shadow on a glass card on a Material 3 button): paradigm conflict reads as confusion, not eclecticism.
- Decorative noise compensating for a thin idea: when the surface earns its weight, restraint amplifies it.

## Failure and recovery
- Converged directions: if two or more directions read alike, do not pick from a thin field. Re-dispatch with sharpened, opposing constraints until contrast is real.
- Missing runtime: if the runtime is not identified before step 5 in implement mode, stop and ask; do not implement against an assumed runtime.
- Missing brief or target surface: stop and request the missing input rather than inferring a design from defaults.
- Token drift mid-build: a new spacing value, third type family, or hardcoded color appearing mid-build is a smell. Revert to the committed token set; do not patch around it.
- Audit failure: if the result triggers any Side A or Side B tell, or violates a cross-surface invariant, the done predicate does not hold. Fix the tell at its source; do not compensate with more decoration.
- Persist mode, proposal rejected: revise the design system and preview, then re-present. Do not persist an unapproved system.
- Persist mode, no approval within the session: leave DESIGN.md unchanged. Mark any produced artifacts unapproved; they are not the design source of truth.
- Partial result: never present an unaudited or half-implemented direction as done. State which steps are complete and which remain.

## Output
Implement mode: one picked direction plus a committed token set (color, type, space, radius, shadow, motion) in the runtime's native token system and implementation artifacts that reference those tokens, ordered frame → direction → tokens → implementation, passing the anti-slop charter and cross-surface invariants. Persist mode: DESIGN.md with the approved design system (tokens, primitives, application rules), CLAUDE.md pointers naming DESIGN.md as source of truth, and preview artifacts alongside, ordered frame → direction → tokens → preview → approval → persist, gated on user approval before any persistence.
