---
name: typing-exclusion-worker
description: 'Use when removing modules from pyproject mypy exclusions or running a typing-debt worker batch. Not for cross-team or out-of-scope typing work.'
---

# Typing exclusion worker

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to remove modules from `pyproject.toml` mypy exclusions or to run one typing-debt worker batch. |
| Authority | Reversible local: write only the `pyproject.toml` mypy exclusion entries for assigned modules and source or test files inside the assigned ownership boundary. Rollback restores file contents from a content-complete baseline recorded before the first edit. |
| Side effect | Removes assigned module entries from the mypy exclusion override and fixes the typing issues those exclusions surface. No cross-team modules, no unrelated files, no dependency or config changes beyond the exclusion list. |
| Done | Every assigned module is removed from the exclusion list and a batch summary reports removed modules, changed files, key fixes, and passing targeted mypy, targeted tests, and pre-commit on changed files. |

## Inputs

Required before any edit:

- Worktree or branch name the batch runs on.
- Exact module list to remove from exclusion.
- Ownership or domain boundary that bounds the batch.

Optional: customized validation commands; when absent, use the defaults in Procedure.

If any required input is missing or ambiguous, ask before editing.

## Procedure

1. Record a content-complete baseline before editing. Save the full contents of every file the batch may touch: `pyproject.toml` plus every source and test file inside the ownership boundary. Use a temporary commit, a stash, or an in-memory content snapshot. Then confirm prerequisites: `mypy`, `pre-commit`, and `pytest` run in this repo, and every assigned module name appears in the mypy exclusion override in `pyproject.toml`. Done when: the content baseline is recorded and every assigned module is confirmed excluded.

2. Remove only the assigned module entries from the mypy exclusion override in `pyproject.toml`; leave every other entry byte-identical. Done when: only the assigned entries are removed and all other entries are unchanged.

3. Run mypy on the assigned scope, targeted paths first. Fix each surfaced error with explicit typing in scope: `isinstance` narrowing before attribute access on unions, accurate return types, typed class attributes, signature-compatible method overrides, and relation-aware attribute access where stubs omit raw id fields. Never add a blanket `# type: ignore`; when a narrow ignore is unavoidable, write `# type: ignore[code]` with a one-line reason and record it for the summary. Done when: targeted mypy passes on the assigned scope.

4. Run targeted pytest over the modules touched in step 3 and fix regressions in scope. Then run `pre-commit run --files <changed files>`; if hooks auto-fix files, rerun until clean. Done when: targeted pytest passes on the touched modules and pre-commit passes clean on changed files.

5. Prove isolation by diffing file contents against the content baseline: for every file in the baseline, compare its current contents to the saved baseline contents. A file that changed must be either `pyproject.toml` or a source or test file inside the ownership boundary. A file whose pre-batch contents differed from the baseline (a pre-existing user edit) must still differ by exactly the same lines plus the batch's changes. Then emit the batch summary in the exact structure under Output. Done when: isolation is proven by content diff and the summary is emitted with every field filled from measured results.

Stop and report rather than widening scope if a fix requires changes in another team or domain, the exclusion entries conflict irreconcilably in `pyproject.toml`, or the error volume makes the batch too large and calls for a split.

## Failure and recovery

- Required input missing or unresolvably ambiguous after asking: no mutation; return blocked naming the input.
- Prerequisite failure (assigned module absent from the exclusion list, or mypy, pre-commit, or pytest unavailable): no mutation; return blocked with the failing prerequisite.
- Unresolvable exclusion conflict in `pyproject.toml`: revert only the exclusion edit and return blocked with the conflicting entries.
- Checks still fail after in-scope fixes are exhausted, or a fix needs out-of-scope edits: restore every touched file from the content baseline, which preserves pre-existing user edits because contents were saved, then return blocked with the failing check output and the files that need wider authority.
- Pre-commit loop: if a hook modifies files on three consecutive runs, restore the hook-touched files from the content baseline and return blocked naming the hook.

Partial-result rule: the batch is either complete per the Done contract or fully reverted to the content baseline. Never report a worktree as done when some assigned modules remain excluded or checks fail. A smaller batch for the remainder may appear in the blocked reason, but must not run without a new assigned module list.

## Output

A batch summary with sections in order: branch or worktree and ownership, modules removed from exclusion, files changed, key typing fixes, validation (mypy, pre-commit, pytest pass or fail with scope), and notes (remaining blockers, new ignore entries).

Terminal classification: `complete` when the Done contract holds; otherwise `blocked` with the named failure class and the recovery taken. Both carry the batch summary; a blocked result never claims passing checks.
