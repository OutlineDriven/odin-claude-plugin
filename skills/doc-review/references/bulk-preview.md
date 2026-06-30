# Bulk Action Preview

This reference defines the compact plan preview that Interactive mode shows before every bulk action -- best-judgment (routing option B), defer-in-report (routing option C), and the walk-through's `Auto-resolve with best judgment on the rest` (option D of the per-finding question). The preview gives the user a single-screen view of what the agent is about to record, with exactly two options to Proceed or Cancel.

Interactive mode only.

---

## When the preview fires

Three call sites:

1. **Routing option B (top-level best-judgment)** -- after the user picks `Auto-resolve with best judgment` from the routing question, but before any decisions are recorded. Scope: every pending `gated_auto` or `manual` finding at confidence anchor `75` or `100`.
2. **Routing option C (top-level defer-in-report)** -- after the user picks `Record all findings as deferred in the report and proceed` but before any recording runs. Scope: every pending `gated_auto` or `manual` finding at confidence anchor `75` or `100`. Every finding appears under `Deferring (N):` regardless of the agent's natural recommendation, because option C is batch-defer.
3. **Walk-through `Auto-resolve with best judgment on the rest`** -- after the user picks option D from a per-finding question, but before the remaining findings are resolved. Scope: the current finding and everything not yet decided. Already-decided findings from the walk-through are not included in the preview.

In all three cases the user confirms with `Proceed` or backs out with `Cancel`. No per-item decisions inside the preview -- per-item decisioning is the walk-through's role.

---

## Preview structure

The preview is grouped by the action the agent intends to take. Bucket headers appear only when their bucket is non-empty.

```
<Path label> -- <scope summary>:

Accepting (N):
  [P0] <section> -- <one-line plain-English summary>
  [P1] <section> -- <one-line plain-English summary>

Deferring (N):
  [P2] <section> -- <one-line plain-English summary>

Skipping (N):
  [P2] <section> -- <one-line plain-English summary>
```

Worked example for routing option B (top-level best-judgment):

```
Auto-resolve plan -- 8 findings:

Accepting (4):
  [P0] Requirements Trace -- Renumber R4 to match unit reference
  [P1] Unit 3 Files -- Add read-fallback for renamed report file
  [P2] Key Technical Decisions -- Use framework's Deprecated field rather than hand-rolling
  [P3] Overview -- Correct wrong count (says 6, list has 5)

Deferring (2):
  [P2] Scope Boundaries -- Unit 2/3 merge judgment call
  [P2] Risks -- Alias compatibility-theater concern

Skipping (2):
  [P2] Miscellaneous Notes -- Low-confidence style preference
  [P3] Abstraction Commentary -- Speculative, subjective
```

---

## Scope summary wording by path

- **Routing option B (top-level best-judgment):** header reads `Auto-resolve plan -- N findings:`.
- **Routing option C (top-level defer-in-report):** header reads `Defer plan -- N findings to report:`. Every finding lands in the `Deferring (N):` bucket.
- **Walk-through `Auto-resolve with best judgment on the rest`:** header reads `Auto-resolve plan -- N remaining findings (K already decided):`. Already-decided findings from the walk-through are not included in the preview or in the bucket counts.

---

## Per-finding line format

Each line uses a compressed form of the framing-quality guidance from the subagent template (observable-consequence-first, no internal section numbering unless needed to locate). The one-line summary is drawn from the persona-produced `why_it_matters` by taking the first sentence (and, when the first sentence is too long for the preview width, paraphrasing it tightly to fit).

- **Shape:** `[<severity>] <section> -- <one-line summary>`
- **Width target:** keep lines near 80 columns so the preview renders cleanly in narrow terminals. Truncate with ellipsis when necessary.
- **No section numbering** unless the reader needs it to locate the issue.

When no `why_it_matters` is available for a finding (rare -- only if persona output was malformed), fall back to the finding's title directly.

---

## Question and options

After the preview body is rendered, ask the user with exactly two options:

Stem (adapted to the path):

- For routing B: `The agent is about to record the decisions above. Proceed?`
- For routing C: `The agent is about to record the findings above as deferred. Proceed?`
- For walk-through `Auto-resolve with best judgment on the rest`: `The agent is about to record the remaining decisions above. Proceed?`

Options (exactly two, in all three cases):

- `Proceed` -- record the decisions as shown in the completion report
- `Cancel` -- do nothing, return to the originating question

---

## Cancel semantics

- **From routing option B Cancel:** return the user to the routing question (the four-option menu). Do not record any state.
- **From routing option C Cancel:** same -- return to the routing question, no side effects.
- **From walk-through `Auto-resolve with best judgment on the rest` Cancel:** return the user to the current finding's per-finding question (not to the routing question). The walk-through continues from where it was, with prior decisions intact.

In every case, `Cancel` changes no in-memory state.

---

## Proceed semantics

When the user picks `Proceed`:

- **Routing option B (top-level best-judgment):** for each finding in the plan, record the recommended decision. Accept findings go into the Accepted set for the completion report. Defer findings route through `references/open-questions-defer.md` for report recording. Skip findings are recorded as no-action. After all decisions are recorded, emit the unified completion report (see `walkthrough.md`).
- **Routing option C (top-level defer-in-report):** every finding routes through `references/open-questions-defer.md` for report recording as deferred. After all recordings complete, emit the unified completion report.
- **Walk-through `Auto-resolve with best judgment on the rest`:** same as routing option B, but scoped to the findings the user hadn't decided on. Accepted findings join the in-memory set with the ones the user already picked during the walk-through.

Failure during `Proceed` follows the failure path defined in `references/open-questions-defer.md` -- surface the failure inline with Retry / Convert to Skip, continue with the rest of the plan, and capture the failure in the completion report's failure section.

---

## Edge cases

- **Zero findings in a bucket:** omit the bucket header. A preview with only Accept and Skip does not show an empty `Deferring (0):` line.
- **All findings in one bucket:** preview still shows the bucket header; Proceed / Cancel still offered.
- **N=1 preview (only one finding in scope):** the preview still uses the grouped format, just with a single-line bucket. `Proceed` / `Cancel` still apply.
- **Walk-through `Auto-resolve with best judgment on the rest` with zero remaining findings:** the walk-through's own logic suppresses this option when N=1 and otherwise, so the preview should never be invoked with zero remaining findings. If it is, render `Auto-resolve plan -- 0 remaining findings` and fall through to Proceed with no-op.
