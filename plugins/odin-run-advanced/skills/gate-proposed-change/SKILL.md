---
name: gate-proposed-change
description: 'Use when asked to evaluate a proposed commit, merge, or auto-merge against a version-1 gate config. Returns an allow or deny verdict naming matched paths; performs no merge. Not for landing PRs — use gate-and-merge. Read-only.'
---

# Gate proposed change

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A proposed commit, merge, or auto-merge must clear a machine boundary before it can land. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. The gate evaluates policy and returns a verdict; it never merges, commits, pushes, or writes. |
| Side effect | Chat output only: an allow or deny verdict with the matched paths and the trigger. The gate itself performs no merge. |
| Done | Denylist is evaluated before file count before allowlist with dot-aware matching under strict version-1 config validation, and a denied change names the exact matched paths. |

## Not for

- Landing PRs — use gate-and-merge.
- Merging, committing, or pushing — this gate evaluates policy and returns a verdict only.
- Source or remote mutation — this skill is read-only.

## Inputs

- `gate config`: a YAML file with `version: 1`, a required `denylist` array of glob strings, an optional `maxFiles` number, and an optional `autoMergeAllowlist` array of glob strings. Must be supplied.
- `action`: one of `commit`, `merge`, `auto-merge`. Must be supplied; any other value is invalid.
- `paths`: the list of changed file paths in the proposed change. Must be supplied.

## Procedure

1. Validate the action is one of `commit`, `merge`, `auto-merge`. Stop with an invalid-action error on any other value. Done when: the action is validated or an invalid-action error is returned.
2. Load and strictly validate the gate config:
   - Parse the YAML.
   - Require `version` to equal `1`; otherwise reject.
   - Require `denylist` to be an array of strings; otherwise reject.
   - If `maxFiles` is present, require it to be a finite number; otherwise reject.
   - If `autoMergeAllowlist` is present, require it to be an array of strings; otherwise reject.
   - Stop with a config-validation error on any failure; do not evaluate.
   Done when: the config is validated or a config-validation error is returned.
3. Evaluate the changed paths in this exact order, returning on the first hit:
   - **Denylist first.** For each path, test it against every `denylist` glob with dot-aware matching (a `*` segment matches names beginning with `.`). If one or more paths match, deny with trigger `denylist`, listing the exact matched paths.
   - **File count.** If `maxFiles` is set and the number of paths exceeds it, deny with trigger `file-count`, listing all paths.
   - **Auto-merge allowlist.** Only when action is `auto-merge`: for each path, require it to match at least one `autoMergeAllowlist` glob with dot-aware matching. If any path matches none, deny with trigger `not-allowlisted`, listing the exact non-matching paths.
   Done when: the first matching condition returns a deny, or all conditions pass.
4. If no condition denied, allow with trigger `ok`. Done when: an allow or deny verdict is returned.

## Failure and recovery

- Invalid action: stop; return the invalid value and the accepted set. No evaluation runs.
- Config not found or unparseable YAML: stop; return the file and parse error. No evaluation runs.
- **Config schema invalid** (wrong version, non-string-array denylist, non-number `maxFiles`, non-string-array `autoMergeAllowlist`): stop; return the field and the constraint. No evaluation runs.
- Empty paths list: no denylist hit, `0 <= maxFiles`, and zero paths trivially satisfy the allowlist; result is allow with trigger `ok`. Do not invent paths.
- Partial-result rule: evaluation is all-or-nothing per condition; a deny on an earlier condition short-circuits all later conditions. The gate never mutates state, so there is no rollback; a failed validation leaves nothing to undo.
- The blocked/non-converged result is a deny verdict or a validation error, never a silent allow.

## Output

A verdict record: `allowed` (boolean), `trigger` (one of `ok`, `denylist`, `file-count`, `not-allowlisted`), `reason` (human-readable), and `matchedPaths` (the exact paths responsible; empty when `ok`) — the gate emits this record only; it performs no merge, commit, or write.
