# Defer Action — Report Recording

This reference defines the Defer action's recording mechanic. When the user chooses Defer on a finding (from the walk-through or from the bulk-preview defer-in-report path), the finding and its rationale are recorded in the completion report's deferred section. The reviewed document is never mutated.

Interactive mode only. Invoked by `references/walkthrough.md` (per-finding Defer option) and `references/bulk-preview.md` (routing option C Proceed).

---

## Recording flow

### Step 1: Record the deferred finding

Per deferred finding, record a structured entry in the in-memory deferred-findings list. Each entry carries:

- `{title}` -- the finding's title field
- `{section}` -- the finding's section field, unmodified
- `{severity}` -- P0 / P1 / P2 / P3
- `{reviewer}` -- the persona that produced the finding (after dedup, the persona with the highest confidence anchor; surface all co-flagging personas if multiple)
- `{confidence}` -- the integer anchor (`50`, `75`, or `100`)
- `{why_it_matters}` -- the full why_it_matters text
- `{reason}` -- the user-provided reason for deferring (if any), or the default rationale: "Deferred for later resolution"
- `{timestamp}` -- ISO 8601 datetime of the deferral decision

Do not include `suggested_fix` or the full `evidence` array in the deferred entry. The entry is a concern summary for the reader, not a full decision packet.

### Step 2: Idempotence on compound-key collisions

If an entry with the same compound key already exists in the deferred list, do not add a duplicate.

**Compound key for dedup:** `normalize(section) + normalize(title) + why_fingerprint`. All three reconstruct from the entry:

- `normalize(section)` and `normalize(title)` use the same normalization as synthesis dedup (lowercase, strip punctuation, collapse whitespace).
- `why_fingerprint` is the first ~120 characters of the entry's `{why_it_matters}` prose, word-boundary-preserving, with whitespace collapsed. When why_it_matters is empty, fall back to `normalize(section) + normalize(title)` alone.

On collision, record the no-op in the completion report's Coverage section so the user sees the duplicate was suppressed.

### Step 3: Render in completion report

Deferred findings appear in the completion report under the `Deferred` action bucket. Each entry renders as:

```
- **{title}** -- {section} ({severity}, {reviewer}, confidence {confidence})
  Reason: {reason}
  {why_it_matters}
```

---

## Failure handling

If recording fails (e.g., in-memory state lost due to session interruption), surface the failure to the user:

**Stem:** `Couldn't record the deferral. What should the agent do?`

**Options (exactly two; fixed order):**

```
A. Retry the recording
B. Convert this finding to Skip
```

- **A Retry** -- attempt recording again. On repeated failure, loop back to the same sub-question.
- **B Convert to Skip** -- record the finding as Skip with an explanatory reason ("deferral recording failed"). The finding is treated as no-action for the remainder of the session.

If the user does not respond (session ends, terminal disconnects), default to Skip so the in-memory decision state stays consistent.

---

## Example deferred entries in completion report

```
### Deferred

- **Unit 2/3 merge judgment call** -- Scope Boundaries (P2, scope-guardian, confidence 75)
  Reason: Genuine tradeoff requires team discussion
  The two units update consumer sites that deploy together. Splitting
  adds dependency tracking without enabling independent delivery.

- **Strawman alternatives on migration strategy** -- Unit 3 Files (P2, coherence, confidence 75)
  Reason: Multiple valid approaches, needs architectural decision
  The fix options list (a) through (c) as alternatives, but (b) and (c)
  are "accept the regression" framings that don't solve the problem the
  finding describes.
```
