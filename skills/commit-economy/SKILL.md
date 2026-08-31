---
name: commit-economy
description: 'Use when the user asks to clean up a finished commit message or bring it to handoff-ready form. Rewrites only the messages of HEAD or a short unpushed range; the tree stays byte-identical, each commit is re-signed with dates preserved by position, and git log alone carries the handoff. Don''t use for untracked data or changes without a version-control rollback.'
---

# Commit economy

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to clean up a finished commit's message, or a commit message needs handoff-ready form. |
| Authority | Rewrite only VCS-tracked commit messages. Show the exact commit set before mutation. Use the original refs and reflog as recovery. Never create or suggest a new commit. |
| Side effect | Rewrites commit messages only; the tree stays byte-identical; each rewritten commit is re-signed with its dates preserved by position. Local history only. |
| Done | `git diff old..new` is empty; each rewritten commit is signed with the intended dates; `git log` alone carries the handoff with the diff hidden. |

## Inputs

- The target commit or range: `HEAD` or a short unpushed range (`HEAD~N..HEAD`). Optional; default is `HEAD`.
- The intended message text for each target commit. Must be supplied by the user or derived from the existing message; never invented.
- Confirmation when any target commit is already pushed to a shared remote. Required before proceeding; otherwise stop.

## Procedure

1. Determine the exact target set: `HEAD`, or `HEAD~N..HEAD` for a short unpushed range. List the commits with `git log --format='%H %an <%ae> %ad %cn <%ce> %cd' <range>` so the set and per-position author/committer dates are visible.
2. Confirm none of the target commits are pushed to a shared remote (`git branch -r --contains <sha>`). If any is pushed, stop and require explicit user confirmation before continuing. Pushed history is otherwise untouched.
3. Record the original tree SHA of each target commit (`git rev-parse <sha>^{tree}`) and the original author and committer dates per commit, keyed by position in the range. These are the dates-by-position that re-signing must preserve.
4. Never create or suggest a new commit. Only rewrite the message of existing commits in the target set.
5. Rewrite each target commit's message to handoff-ready form: the message must let `git log` alone carry the handoff when the diff is hidden, stating what changed and why without relying on the diff. Use `git rebase` with `GIT_SEQUENCE_EDITOR` and `git commit --amend`/`--reedit-message`, or `git filter-repo --message-callback`, scoped to the exact range.
6. Re-sign each rewritten commit preserving its original author and committer dates by position. Set `GIT_AUTHOR_DATE` and `GIT_COMMITTER_DATE` to the recorded per-position values during each amend so dates stay by position; do not let them slip to now.
7. Verify the done predicate: run `git diff <old>..<new>` and confirm it is empty (tree byte-identical); confirm each rewritten commit's author and committer dates match the recorded per-position values; confirm `git log` for the range carries the handoff with `git show`/diff hidden.

## Failure and recovery
- Pushed target without confirmation: stop. Do not rewrite. Report which commits are pushed and await confirmation.
- Tree drift: if `git diff old..new` is non-empty, the rewrite touched the tree. Abort, discard the rewritten history, and restore the original refs from the reflog or the pre-rewrite backup ref. Report the drift.
- Date slip: if any rewritten commit's author or committer date does not match the recorded per-position value, abort and restore from the backup ref. Re-signing must preserve dates by position.
- Non-converged: if verification cannot pass after one corrective pass, stop and report the exact failing check (empty-diff, date-match, or handoff-in-log). Do not pretend the done predicate holds.
- Rollback: before any rewrite, create a backup ref (`git update-ref refs/rewrite-backup/<range> <original-tip>`). Recovery is `git reset --hard refs/rewrite-backup/<range>` or `git reflog`.

## Output
The rewritten local history over the target range: commit messages in handoff-ready form, tree byte-identical to the original, each commit re-signed with its dates preserved by position. A report naming the exact commit set rewritten, the backup ref created, and the verification results (`git diff old..new` empty, dates matched, log carries handoff).

## Provenance

Adapted from `skills/depth/re0-git/SKILL.md` in [LilMGenius/paperthin](https://github.com/LilMGenius/paperthin) at revision `3bca079a51bcfff5dafb53d1d7f9f523d66ee317`, MIT ((c) 2026 LilMGenius). Clean-room adaptation: the commit-economy message-rewrite standard is re-expressed here; no verbatim vendor material from mattpocock/skills is copied. The never-create-or-suggest-a-commit and message-only-tree-identical mechanisms are preserved.
