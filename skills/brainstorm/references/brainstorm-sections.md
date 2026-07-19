# Brainstorm Sections

This reference describes what makes a great requirements-only plan artifact produced by `brainstorm`.
It does NOT prescribe how the doc looks on the page — rendering is handled by the format-specific references (`markdown-rendering.md`, `html-rendering.md`).

## The outcome

A great brainstorm produces the first version of the same plan artifact that `/plan` later enriches. It enables three audiences to act:

- **The planning agent** produces an implementation plan without inventing user behavior, scope boundaries, or success criteria.
- **The reviewer** sees the framing choices, distinguishes pinned from open, and catches scope gaps before planning.
- **The future reader** traces why the proposed thing matters, who it is for, and what success looks like.

Sections earn their place by serving one of these audiences. Omit padding.

## ODIN plan skeleton contract

New `brainstorm` outputs live under `docs/plans/` and use the plan artifact contract:

- **Path:** `docs/plans/YYYY-MM-DD-NNN-<type>-<topic>-plan.<md|html>`.
- **Restricted-write harness fallback:** `local://<topic-slug>-requirements.md`, carrying `intended_path` (a frontmatter key) that names the `docs/plans/` path above; markdown only, and never `local://<slug>-plan.md` (restricted harnesses reserve that for the execution-spec plan). It is a working draft, not persistence, until a writes-allowed session materializes it at that path.
- **`artifact_contract: odin-plan/v1`**.
- **`artifact_readiness: requirements-only`**.
- **`source: brainstorm`**.
- **`execution`** only when the brainstorm has enough signal to classify the eventual execution domain. For software features, use `execution: code`. For non-code deliverables, follow the universal-brainstorming route instead of pretending the artifact is executable code.

A requirements-only plan is kept **light and standalone-readable**. It includes:

- `## Goal Capsule` with objective, product authority, and open blockers.
- `## ODIN spec outline` containing the brainstorm sections below (rendered as `###` subsections).

Do **not** emit a `## Goal Launch Block` or `## Reader Index`. It also omits empty `Planning Outline`, `Implementation Units`, `Verification Contract`, and `Definition of Done` sections — empty placeholders make requirements-only docs look executable and waste downstream tokens. `/plan` adds those sections when it enriches the same file in place. The next step is conveyed by the Phase 4 handoff menu, not by a section in the doc.

## Decide whether a doc is warranted at all

Brainstorm dialogue does not always need a durable document.
Skip document creation when **both** hold:

- The user only needs brief alignment — no exploration produced novel scope, framing, or decisions worth preserving in IDed shape.
- Any durable decisions can flow naturally to later artifacts (`/plan`, the commit message, `docs/solutions/`) without a brainstorm doc as an intermediary.

The trigger for creating a doc is when the dialogue surfaced enough structural decisions, scope boundaries, or acceptance criteria that later work needs them in durable, IDed form.

**Stress test:** a brainstorm about a tiny bug fix where the user asks "fix this with a null check or with upstream validation?" and the agent confirms "upstream validation" does not need a brainstorm doc. The decision flows to `/plan` or directly to the commit message.

Conversely, a brainstorm about a multi-actor feature with contested scope and several behavioral conditions probably does need a doc.

## Match depth to content

When a doc IS warranted, depth matches what the dialogue produced. A brainstorm with sparse content produces a sparse doc; rich content produces a rich doc. Do not add ceremony to make a slim brainstorm look substantial.

## Prose economy

Hold every kept section to these rules:

- **Lead with the decision or outcome.** Put the conclusion first, then the reason, then background.
- **One idea per sentence.** If a sentence needs a second parenthetical to stay true, split it.
- **A requirement is one sentence of intent plus at most one qualifier.** When a requirement would specify two outcomes, state the intent and send the fork to Outstanding Questions.
- **Cut hedges and intensifiers.** "Critically", "deliberately", "explicitly", "genuinely", "actually", "simply" carry nothing a downstream agent acts on.
- **Prefer the verb to the nominalization.** "Demote the grid", not "the demotion of the grid is the deliberate change."

Precision is not padding: keep IDs, dates, actor names, domain terms, conditionals, and exact thresholds verbatim.

**Resolve in place; do not stratify.** When a later decision answers a parked question or supersedes earlier text, rewrite or remove the original entry — do not append a separate "resolutions" layer.

**Named test, run before the doc is declared written:** could a reader find a contradiction in each section in one pass?

## ODIN spec outline hard floor

When a requirements-only plan is warranted, these are present inside `## ODIN spec outline` (as `###` subsections):

- **Summary** — what is being proposed, in 1-3 lines. Forward-looking.
- **Requirements** (with stable R-IDs) — what must be true about the proposed thing. For very sparse brainstorms (≤3 simple items where the bullets ARE the summary), plain bullets without IDs are acceptable. When requirements span distinct concerns, group them under bold inline headers within the Requirements section — group by capability or concern, not by discussion order. R-IDs stay continuous across groups.

## Include when material

The agent decides per brainstorm whether each section carries information not covered elsewhere. Filling a section with placeholder prose is worse than omitting it.

- **Problem Frame** — include when motivation is not obvious from Summary alone (the *why* needs paragraphs, not a sentence). Backward-looking / situational. Does NOT restate the proposal.
- **Key Decisions** — include when the brainstorm produced opinionated framing choices that constrain Requirements / Flows / Scope below.
- **Actors** — include when the proposed thing has multi-party behavior.
- **Key Flows** — include when the proposed thing has multi-step behavior. Expected by default for behavioral brainstorms unless the thing is genuinely non-flow-shaped.
- **Visualizations** — include when a concept has a **structure worth showing**, and that decision turns on whether the structure exists, not on whether prose reads clearly. Shapes that warrant one: data-shape transformation, source-of-truth fan-out, state-or-lifecycle logic, multi-step flow, entity/relationship structure, decision boundary, quantitative comparison — and for any requirement that changes a UI, screen layout, component placement, or screen flow, a **wireframe**. Match the visual to the shape. A point with nothing structural to show gets no visual.
- **Acceptance Examples** — include when any requirement has a state-dependent or conditional shape where prose alone leaves ambiguity.
- **Success Criteria** — include when there are quality / metric / handoff signals that Requirements do not already carry.
- **Scope Boundaries** — include when scope is contested or there are tempting non-goals worth naming.
- **Dependencies / Assumptions** — include when material upstream dependencies exist or load-bearing assumptions need surfacing.
- **Outstanding Questions** — include when there are unresolved items. Distinguish "Resolve Before Planning" from "Deferred to Planning."
- **Sources / Research** — surface research that orients the planner or justifies framing choices. Process exhaust (reading the user's prompt, glancing at obvious files) → omit.

## Agent agency

The catalog is a floor, not a ceiling. When the brainstorm's content does not fit any catalog section, introduce a new one.

The agent also picks per artifact:

- Whether Acceptance Examples render as a separate section or embed in each requirement.
- How much depth each present section gets.

## Brainstorm metadata fields

every requirements-only plan carries stable metadata fields. In markdown these fields appear as YAML frontmatter; in HTML they appear as visible header text.

### Required

- **`title`** — descriptive name with a ` - Plan` suffix, matching the H1 (markdown) or document `<h1>` (HTML). No conventional-commit prefix in the title — the `type` field carries that.
- **`type`** — conventional-commit-prefix-aligned classification (`feat`, `fix`, `refactor`, `docs`, etc.).
- **`date`** — creation date in ISO 8601 (`YYYY-MM-DD`). Used in the filename.
- **`topic`** — kebab-case slug identifying the brainstorm subject. Used in the filename and as the resume-detection key.
- **`artifact_contract`** — always `odin-plan/v1` for new outputs.
- **`artifact_readiness`** — always `requirements-only` for new `brainstorm` outputs.
- **`source`** — always `brainstorm`.

### No status field

Plan artifacts have no `status` field and no `active → completed` lifecycle. `artifact_readiness` is document completeness, not execution progress. Whether work shipped is derived from git, not stored in the doc.

### Field-name stability

Field names are stable across brainstorm revisions — never rename or repurpose a field. Agents composing new brainstorms MUST use these exact names.

## ID and content rules

- **Stable IDs.** R-IDs (Requirements), A-IDs (Actors), F-IDs (Flows), AE-IDs (Acceptance Examples). No other ID namespaces.
- **Plain prefix.** `R1.`, `A1.`, `F1.`, `AE1.` as bullet prefixes. Do not bold.
- **Bold leader labels** inside Flows and Acceptance Examples (`**Trigger:**`, `**Covers R4, R8.**`).
- **Repo-relative paths.** Always. Never absolute paths.
- **No process exhaust.** No "captured at Phase X" notes, no `## Next Steps` pointing to `/plan`, no italic provenance lines.
- **No implementation details by default.** Libraries, schemas, endpoints, file layouts, code structure stay out unless the brainstorm is itself inherently technical or architectural.

## Discipline: Summary vs Problem Frame

Inside `## ODIN spec outline`, `### Summary` and `### Problem Frame` serve distinct purposes:

| Section | Question it answers | Time direction | Length |
|---|---|---|---|
| `### Summary` | What is this doc proposing? | Forward-looking | 1-3 lines |
| `### Problem Frame` | Why does this proposal exist? | Backward-looking / situational | Paragraphs |

- **Summary does not need problem context.** A reader scanning Summary gets the proposal at a glance.
- **Problem Frame does not restate the proposal.** It establishes the situation, the specific moment of pain, and the cost shape — then stops.

## Rendering

The format-specific references describe how to render these sections in each output format:

- **Markdown rendering:** `references/markdown-rendering.md`
- **HTML rendering:** `references/html-rendering.md`

The brainstorm is written in one format — markdown OR HTML, never both.
