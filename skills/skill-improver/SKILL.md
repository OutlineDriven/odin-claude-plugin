---
name: skill-improver
description: 'Use when a user asks to iteratively improve a Claude Code skill or fix skill-quality findings. The skill resolves the target, runs structured reviews, applies fixes, and repeats until no critical or major findings remain or a terminal status is reached. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Skill improver

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user asks to iteratively improve a Claude Code skill, fix skill-quality findings, or resume a previously escalated skill-improvement run. |
| Authority | Reversible local writes only. Edit files within the resolved skill directory and the `.code-improver/` run-artifact directory. No remote mutation, credential change, paid action, publishing, or deployment. Roll back any edit by restoring the prior file content from the run artifact or version control. |
| Side effect | Resolved skill/plugin scope plus `.code-improver` run artifacts and metrics. |
| Done | A final skill review contains no critical or major findings and finalization edits pass scope and regression checks, or a non-success terminal status is reported without being presented as convergence. |

## Inputs

1. **Target skill path** (required): a path to a `SKILL.md` file or a skill slug that resolves to one. If a slug is given, resolve it by searching `skills/`.
2. **Improvement scope** (optional): specific findings to fix, a prior `.code-improver/` run directory to resume, or quality dimensions to focus on. If omitted, run a full review-and-fix cycle.
3. **Max iterations** (optional): integer cap on review-fix cycles. Default: 5.

## Procedure

1. **Resolve target.** Locate the `SKILL.md` file. If the path does not exist or does not contain a valid skill frontmatter block, report `invalid-target` and stop. Record the resolved path in `.code-improver/run-<timestamp>/target.txt`.
2. **Bound scope.** The improvement scope is the single resolved skill directory. No file outside that directory or the `.code-improver/` artifact tree may be read or written.
3. **Initial review.** Read the full `SKILL.md` and any `agents/openai.yaml` in the skill directory. Evaluate against these quality dimensions:
   - **Trigger clarity**: does the frontmatter description and trigger predicate route precisely?
   - **Authority fidelity**: does the body restatement match the declared authority without expansion?
   - **Procedure completeness**: are steps numbered, executable, and free of ambiguity or missing branches?
   - **Semantic minimum**: does every line earn its place by changing routing, authority, reads/writes, procedure, proof, failure handling, or license?
   - **Failure coverage**: are named failure classes present with partial-result rules, rollback rules, and exact blocked-terminal output?
   - **Self-containment**: does the body avoid pointers to other skills, AGENTS.md, system prompts, or rule files?
   - **Provenance**: is origin, revision, license, and adaptation statement present?
   Classify each finding as `critical`, `major`, or `minor`. Write findings to `.code-improver/run-<timestamp>/review-<N>.json`.
4. **Gate check.** If zero critical and zero major findings exist, proceed to step 7 (finalization). If the iteration count equals max iterations, proceed to step 6 (non-converged terminal).
5. **Fix cycle.** For each critical and major finding, in severity-then-file-order:
   a. Read the affected section.
   b. Apply the minimal edit that resolves the finding without changing the skill's contract, trigger, authority, side-effect, or done predicate.
   c. Write the edit. Record the diff in `.code-improver/run-<timestamp>/fix-<N>.json`.
   d. After all fixes for this iteration, re-run the review (step 3) with incremented iteration counter.
6. **Non-converged terminal.** If max iterations are exhausted with remaining critical or major findings, report `non-converged` with the remaining finding count and severity breakdown. Do not present this as convergence.
7. **Finalization.** Run a scope check: confirm no edit changed the trigger predicate, authority class, side-effect target, or done predicate. Run a regression check: confirm the edited skill still parses (valid frontmatter, required sections present). If either check fails, revert the last iteration's edits and report `finalization-failed`. If both pass, write the final review to `.code-improver/run-<timestamp>/final-review.json` and report `converged`.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| `invalid-target` | Target path does not exist or lacks valid skill frontmatter. Report and stop. No files written beyond target.txt. |
| `scope-violation` | An edit would touch a file outside the resolved skill directory or `.code-improver/`. Revert the edit, record the violation, and continue with remaining findings. |
| `non-converged` | Max iterations exhausted with critical or major findings remaining. Report the count and severity breakdown. Do not claim convergence. |
| `finalization-failed` | Post-convergence scope or regression check fails. Revert the last iteration's edits. Report the specific check failure. |
| `review-error` | The review step itself fails (unparseable skill, tool error). Record the error, skip the fix cycle, and report `review-error` with the error message. |

Partial results: each iteration's review and fix artifacts are written incrementally. A mid-run interruption preserves all artifacts written so far. Resume by passing the `.code-improver/run-<timestamp>` directory as the improvement scope.

## Output
On `converged`: a report listing the final review findings (all minor or informational), the total iteration count, and the path to `.code-improver/run-<timestamp>/final-review.json`.

On `non-converged`: a report listing the remaining critical and major findings, the iteration count, and the path to the last review artifact.

On `invalid-target`, `finalization-failed`, or `review-error`: a terminal status message with the specific failure class and diagnostic detail.

## Provenance

Adapted from Trail of Bits `code-improver` plugin skill-improver (`/plugins/code-improver/skills/skill-improver/SKILL.md`).
Origin: https://github.com/trailofbits/skills
Pinned revision: d1f1575cff97816e5cc08af66cd2506099c681d3
License: CC-BY-SA-4.0. This adaptation preserves Trail of Bits attribution and source link, marks modifications, licenses adaptations ShareAlike, claims no trademark rights, and does not reuse trail-of-bits-mark.svg as branding.
Adaptation: Clean-room rewrite for ODIN 2.0 module structure. Content derived from normalized candidate metadata; no third-party expression was copied verbatim.
