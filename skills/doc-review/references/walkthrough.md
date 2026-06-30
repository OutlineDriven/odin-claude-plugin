# Per-finding Walk-through

This reference defines Interactive mode's per-finding walk-through -- the path the user enters by picking option A from the routing question, plus the unified completion report that every terminal path emits. The walk-through is fully read-only: decisions are recorded in the completion report, never applied to the reviewed document.

Interactive mode only.

---

## Routing question (the entry point)

After synthesis produces the remaining finding set, the orchestrator asks a four-option routing question before any walk-through or bulk action runs.

**Stem:** `What should the agent do with the remaining N findings?`

**Options (fixed order; no option is labeled `(recommended)` -- the routing choice is user-intent):**

```
A. Review each finding one by one -- accept the recommendation or choose another action
B. Auto-resolve with best judgment -- record per-finding decisions the agent can defend, surface the rest
C. Record all findings as deferred in the report and proceed
D. Report only -- take no further action
```

If all remaining findings are FYI-subsection-only (no `gated_auto` or `manual` findings at confidence anchor `75` or `100`), skip the routing question entirely and flow to the Phase 5 terminal question.

**Dispatch by selection:**

- **A** -- load this walk-through (per-finding loop). Accepted decisions accumulate in memory; Defer decisions are recorded via `references/open-questions-defer.md`; Skip decisions are recorded as no-action; `Auto-resolve with best judgment on the rest` routes through `references/bulk-preview.md`.
- **B** -- load `references/bulk-preview.md` scoped to every pending `gated_auto` / `manual` finding. On Proceed, record the decisions. On Cancel, return to the routing question.
- **C** -- load `references/bulk-preview.md` with every pending finding in the defer bucket. On Proceed, record all as deferred. On Cancel, return to the routing question.
- **D** -- do not enter any dispatch phase. Emit the completion report and flow to Phase 5 terminal question.

---

## Entry (walk-through mode)

The walk-through receives, from the orchestrator:

- The merged findings list in severity order (P0 -> P1 -> P2 -> P3), filtered to actionable findings (confidence anchor `75` or `100` with `autofix_class` `gated_auto` or `manual`). FYI-subsection findings (anchor `50`) are not included -- they surface in the final report only.
- Premise-dependency chain annotations from synthesis step 3.5c: each finding may carry `depends_on: <root_id>` or `dependents: [<ids>]`.

Each finding's recommended action has already been normalized by synthesis step 3.5b -- the walk-through surfaces that recommendation and does not recompute it.

**Root-first iteration order.** When a finding has `dependents`, iterate it before any of its dependents regardless of severity order within the chain.

**Cascading root decisions.** When the user picks Skip or Defer on a finding with `dependents`:

1. Announce the cascade: "Skipping/Deferring this root will auto-resolve N dependent finding(s): {titles}. Continue?"
2. Offer two options: `Cascade -- apply same action to all dependents` (recommended) and `Decide each dependent individually`.
3. On Cascade: record the root's action for every dependent and skip those findings' walk-through entries.
4. On Individual: proceed normally -- dependents each get their own walk-through entry.

When the user picks Accept on a root, do NOT cascade -- the premise held, so dependents each need their own decision.

**Orphaned dependents.** If a dependent's root was rejected in a prior round and the root is suppressed this round (per R29), treat the dependent as a standalone finding.

---

## Per-finding presentation

Each finding is presented in two parts: a terminal output block carrying the explanation, and a question carrying the decision.

### Terminal output block (print before the question)

```
## Finding {N} of {M} -- {severity} {plain-English title}

Section: {section}

**What's wrong**

{plain-English problem statement from why_it_matters}

**Proposed fix**

{suggested_fix -- rendered as prose describing intent}

**Why it works**

{short reasoning, grounded in a pattern cited in the document or codebase}

{Conflict-context line, when applicable}
```

Substitutions:

- **`{plain-English title}`** -- a 3-8 word summary. Derived from the merged finding's `title` field but rephrased as observable consequence.
- **`{section}`** -- from the finding's `section` field.
- **`why_it_matters`** -- rendered as-is.
- **`suggested_fix`** -- render as prose describing intent. At most 2 inline backtick spans per sentence. No diff blocks.
- **`Why it works`** -- grounded reasoning. One to three sentences.
- **`{Conflict-context line}`** -- when contributing personas implied different actions and synthesis broke the tie.

### Question stem (short, decision-focused)

```
Finding {N} of {M} -- {severity} {short handle}.
{Action framing in a phrase}?
```

Never enumerate alternatives in the stem. One recommendation as a yes/no.

### Confirmation between findings

After the user answers and before printing the next finding, emit a one-line confirmation: `-> Accepted.`, `-> Deferred.`, or `-> Skipped.`

### Options (four; adapted as noted)

```
A. Accept the recommendation  (recommended)
B. Defer -- record for later resolution
C. Skip -- don't record, don't accept
D. Auto-resolve with best judgment on the rest
```

**Mark the post-tie-break recommendation with `(recommended)` on its option label.** Only A, B, or C can carry it. D is a workflow shortcut, never marked recommended.

### Adaptations

- **N=1:** the heading omits `Finding N of M`. Option D is suppressed -- the menu shows three options: Accept / Defer / Skip.

---

## Per-finding routing

For each finding's answer:

- **Accept the recommendation** -- add the finding's id to an in-memory Accepted set. **No-fix guard:** if the merged finding has no `suggested_fix`, Accept is not executable for a concrete fix. Surface the no-fix sub-question below.
- **Defer** -- record the finding as deferred via `references/open-questions-defer.md`. Advance.
- **Skip** -- record in decision list. Advance. No side effects.
- **Auto-resolve with best judgment on the rest** -- exit the walk-through loop. Dispatch `references/bulk-preview.md`, scoped to the current finding and everything not yet decided.

### No-fix sub-question (Accept picked on a finding with no `suggested_fix`)

This fires only after the user picks Accept on a finding whose merged record has no `suggested_fix`.

**Stem:** `Accept isn't executable for this finding -- the review surfaced the issue without a concrete fix. How should the agent proceed?`

**Options (fixed order):**

```
A. Defer for later resolution  (recommended)
B. Skip -- don't record
C. Acknowledge -- record the decision, no concrete fix applied
```

**Routing:**

- **A. Defer** -- record as deferred via `references/open-questions-defer.md`.
- **B. Skip** -- record Skip. Advance. No side effects.
- **C. Acknowledge** -- record as `acknowledged`. Advance. The completion report surfaces Acknowledged as its own dedicated bucket.

---

## Override rule

"Override" means the user picks a different preset action. No inline freeform custom-fix authoring -- the walk-through is a decision loop, not a pair-editing surface. A user who wants a variant picks Skip and edits outside the flow.

---

## State

Walk-through state is **in-memory only**. The orchestrator maintains:

- An Accepted set (finding ids the user accepted the recommendation on)
- A decision list (every answered finding with its action and metadata)
- The current position in the findings list

Nothing is written to disk per-decision. An interrupted walk-through discards all in-memory state. No document changes occur at any point during the walk-through.

---

## End-of-walk-through recording

After the loop terminates, emit the unified completion report containing all recorded decisions. No document edits are dispatched -- the walk-through is a decision-recording loop, not a mutation surface.

1. **Accepted set:** findings where the user accepted the recommendation. Recorded in the report as accepted.
2. **Defer set:** findings deferred by the user. Recorded in the report's deferred section via `references/open-questions-defer.md`.
3. **Skip:** no-action findings. Recorded in the report as skipped.

After recording completes, emit the unified completion report.

---

## Unified completion report

Every terminal path of Interactive mode emits the same completion report structure.

### Minimum required fields

- **Per-finding entries:** title, severity, action taken (Accepted / Deferred / Skipped / Acknowledged). Reason is optional -- when available, drawn from the finding's `why_it_matters` or the user's provided rationale; when not, omitted.
- **Summary counts by action:** totals per bucket. Include an `acknowledged` count when any entries land in that bucket; omit when zero.
- **End-of-review verdict.**

### Report ordering

Per-finding entries grouped by action bucket in order `Accepted / Deferred / Skipped / Acknowledged`, then summary counts, then Coverage, then the verdict. Omit any bucket whose count is zero.

### Zero-findings degenerate case

When the routing question was skipped because no actionable findings remained:

No FYI or residual concerns:
```
All findings resolved -- 3 decisions recorded.

Verdict: Ready.
```

FYI or residual concerns remain:
```
All actionable findings resolved -- 3 decisions recorded. (2 FYI observations, 1 residual concern remain in the report.)

Verdict: Ready.
```

---

## Execution posture

The walk-through is fully read-only with respect to the project. The orchestrator maintains in-memory state (Accepted set, decision list) and emits a completion report. Persona agents remain strictly read-only. No document edits occur at any point.
