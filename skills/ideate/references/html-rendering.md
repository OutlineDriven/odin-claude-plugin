# `ideate` HTML view — render `docs/ideation/<slug>.md` for human reading

The opt-in rendering reference for `ideate`. The skill is markdown-default: `docs/ideation/<slug>.md` is written every run and is the canonical surface. The `format:html` flag renders a second file, `docs/ideation/<slug>.html`, as a human-reading **view derived from that markdown**. Read this file only when a run carries `format:html`.

## When to render HTML

- The user passed `format:html`, asked for an HTML view, or wants to skim/share the ideation doc outside an editor.
- Otherwise don't. The default is markdown; an HTML view nobody asked for is surface no one reads.

The markdown is the source of truth. The `askme` handoff and the repo's decision record read the markdown, not the HTML. The HTML never carries a survivor, rejection, or cite the markdown lacks — it presents the same content, generated after the markdown is written and read back.

## Hard invariants

- **Derived, never authored.** Render from the just-written markdown. If the two disagree, the markdown is right — regenerate the HTML; never hand-patch content into the HTML that isn't in the markdown.
- **Single self-contained HTML5 file.** No companion `.css` / `.js` / `.svg`. CSS lives in `<style>`; any SVG is inline. The one permitted external link is a CDN webfont `<link rel="stylesheet">`, paired with an offline fallback font stack so the doc reads when the CDN is unreachable.
- **All content as visible text — one source of truth.** Subject, grounding cites, survivors, the rejected table, and the next step render as visible HTML. No hidden machine-readable mirror: no `<script type="application/json">` block, no `data-*` value mirror, no `<meta name="…">` duplicating the visible header.
- **ASCII identifiers.** Class names and element IDs are ASCII-only.
- **Composition footer.** A visible footer names the render timestamp and the source markdown path — e.g. `<footer>Rendered 2026-06-26 from docs/ideation/<slug>.md</footer>` — so a reader can tell how stale the view is.

## Section anatomy — maps 1:1 to the markdown

The markdown has a fixed shape (subject statement, `## Grounding`, `## Survivors`, `## Rejected`, `## Next step`). The HTML mirrors it section-for-section, and heading vocabulary matches the markdown so the doc stays greppable.

- **Subject** — `<h1>Ideation — <subject></h1>`, then the one-paragraph statement in a `<section>`.
- **Grounding** — `<section>` with the scan summary; keep every `file:line` cite as visible text.
- **Survivors** — one `<article>` per survivor: the idea as a heading, then a `<dl>` for Rationale / Evidence / Axis × frame. Flat cards a reader scans; reach for default-closed `<details>` only if a card's rationale runs long.
- **Rejected** — a `<table>`: Candidate | Rejection rationale, one row per loser. Losers stay visible and explained; never drop the table to "tidy" the view.
- **Next step** — `<section>` restating the `askme` handoff.

## Style — opinionated fallback, honored preferences win

Honor style preferences in order, highest first:

1. **In-session direction** the user gave this run.
2. **A stylesheet/brand reference** named in loaded agent-instruction context (`AGENTS.md` / `CLAUDE.md`). If inlinable, inline it into `<style>`; if not (large framework, proprietary face), compose CSS in its spirit. Load only open webfonts; never attempt a proprietary brand face.
3. **`DESIGN.md`** at the worktree root or `docs/DESIGN.md` (first match; read once). Take palette / font weight / radius character literally; own the type-size and spacing scale yourself — DESIGN.md values are usually product-scaled and too large for a long-form doc; skip decoration.
4. **Fallback default** — a centered column (~820–960px), prose held to ~70ch, body ~14–16px, a legible light or dark reading canvas.

The single-file invariant holds across all four tiers.

## No JS framework runtimes

A small inline `<script>` for anchor or TOC behavior is acceptable; React/Vue/Svelte or any framework bundle is not. An ideation doc is short — a static layout almost always suffices.

## Post-render audit

Before finishing, scan the HTML for:

- **Content parity** with the markdown — every survivor, every rejected row, every `file:line` cite present; nothing added the markdown lacks.
- **Single self-contained file** — no companion assets, no framework runtime.
- **No hidden metadata copy** — values live once, in visible text.
- **Composition footer** present (timestamp + source markdown path).
- **No template placeholders** (`<subject>`, `{slug}`) leaked into output.
