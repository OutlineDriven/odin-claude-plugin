# Phases 3-5: Synthesis, Presentation, and Next Action

## Phase 3: Synthesize Findings

Process findings from all agents through this pipeline. Order matters -- each step depends on the previous. The pipeline implements the finding-lifecycle state machine: **Raised -> (Confidence Gate | FYI-eligible | Dropped) -> Deduplicated -> Classified -> SafeAuto | GatedAuto | Manual | FYI**. Re-evaluate state at each step boundary; do not carry forward assumptions from earlier steps as prose-level shortcuts.

### 3.1 Validate

Check each agent's returned JSON against the findings schema:

- Drop findings missing any required field defined in the schema
- Drop findings with invalid enum values
- Note the agent name for any malformed output in the Coverage section

**Do not narrate remap / validation diagnostics to the user.** Schema-drift notes ("persona X returned unknown enum Y, remapped to Z"), persona-prompt-drift commentary, and other validator-internal diagnostics are maintainer-facing information. They do not belong in the Phase 4 output the user reads. If a persona's output is malformed, the only user-visible consequence is a Coverage-row annotation (e.g., the persona shows fewer findings or a `malformed` marker). Everything else stays internal.

### 3.2 Confidence Gate (Anchor-Based)

Gate findings by their `confidence` anchor value. Anchors are discrete integers (`0`, `25`, `50`, `75`, `100`) with behavioral definitions documented in `references/findings-schema.json` and embedded in the persona rubric (`references/subagent-template.md`).

| Anchor | Meaning | Route |
|--------|---------|-------|
| `0`    | False positive or pre-existing issue | Drop silently |
| `25`   | Might be real but could not verify | Drop silently |
| `50`   | Verified real but nitpick / advisory / not very important | Surface in FYI subsection |
| `75`   | Double-checked, will hit in practice, directly impacts correctness | Enter actionable tier (classify by `autofix_class`) |
| `100`  | Evidence directly confirms; will happen frequently | Enter actionable tier (classify by `autofix_class`) |

- **Dropped silently** (anchors `0` and `25`): these do not surface in any output bucket -- not as findings, not as FYI observations, not as residual concerns. Record the total drop count as a Coverage footnote line when non-zero: `Dropped: N (anchors 0/25 suppressed)`. The footnote appears below the Coverage table, alongside the `Chains:` footnote when both apply. Omit the footnote when N is zero.
- **FYI-subsection** (anchor `50`): stays in the working set through 3.3 dedup and 3.4 cross-persona promotion. If promoted to `75` by corroboration, enters the actionable tier; if not promoted, routes to the FYI subsection regardless of `autofix_class`. These do not enter the walk-through or any bulk action -- observational value without forcing a decision. Advisory observations ("nothing breaks, but...") naturally land here.
- **Actionable** (anchors `75` and `100`): enter the classification pipeline. Route by `autofix_class` (see 3.10).

**Why this threshold, not a higher one:** Document review has opposite economics from code review. There is no linter backstop -- the review IS the backstop. Premise-level concerns (product, adversarial) naturally cap at anchors 50-75 because "is the motivation valid?" cannot be verified against ground truth. The routing menu already makes dismissal cheap (Skip, Append to Open Questions), so surfaced-and-skipped is a low-cost outcome while missed-and-shipped derails downstream implementation. Filter low (`>= 50`) and let the routing menu handle volume.

### 3.3 Deduplicate

Fingerprint each finding using `normalize(section) + normalize(title)`. Normalization: lowercase, strip punctuation, collapse whitespace.

When fingerprints match across personas:

- If the findings recommend opposing actions (e.g., one says cut, the other says keep), do not merge -- preserve both for contradiction resolution in 3.5
- Otherwise merge: keep the highest severity, keep the highest confidence anchor (if tied, keep the finding appearing first in document order -- deterministic, not probabilistic), union all evidence arrays, note all agreeing reviewers (e.g., "coherence, feasibility")
- **Coverage attribution:** Attribute the merged finding to the persona with the highest confidence anchor. If anchors tie, attribute to the persona whose entry appeared first in document order. Decrement the losing persona's Findings count and the corresponding route bucket so totals stay exact.

### 3.3b Same-Persona Premise Redundancy Collapse

A single persona sometimes files multiple findings that share the same root premise expressed at different sections or wrapped in different framing. Cross-persona dedup (3.3) does not catch this -- it fingerprints on section+title, which differ even when the underlying concern is the same. Surfacing all N variants over-weights one persona's perspective relative to the others and inflates the P2 Decisions tier with near-duplicate signal.

For each persona, cluster that persona's surviving findings by shared root premise. A cluster forms when 3 or more findings from the same persona share:

- The same `finding_type` (error or omission)
- Substantially overlapping `why_it_matters` phrasing (same key nouns/verbs signaling the same concern)
- Fixes that would all be obviated by the same upstream decision

For each cluster of size N >= 3:

- Keep the single finding with the strongest evidence (highest confidence anchor, or if tied, the one citing the most concrete document reference)
- Demote the remaining N-1 findings to FYI-subsection status (anchor `50`), regardless of their original anchor
- On the kept finding, note in the Reviewer column that the persona raised N-1 related variants (e.g., `product (+4 related variants demoted to FYI)`)

This runs per-persona before 3.4 cross-persona boost. Cross-persona agreement across the *kept* finding still qualifies for the anchor-step promotion in 3.4; demoted variants do not participate in cross-persona promotion (they are observational only after collapse).

Do NOT collapse across personas at this step -- different personas surfacing the same concern is exactly the independence signal the cross-persona boost rewards. Collapse applies within one persona's output only.

### 3.4 Cross-Persona Agreement Promotion

When 2+ independent personas flagged the same merged finding (from 3.3), promote the merged finding's anchor by one step: `50 -> 75`, `75 -> 100`. Anchor `100` does not promote further (already at the ceiling). Findings at anchors `0` or `25` do not reach this step (they were dropped in 3.2).

Independent corroboration is strong signal -- multiple reviewers converging on the same issue is more reliable than any single reviewer's anchor. Promoting by one anchor step is semantically meaningful (a "verified but nitpick" finding that two personas independently surface is plausibly "will hit in practice").

Note the promotion in the Reviewer column of the output (e.g., `coherence, feasibility (+1 anchor)`).

### 3.5 Resolve Contradictions

When personas disagree on the same section:

- Create a combined finding presenting both perspectives
- Set `autofix_class: manual` (contradictions are by definition judgment calls)
- Set `finding_type: error` (contradictions are about conflicting things the document says, not things it omits)
- Frame as a tradeoff, not a verdict

Specific conflict patterns:

- Coherence says "keep for consistency" + scope-guardian says "cut for simplicity" -> combined finding, let user decide
- Feasibility says "this is impossible" + product says "this is essential" -> P1 finding framed as a tradeoff
- Multiple personas flag the same issue (no disagreement) -> handled in 3.3 merge, not here

### 3.5b Deterministic Recommended-Action Tie-Break

Every merged finding carries exactly one `recommended_action` field consumed by the walk-through (`references/walkthrough.md`) to mark the `(recommended)` option, by the best-judgment path (`references/bulk-preview.md`) to choose what to execute in bulk, and by the stem's yes/no framing. When a merged finding was flagged by multiple personas who implied different actions, synthesis picks the recommended action deterministically so identical review artifacts produce identical walk-through and best-judgment behavior across runs.

**Tie-break order (most conservative first):** `Skip > Defer > Apply`. The first action that at least one contributing persona implied wins, scanning in that order.

- If any contributing persona implied Skip -> `recommended_action: Skip`
- Else if any contributing persona implied Defer -> `recommended_action: Defer`
- Else -> `recommended_action: Apply`

**Persona-to-action mapping.** A persona implies an action through its classification:

- `safe_auto` or `gated_auto` -> implies Apply
- `manual` with a concrete `suggested_fix` and a recommended resolution -> implies Apply (the persona has an opinion about what to do)
- `manual` flagged as a tradeoff or scope question with no recommended resolution -> implies Defer (worth revisiting, not worth acting now)
- Any persona flagging the finding as low-confidence or suppression-eligible via residual concerns -> implies Skip
- Persona in the contradiction set (3.5) implying "keep as-is / do not change" -> implies Skip

If the contributing personas are all silent on action (e.g., a merged `manual` finding from personas that all flagged it as observation without recommendation), pick the default based on whether the merged finding carries an executable `suggested_fix`:

- `suggested_fix` present -> `recommended_action: Apply` as the pragmatic default.
- `suggested_fix` absent -> `recommended_action: Defer` (the walk-through and best-judgment path cannot execute Apply without a fix; routing an actionless finding to Defer surfaces it in Open Questions where the user can decide what to do with it).

This gate holds for every branch of the tie-break: if the winning action is `Apply` but the merged finding has no `suggested_fix` after 3.9 (Promote) and 3.10 (Route) have run, downgrade to `Defer`. The walk-through still lets the user pick any of the four options; this rule only governs the agent's default recommendation so the best-judgment path and bulk-preview never schedule a non-executable Apply.

**Conflict-context surface.** When the tie-break fires (contributing personas implied different actions), record a one-line conflict-context string on the merged finding. The walk-through renders this on the conflict-context line. Example: `Coherence recommends Apply; scope-guardian recommends Skip. Agent's recommendation: Skip.`

**Downstream invariant.** The walk-through and bulk-preview never recompute the recommendation -- they read `recommended_action` and render `(recommended)` on the matching option. Best-judgment-the-rest and routing option B execute the `recommended_action` across the scoped finding set in bulk. This keeps best-judgment outcomes reproducible and auditable: the same review artifact always produces the same bulk plan.

### 3.5c Premise-Dependency Chain Linking

Document reviews often produce fanout: a single premise challenge ("is this work justified?") generates downstream findings that all evaporate if the premise is rejected. Surfacing each as an independent decision forces the user to re-litigate the same root question N times. This step links dependent findings to their root so presentation can group them and the walk-through can cascade a single root decision across the chain.

Run this step after 3.5b (recommended_action normalized) and before 3.9 (auto-promotion), operating on the merged finding set.

**Step 1: Identify roots.** A finding is a candidate root when ALL of the following hold:

- Severity is `P0` or `P1` (premise-level issues carry high priority by nature)
- `autofix_class` is `manual` (the root itself requires judgment -- a safe/gated root is acted on, not cascaded)
- `why_it_matters` or `title` challenges a foundational premise, not a detail. Signal phrases (shape, not vocabulary): "premise unsupported", "justification missing", "do-nothing baseline not evaluated", "is X justified", "unsupported by evidence", "is the proposed solution the right approach"
- The finding's `section` is framing-level (Problem Frame, Summary, Overview, Why, Motivation, Goals) OR the finding explicitly questions whether a named component should exist

If multiple candidates match the criteria, elevate ALL of them. The criteria above are restrictive enough that this list will be short for any well-formed document; do not impose a further numerical cap. Picking only one root when two valid roots exist leaves the second root's natural dependents stranded as independent manual findings.

**Peer vs nested test.** Two candidate roots are peers when accepting root A's proposed fix would not resolve root B's concern (and vice versa). They are nested when one root's fix would moot the other -- in which case the subsumed candidate becomes a dependent of the surviving root, not a peer root.

**Surviving-root selection under asymmetric subsumption.** When nested, the surviving root is the one whose fix moots the other -- not the one with higher confidence. The subsumption direction determines scope (broader premise wins); confidence determines strength, not scope.

**Sanity diagnostic.** If more than 3 candidates match, reconsider whether the criteria are being applied correctly. Do not silently drop candidates; either confirm each one independently meets the criteria, or tighten the application.

If none match, skip the rest of this step -- no chains exist.

**Step 2: Identify dependents.** For each candidate root, scan the remaining findings for dependents. A finding is a dependent of a root when:

- The root challenges a foundational premise about a named component
- The candidate's `suggested_fix` modifies, adds detail to, or constrains that same component
- The candidate's concern would dissolve if the root's premise is rejected

Test with the substitution check: "If the user rejects the root (Skip/Defer), does the dependent's finding still describe an actionable concern?" If no -- the dependent's premise dissolves alongside the root's -- it is a dependent.

**Step 3: Independence safeguard.** Even when a finding's target component is addressed by the root, do NOT link if:

- The dependent identifies a problem that would exist regardless of the root's resolution (operational obligations that don't evaporate when the premise changes)
- The dependent's `why_it_matters` cites evidence that stands on its own, not conditioned on the premise
- The dependent is `safe_auto` -- it has one clear correct fix and should apply regardless

When uncertain, default to NOT linking. A mis-linked chain hides a real issue; leaving a finding unlinked only costs one extra decision.

**Step 4: Annotate.** On each dependent, record `depends_on: <root_finding_id>`. On each root, record `dependents: [<dependent_ids>]`. Cap `dependents` at 6 entries per root.

Do NOT reclassify, re-route, or change the confidence anchor of any finding in this step. Linking is purely annotative; the walk-through and presentation use the annotation, synthesis proper does not.

**Step 5: Report in Coverage.** Add a line to the coverage summary: `Chains: N root(s) with M total dependents`. When N = 0, omit the line.

**Count invariant.** `M` in the coverage line is the number of findings with `depends_on` set after Step 4 completes. If a finding appears in a root's `dependents` array, it MUST appear nested under that root in the presentation and MUST NOT appear at its own severity position.

### 3.6 R29 Rejected-Finding Suppression (Round 2+)

When running round 2+ on the same document in the same session, the decision primer carries forward every prior-round Skipped, Deferred, and Acknowledged finding. Synthesis suppresses re-raised rejected findings rather than re-surfacing them. This step runs before promotion (3.9) and routing (3.10) so suppressed findings cannot influence downstream decisions.

For each current-round finding, compare against the primer's rejected list:

- **Matching predicate:** `normalize(section) + normalize(title)` fingerprint augmented with evidence-substring overlap check (>50%). If a current-round finding matches a prior-round rejected finding on fingerprint AND evidence overlap, drop the current-round finding.
- **Materially-different exception:** if the current document state has changed around the finding's section since the prior round (the section was edited and the evidence quote no longer appears in the current text), treat the finding as new.
- **On suppression:** record the drop in Coverage with a "previously rejected, re-raised this round" note.

### 3.7 R30 Fix-Landed Matching Predicate

When running round 2+, synthesis verifies that prior-round Applied findings actually landed. This step runs before promotion and routing so regressions are flagged before downstream decisions.

For each current-round finding whose fingerprint matches a prior-round Applied finding:

- **Strong match -- evidence overlap >50%: fix-landed regression.** Flag as "fix did not land" in the report rather than surfacing as a new finding.
- **Weak match -- evidence overlap <=50%: not a fix-landed regression.** If the current-round item is explicitly a non-actionable verification observation, suppress it and record `Verified: round-N '{title}' landed correctly` in Coverage. Otherwise, treat the finding as new.
- **Section renames count as different locations.** If the section name has changed between rounds, treat the new section as a different location.
- **No fingerprint match:** not a verification candidate; the finding flows through normally.

### 3.8 Protected Artifacts

Discard any finding that recommends deleting or removing files in:

- `docs/brainstorms/`
- `docs/plans/`
- `docs/solutions/`

These are pipeline artifacts and must not be flagged for removal.

### 3.8b Chain Pruning

After 3.6-3.8 drop findings, chain annotations may reference suppressed entries. Prune before promotion and routing:

- **Dropped dependents:** for each root's `dependents` array, remove any id whose finding was dropped by 3.6 (R29), 3.7 (R30), or 3.8 (Protected). If a root's `dependents` array becomes empty, clear the root's `dependents` field but leave the root finding intact.
- **Dropped roots:** if a root finding itself was dropped, clear `depends_on` on every surviving dependent that pointed to it. Those dependents become standalone findings.
- **Recompute Chains coverage:** count surviving roots (findings with non-empty `dependents` arrays) and surviving dependents (findings with `depends_on` set). Update the `Chains:` coverage line from the post-pruning state. The count invariant (`M` = number of findings with `depends_on` set) now reflects only surviving findings.

### 3.9 Promote Auto-Eligible Findings

Scan `manual` findings for promotion to `safe_auto` or `gated_auto`. Promote when the finding meets one of the consolidated auto-promotion patterns:

- **Codebase-pattern-resolved.** `why_it_matters` cites a specific existing codebase pattern, and `suggested_fix` follows that pattern. Promote to `gated_auto`.
- **Factually incorrect behavior.** The document describes behavior that is factually wrong, and the correct behavior is derivable from context or the codebase. Promote to `gated_auto`.
- **Missing standard security/reliability controls.** The omission is clearly a gap, and the fix follows established practice. Promote to `gated_auto`.
- **Framework-native-API substitutions.** A hand-rolled implementation duplicates first-class framework behavior. Promote to `gated_auto`.
- **Mechanically-implied completeness additions.** The missing content follows mechanically from the document's own explicit, concrete decisions. Promote to `safe_auto` when there is genuinely one correct addition; `gated_auto` when the addition is substantive.

Do not promote if the finding involves scope or priority changes where the author may have weighed tradeoffs invisible to the reviewer.

**Strawman-downgrade safeguard.** If a `safe_auto` finding names dismissed alternatives in `why_it_matters`, verify the alternatives are genuinely strawmen. If any alternative is a plausible design choice that the persona dismissed too aggressively, downgrade to `gated_auto`.

### 3.10 Route by Autofix Class

**Severity and autofix_class are independent.** A P1 finding can be `safe_auto` if the correct fix is obvious. The test is not "how important?" but "is there one clear correct fix, or does this require judgment?"

**Anchor and autofix_class are also independent.** Anchor gates the finding into a surface (FYI vs actionable); `autofix_class` decides what the actionable surface does with it.

Findings reaching 3.10 have already been gated to anchors `50`, `75`, or `100` by 3.2.

| Anchor | Autofix Class | Route |
|--------|---------------|-------|
| `100`  | `safe_auto`   | Apply silently in Phase 4. Requires `suggested_fix`. Demote to `gated_auto` if missing. |
| `100`  | `gated_auto`  | Enter the per-finding walk-through with Apply marked (recommended). Requires `suggested_fix`. Demote to `manual` if missing. |
| `100`  | `manual`      | Enter the per-finding walk-through with user-judgment framing. `suggested_fix` is optional. |
| `75`   | `safe_auto`   | Demote to `gated_auto` before routing -- silent apply is reserved for anchor `100` findings. Enter the walk-through with Apply marked (recommended). |
| `75`   | `gated_auto`  | Enter the per-finding walk-through with Apply marked (recommended). Requires `suggested_fix`. Demote to `manual` if missing. |
| `75`   | `manual`      | Enter the per-finding walk-through with user-judgment framing. `suggested_fix` is optional. |
| `50`   | any           | Surface in the FYI subsection regardless of `autofix_class`. Do not enter the walk-through or any bulk action. |

### 3.11 Sort

Sort findings for presentation: P0 -> P1 -> P2 -> P3, then by finding type (errors before omissions), then by confidence anchor (descending: `100` first, then `75`, then `50`), then by document order (section position) as the deterministic final tiebreak.

### 3.12 Suppress Restatements in Residual Concerns and Deferred Questions

Persona outputs carry `residual_risks` and `deferred_questions` arrays alongside `findings`. After the actionable-tier set is finalized (post-3.10 routing), personas often re-surface the same substance in their residual/deferred arrays. Rendering both sections verbatim inflates the output with restatements that carry no new signal.

For every `residual_risk` and `deferred_question` across all persona outputs, check against the finalized actionable-finding set. Drop the residual/deferred item if either of these holds:

- **Section-and-substance overlap.** The residual/deferred item names the same section as an actionable finding AND its substance fuzzy-matches the finding's `title` or `why_it_matters`.
- **Question form of an actionable finding.** A deferred question whose subject is directly answered by or obviated by an actionable finding's recommendation.

Do NOT drop residual/deferred items that introduce genuinely new signal. When in doubt, keep.

Record the count dropped as a Coverage footnote line when non-zero: `Restated: N (residual/deferred items suppressed as duplicates of actionable findings)`. Ordering: footnotes appear in the sequence `Dropped:`, `Chains:`, `Restated:` below the Coverage table. Omit any footnote whose count is zero.

## Phase 4: Apply and Present

**User-facing vocabulary rule (applies to ALL user-visible output in Phase 4).** Internal enum values -- `safe_auto`, `gated_auto`, `manual`, `FYI` -- stay inside the schema and synthesis prose. Every word the user sees in Phase 4 output MUST use user-facing vocabulary: "fixes" (for `safe_auto`), "proposed fixes" (for `gated_auto`), "decisions" (for `manual` findings at anchor `75` or `100`), "FYI observations" (for any finding at anchor `50`). The only exception is the `Tier` column in rendered tables, which names the internal enum for transparency.

### Apply safe_auto fixes

Apply only `safe_auto` findings **at confidence anchor `100`** to the document in a single pass. This matches the 3.10 routing table: anchor `100` + `safe_auto` silent-applies; anchor `75` + `safe_auto` was demoted to `gated_auto` in 3.10; anchor `50` + any `autofix_class` routes to FYI.

- Edit the document inline using the platform's edit tool
- Track what was changed for the "Applied fixes" section in the rendered output
- Do not ask for approval -- these have one clear correct fix AND evidence directly confirms (anchor `100`)
- Do NOT silent-apply any `safe_auto` finding at anchor `75` or `50`

List every applied fix in the output summary so the user can see what changed.

### Route Remaining Findings

After safe_auto fixes apply, remaining findings split into buckets:

- `gated_auto` and `manual` findings at confidence anchor `75` or `100` -> enter the routing question (see `references/walkthrough.md`)
- FYI-subsection findings -> surface in the presentation only, no routing
- Zero actionable findings remaining -> skip the routing question; flow directly to Phase 5 terminal question

**Headless mode:** Do not use interactive question tools. Output all findings as a structured text envelope the caller can parse. Internal enum values stay in the schema; the envelope uses user-facing vocabulary.

```
Document review complete (headless mode).

Applied N fixes:
- <section>: <what was changed> (<reviewer>)

Proposed fixes (concrete fix, requires user confirmation):

[P0] Section: <section> -- <title> (<reviewer>, confidence <anchor>)
  Why: <why_it_matters>
  Suggested fix: <suggested_fix>

Decisions (requires user judgment):

[P1] Section: <section> -- <title> (<reviewer>, confidence <anchor>)
  Why: <why_it_matters>
  Suggested fix: <suggested_fix or "none">

  Dependents (would resolve if this root is rejected):
    [P2] Section: <section> -- <title> (<reviewer>, confidence <anchor>)
      Why: <why_it_matters>

FYI observations (anchor 50, no decision required):

[P3] Section: <section> -- <title> (<reviewer>, confidence <anchor>)
  Why: <why_it_matters>

Residual concerns:
- <concern> (<source>)

Deferred questions:
- <question> (<source>)

Dropped: N (anchors 0/25 suppressed)
Chains: N root(s) with M dependents
Restated: N (residual/deferred items suppressed as duplicates of actionable findings)

Review complete
```

Omit any section with zero items. End with "Review complete" as the terminal signal so callers can detect completion.

**Compact rendering for FYI observations, residual concerns, and deferred questions (high-count mode).** When the combined count of these three buckets is 5 or more, collapse each to a one-line count followed by a tight bullet list without per-item `Why` expansion. Actionable buckets remain fully rendered regardless.

**Interactive mode:**

Present findings using the review output template (read `references/review-output-template.md`). Within each severity level, separate findings by type:

- Errors first -- these need resolution
- Omissions second -- these need additions

Brief summary at the top: "Applied N fixes. K items need attention (X errors, Y omissions). Z FYI observations."

Include the Coverage table, applied fixes, FYI observations (as a distinct subsection), residual concerns, and deferred questions.

**All tables MUST be pipe-delimited markdown (`| col | col |`). Do NOT use ASCII box-drawing characters under any circumstances.**

## Phase 5: Next Action -- Terminal Question

**Headless mode:** Return "Review complete" immediately. Do not ask questions.

**Interactive mode:** fire the terminal question using the platform's blocking question tool.

**Stem:** `Apply decisions and what next?`

**Options (three by default; two in the zero-actionable case):**

When `fixes_applied_count > 0`:

```
A. Apply decisions and proceed to implementation
B. Apply decisions and re-review
C. Exit without further action
```

When `fixes_applied_count == 0`:

```
A. Proceed to implementation
B. Exit without further action
```

**Label adaptation:** when no decisions are queued to apply, the primary option drops the `Apply decisions and` prefix.

### Iteration limit

After 2 refinement passes, recommend completion -- diminishing returns are likely. But if the user wants to continue, allow it; the primer carries all prior-round decisions so later rounds suppress repeat findings cleanly.

Return "Review complete" as the terminal signal for callers, regardless of which option the user picked.

## What NOT to Do

- Do not rewrite the entire document
- Do not add new sections or requirements the user didn't discuss
- Do not over-engineer or add complexity
- Do not create separate review files or add metadata sections

## Iteration Guidance

On subsequent passes, re-dispatch personas with the multi-round decision primer and re-synthesize. Fixed findings self-suppress because their evidence is gone from the current doc; rejected findings are handled by the R29 pattern-match suppression rule; applied-fix verification uses the R30 matching predicate. If findings are repetitive across passes after these mechanisms run, recommend completion.
