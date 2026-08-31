---
name: review-speedread
description: 'Use when a human asks for the change shape before reading a diff. It renders a compact visual summary of added/removed files, line counts, and change type so the human can decide whether and where to dive in. Don''t use for tasks that require source or remote-system changes.'
---

# Review speedread

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to see the change shape of a diff before reading the diff itself. |
| Authority | Read-only: no file mutation, no VCS write, no credential use, no remote or deployed resource touched. |
| Side effect | Chat output only: one compact visual or textual summary of the change shape. |
| Done | A change-shape summary is rendered in the chat and the human can proceed to read the diff. |

## Inputs

Required: a diff context such as a PR/MR URL, a commit range, a branch comparison, or an explicit diff/path identifier. The human must supply or confirm the source; the skill does not search for it.

## Procedure

1. Detect the diff source. If the source is ambiguous, absent, or cannot be resolved, stop and report that no diff context is available.
2. Retrieve the diff surface: file names, additions, deletions, and change type for each changed file. Stop rather than fetch full file contents.
3. Render a compact change-shape summary: ASCII table or structured paragraph showing at minimum the count of changed files, total lines added and removed, and a short label for each changed file (e.g., "M src/foo.ts +12 -3", "A docs/readme.md +45 -0"). Highlight files that are new or deleted. Do not render the full diff.
4. Present the summary as a chat-native artifact so the human can absorb the shape in one read before opening the diff.

## Failure and recovery
- **No-diff-context**: the skill cannot locate the diff source. Returns "no diff context found"; does not fabricate a summary.
- **Empty-diff**: the diff exists but has no changes. Returns "diff is empty"; does not pretend a summary exists.
- **Retrieval-failure**: the diff cannot be fetched (network, auth, or permissions). Returns the failure message; does not retry or widen scope.

Partial-result rule: if retrieval succeeds for a subset of files, render what was retrieved and label it "partial" if the full set is not available.

## Output
A chat-native change-shape summary: compact ASCII table or structured paragraph listing each changed file with its change type and line delta, plus aggregate totals. The human reads this and then reads the full diff.

## Provenance

Origin: `project-owned:user-curated-skill-ideas` / `project-owned:user-supplied-source-brief`. No external revision pinned. License: project-owned adaptation. Mechanism: user-curated common review aid; read-only pre-review step. No third-party expression copied.
