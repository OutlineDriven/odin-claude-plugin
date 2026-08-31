---
name: review-fix
description: 'Use when the user runs /review on a branch, run a pre-landing multi-specialist review and return a scored report that accounts for every finding. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Review fix

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /review on a branch. |
| Authority | Reversible local: write only committed fix commits on the reviewed branch and one append-only review log. Roll back fix commits with `git revert` or `git reset` to the pre-review ref; the review log is never mutated after append. |
| Side effect | Committed fixes, a persisted review log, and dispatched specialist subagent reports. No push, publish, credential, or remote mutation. |
| Done | A pre-landing review report gives a quality score and accounts for every finding produced by the checklists and the eight specialist reviewers. |

## Inputs

- A branch under review and its merge base against the target branch. Both must be resolvable in the local working repository; if the base is ambiguous, stop and ask the user for the explicit base ref.
- Optional: a plan or spec file the branch is meant to implement, used only by the plan-completion pass when supplied.

## Procedure

1. Resolve the branch and base ref, then read the full diff (`git diff <base>...HEAD`) and the changed file contents. Stop if the diff is empty or unreadable rather than reviewing nothing.
2. Run the general and design checklists against the diff, recording each checklist finding with file, line, and severity.
3. Dispatch eight specialist reviewers as isolated subagents, each scoped to the diff plus the changed files it needs: api-contract, data-migration, maintainability, performance, red-team, security, simplification, and testing. Each subagent returns findings with file, line, severity, and a concrete fix recommendation or a no-finding verdict.
4. Apply fix-clear-defects-first ordering: before any judgment-call finding reaches the user, commit local fixes for every finding that is a clear, unambiguous defect with an obvious correct change. Commit each fix on the reviewed branch. Skip findings that need a design decision, a preference call, or missing information; route those to the report instead of guessing.
5. Re-read the post-fix diff and re-run only the specialists whose findings were fixed, to confirm the fix cleared the defect and introduced no new finding. A fix that does not clear its defect is reverted and the original finding is reclassified as unresolved.
6. Run the plan-completion pass only when a plan or spec was supplied: map each plan item to changed code and mark it done, partial, or unaddressed with evidence from the diff.
7. Account for every finding: each checklist and specialist finding is recorded as fixed, unresolved, or declined-with-reason. No finding is dropped, merged silently, or left without a disposition.
8. Append one review log entry (branch, base, timestamp, finding count by disposition, fix commit SHAs, quality score) to the persisted review log.
9. Return the pre-landing review report with the quality score and the full finding accounting.

## Failure and recovery
- Subagent failure: if a specialist subagent returns no usable verdict (error, empty, or off-scope output), retry it once with the same scope. If it still fails, record that specialist as `unverified` in the report; never report it as a clean pass.
- Non-convergent fixes: if a fix is reverted because it did not clear its defect and a second fix attempt also fails, mark the finding `unresolved` and stop fixing it; do not loop indefinitely.
- Scope widening: if a specialist proposes a change outside the reviewed diff, decline it and record the proposal as `out-of-scope`; do not expand the review to unrelated code.
- Partial-result rule: a report with any `unverified` or `unresolved` finding is still returned, but its quality score reflects the incomplete coverage and the done predicate is met only when every finding has a disposition, not when every finding is fixed.
- Rollback: fix commits are recoverable via `git revert <sha>` or `git reset --hard <pre-review-ref>`; the review log entry is append-only and is not rolled back.

## Output
A pre-landing review report containing: the quality score; the finding accounting table (finding, source specialist or checklist, file, line, severity, disposition: fixed / unresolved / declined-with-reason / out-of-scope / unverified); the list of fix commit SHAs; and, when a plan was supplied, the plan-completion map. The persisted review log gains one appended entry.

## Provenance

Origin: https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69. License: MIT (Copyright (c) 2026 Garry Tan), blob 35029511144443297cad2d26e4bac17d0e352f93. Adaptation: clean-room re-derivation of the pre-landing review pipeline (diff read, general and design checklists, eight specialist reviewers, fix-clear-defects-first ordering, subagent dispatch, and finding accounting) into a self-contained procedure; no third-party expressive prose or code copied wholesale.
