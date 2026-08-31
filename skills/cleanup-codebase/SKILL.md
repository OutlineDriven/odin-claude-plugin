---
name: cleanup-codebase
description: 'Use when a dead field, redundant wrapper, duplicate state, stale config, or speculative abstraction appears in nearby code already under edit; the candidate is proven dead or redundant across all consumers, removed without behavior change, and repository validation passes. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Cleanup codebase

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A dead field, redundant wrapper, duplicate state, stale config, or speculative abstraction appears in nearby code already under edit. |
| Authority | Reversible local: edit only the named local artifacts already touched by the active change; recover any deletion through version control. |
| Side effect | Deletes proven-dead local code/config and inlines redundant local wrappers, each as a separate atomic cleanup commit. |
| Done | Candidate is proven dead or redundant across all consumers, removed without behavior change, and repository validation passes. |

## Inputs

- A candidate spotted in code already under edit for another reason: a dead field, redundant wrapper, duplicate state, stale config branch, or speculative abstraction.
- The repository-native validation command (build, tests, type-check) for every touched language. Must be supplied or discoverable in the repo.
- Optional: `ast-grep` for structural dead-code confirmation; fall back to `git --no-pager grep -n` when unavailable.

## Procedure

1. **Bound scope.** Confirm the candidate lies in a file already touched by the active change. If it does not, stop: opportunistic sweeps across untouched files are out of scope.
2. **Classify the candidate** against the rubric below to decide remove versus keep.
3. **Confirm dead across all consumers.** Run `git --no-pager grep -n` (or `ast-grep`) for every reference to the candidate in code, tests, docs, configs, error messages, and log lines. A field is dead only if it is never read after assignment; a wrapper is redundant only if it adds nothing but a rename or forward. If any consumer is unverified, stop and investigate rather than delete.
4. **Check coupling effects.** Determine whether removal breaks the build or forces a refactor of the only consumer. If it does, that is a separate decision; record it and do not delete in this pass.
5. **Apply the deletion.** Remove the file with `rm` then `git add <path>`, or make a precise edit for partial removal. Inline a redundant wrapper at every call site, then delete the wrapper. Never comment out code as a substitute for deletion.
6. **Keep the cleanup atomic.** The cleanup must be its own commit, separate from any behavior change. If it is mixed in, split it with `git move --fixup` or `git split` so each commit has exactly one concern. Never add a new abstraction during cleanup; the diff must be net-deletion or inline-and-delete only.
7. **Verify.** Run the repository-native validation (build, tests, type-check) on every touched language. If a test was the only consumer of the dead code, that test was probably testing the dead code; remove or update it.
8. **Search for ghosts.** Grep docs, error messages, config keys, env vars, and log lines for string references to the removed concept. Leftover references mean the cleanup is incomplete.

### Decision rubric

| Pattern | Action |
|---|---|
| Wrapper that adds nothing but a rename | Inline at call sites, then delete the wrapper |
| Field set but never read after | Delete the field and its assignment |
| Config flag whose both branches are dead | Delete the flag, keep the winning path |
| Adapter between two structurally equivalent local types | Collapse to one type |
| Helper used in one place wrapping a short body | Inline |
| State mirrored across two structs or services | Pick one owner; the other reads from it |
| Comment that contradicts the code | Update or delete the comment |
| Helper used in three or more places that names a real shared concept | Keep |

Indirection earns its keep only at a real boundary: public API surfaces, process or network seams, untrusted-input boundaries, async/sync seams, runtime FFI seams, or test/production seams where mocks substitute. A swappable-implementation contract counts only when more than one real implementation ships today. Internal modules in the same package, same-file helpers, and cross-module calls without a co-change constraint are not boundaries.

## Failure and recovery
- **Unverified consumer (exit 11).** A consumer was not in the original grep. Do not delete. Investigate and either preserve the candidate or migrate the consumer first.
- **Build or test regression (exit 12).** Rollback the deletion via version control. The removal was not behavior-preserving; re-classify and re-confirm before retrying.
- **Mixed-concern commit (exit 13).** The cleanup is bundled with behavior change. Split with `git move --fixup` before merging; never merge a mixed commit.
- **New abstraction introduced (exit 14).** Cleanup must be net-deletion. Separate the abstraction into its own commit with independent justification, or drop it.
- **Ghost references (exit 15).** Leftover string references remain. Complete the cleanup by removing them, or rollback if they indicate the candidate was not actually dead.

Partial-result rule: a pass that confirms some candidates dead and leaves others unverified lands only the confirmed deletions; unverified candidates stay untouched. Non-mutation rule: nothing is deleted until the dead-confirmation grep covers code, tests, docs, configs, and error messages. The blocked result is the candidate left in place with the unverified consumer or regression recorded for a separate decision.

## Output
A terminal classification per candidate:

| Code | Meaning |
|---|---|
| 0 | Clean: atomic deletion landed, all consumers updated, validation green |
| 11 | Unverified consumer found; candidate preserved pending investigation |
| 12 | Build or test regression; deletion rolled back |
| 13 | Mixed-concern commit; must split before merge |
| 14 | New abstraction introduced; separate or drop |
| 15 | Ghost references remain; cleanup incomplete |

## Provenance

Origin: odin-1.x current skill `cleanup-codebase` (skills/cleanup-codebase/SKILL.md) and current ODIN skill-tree `tidy` (skills/tidy/SKILL.md). No pinned revision; project-owned, no third-party license. `tidy` was an exact four-field contract duplicate of `cleanup-codebase` and is merged here without an alias. This is a clean-room, self-contained restatement of the local dead-code removal mechanism; no third-party expression is copied.
