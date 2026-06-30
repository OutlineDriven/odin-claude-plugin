# HTML Rendering

This is a format-rendering reference — it describes how to render any artifact in HTML, independent of which skill is producing it.

It is paired with a section contract (`plan-sections.md`, `brainstorm-sections.md`, etc.) that describes *what* the artifact contains. This reference describes *how* HTML specifically presents it.

The HTML artifact is the *only* artifact the skill produces for that run — output mode is exclusive (markdown OR HTML, never both). Readers of the HTML artifact (`/work`, humans) use it directly. `/doc-review` is *not* currently an HTML consumer — its mutation mechanics are markdown-only, so the `/plan` step gates the doc-review pass to `OUTPUT_FORMAT=md` runs and skips it for HTML.

## Hard invariants

These hold regardless of which skill produced the artifact.

- **Single self-contained HTML5 file.** No companion `.css`, `.js`, or `.svg` files. CSS lives in `<style>`. SVG lives inline. Images are base64 data URIs or inline SVG. The one permitted exception is a `<link rel="stylesheet">` to a CDN webfont CSS endpoint (Google Fonts, Bunny Fonts, etc.), paired with an offline-readable fallback font stack.
- **All metadata appears as visible text — single source of truth.** The artifact's metadata (title, type, date, etc. — exact fields per-skill, defined in the section contract) renders as visible HTML elements. No hidden machine-readable copy: no `<script type="application/json">` frontmatter block, no `data-*` attribute mirror, and no `<meta name="created">` / `<meta name="origin">` in `<head>` duplicating visible values.

  The text-and-attribute redundancy in `<time datetime="2026-05-12">2026-05-12</time>` is acceptable because the attribute is a parser hint, not a hidden copy.
- **Stable IDs as anchor IDs AND visible text.** every ID-bearing item (R-IDs, U-IDs, A-IDs, F-IDs, AE-IDs, KTDs) gets `id="r1"` on its element AND appears as visible text inside the element.
- **Source / composition signal.** A visible footer at the bottom names the composition timestamp and the source identifier (the user prompt context, the upstream brainstorm doc when one exists, or just the composing skill name when there is no external source). Example: `<footer class="composition-signal">Composed 2026-05-17T14:23Z by /plan from <code>docs/plans/...-requirements.md</code></footer>`.
- **ASCII identifiers.** Class names, element IDs, data attribute names are ASCII-only.
- **ODIN plan navigation.** ODIN plan artifacts include a visible navigation region near the top linking to stable section anchors for `goal-capsule`, `odin-spec-outline`, `planning-outline`, `implementation-units`, `verification-contract`, `definition-of-done`, and `appendix` when those sections exist. Requirements-only artifacts omit links to absent implementation sections.
- **Visible readiness metadata.** If the artifact has `artifact_contract`, `artifact_readiness`, `source`, or `execution`, render those values in the visible header metadata.

## Precedence stack for style preferences

Honor user style preferences in this order (highest to lowest):

1. **In-session conversation** — explicit direction the user gave this run.
2. **Preferred stylesheet reference** named in loaded agent-instruction context (typically `AGENTS.md` / `CLAUDE.md`, but scan loaded context; do not enumerate locations). The reference may be a file path, a URL, a named library, or a style brand. Agent-instruction files carry deliberate agent-aware preferences, so this tier sits above `DESIGN.md`.
3. **`DESIGN.md` discovered on the filesystem** (see "DESIGN.md discovery" below).
4. **Fallback default** — the palette / typography choices the agent makes when no preference exists.

### Active-recall at compose time

Before writing the CSS, scan loaded context for any stylesheet reference the user has indicated for documents like this. If found and inlinable (short local file, fetchable URL within budget), inline it into `<style>`. If found but not inlinable (large framework, paywalled stylesheet, named system without a fetchable source), compose CSS in its spirit. Only fall back to the default style when no preference signal exists.

The single-file invariant is preserved either way. External `<link rel="stylesheet">` is permitted only for CDN webfont CSS (with offline fallback); never link to an external stylesheet carrying layout, color, or typography rules the doc cannot read offline.

### DESIGN.md discovery

When tier 3 applies, look for `DESIGN.md` in these locations, first match wins:

1. Worktree root (resolve via `git rev-parse --show-toplevel`).
2. `docs/DESIGN.md`.

Read once at compose time. Absent → fall through to the fallback default.

Worktree-root only — do not fall through to a main checkout.

**DESIGN.md is a partial override, not all-or-nothing.** Take the brand's scale-independent identity literally, own the scale-dependent layout values yourself, and skip decoration.

- **Take literally (scale-independent identity):** color palette (under the contrast rule), font *weight* and *style*, OpenType features, radius *character* (sharp vs rounded).
- **Own it yourself (scale-dependent layout):** type size scale and spacing magnitudes. DESIGN.md values are almost always product/marketing-scaled; read them only as hierarchy, then set doc-appropriate values (body ~14-16px, headings ~1.2-1.6× body).
- **Skip decoration:** gradient orbs, full-bleed hero photography, motion. Take the palette and feel; do not reproduce the decoration.

Specific cases:

- **Fonts: load only open webfonts; never attempt a proprietary brand face.** A self-contained doc can only load an open webfont via the permitted webfont `<link>` plus an offline fallback stack. Assume a bespoke brand face is proprietary and do not attempt to load it. Load a named face only when it is a known open webfont (Inter, Geist, Cal Sans, Roboto…). Honor the DESIGN.md's declared roles (`body` / `display` / `mono`) and never promote a display/decorative face into a body or small-text role.
- **Typography-scale mismatch.** When the size scale looks product-scaled (the common case), use the **family**, **weight**, and **OpenType feature** assignments and pick the agent's own size scale. Apply DESIGN.md sizes literally only when clearly doc-scaled.
- **Scope mismatch (product UI vs doc surface).** A DESIGN.md aimed at product marketing or app UI may name button states, input borders, or hero backgrounds tied to *that* surface, not a generic doc. A reading canvas transfers literally and should be the doc background; a bright product/marketing-hero surface does not — extract the principle rather than the literal value.
- **Partial coverage.** When DESIGN.md defines some categories but not others, use it for what it covers and the fallback default for the rest.

## Format principles

### Readable measure, not full bleed

Long-form text is unreadable at full viewport width — past ~80 characters per line the eye loses the return sweep. As a fallback default, center the document in a content container and hold prose to a comfortable measure.

- **Page container.** A centered column with max-width in the ~820-960px band (`margin-inline: auto`) keeps the doc off the far edges of wide monitors.
- **Prose measure.** Hold running paragraphs to roughly 65-80 characters (`max-width: ~70ch` on text blocks).
- **Let wide content break out.** Tables, diagrams, and side-by-side columns may use the full container width when the content needs it.

Express the constraint in `ch`/`rem` rather than a single hardcoded pixel value so it survives font-size and DESIGN.md overrides.

### Markdown source is content, not design

When markdown (or markdown-shaped chat context) is part of the input, use it for semantic content — what the doc is about, what sections exist, what facts each section establishes. Do NOT treat its bullet-vs-table presentation choices as authoritative; re-choose the rendering per content shape in HTML's richer affordance space.

### Prose is authoritative

When a visualization disagrees with the surrounding prose, the prose governs. If they diverge, the visualization is wrong.

### Hyperlink the reference index

When the doc has a Sources & References (or equivalent reference-index) section, hyperlink each entry to its canonical destination.

Resolve the repo's GitHub URL once at compose time:

```bash
git remote get-url origin
```

Apply linking to three reference shapes:

- **Repo-relative code/doc paths** (`services/foo.ts`, `docs/solutions/bar.md`) → `<repo-url>/blob/main/<path>`.
- **Named GitHub PRs/issues** (`PR #636`, `issue #1048`) → `<repo-url>/pull/636` or `<repo-url>/issues/1048`.
- **Named external trackers** (Linear `ESP-1705`, Jira `PROJ-123`) → link only when the workspace URL is established in loaded context; otherwise leave as text.

**Do not invent URLs.** If `origin` is not a GitHub URL and the equivalent main-tree URL pattern is not obvious, leave entries as `<code>` text. A broken or guessed link is worse than no link.

**Scope: reference index only, not inline prose.** Inline `<code>` mentions of paths or PRs inside paragraph prose stay as code or text.

### Stable section anchors for ODIN plans

When rendering an ODIN plan, every major logical section gets a stable anchor ID and visible heading text:

| Logical section | Required id |
|---|---|
| Goal Capsule | `goal-capsule` |
| ODIN spec outline | `odin-spec-outline` |
| Product Requirements | `odin-spec-requirements` |
| Planning Outline | `planning-outline` |
| Implementation Units | `implementation-units` |
| Verification Contract | `verification-contract` |
| Definition of Done | `definition-of-done` |
| Appendix | `appendix` |

Long HTML plans are consumed as source text as often as they are read in a browser. Keep heading text visible and adjacent to the `id`.

### Text contrast is local

every text-on-background pairing must hold up on its own. A color that works for prose on the page background does not automatically work for a small label inside a tinted container. Test by reading each filled shape's labels at the rendered scale.

### Body bold not colored by default

Reserve accent text color for status chips, ID chips, links, and section borders. Do NOT color `<strong>` in body content by default. CSS should leave `strong` at `color: inherit` unless a specific surface (status pill, ID chip) is being styled.

### Chips and pills: uniform shape, no one-sided accent

Status chips, ID chips, and metric pills in the same row share one shape — same border-radius, border weight, and fill treatment. Differentiate categories only by the chip's overall fill/text color (applied to the whole pill), never by an accent on one edge.

### No JS framework runtimes

A small inline `<script>` for active-section TOC tracking or anchor-permalink behavior is acceptable. React, Vue, Svelte, or any framework runtime is not.

## Section anatomy

How section types commonly render in HTML. These are patterns, not contracts.

- **Summary / Problem Frame** — semantic `<section>` with prose paragraphs. Optionally precede with an eyebrow label.
- **Requirements** — `<table>` is the default at 5+ uniform items; bullets at smaller counts. Concern-grouping takes precedence: group under bold inline headers (or per-group sections) first, then apply the 5+ table default *within* each group. Each row has the R-ID as visible text in its own column.
- **Implementation Units** — repeating `<article>` cards with a stable ID chip, a metadata strip (`<dl>` with field labels and values), and secondary content inside `<details>` collapsibles, **default-closed**. At 3+ units the default-closed rule is load-bearing. The metadata strip is for *descriptive* fields; a *directive* field (e.g., "start with a failing integration test") belongs in an advisory callout.
- **Key Technical Decisions** — repeating cards with the decision ID, bold decision title, and prose rationale. Flat cards, not collapsibles.
- **Risks** — cards with a color-coded status eyebrow and prose body.
- **Scope Boundaries** — callout cards distinguished by colored eyebrow/label plus subtle full-card tint.

The agent picks more elaborate or simpler shapes based on content.

## Diagrams

When the section contract calls for a diagram (architecture, sequence, flowchart, state machine, swim lane, data-flow, quantitative comparison), HTML renders it as **inline SVG**. The agent picks the shape that conveys the content fastest.

**Conceptual diagrams are not wireframes.** The wireframe affordance below is scoped to *UI-shaped requirements*; a data model, sync protocol, or agent workflow earns a conceptual diagram.

**Diagrams complement prose; they never replace it.** The IDed prose stays complete and standalone — a reader who ignores every diagram still gets the full content in text, and a text-reading downstream agent is never left with a relationship that exists only in the picture.

### Layout legibility for hand-authored SVG

Before emitting, trace each labeled arrow, shape edge, and text label:

- **No stroke passes through a text label.** If an arrow or border crosses a label's bounding box, re-route the arrow, move the label, or apply `paint-order: stroke fill` with a stroke color matching the background to halo the label.
- **Labels inside skewed or rotated shapes sit in the shape's true interior.** Account for skew/rotation offset, or place the label outside with a short leader.
- **Arrow labels sit adjacent to the arrow's midpoint.** A label floating at the diagram's edge is broken.
- **Avoid long curves traversing the diagram.** Prefer reordering boxes or numbered step badges.
- **Differentiate diagram shapes by geometry first, fill semantics second.** Geometry (diamond = decision, rect = step, oval = start/end, parallelogram = data) carries role unambiguously.

### Plan architecture diagrams are not directional sketches

Do not add hedging captions or section preambles to plan SVG diagrams. Plan diagrams render authoritative content; hedging language is reserved for the wireframe affordance below.

## Wireframe mockups (requirements docs only)

When a brainstorm requirement describes a user-facing visual surface, the HTML rendering may include a wireframe mockup. The trigger is the **requirement**, not the document.

When a wireframe is included:

- **Fidelity ceiling: wireframe, not mockup.** Gray boxes for layout regions, text labels for content placeholders, intentional placeholder copy (`[Product name]`, `[CTA label]`, `[user avatar]`). No pixel-perfect colors, typography, component-library references.
- **Static only.** Inline SVG or simple HTML/CSS for layout. No JS interaction, working form fields, state changes, live data.
- **Anti-padding.** One wireframe per distinct visual concept.
- **Mandatory directional caption.** every wireframe carries a "directional, not the spec" note: *"Directional only — illustrates the intended user-facing shape. Exact colors, spacing, copy, and component choices are placeholders for review, not requirements."*

## Affordance idioms

Common HTML affordances the agent can reach for when content benefits:

- **Sticky TOC sidebar** — available when navigation will materially help and implementation is reliable. For most long docs, default-closed `<details>` on repeating cards already cuts visible scroll length enough.
- **Within-section sub-nav** for sections with 6+ repeating cards.
- **Eyebrow labels** (small-caps tag above section titles) for editorial polish.
- **Stats strip** at the top when the artifact has 3+ quantifiable signals.
- **`<details>` + `<summary>`** for collapsible secondary content inside repeating cards. All collapsibles start closed.
- **Side-by-side columns** for parallel content.
- **Tinted callout cards** for content that is "different in kind" — Deferred, Open Questions, advisory notes. Tint the whole card; avoid a colored stripe on one edge.

## Agent-consumability rules

Downstream agents that read HTML today (`/work`, a skill re-reading its own prior artifact, future consumers) reason over the HTML as text. These rules make that safe:

- **Use semantic HTML over `<div>` soup.** `<article>` per unit card, `<dl>` for metadata pairs, `<table>` for tabular content, `<details>` / `<summary>` for collapsibles, `<section>` for top-level doc sections.
- **Render field labels as visible text, not attributes.** Emit `<dt>GOAL</dt><dd>...</dd>`, not `<dd data-field="goal">...</dd>`.
- **Keep U-IDs, R-IDs, and similar as visible text** in headings and table cells, not only as `id=""` attributes.
- **Match section heading vocabulary to the section contract.** When the contract says "Implementation Units," the HTML heading is "Implementation Units" — not "How we'll build it."
- **All semantic content lives in actual HTML text.** No CSS `::before { content: "..." }` carrying meaning, no background images as content.
- **Stable structure is the public API.** Element types, ID/label scheme, and field-label vocabulary do not break across versions. Visual styling can change freely.

## Post-compose audit

Before returning the artifact, scan for common slips:

- Single self-contained file. No companion `.css` / `.js` / `.svg`.
- No hidden machine-readable metadata copy.
- All stable IDs appear as both `id=""` and visible text.
- Section heading vocabulary matches the section contract names.
- Source / composition signal is present as a visible footer.
- Repeating cards with 3+ instances put secondary content inside default-closed `<details>`.
- Within-section sub-nav is present for sections with 6+ repeating cards.
- Body `<strong>` is not colored with accent palette.
- No one-edge colored accent on chips, pills, or callout cards.
- `<details>` inside repeating cards have no `open` attribute.
- Diagram labels are legible — no arrow paths crossing text.
- Diagrams complement prose, not replace it.
- No JS framework runtimes included.
- Each heading level is visually distinct.
- No template placeholders leaked into output.
- No process exhaust callouts in the artifact.
