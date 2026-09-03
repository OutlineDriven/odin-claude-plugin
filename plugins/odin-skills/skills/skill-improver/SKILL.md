---
name: skill-improver
description: 'Use when a user asks to iteratively improve a skill, fix skill-quality findings, or resolve scanner alerts (W001, W011, W012) on a skill. Resolves the target, runs structured reviews or scanner-backed remediation, applies fixes with per-edit re-scan, and repeats until clean. Not for agent grading; use skill-doctor for that.'
---

# Skill improver

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user asks to iteratively improve a Claude Code skill, fix skill-quality findings, resolve scanner alerts on a skill, or resume a previously escalated skill-improvement run. |
| Authority | Reversible local writes only. Edit files within the resolved skill directory and the `.code-improver/` run-artifact directory. No remote mutation, credential change, paid action, publishing, or deployment. Roll back any edit by restoring the prior file content from the run artifact or version control. |
| Side effect | Resolved skill/plugin scope plus `.code-improver` run artifacts and metrics. |
| Done | A final skill review contains no critical or major findings and finalization edits pass scope and regression checks, or a non-success terminal status is reported without being presented as convergence. In scanner mode, a clean scan with information preserved and the pre-authoring checklist passed. |

## Inputs

1. **Target skill path** (required): a path to a `SKILL.md` file or a skill slug that resolves to one. If a slug is given, resolve it by searching `skills/`.
2. **Improvement scope** (optional): specific findings to fix, a prior `.code-improver/` run directory to resume, or quality dimensions to focus on. If omitted, run a full review-and-fix cycle.
3. **Scanner mode** (optional): when the improvement scope is scanner alerts (W001, W011, W012), provide the scan output listing each alert as a code with its file, or the skill directory to scan to produce one. Optional `SNYK_TOKEN` is supplied by the operator environment, never requested or stored by this workflow.

## Procedure

1. **Resolve target.** Locate the `SKILL.md` file. If the path does not exist or does not contain a valid skill frontmatter block, report `invalid-target` and stop. Record the resolved path in `.code-improver/run-<timestamp>/target.txt`. Done when: the target is resolved and recorded, or `invalid-target` is reported.
2. **Bound scope.** The improvement scope is the single resolved skill directory. No file outside that directory or the `.code-improver/` artifact tree may be read or written. Done when: the scope boundary is established.
3. **Initial review.** Read the full `SKILL.md` and any `agents/openai.yaml` in the skill directory. Evaluate against these quality dimensions:
   - Trigger clarity: does the frontmatter description and trigger predicate route precisely?
   - Authority fidelity: does the body restatement match the declared authority without expansion?
   - Procedure completeness: are steps numbered, executable, and free of ambiguity or missing branches?
   - Semantic minimum: does every line earn its place by changing routing, authority, reads/writes, procedure, proof, failure handling, or license?
   - Failure coverage: are named failure classes present with partial-result rules, rollback rules, and exact blocked-terminal output?
   - Self-containment: does the body avoid pointers to other skills, AGENTS.md, system prompts, or rule files?
   - Provenance: is origin, revision, license, and adaptation statement present?
   Classify each finding as `critical`, `major`, or `minor`. Write findings to `.code-improver/run-<timestamp>/review-<N>.json`. Done when: findings are classified and written.
4. **Gate check.** If zero critical and zero major findings exist, proceed to step 7 (finalization). If the iteration count equals max iterations, proceed to step 6 (non-converged terminal). Done when: the gate decision is made.
5. **Fix cycle.** For each critical and major finding, in severity-then-file-order:
   a. Read the affected section.
   b. Apply the minimal edit that resolves the finding without changing the skill's contract, trigger, authority, side-effect, or done predicate.
   c. Write the edit. Record the diff in `.code-improver/run-<timestamp>/fix-<N>.json`.
   d. After all fixes for this iteration, re-run the review (step 3) with incremented iteration counter.
   Done when: all critical and major findings for this iteration are fixed and the review is re-run.
6. **Non-converged terminal.** If max iterations are exhausted with remaining critical or major findings, report `non-converged` with the remaining finding count and severity breakdown. Do not present this as convergence. Done when: the non-converged status is reported.
7. **Finalization.** Run a scope check: confirm no edit changed the trigger predicate, authority class, side-effect target, or done predicate. Run a regression check: confirm the edited skill still parses (valid frontmatter, required sections present). If either check fails, revert the last iteration's edits and report `finalization-failed`. If both pass, write the final review to `.code-improver/run-<timestamp>/final-review.json` and report `converged`. Done when: the finalization verdict is reported.

## Scanner mode

When the improvement scope is scanner alerts (W001, W011, W012), the fix cycle uses scanner-backed remediation instead of the review-based fix cycle. Parse the scan output into `(alert code, file)` pairs. Only files named in the alert list are edited.

1. **Order the queue.** Fix one alert at a time in order: W001, W011, then W012. Starting with the simplest alert minimizes rework when one fix surfaces another.
2. **Apply the restructuring rule for the alert code.** Every rule preserves the original information by relocating or rephrasing it; deleting content to silence an alert is prohibited:
   - W001 (prompt injection via named MCP tool functions): replace each explicitly named tool function in body prose with a generic formulation naming the capability instead. Tool names remain acceptable in the frontmatter `allowed-tools` field; only the body is restricted.
   - W011 (imperative external-content instructions): rewrite sentences that send the agent to fetch, check, or evaluate external content into passive availability statements that keep the URL and its purpose. Remove `always` from instructions involving external resources. Move tool invocations from prose checklists into code blocks. Running a tool is fine, but its remote-sourced output must not be the sole trigger for acting.
   - W012 (external content fetched and executed at runtime): replace `@latest` with an exact pinned version. Move install commands out of body prose into the alerted skill's frontmatter metadata install block. Pin GitHub Actions to a major version verified to exist in the action's releases. Never pipe remote content into a shell.
3. **Re-run the scanner after each fix.** Run `SNYK_TOKEN=<token> snyk-agent-scan --skills <skill-directory>`. If the binary is absent, run `uvx snyk-agent-scan` without installing it. Compare alert counts. If the count did not drop, undo that edit and choose a different restructuring; never stack unverified changes.
4. **Queue surfaced alerts.** Expect W011 fixes to surface hidden W012 alerts as URLs become prominent after restructuring. Treat each surfaced alert as a new item in the ordered queue.
5. **Restructure likely false positives.** Treat a URL in a reference-data table cell, official documentation link, frontmatter homepage link, or `always` outside an external-resource sentence the same as a confirmed alert: use the passive-availability pattern. Do not override, suppress, or assume scanner error.
6. **Prevent recurrence.** When the scan is clean, apply the pre-authoring checklist to the edited content: no sentence with the agent acting on a URL, no `@latest` in body install instructions, no MCP tool names in body prose, install commands in frontmatter, GitHub Actions versions real, tool invocations in code blocks, and no `always` before external-resource instructions.

Scanner mode failure classes:
| Failure class | Behavior |
|---|---|
| `scanner-unavailable` | Scanner binary missing and `uvx` drop-in fails, or `SNYK_TOKEN` missing. Report the exact error and stop. No edit made in an unverified run may be claimed as fixed. |
| `alert-count-not-dropping` | Restore the pre-edit bytes and select a different restructuring. The failing edit must not survive. |
| `alert-count-rising` | Revert to the last state with the lowest verified count and stop the loop there. |
| `information-preservation-limit` | An alert cannot clear without deleting content. Stop editing, keep all verified fixes, and return the blocking file, alert code, and constraint. Do not claim the done predicate. |

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
On `converged`: a report listing the final review findings (all minor or informational), the total iteration count, and the path to `.code-improver/run-<timestamp>/final-review.json`. On `non-converged`: remaining critical and major findings, iteration count, and last review artifact path. On `invalid-target`, `finalization-failed`, or `review-error`: a terminal status message with the specific failure class and diagnostic detail. In scanner mode: a per-file remediation report ordered by alert queue, listing code, restructuring, before-and-after counts, then final clean status or exact blockers, and the pre-authoring checklist result.
