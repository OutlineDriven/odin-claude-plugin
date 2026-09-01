# Phases 3-5: Synthesis, presentation, and next action

## Phase 3: Synthesize findings

Process findings from all agents through this pipeline. Order matters -- each step depends on the previous. The pipeline implements the finding-lifecycle state machine: **Raised -> (Confidence Gate | FYI-eligible | Dropped) -> Deduplicated -> Classified -> SafeAuto | GatedAuto | Manual | FYI**. Re-evaluate state at each step boundary; derive each step's state from the current finding set rather than carrying forward earlier-step assumptions as prose-level shortcuts.

### Routing decision table

| Phase | Condition | Action |
|-------|-----------|--------|
| **3.1** Validate | Agent's returned JSON checked against the findings schema. | Drop findings missing a required field or with invalid enum values; note the offending agent in Coverage. Restrict schema/validation diagnostics to a Coverage-row annotation (e.g. fewer findings, or a `malformed` marker) -- the only user-visible trace. |
| **3.2** Confidence Gate (Anchor-Based) | Finding's `confidence` anchor (`0`/`25`/`50`/`75`/`100`). | See "3.2 Confidence Gate" below -- full anchor table, drop/FYI/actionable routing, and the threshold rationale. |
| **3.3** Deduplicate | Fingerprint (`normalize(section)+normalize(title)`) matches across personas. | Opposing recommended actions (one says cut, one says keep) -> keep both, unresolved until 3.5. Otherwise merge: highest severity, highest confidence anchor (tie -> first in document order), union all evidence, list all agreeing reviewers. **Coverage attribution:** merged finding attributed to the persona with the highest anchor (tie -> first in document order); the losing persona's Findings count and route bucket are decremented so totals stay exact. |
| **3.3b** Same-Persona Premise Redundancy Collapse | One persona has 3+ surviving findings sharing the same `finding_type`, substantially overlapping `why_it_matters` phrasing, and fixes all obviated by the same upstream decision. | Keep the single strongest finding (highest anchor, else most concrete evidence); demote the other N-1 to FYI-subsection status (anchor `50`) regardless of original anchor; annotate the kept finding's Reviewer column with the variant count (e.g. `product (+4 related variants demoted to FYI)`). Runs per-persona, before 3.4. Demoted variants remain at FYI-subsection status through cross-persona promotion. This step collapses only within a single persona -- independent personas surfacing the same concern is exactly the signal 3.4 rewards. |
| **3.4** Cross-Persona Agreement Promotion | 2+ independent personas flagged the same merged (3.3) finding. | Promote the merged finding's anchor by one step: `50 -> 75`, `75 -> 100` (`100` does not promote further; anchors `0`/`25` are already dropped at 3.2 and absent from this step). Note the promotion in the Reviewer column (e.g. `coherence, feasibility (+1 anchor)`). |
| **3.5** Resolve Contradictions | Personas disagree on the same section (opposing recommendations, not mere agreement). | Create one combined finding: `autofix_class: manual`, `finding_type: error`, framed as a tradeoff, not a verdict. E.g. coherence "keep for consistency" + scope-guardian "cut for simplicity" -> combined finding, let user decide; feasibility "impossible" + product "essential" -> P1 tradeoff finding. Same-direction multi-persona agreement is handled by 3.3's merge, not here. |
| **3.5b** Deterministic Recommended-Action Tie-Break | Merged finding's contributing personas implied different actions (Apply/Defer/Skip). | See "3.5b Deterministic Recommended-Action Tie-Break" below -- `Skip > Defer > Apply` precedence, persona-to-action mapping, the no-`suggested_fix` default and downgrade, and the conflict-context string. |
| **3.5c** Premise-Dependency Chain Linking | A P0/P1 `manual` finding challenges a foundational premise on a framing-level section or named component (candidate root), and other findings' concerns would dissolve if that root is rejected (dependents). | See "3.5c Premise-Dependency Chain Linking" below -- root/dependent identification, peer-vs-nested and independence-safeguard rules, `depends_on`/`dependents` annotation (capped at 6), and the Chains coverage line. |
| **3.6** R29 Rejected-Finding Suppression (Round 2+) | Round 2+; current-round finding's fingerprint plus evidence-substring overlap (>50%) matches a prior-round Skipped/Deferred/Acknowledged finding from the decision primer. | Drop the current-round finding; record "previously rejected, re-raised this round" in Coverage. **Exception:** if the section was edited since the prior round and the evidence quote no longer appears in the current text, treat the finding as new. Runs before 3.9/3.10. |
| **3.7** R30 Fix-Landed Matching Predicate | Round 2+; current-round finding's fingerprint matches a prior-round Accepted finding. | Evidence overlap >50% -> flag "fix did not land" regression instead of surfacing as new. Overlap <=50% -> if the current item is a pure non-actionable verification observation, suppress it and record `Verified: round-N '{title}' landed correctly`; otherwise treat as new. A section rename between rounds counts as a different location (treated as new). No fingerprint match -> not a verification candidate, flows through normally. |
| **3.8** Protected Artifacts | Finding recommends deleting or removing files under `docs/brainstorms/`, `docs/plans/`, or `docs/solutions/`. | Discard the finding -- these are pipeline artifacts and must not be flagged for removal. |
| **3.8b** Chain Pruning | After 3.6-3.8 drop findings, a chain annotation from 3.5c (`depends_on`/`dependents`) may reference a now-dropped entry. | Remove dropped ids from surviving roots' `dependents` arrays (clear the field if it becomes empty, leave the root intact). If a root itself was dropped, clear `depends_on` on every dependent that pointed to it (they become standalone). Recompute the `Chains: N root(s) with M total dependents` coverage line from the post-pruning surviving roots/dependents; `M` = findings with `depends_on` set after pruning. |
| **3.9** Promote Auto-Eligible Findings | `manual` finding matches one of five consolidated auto-promotion patterns. | See "3.9 Promote Auto-Eligible Findings" below -- codebase-pattern-resolved / factually-incorrect-behavior / missing-standard-controls / framework-native-substitution / mechanically-implied-completeness patterns, their promotion targets, the scope/priority exclusion, and the strawman-downgrade safeguard. |
| **3.10** Route by Autofix Class | Anchor (`100`/`75`/`50`) x `autofix_class` (`safe_auto`/`gated_auto`/`manual`). | See "3.10 Route by Autofix Class" below -- full anchor x autofix_class routing table (accepted-recommendation recording, walk-through entry with Accept marked, user-judgment framing, demotion rules, and the anchor-`50` FYI catch-all). |
| **3.11** Sort | Finalized finding set, ready for presentation. | Sort `P0 -> P1 -> P2 -> P3`, then by finding type (errors before omissions), then by confidence anchor descending (`100`, then `75`, then `50`), then by document order (section position) as the deterministic final tiebreak. |
| **3.12** Suppress Restatements in Residual Concerns and Deferred Questions | A `residual_risk`/`deferred_question` (checked after 3.10 routing) fuzzy-matches an actionable finding's section+substance, or is a question directly answered/obviated by one. | Drop the item; keep it when in doubt or when it introduces genuinely new signal. Record `Restated: N (residual/deferred items suppressed as duplicates of actionable findings)` in Coverage when non-zero. Footnote order below the Coverage table: `Dropped:`, `Chains:`, `Restated:` -- omit any footnote whose count is zero. |

Five phases carry branching, multi-step procedures too dense for a single table cell; their full logic is preserved as prose below, unchanged from the pre-table version.

### 3.2 Confidence gate (anchor-based)

Gate findings by their `confidence` anchor value. Anchors are discrete integers (`0`, `25`, `50`, `75`, `100`) with behavioral definitions documented in `references/findings-schema.json` and embedded in the persona rubric (`references/subagent-template.md`).

| Anchor | Meaning | Route |
|--------|---------|-------|
| `0`    | False positive or pre-existing issue | Drop silently |
| `25`   | Might be real but could not verify | Drop silently |
| `50`   | Verified real but nitpick / advisory / not very important | Surface in FYI subsection |
| `75`   | Double-checked, will hit in practice, directly impacts correctness | Enter actionable tier (classify by `autofix_class`) |
| `100`  | Evidence directly confirms; will happen frequently | Enter actionable tier (classify by `autofix_class`) |

- Dropped silently (anchors `0` and `25`): these stay suppressed across every output bucket -- findings, FYI observations, and residual concerns alike. Record the total drop count as a Coverage footnote line when non-zero: `Dropped: N (anchors 0/25 suppressed)`. The footnote appears below the Coverage table, alongside the `Chains:` footnote when both apply. Omit the footnote when N is zero.
- FYI-subsection (anchor `50`): stays in the working set through 3.3 dedup and 3.4 cross-persona promotion. If promoted to `75` by corroboration, enters the actionable tier; if not promoted, routes to the FYI subsection regardless of `autofix_class`. These bypass the walk-through and any bulk action -- observational value without forcing a decision. Advisory observations ("nothing breaks, but...") naturally land here.
- Actionable (anchors `75` and `100`): enter the classification pipeline. Route by `autofix_class` (see 3.10).

**Why this threshold, not a higher one:** Document review has opposite economics from code review. There is no linter backstop -- the review IS the backstop. Premise-level concerns (product, adversarial) naturally cap at anchors 50-75 because "is the motivation valid?" cannot be verified against ground truth. The routing menu already makes dismissal cheap (Skip, Append to Open Questions), so surfaced-and-skipped is a low-cost outcome while missed-and-shipped derails downstream implementation. Filter low (`>= 50`) and let the routing menu handle volume.

### 3.5b Deterministic recommended-action tie-break

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
- Persona in the contradiction set (3.5) implying "keep as-is / leave unchanged" -> implies Skip

If the contributing personas are all silent on action (e.g., a merged `manual` finding from personas that all flagged it as observation without recommendation), pick the default based on whether the merged finding carries an executable `suggested_fix`:

- `suggested_fix` present -> `recommended_action: Apply` as the pragmatic default.
- `suggested_fix` absent -> `recommended_action: Defer` (the walk-through and best-judgment path cannot execute Apply without a fix; routing an actionless finding to Defer surfaces it in Open Questions where the user can decide what to do with it).

This gate holds for every branch of the tie-break: if the winning action is `Apply` but the merged finding has no `suggested_fix` after 3.9 (Promote) and 3.10 (Route) have run, downgrade to `Defer`. The walk-through still lets the user pick any of the four options; this rule only governs the agent's default recommendation so the best-judgment path and bulk-preview schedule only executable Apply actions.

Conflict-context surface. When the tie-break fires (contributing personas implied different actions), record a one-line conflict-context string on the merged finding. The walk-through renders this on the conflict-context line. Example: `Coherence recommends Apply; scope-guardian recommends Skip. Agent's recommendation: Skip.`

Downstream invariant. The walk-through and bulk-preview read `recommended_action` as authoritative and render `(recommended)` on the matching option. Best-judgment-the-rest and routing option B execute the `recommended_action` across the scoped finding set in bulk. This keeps best-judgment outcomes reproducible and auditable: the same review artifact always produces the same bulk plan.

### 3.5c Premise-dependency chain linking

Document reviews often produce fanout: a single premise challenge ("is this work justified?") generates downstream findings that all evaporate if the premise is rejected. Surfacing each as an independent decision forces the user to re-litigate the same root question N times. This step links dependent findings to their root so presentation can group them and the walk-through can cascade a single root decision across the chain.

Run this step after 3.5b (recommended_action normalized) and before 3.9 (auto-promotion), operating on the merged finding set.

**Step 1: Identify roots.** A finding is a candidate root when ALL of the following hold:

- Severity is `P0` or `P1` (premise-level issues carry high priority by nature)
- `autofix_class` is `manual` (the root itself requires judgment -- a safe/gated root is acted on, not cascaded)
- `why_it_matters` or `title` challenges a foundational premise, not a detail. Signal phrases (shape, not vocabulary): "premise unsupported", "justification missing", "do-nothing baseline not evaluated", "is X justified", "unsupported by evidence", "is the proposed solution the right approach"
- The finding's `section` is framing-level (Problem Frame, Summary, Overview, Why, Motivation, Goals) OR the finding explicitly questions whether a named component should exist

If multiple candidates match the criteria, elevate ALL of them. The criteria above are restrictive enough that this list will be short for any well-formed document; rely on the criteria alone to bound the list size. Picking only one root when two valid roots exist leaves the second root's natural dependents stranded as independent manual findings.

**Peer vs nested test.** Two candidate roots are peers when accepting root A's proposed fix would not resolve root B's concern (and vice versa). They are nested when one root's fix would moot the other -- in which case the subsumed candidate becomes a dependent of the surviving root, not a peer root.

**Surviving-root selection under asymmetric subsumption.** When nested, the surviving root is the one whose fix moots the other -- not the one with higher confidence. The subsumption direction determines scope (broader premise wins); confidence determines strength, not scope.

**Sanity diagnostic.** If more than 3 candidates match, reconsider whether the criteria are being applied correctly. Either confirm each one independently meets the criteria, or tighten the application; every candidate must be explicitly resolved.

If none match, skip the rest of this step -- no chains exist.

**Step 2: Identify dependents.** For each candidate root, scan the remaining findings for dependents. A finding is a dependent of a root when:

- The root challenges a foundational premise about a named component
- The candidate's `suggested_fix` modifies, adds detail to, or constrains that same component
- The candidate's concern would dissolve if the root's premise is rejected

Test with the substitution check: "If the user rejects the root (Skip/Defer), does the dependent's finding still describe an actionable concern?" If no -- the dependent's premise dissolves alongside the root's -- it is a dependent.

**Step 3: Independence safeguard.** Even when a finding's target component is addressed by the root, keep the finding standalone when:

- The dependent identifies a problem that would exist regardless of the root's resolution (operational obligations that persist when the premise changes)
- The dependent's `why_it_matters` cites evidence that stands on its own, not conditioned on the premise
- The dependent is `safe_auto` -- it has one clear correct fix and should apply regardless

When uncertain, default to NOT linking. A mis-linked chain hides a real issue; leaving a finding unlinked only costs one extra decision.

**Step 4: Annotate.** On each dependent, record `depends_on: <root_finding_id>`. On each root, record `dependents: [<dependent_ids>]`. Cap `dependents` at 6 entries per root.

Preserve each finding's class, route, and confidence anchor in this step. Linking is purely annotative; the walk-through and presentation use the annotation, synthesis proper does not.

**Step 5: Report in Coverage.** Add a line to the coverage summary: `Chains: N root(s) with M total dependents`. When N = 0, omit the line.

**Count invariant.** `M` in the coverage line is the number of findings with `depends_on` set after Step 4 completes. If a finding appears in a root's `dependents` array, it MUST appear nested under that root in the presentation, and that nested position MUST be its only appearance in the output.

### 3.9 Promote auto-eligible findings

Scan `manual` findings for promotion to `safe_auto` or `gated_auto`. Promote when the finding meets one of the consolidated auto-promotion patterns:

- Codebase-pattern-resolved. `why_it_matters` cites a specific existing codebase pattern, and `suggested_fix` follows that pattern. Promote to `gated_auto`.
- Factually incorrect behavior. The document describes behavior that is factually wrong, and the correct behavior is derivable from context or the codebase. Promote to `gated_auto`.
- Missing standard security/reliability controls. The omission is clearly a gap, and the fix follows established practice. Promote to `gated_auto`.
- Framework-native-API substitutions. A hand-rolled implementation duplicates first-class framework behavior. Promote to `gated_auto`.
- Mechanically-implied completeness additions. The missing content follows mechanically from the document's own explicit, concrete decisions. Promote to `safe_auto` when there is genuinely one correct addition; `gated_auto` when the addition is substantive.

Keep such findings at `manual` when they involve scope or priority changes where the author may have weighed tradeoffs invisible to the reviewer.

**Strawman-downgrade safeguard.** If a `safe_auto` finding names dismissed alternatives in `why_it_matters`, verify the alternatives are genuinely strawmen. If any alternative is a plausible design choice that the persona dismissed too aggressively, downgrade to `gated_auto`.

### 3.10 Route by autofix class

**Severity and autofix_class are independent.** A P1 finding can be `safe_auto` if the correct fix is obvious. The test is not "how important?" but "is there one clear correct fix, or does this require judgment?"

**Anchor and autofix_class are also independent.** Anchor gates the finding into a surface (FYI vs actionable); `autofix_class` decides what the actionable surface does with it.

Findings reaching 3.10 have already been gated to anchors `50`, `75`, or `100` by 3.2.

| Anchor | Autofix Class | Route |
|--------|---------------|-------|
| `100`  | `safe_auto`   | Record as accepted recommendation in report. Requires `suggested_fix`. Demote to `gated_auto` if missing. |
| `100`  | `gated_auto`  | Enter the per-finding walk-through with Accept marked (recommended). Requires `suggested_fix`. Demote to `manual` if missing. |
| `100`  | `manual`      | Enter the per-finding walk-through with user-judgment framing. `suggested_fix` is optional. |
| `75`   | `safe_auto`   | Demote to `gated_auto` before routing -- accepted recommendations are reserved for anchor `100` findings. Enter the walk-through with Accept marked (recommended). |
| `75`   | `gated_auto`  | Enter the per-finding walk-through with Accept marked (recommended). Requires `suggested_fix`. Demote to `manual` if missing. |
| `75`   | `manual`      | Enter the per-finding walk-through with user-judgment framing. `suggested_fix` is optional. |
| `50`   | any           | Surface in the FYI subsection regardless of `autofix_class`, skipping the walk-through and any bulk action. |


## Phase 4: Present findings

**User-facing vocabulary rule (applies to ALL user-visible output in Phase 4).** Internal enum values -- `safe_auto`, `gated_auto`, `manual`, `FYI` -- stay inside the schema and synthesis prose. Every word the user sees in Phase 4 output MUST use user-facing vocabulary: "accepted recommendations" (for `safe_auto`), "proposed fixes" (for `gated_auto`), "decisions" (for `manual` findings at anchor `75` or `100`), "FYI observations" (for any finding at anchor `50`). The only exception is the `Tier` column in rendered tables, which names the internal enum for transparency.

### Record safe_auto findings as accepted recommendations

Record `safe_auto` findings **at confidence anchor `100`** as accepted recommendations in the completion report. These findings have one clear correct fix AND evidence directly confirms (anchor `100`).

- Track what was recorded for the "Accepted recommendations" section in the rendered output
- Record only `safe_auto` findings at anchor `100` as accepted; `safe_auto` findings at anchor `75` or `50` enter the walk-through or FYI per the routing table

List every accepted recommendation in the output summary so the user can see what was recommended.

### Route remaining findings

After safe_auto findings are recorded, remaining findings split into buckets:

- `gated_auto` and `manual` findings at confidence anchor `75` or `100` -> enter the routing question (see `references/walkthrough.md`)
- FYI-subsection findings -> surface in the presentation only, no routing
- Zero actionable findings remaining -> skip the routing question; flow directly to Phase 5 terminal question

**Headless mode:** Output all findings as a structured text envelope the caller can parse, without interactive question tools. Internal enum values stay in the schema; the envelope uses user-facing vocabulary.

```
Document review complete (headless mode).

Accepted N recommendations:
- <section>: <what was recommended> (<reviewer>)

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

Brief summary at the top: "Accepted N recommendations. K items need attention (X errors, Y omissions). Z FYI observations."

Include the Coverage table, accepted recommendations, FYI observations (as a distinct subsection), residual concerns, and deferred questions.

**All tables MUST be pipe-delimited markdown (`| col | col |`). Do NOT use ASCII box-drawing characters under any circumstances.**

## Phase 5: Next action -- terminal question

Headless mode: Return "Review complete" immediately, without asking questions.

Interactive mode: fire the terminal question using the platform's blocking question tool.

Stem: `Record decisions and what next?`

When `decisions_recorded_count > 0`:

```
A. Persist review record and exit
B. Re-review with updated context
C. Exit without persisting
```

When `decisions_recorded_count == 0`:

```
A. Persist review record and exit
B. Exit without persisting
```

**Label adaptation:** when no decisions are queued, the primary option drops the `Record decisions and` prefix.

### Iteration limit

After 2 refinement passes, recommend completion -- diminishing returns are likely. But if the user wants to continue, allow it; the primer carries all prior-round decisions so later rounds suppress repeat findings cleanly.

Return "Review complete" as the terminal signal for callers, regardless of which option the user picked.

## What not to do

- Do not rewrite the entire document
- Do not add new sections or requirements the user didn't discuss
- Do not over-engineer or add complexity
- Do not create separate review files or add metadata sections

## Iteration guidance

On subsequent passes, re-dispatch personas with the multi-round decision primer and re-synthesize. Fixed findings self-suppress because their evidence is gone from the current doc; rejected findings are handled by the R29 pattern-match suppression rule; accepted-recommendation verification uses the R30 matching predicate. If findings are repetitive across passes after these mechanisms run, recommend completion.
