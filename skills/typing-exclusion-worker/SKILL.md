---
name: typing-exclusion-worker
description: 'Use when the user asks to remove modules from pyproject mypy exclusions or to run a typing-debt worker batch; removes only the assigned modules from the mypy exclusion override, fixes the surfaced typing issues in scope, and returns a batch summary backed by passing targeted mypy, targeted tests, and pre-commit. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Typing exclusion worker

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to remove modules from `pyproject.toml` mypy exclusions or to run one typing-debt worker batch. |
| Authority | Reversible-local: write only the `pyproject.toml` mypy exclusion entries for assigned modules and source or test files inside the assigned ownership boundary. Rollback is `git restore -- <batch-touched files>` against the pre-batch baseline recorded before the first edit. |
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

1. Bound the batch before mutation: record `git status --porcelain` as the baseline, confirm `mypy`, `pre-commit`, and `pytest` run in this repo, and confirm every assigned module name appears in the mypy exclusion override in `pyproject.toml`. An assigned module that is not excluded, or a missing tool, stops the batch before any edit.
2. Remove only the assigned module entries from the mypy exclusion override in `pyproject.toml`; leave every other entry byte-identical.
3. Run mypy on the assigned scope, targeted paths first. Fix each surfaced error with explicit typing in scope: `isinstance` narrowing before attribute access on unions, accurate return types, typed class attributes, signature-compatible method overrides, and relation-aware attribute access where stubs omit raw id fields. Never add a blanket `# type: ignore`; when a narrow ignore is unavoidable, write `# type: ignore[code]` with a one-line reason and record it for the summary.
4. Run targeted pytest over the modules touched in step 3 and fix regressions in scope.
5. Run `pre-commit run --files <changed files>`; if hooks auto-fix files, rerun until clean.
6. After the final edit, re-run the targeted mypy and pytest commands, then diff `git status --porcelain` against the baseline to prove no unrelated file changed.
7. Emit the batch summary in the exact structure under Output.

Stop and report instead of widening scope when a fix requires touching another team or domain, when the exclusion entries cannot be removed without an unresolvable conflict in `pyproject.toml`, or when the error volume shows the batch is too large and should be split.

## Failure and recovery
- Required input missing or unresolvably ambiguous after asking: no mutation; return blocked naming the input.
- Prerequisite failure (assigned module absent from the exclusion list, or mypy, pre-commit, or pytest unavailable): no mutation; return blocked with the failing prerequisite.
- Unresolvable exclusion conflict in `pyproject.toml`: revert only the exclusion edit and return blocked with the conflicting entries.
- Checks still fail after in-scope fixes are exhausted, or a fix needs out-of-scope edits: run `git restore -- <batch-touched files>` to return the worktree to the baseline, then return blocked with the failing check output and the files that need wider authority.
- Pre-commit loop: if a hook modifies files on three consecutive runs, restore the files that hook touched from the baseline and return blocked naming the hook.

Partial-result rule: the batch is either complete per the Done contract or fully reverted to the baseline; a worktree with some assigned modules unexcluded but checks failing is never reported as done. Proposing a smaller batch for the remainder belongs in the blocked reason; it is never executed without a new assigned module list.

## Output
Return exactly this structure, filling every field from measured results:

```markdown
### Batch summary

- Branch/worktree: `<name>`
- Ownership/domain: `<team-or-domain>`

### Modules removed from exclusion

- `<module.path>`

### Files changed

- `<path>`

### Key typing fixes

- `<short rationale + fix>`

### Validation

- `mypy`: `<pass/fail + scope>`
- `pre-commit --files`: `<pass/fail>`
- `pytest`: `<pass/fail + scope>`

### Notes

- Remaining blockers: `<none or details>`
- New ignore entries: `<none or file + ignore code + reason>`
```

Terminal classification: `complete` when the Done contract holds; otherwise `blocked` with the named failure class and the recovery taken. Both carry the batch summary; a blocked result never claims passing checks.

## Provenance

Origin: getsentry/skills, path `skills/typing-exclusion-worker/SKILL.md`, pinned revision `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241`, license Apache-2.0. Adapted to the ODIN 2.0 skill contract: the batch workflow, scope limits, stop conditions, and summary template are retained from the Apache-2.0 source; the purpose framing, standalone best-practices list, and section structure were rewritten for this catalog rather than copied verbatim.
