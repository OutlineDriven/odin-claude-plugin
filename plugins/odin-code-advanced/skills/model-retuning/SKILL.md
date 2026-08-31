---
name: model-retuning
description: 'Use when asked to run /model-retuning [target model or symptom] [corpus path] [bar:<n> consecutive clean runs] to retune a skill corpus for a new model measurement-first. Not for static audits — use deslop for those.'
---

# Model retuning

## Contract

| Field | Bound contract |
|---|---|
| Trigger | /model-retuning [target model or symptom] [corpus path] [bar:<n> consecutive clean runs] |
| Authority | Reversible-local: write only named local corpus files and measurement artifacts; recover by reverting the per-pass commits. |
| Side effect | Runs measurement passes and edits corpus files in surgical, measured passes; one problem class per pass over disjoint file ownership. |
| Done | The pre-registered bar clears, or the run reports the specific claim it could not support. |

## Inputs

- Target model or symptom: required. Names what the corpus degrades on.
- Corpus path: optional, defaults to `./skills`. The skill directories to retune.
- `bar:<n>`: required. The number of consecutive clean runs the corpus must clear, registered in writing before any change exists.
- A benchmark harness that can A/B two builds of the corpus: required. Refuse without it.

## Procedure

1. **Measurement gate.** Confirm all three before any work: a run archive (or harness that produces one) carrying per-run tool-call traces, terminal markers, token counts, and final messages; a build selector that points a run at a specific corpus checkout so two builds are comparable under one runner; and a repeatable task the corpus executes end to end. Name whichever is missing and stop. Do not fall back to a static audit and present it as retuning. Done when: all three substrate requirements are confirmed or the missing one is named and the run stops.
2. **Mine the archive** before spending a run. Zero model cost: read files already on disk. Derive a phase-marker map from the corpus's own spine — one observable marker per phase (a tool call or a file that exists, never a phrase in prose) — before writing an extractor. Extract one row per run by script, not by hand, with at least: run id, model, settings, session and child ids, ordered phase trace, terminal marker present, output tokens, wall clock, helper dispatch count, max parallel dispatch, and the verbatim final message. Derive `task_done` (deliverable exists) and `process_followed` (every required phase appears in spine order) independently; never let one imply the other or let the marker stand in for either. Score outcomes first-match-wins with `broken > halt > wrong-result > task-done-no-process > success`. Done when: every archived run has an extracted row with both metrics scored independently.
3. **Establish the noise floor.** Run the harness against two identical copies of the corpus, same commit on both sides; whatever difference appears is the floor every later claim must clear. Register the bar now, in writing, before any change exists — a bar chosen after seeing results is not a bar. Run arms serial within an arm and interleaved across arms with nothing else running; contention destroys wall-clock-derived metrics and can manufacture a timeout that reads as a halt, so a contended run cannot support a latency claim and cannot be counted as a halt. Done when: the noise floor is measured, the bar is registered in writing, and no corpus change exists yet.
4. **Audit the corpus adversarially.** One agent per skill directory proposes cuts; a second per skill defends the existing prose. The two passes require independent contexts. If the host exposes no way to run them as separate agents, report that as a blocker and stop — do not argue both sides in one context and present the result as an audit. Budget the defense as first-class work: the removals are the phase's product as much as the proposals. Done when: both passes complete in independent contexts or the host limitation is reported as a blocker.
5. **Cut in surgical passes.** One problem class per pass, no bundling. Fan out by disjoint file ownership, never by item: one agent owns one skill directory and applies the class everywhere inside it, so ownership is a checkable filesystem partition with every path in exactly one manifest row. Discover byte-identical duplicated assets before dispatch and assign every copy to exactly one owner who propagates the edit to all copies in the same pass; list them as forbidden for everyone else. When a rewrite's strings cross-reference each other, author the canonical mapping (old string to new string, exact) serially first, then fan out verbatim application; an uncovered occurrence is a contract gap to resolve serially, not a variant to improvise. Reconcile every cross-reference before the pass closes. Done when: one problem class is applied across all owned paths and every cross-reference is reconciled.
6. **Measure, then let the failure choose the next fix.** A failure that moves to a later phase is progress and names the next target; a failure at the same site means the fix missed; a run that completes the task while skipping the workflow is a different defect than a halt and only shows up if step 2's two metrics stayed separate. Audit the phases the instrument cannot reach: a probe that skips a phase can never fail in it, so a green streak certifies only what it exercised. Loop steps 5 and 6 until the registered bar clears, then stop. Report the paths that remain unmeasured and what would be needed to measure them; one clean run proves nothing. Done when: the registered bar clears or the run reports the specific claim it could not support and the unmeasured paths.
7. **Ship.** Commit each pass separately with its own message so history says which change was made and why. Keep the measurement artifacts. Write the finding where the next person will hit it: the mechanism, before and after, the measured numbers, and the hypotheses that died — the dead ends are what stops the next attempt re-running them. Done when: every pass is committed separately and the finding is written at the point of next impact.

Cross-cutting rules for every fan-out: pass large context by path plus a short gist, not inlined contents; decide every artifact's path before the phase that writes it and keep them together; give a schema to anything that will be aggregated; budget the serial tail and name serial segments separately when reporting elapsed time; state what a fan-out did not cover — units queued past the cap, units skipped, files outside every owner's set.

## Failure and recovery

- Missing measurement substrate: any of the gate's three requirements absent. Stop and name what to build. Do not substitute a static audit.
- No independent agent contexts for the audit: the host cannot run proposal and defense as separate agents. Report as a blocker and stop the audit; do not collapse both sides into one context.
- Shared-asset parity break: a per-unit agent edited its own copy of a byte-identical file. Recover by assigning all copies to one owner and propagating in one pass; a parity test failure surfacing in a different pass is attributed to the wrong change until ownership is fixed.
- Over-cut: a removed mandate handed a required decision to the model. Recover by naming the new decider and restoring the gate if the decider is not allowed to decide it.
- Non-convergence: the bar does not clear after the affordable passes. Partial results stand as a ranked hypothesis list with measured numbers; do not pretend the done predicate holds. Report the specific claim the run could not support and the paths still unmeasured.
- Rollback is `git revert` of the per-pass commits; each pass is one commit, so any pass is independently reversible.

## Output

A retuned corpus whose measured behavior on the target model clears the pre-registered bar, with each removal attributable to a named problem class and a per-pass commit. Plus a written finding: the mechanism, before and after, measured numbers, and the hypotheses that died. If the bar does not clear, a report naming the specific unsupported claim and the unmeasured paths — not a green suite presented as success.
