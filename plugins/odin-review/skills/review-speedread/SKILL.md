---
name: review-speedread
description: 'Use when a human asks for the change shape before reading a diff. Not for a full findings report: use review. For an interactive walk: use show-review.'
---

# Review speedread

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to see the change shape of a diff before reading the diff itself. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only: one compact visual or textual summary of the change shape. |
| Done | A change-shape summary is rendered in the chat and the human can proceed to read the diff. |

## Inputs

Required: a diff context such as a PR/MR URL, a commit range, a branch comparison, or an explicit diff/path identifier. The human must supply or confirm the source; the skill does not search for it.

## Procedure

1. Detect the diff source. If the source is ambiguous, absent, or cannot be resolved, stop and report that no diff context is available. Done when: the diff source is detected or a no-diff-context stop is reported.
2. Retrieve the diff surface: file names, additions, deletions, and change type for each changed file. Stop rather than fetch full file contents. Done when: the diff surface is retrieved with file names, line deltas, and change types.
3. Render a compact change-shape summary as an ASCII table or structured paragraph. Include at minimum the changed-file count, total lines added and removed, and a short label for each changed file (e.g., "M src/foo.ts +12 -3", "A docs/readme.md +45 -0"). Highlight new and deleted files. Do not render the full diff. Done when: the change-shape summary is rendered with file count, totals, and per-file labels.
4. Present the summary in chat so the human can absorb the shape in one read before opening the diff. Done when: the summary is presented in chat.

## Failure and recovery
- No-diff-context: the skill cannot locate the diff source. Returns "no diff context found"; does not fabricate a summary.
- Empty-diff: the diff exists but has no changes. Returns "diff is empty"; does not pretend a summary exists.
- Retrieval-failure: the diff cannot be fetched (network, auth, or permissions). Returns the failure message; does not retry or widen scope.

Partial-result rule: if retrieval succeeds for a subset of files, render what was retrieved and label it "partial" if the full set is not available.

## Output
A chat-native change-shape summary: compact ASCII table or structured paragraph listing each changed file with its change type and line delta, plus aggregate totals. The human reads this and then reads the full diff.
