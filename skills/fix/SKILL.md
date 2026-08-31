---
name: fix
description: 'Use when the user says "fix" or hands a verifier failure — guard-passing repair loop. Also handles finder-fixer when findings have scope globs, iterative-improve when a named reviewer is given, and review-loop on /review. Not for remote, credential, publish, or deploy.'
---

# Fix

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says "fix", "make it pass", or "apply the findings", or supplies a verifier failure, findings artifact, or bug description. Also fires for `/review` on a branch (review-loop), iterative review-and-fix with a named reviewer (iterative-improve), or bounded findings with scope globs (finder-fixer). CI-on-PR workflows, PR review comments, merge conflicts, and analysis-only tasks are out of scope. |
| Authority | VCS-reversible destructive in default and review-loop modes (edits VCS-tracked source, checkpoint commits, recovery via `git revert`); working-tree-only in finder-fixer and iterative-improve modes (no commits, no git state-changing commands). Refuses protected branches in committing modes. |
| Side effect | Default/review-loop: local writes plus checkpoint commits; red iterations revert via `git revert HEAD --no-edit`; never `git reset --hard` or `git checkout -- .`. Finder-fixer/iterative-improve: writes only to in-scope files and run artifacts; all changes stay in the working tree. |
| Done | Default: guard passes (KEEP), or item REWORKed/SKIPped with a blocked.md entry, or loop HALTs after 3 skips. Finder-fixer: every dispatched finding has a verdict. Iterative-improve: final review reports zero critical/major, or result is capped/escalated/halted. Review-loop: every finding has a disposition and the report carries a quality score. No test deletion and no suppression via ignore flags in any mode. |

## Modes

The classifier (`references/classifier.md`) routes input to one of seven modes. The first three share the default guard-passing repair loop; the last three are the absorbed modes with their own verifier and termination contract.

| Mode | Condition | Verifier | Reference |
|------|-----------|----------|-----------|
| `verifier-failure` | Raw verifier stdout/stderr | Repo-native test + lint guard | `references/verifiers.md` |
| `findings` | Structured findings artifact (no scope globs) | Repo-native test + lint guard | `references/verifiers.md` |
| `bug-spec` | Natural-language bug description (catch-all) | Repo-native test + lint guard | `references/verifiers.md` |
| `review-loop` | `/review` on a branch | 8 specialist subagents | `references/review-loop.md` |
| `iterative-improve` | Named reviewer + target + scope | Named external reviewer agent | `references/iterative-improve.md` |
| `finder-fixer` | Bounded findings + explicit scope globs | Next independent review (regression pins) | `references/finder-fixer.md` |

The `gh-route` mode (priority 1) sub-routes to `gh-fix-ci` or `resolve-pr-feedback` and does not enter the fix loop.

## Inputs

- A failure input: raw verifier stdout/stderr, a path to a findings artifact (`*/findings.md`, `*/review/*.md`, `*/debug/*.md`), structured findings text, or a natural-language bug description.
- For `review-loop`: a branch under review and its merge base; optional plan or spec file.
- For `iterative-improve`: target path, named reviewer, scope globs; optional `maxRounds` (default 5), `finalize` overrides, `decision` (continuation only).
- For `finder-fixer`: a bounded list of blocking findings with evidence and cited locations; explicit file scope globs; optional test command or pin conventions.
- Optional: `iterations: N` or `--iterations N` to override the default 20-iteration cap (default modes only).
- Optional: `--mode <X>` to bypass the classifier.

## Procedure

1. **Classify input** (first match wins) and emit a detection line before any edit:
   ```
   detected: <mode> — target=TARGET guard=GUARD scope=SCOPE cap=20
   ```
   See `references/classifier.md` for the full mode table, signals, and worked examples. Use bare `none` (not `<none>`) for empty target/guard; `*` for repo-wide scope.

2. **Resolve ambiguity** with a single-select `AskUserQuestion` (never `multiSelect`), one question per axis, when `MIXED_MODE`, `GH_PARTIAL`, `LANG_UNKNOWN`, or `SCOPE_AMBIGUOUS` fires. See `references/classifier.md` § Ambiguity flags.
   Done when: a single mode is selected or no ambiguity flag fires.

3. **Refuse protected branches** (committing modes only: default and review-loop). Run `git branch --show-current`; if it matches `main`, `master`, `release/*`, or a branch the repo marks protected, emit `detected: ... — REFUSED: fix loop cannot run on protected branch <branch>; create a fix branch first` and stop. Finder-fixer and iterative-improve skip this check — they do not mutate VCS state.
   Done when: branch is not protected, or mode is non-committing.

4. **Detect verifier and guard** — mode-dependent:
   - Default modes: repo-native first (use `fd --max-depth 2` to locate `Justfile`, `Makefile`, `package.json`, `dune-project`), then language fallbacks. See `references/verifiers.md` § 1–2.
   - `iterative-improve`: probe the named reviewer; if it does not resolve, stop with `halted: "reviewer-unavailable"`. See `references/iterative-improve.md`.
   - `review-loop`: the eight specialist subagents are the verifiers. See `references/review-loop.md`.
   - `finder-fixer`: no in-loop verifier; each behavioral fix carries a regression pin. See `references/finder-fixer.md`.
   Done when: verifier and guard are identified, or the mode has no in-loop verifier.

5. **Compute baseline.** Default modes: run all verifiers, extract error counts per pattern (`references/verifiers.md` § 4). If baseline errors == 0, emit `detected: ... — no failures found; exiting without changes` and stop. `iterative-improve`: snapshot the current commit as baseline. `review-loop`: read the full diff against the merge base. `finder-fixer`: read the dispatched findings and confirm each cited location exists and is in-scope.
   Done when: baseline is recorded and non-empty (or the loop exits early).

6. **Iterative loop** (cap default 20 for default modes, `maxRounds` default 5 for iterative-improve). The spine is in `references/loop.md` — attempt → verify → classify → retry-or-stop. Mode-specific mechanics:
   - **Default modes**: one minimal fix per iteration, checkpoint commit, run verifiers + guard, decide KEEP/REWORK/DISCARD per the decide matrix, revert on red via `git revert HEAD --no-edit`. Progress print every 5 iterations.
   - **`finder-fixer`**: one verdict per finding (`fixed`/`rejected`/`deferred`), regression pin for each behavioral change, scope guard before every edit, no commits, no narration, no goalpost moving. See `references/finder-fixer.md`.
   - **`iterative-improve`**: dispatch named reviewer, collect findings with stable ids, apply fixes for critical/major only, run scope guard (hash-based for untracked files), record verdicts in ledger, detect oscillation. At cap, run final review-only round. See `references/iterative-improve.md`.
   - **`review-loop`**: run checklists, dispatch eight specialists, apply fix-clear-defects-first ordering (commit clear-defect fixes on the reviewed branch), re-run fixed specialists, account for every finding. See `references/review-loop.md`.
   Done when: the mode's termination condition is met (see Contract § Done).

7. **Recursion guard.** When invoked with explicit `--mode <X>`, the classifier is bypassed entirely and no auto-routing fires. The `--mode` flag is the only bypass; its absence always runs the classifier. This prevents re-entrant loops from callers that delegate back into fix.

8. **Never suppress.** Do not add `@ts-ignore`, `# type: ignore`, `// eslint-disable`, or equivalent ignore flags to silence errors. Do not delete tests to make them pass. One fix per iteration — no "while I'm here" changes. In `iterative-improve`, the finalize pass strips session narration from in-scope files; in `finder-fixer`, no narration is added in the first place.

## Failure and recovery

- **No verifier output** (default modes): emit a warning, raise `LANG_UNKNOWN`, and ask which verifier to run.
- **3 strikes on one item** (default modes): SKIP, append to `blocked.md`, recommend root-cause investigation.
- **Guard ambiguous** (default modes): ask for the guard command via single-select `AskUserQuestion`.
- **Protected branch** (committing modes): REFUSE before entering the loop.
- **State mismatch after revert** (default modes): halt and report; the working tree does not match the expected baseline.
- **Cap exhausted** (default modes): HALT and emit a summary with remaining errors.
- **`halted: "reviewer-unavailable"`** (iterative-improve): the named reviewer is not installed. Relay the install instruction and stop.
- **`halted: "scope-violation"`** (iterative-improve, finder-fixer): an out-of-scope change was detected. Relay the violating paths.
- **`escalation`** (iterative-improve): oscillation detected; relay finding ids and the design question. Continuing is a fresh run with `decision: "<user's verbatim ruling>"`.
- **`capped: true`** (iterative-improve): fix budget ran out, final review still found blocking issues. NOT converged.
- **`halted: "finalize-regression"`** (iterative-improve): the finalize pass rewrote something it should not have.
- **Subagent failure** (review-loop): retry once; if it still fails, record that specialist as `unverified`; never report it as a clean pass.
- **Non-convergent fixes** (review-loop): if a fix is reverted and a second attempt also fails, mark `unresolved` and stop fixing that finding.
- **Structural conflict** (finder-fixer, iterative-improve): a real finding that a documented immutable demand makes unsatisfiable is rejected with `structural: true`; the loop escalates it to the user.
- Partial results: kept commits from prior green iterations remain; the loop never widens scope beyond the classified target. Never swallow errors or claim the done predicate holds when the guard has not passed.

## Output

- **Default modes**: a session directory at `fix/{YYMMDD}-{HHMM}-{slug}/` containing `fix-results.tsv` (iteration log), `summary.md` (what was fixed, what remains, `fix_score`), and `blocked.md` (3+ attempt items). Terminal classification per item: `fixed`, `rework`, `discard`, or `blocked`.
- **`finder-fixer`**: one verdict per dispatched finding (`fixed`/`rejected`/`deferred`) with a named regression pin for each `fixed` behavioral change and a specific reason for each `rejected` or `deferred` finding.
- **`iterative-improve`**: a structured result with exactly one terminal classification (`converged: true` / `capped: true` / `escalation` / `halted`), plus artifact paths (`ledger_path`, `metrics`). Nothing is committed; the working tree holds every change.
- **`review-loop`**: a pre-landing review report with the quality score, the finding accounting table (finding, source, file, line, severity, disposition), fix commit SHAs, and the plan-completion map when a plan was supplied. The persisted review log gains one appended entry.

## Provenance

Origin: odin-1.x `skills/fix/SKILL.md` (project-owned, no third-party license). Adapted as a self-contained ODIN 2.0 procedure: reference files (`classifier.md`, `loop.md`, `verifiers.md`) folded inline; inter-skill dispatch routes and partner pointers removed; iterative-repair observable contract preserved.

Absorbed skills (W2 merge M6):
- `code-improver` → `iterative-improve` mode. Origin: https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3. License: CC-BY-SA-4.0 — preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, never reuse `trail-of-bits-mark.svg` as branding.
- `code-improver-fixer` → `finder-fixer` mode. Origin: Trail of Bits skills, same revision and license as above, file `plugins/code-improver/agents/fixer.md`.
- `review-fix` → `review-loop` mode. Origin: https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69. License: MIT (Copyright (c) 2026 Garry Tan).
