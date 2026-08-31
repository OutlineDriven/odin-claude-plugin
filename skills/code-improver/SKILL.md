---
name: code-improver
description: 'Use when a user asks to iteratively review and fix an arbitrary code target with a specifically named installed reviewer and explicit scope. The loop runs review-and-fix rounds with a cross-round findings ledger, a mechanical scope guard, oscillation escalation, and a scope-checked finalize pass until a final review reports zero critical or major findings, then reports a converged, capped, escalated, or halted result. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Code improver

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user asks to iteratively review and fix an arbitrary code target with a specifically named installed reviewer and explicit scope. |
| Authority | Write only confirmed in-scope files plus `.code-improver` run artifacts and metrics; never commit; recover via the baseline diff or per-round diffs. |
| Side effect | Confirmed in-scope files plus `.code-improver/<target>/` artifacts and metrics; all changes stay in the working tree. |
| Done | A final reviewer pass reports zero critical or major findings after all fixes and finalization edits are scope-checked; otherwise the result is explicitly capped, escalated, or halted. |

## Inputs

- **Target** (required): absolute path to the directory under improvement. Resolve relative paths against the working directory and verify it exists.
- **Reviewer** (required): the installed agent or skill that performs every review. The user must name it — there is no default and no bundled reviewer. Determine its kind: a namespaced agent (`"kind": "agent"`) or an installed skill (`"kind": "skill"`); if the name could be either, ask the user. If no reviewer was named, ask — do not pick one.
- **Scope** (required): repo-relative globs the loop may touch. If the user did not give one, propose `<repo-relative-target>/**` and confirm before launching.
- **maxRounds** (optional): fix budget; default 5.
- **finalize** (optional): `{version_bump, narration_strip, docs_pass}` overrides; defaults are version bump when the target sits inside a plugin, narration strip and docs pass always.
- **decision** (optional, continuation only): the user's verbatim ruling, supplied to a fresh run after an escalation.

## Procedure

1. Collect the three required inputs (target, reviewer, scope) without guessing. Resolve and confirm each as above; do not launch until all three are settled.
2. Establish a baseline. If the target is in a git repository, snapshot the current commit as the baseline. If it is not, initialize one with an explicit `code-improver-baseline` identity and record that loudly in the run notes. The baseline is what every scope check and fix-verification diff is taken against.
3. Initialize the ledger at `.code-improver/<target>/ledger.json` with an empty findings list. If a ledger already exists on disk, reload it so every prior finding, rejection, and verdict carries over; rounds restart but re-derivation does not.
4. Probe the named reviewer. If it does not resolve in this session, stop with `halted: "reviewer-unavailable"` and the install instruction for the plugin that provides it. Do not self-review the target or substitute an inline imitation — the ledger, scope guard, and escalation guarantees depend on the real reviewer.
5. For each round up to `maxRounds`:
   a. Dispatch the named reviewer over the in-scope files and collect findings, each with a stable id and a severity of critical, major, or minor. Reviewers verify fixes instead of trusting them and may not re-file a rejected finding without new evidence. If the reviewer prescribes specialist dispatches, execute them (up to 3 waves of 8) and feed the reports back until the review finishes; a specialist that does not resolve halts like a missing reviewer and a failed one is reported to the merge, never dropped.
   b. If the review reports zero critical or major findings, exit the round loop and go to step 7 (finalize).
   c. Apply fixes for the open critical and major findings. Touch only files inside the dispatched scope globs; a fix that needs an out-of-scope edit is rejected with `requires out-of-scope change: <path>`, not made. Register any file created with `git add -N <file>` so the diff and the scope guard can see it. A behavior-changing fix must carry a pin — a test that fails against the pre-fix code; a heuristic over strings or severities needs table pins covering the classes, not one example; prose and frontmatter fixes need no pin. Never weaken a documented guarantee, threat model, or stated behavior to make a finding go away — if a real finding is structurally unsatisfiable, reject it with `structural: true` so the loop escalates. Make minimal diffs: fix the finding, not the file. The fixer may not run `git checkout --`, `git stash`, `git reset`, `git clean`, or `git commit`.
   d. Run the scope guard. Diff the working tree against the baseline and match every changed path against the declared scope globs: any out-of-scope change inside the repository halts the loop on the spot. `git diff` cannot see files git does not track, so guard untracked files by content — hash each one (up to 50; name the rest in the notes as unguarded) and treat a hash that moved, a file that vanished, or a hash the check failed to report as a violation. On any violation, stop with `halted: "scope-violation"` and the violating paths.
   e. Record a verdict for every finding in the ledger — `fixed` (name the pin), `rejected: <specific reason>`, or `deferred` (minor/info only; deferring a critical or major finding just leaves it open). A finding silently skipped stays open and costs a round. Write the ledger to disk every round and write the cumulative diff to `fixes-round-N.diff`.
   f. Detect oscillation: non-decreasing blocking counts over three rounds, the same finding open three consecutive rounds, or a finding "fixed" twice. On any of these, stop with an `escalation` result naming the finding ids — this needs a design decision, not more rounds.
6. At the round cap, run one final review-only round. If it is not clean, stop with `capped: true` (NOT converged) and list `open_blocking`. Do not present an unreviewed fix as done.
7. Run the finalize pass: strip session narration from in-scope files, collapse version churn to exactly one bump (only when the target sits inside a plugin and `version_bump` is not disabled), and run a docs-match-code pass (unless disabled). When a marketplace manifest repeats the plugin version, bring that file into scope so the one bump lands in both places.
8. Scope-check and read every finalize edit for regressions. A narration strip that rewrote legitimate content, a docs pass that made a statement false, or a version that is not exactly one increment stops the run with `halted: "finalize-regression"` and the named sites. Completion additionally requires no unregistered new files in scope.
9. Collect metrics into `.code-improver/<target>/metrics.json` and write the final artifacts (`ledger.json`, `ledger.md`, `status.md`, `pre-finalize.diff`, `post-finalize.diff`).
10. Report the structured result (below). Do not end the turn while a round is in flight; a round that stops mid-way abandons its guarantees.

## Failure and recovery
- **`halted: "reviewer-unavailable"`**: the named reviewer is not installed. Relay the install instruction and stop; nothing was reviewed or edited. Re-run after installing.
- **`halted: "scope-violation"`**: an out-of-scope change was detected. Relay the violating paths; inspect, revert or widen `scope`, and re-run. The ledger on disk is current to the last completed round.
- **`escalation`**: iteration cannot resolve the findings. Relay the finding ids and the design question. Continuing is a fresh run with the same target and reviewer plus `decision: "<the user's verbatim ruling>"`; the reloaded ledger carries every finding, rejection, and verdict forward.
- **`capped: true` (NOT converged)**: the fix budget ran out and the final review still found blocking issues. List `open_blocking`; raise `maxRounds` or fix the findings manually, then re-run from the ledger.
- **`halted: "finalize-regression"`**: the finalize pass rewrote something it should not have. `finalize_regressions` names each site; `diff -u pre-finalize.diff post-finalize.diff` shows the whole pass. Revert the named sites, or re-run with the offending finalize pass disabled. The review-and-fix work is already on disk.
- **Rollback**: nothing is ever committed; all changes stay in the working tree. Revert with the baseline diff or the per-round `fixes-round-N.diff` artifacts. The ledger is written every round, so an interrupted run resumes from disk without re-deriving anything. To stop a run, stop the in-flight round; the ledger is current to the last completed round.
- Never swallow an error or report the done predicate as held when it is not. A result that is not `converged: true` is explicitly capped, escalated, or halted.

## Output
A structured result with exactly one terminal classification:

- **`converged: true`** — the last action was a review with zero critical/major findings. Report rounds used, `open_minor_count`, and the artifact paths (`ledger_path`, `metrics`).
- **`capped: true`** — capped, NOT converged; list `open_blocking`.
- **`escalation`** — relay the escalation message and finding ids.
- **`halted`** — relay `violations`/`new_untracked_files`, `finalize_regressions`, or the reviewer-unavailable note as applicable.

`notes` always travel with the result and must be surfaced (e.g. "a git repository was initialized"). Nothing is committed; the working tree holds every change for review.

## Provenance

Origin: `https://github.com/trailofbits/skills`, revision `d1f1575cff97816e5cc08af66cd2506099c681d3`, file `plugins/code-improver/skills/code-improver/SKILL.md`. License: CC-BY-SA-4.0 — preserve Trail of Bits attribution and the source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse `trail-of-bits-mark.svg` as branding. This is a clean-room adaptation that preserves the reviewer-named, explicit-scope loop mechanism and its ledger, scope-guard, oscillation, and finalize guarantees without copying the source expression.
