# Ideation Sections

This is the section contract for the ideation artifact — it describes *what* a persisted ideation document contains. It defines the markdown structure that `docs/ideation/<slug>.md` follows.

## What the artifact contains

An ideation artifact is a ranked, critiqued candidate set, the grounding the candidates were qualified against, and a record of what was cut. It is a human-facing discovery document, not a requirements doc or plan — keep it about the ideas and their basis, not implementation.

### Metadata

- **date** — composition date (YYYY-MM-DD).
- **topic** — kebab-case topic slug.
- **focus** — the focus hint, when one was given. Omit when open-ended.

Markdown renders metadata as YAML frontmatter at the top of the file.

**No status field — not on the doc, not per idea.** An ideation doc is a point-in-time discovery artifact, not a tracked work item: it carries no `active -> completed` lifecycle and no per-idea "explored" marker. Tracking mutable workflow progress inside the artifact would create a second source of truth that drifts — whether an idea was later pursued is knowable from downstream artifacts (a plan that picked it up), so it is not duplicated here.

### Grounding Context

The Phase 1 grounding summary the ideas were qualified against.

### Topic Axes (conditional)

The 3-5 axes from Phase 1.5, one per line. When Phase 1.5 was skipped, a single line records why (`Decomposition skipped — atomic subject`). Omit the section entirely when not applicable.

### Ranked Ideas

The surviving candidates, ranked. Each idea carries:

- **title**
- **description** — concrete explanation.
- **axis** — the topic axis this idea targets. Omit when decomposition was skipped.
- **basis** — tagged `direct:` (quoted evidence) / `external:` (named prior art) / `reasoned:` (written-out first-principles argument).
- **rationale** — how the basis connects to the move's significance.
- **downsides** — tradeoffs or costs.
- **confidence** — 0-100%.
- **complexity** — Low / Medium / High.

**Keep idea cards expanded.** Unlike plan Implementation Units, ideation idea cards are meant to be read in full to choose a direction — do not hide their substance behind collapsed sections. When the section is long, add a within-section jump-list of ranked titles at the top.

### Rejection Summary

A table of considered-and-cut ideas with a one-line reason each. When an axis ended with zero survivors despite recovery, record it as its own row so the coverage gap is visible rather than silently absent.

## Markdown skeleton

The section shape for `docs/ideation/<slug>.md`. Omit clearly irrelevant fields only when necessary.

```markdown
---
date: YYYY-MM-DD
topic: <kebab-case-topic>
focus: <optional focus hint>
---

# Ideation: <Title>

## Grounding Context
[Grounding summary from Phase 1]

## Topic Axes
[3-5 axes from Phase 1.5, one per line, OR a single `Decomposition skipped — ...` line. Omit the section if not applicable.]

## Ranked Ideas

### 1. <Idea Title>
**Description:** [Concrete explanation]
**Axis:** [Topic axis this idea targets — omit when decomposition was skipped]
**Basis:** [`direct:` / `external:` / `reasoned:` — quoted, cited, or written-out argument]
**Rationale:** [How the basis connects to the move's significance]
**Downsides:** [Tradeoffs or costs]
**Confidence:** [0-100%]
**Complexity:** [Low / Medium / High]

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | <Idea> | <Reason rejected> |

[When applicable, append axis-coverage gaps as their own rows so the gap is visible:]
| - | axis: <name> | recovery skipped (cap reached) — no survivors on this axis |
```

## No process exhaust

Keep engineering-process metadata out of the artifact — no "captured at Phase X" notes, no skill-pointer "next steps", no italic provenance lines. The reader wants the ideas and their basis.
