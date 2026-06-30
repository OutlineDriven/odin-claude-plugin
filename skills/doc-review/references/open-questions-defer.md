# Open Questions Deferral

This reference defines the Defer action's in-doc append mechanic. When the user chooses Defer on a finding (from the walk-through or from the bulk-preview Append-to-Open-Questions path), an entry for that finding appends to a `## Deferred / Open Questions` section at the end of the document under review.

Interactive mode only. Invoked by `references/walkthrough.md` (per-finding Defer option) and `references/bulk-preview.md` (routing option C Proceed).

---

## Append flow

### Step 1: Locate or create the Open Questions section

Scan the document for an existing `## Deferred / Open Questions` heading (case-sensitive match on the full heading text). Behavior by location:

- **Heading present at the end of the document (last `##`-level section):** append new content inside this section at the end.
- **Heading present mid-document (not the last `##`-level section):** still append inside the existing heading at that location. Do not create a duplicate at the end -- the user positioned the section deliberately.
- **Heading absent:** create `## Deferred / Open Questions` at the end of the document. If the document has a trailing horizontal-rule separator (`---`) or a trailing footer, insert the new section above it. If the document has only frontmatter and no body, create the section after the frontmatter block.

### Step 2: Locate or create the timestamped subsection

Within the Open Questions section, scan for a subsection heading matching the current review date: `### From YYYY-MM-DD review`. Behavior:

- **Subsection present:** append new entries to it. Multiple Defer actions within a single review session accumulate under the same subsection.
- **Subsection absent:** create `### From YYYY-MM-DD review` as the last subsection within the Open Questions section. Insert one blank line before the heading for readability.

Date format: ISO 8601 calendar date (`YYYY-MM-DD`).

### Step 3: Format and append the entry

Per deferred finding, append a reader-facing bullet-point entry:

```
- **{title}** -- {section} ({severity}, {reviewer}, confidence {confidence})

  {why_it_matters}
```

Fields come from the finding's schema:

- `{title}` -- the finding's title field
- `{section}` -- the finding's section field, unmodified
- `{severity}` -- P0 / P1 / P2 / P3
- `{reviewer}` -- the persona that produced the finding (after dedup, the persona with the highest confidence anchor; surface all co-flagging personas if multiple)
- `{confidence}` -- the integer anchor (`50`, `75`, or `100`)
- `{why_it_matters}` -- the full why_it_matters text

Do not include `suggested_fix` or the full `evidence` array in the appended entry. Those live in the review run artifact and do not belong in the document's Open Questions section.

### Step 4: Idempotence on compound-key collisions

If an entry with the same compound key already exists under the same `### From YYYY-MM-DD review` subsection, do not append a duplicate.

**Compound key for dedup:** `normalize(section) + normalize(title) + why_fingerprint`. All three reconstruct from the visible entry:

- `normalize(section)` and `normalize(title)` use the same normalization as synthesis step 3.3 dedup (lowercase, strip punctuation, collapse whitespace).
- `why_fingerprint` is the first ~120 characters of the entry's `{why_it_matters}` prose, word-boundary-preserving, with whitespace collapsed. When why_it_matters is empty, fall back to `normalize(section) + normalize(title)` alone.

Title-only dedup is not sufficient: two different findings can legitimately share a short title if their sections or rationale differ.

On collision, record the no-op in the completion report's Coverage section. Cross-subsection collisions (same compound key, different dates) are not deduplicated -- each review is allowed to re-raise the same concern.

---

## Concurrent edit safety

Document edits happen via the platform's edit tool using compare-and-swap (CAS) semantics. The orchestrator maintains an in-memory snapshot of the full document content.

**CAS invariant:** each append is expressed as an edit from the full last-accepted snapshot (old state) to the full post-append document (new state). The edit tool applies the mutation only if the on-disk content matches the snapshot at edit-time. If the on-disk content has changed since the snapshot was taken, the edit tool rejects -- this is the collision signal.

- **Initial snapshot:** taken from the document's content at the first read (Phase 1).
- **On successful append:** update the snapshot to the post-append document state.
- **On edit-tool rejection (mismatch):** the document was modified externally between snapshot and write. Abort the append and surface via the failure path below.

---

## Failure path

When the append cannot complete -- document is read-only on disk, path is invalid, the edit tool returns an error, concurrent-edit collision detected, or any other write failure -- surface the failure inline to the user:

**Stem:** `Couldn't append the finding to Open Questions. What should the agent do?`

**Options (exactly three; fixed order):**

```
A. Retry the append
B. Record the deferral in the completion report only (don't mutate the document)
C. Convert this finding to Skip
```

**Dispatch:**

- **A Retry** -- reread the document from disk to obtain a fresh snapshot. Recompute the target section location, subsection heading, and dedup key against the fresh content. Then issue a new CAS edit from the fresh snapshot to the post-append state. On repeated failure, loop back to the same sub-question.
- **B Record only** -- skip the document mutation; record the Deferred action in the completion report with a note that the append failed.
- **C Convert to Skip** -- record the finding as Skip with an explanatory reason ("append to Open Questions failed: <error>").

If the user does not respond to the sub-question (session ends, terminal disconnects), default to option B so the in-memory decision state stays consistent even if the document wasn't written.

---

## Upstream availability signal

The walk-through and bulk-preview check append-availability before offering Defer as an option. When the document is known-unwritable (e.g., initial read shows it's on a read-only filesystem), the orchestrator caches an `append_available: false` signal at Phase 4 start and Defer is suppressed in the walk-through menu and in the routing question's option C.

When append-availability is true at Phase 4 start but an individual append fails mid-flow, the failure path above handles the specific finding -- this does not flip the session-level cached signal.

---

## Example appended content

Starting document state:

```markdown
## Risks

...existing content...

## Deferred / Open Questions

### From 2026-04-10 review

- **Alias compatibility-theater concern** -- Risks (P1, scope-guardian, confidence 75)

  The alias exists without documented external consumers...

```

After appending two findings in a 2026-04-18 session:

```markdown
## Risks

...existing content...

## Deferred / Open Questions

### From 2026-04-10 review

- **Alias compatibility-theater concern** -- Risks (P1, scope-guardian, confidence 75)

  The alias exists without documented external consumers...

### From 2026-04-18 review

- **Unit 2/3 merge judgment call** -- Scope Boundaries (P2, scope-guardian, confidence 75)

  The two units update consumer sites that deploy together. Splitting
  adds dependency tracking without enabling independent delivery.

- **Strawman alternatives on migration strategy** -- Unit 3 Files (P2, coherence, confidence 75)

  The fix options list (a) through (c) as alternatives, but (b) and (c)
  are "accept the regression" framings that don't solve the problem the
  finding describes.
```
