---
name: writing-fragments
description: 'Use when exploration needs heterogeneous noticings captured before structure; useful noticings are preserved without premature synthesis. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Writing fragments

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Exploration needs heterogeneous noticings captured before structure. |
| Authority | reversible-local: write only the named fragment file; rollback is undoing the last append. |
| Side effect | Fragments appended under one working title; no other file touched. |
| Done | Useful noticings preserved without premature synthesis. |

## Inputs

Must be supplied: a working title (the human's intent or the opening prompt). Optionally: a file path; if absent, ask once and remember for the session.

## Procedure

1. Confirm the working title with the human if not yet established.
2. Locate the fragment file at the given path. If no path was provided, ask once where to save and record the answer.
3. Re-read the file from disk before every write. The human may have edited, reordered, or deleted fragments between turns; preserve their changes.
4. On first write, create the file with a single H1 heading containing the working title and nothing else: no metadata, no table of contents, no date.
5. When a fragment emerges (either from the human or from the model), append it to the file. Separate fragments with a horizontal rule (`\n---\n`). Never write a heading, tag, or metadata inside the body.
6. Never overwrite the file. Only append new fragments, or edit in place a specific fragment the human names.
7. Treat user instructions "cut the last one", "merge those two", or "rewrite that sharper" as first-class: execute them and confirm.
8. If the human changes the working title, update the H1 silently on the next write.
9. Capture the very first thing the human says—including the initial prompt itself—as the opening fragment.
10. When the conversation circles a recurring idea, push the human to coin one leading word that names the concept; that word is load-bearing for all later structure.

## Failure and recovery
- **No working title**: the skill cannot route. Return blocked with the reason.
- **File write fails**: return write-failed with the file path and error class. Do not append or guess.
- **User deletes or rewrites the file between turns**: the next write resumes from the file's current disk state; no rollback of user edits occurs.
- **Append collision**: re-read and retry once; if the file changed again, return non-converged.
- Partial-result rule: fragments written before the failure remain on disk; the skill ends and reports what was written.

## Output
A markdown file. First line: `# Working title`. Remaining content: fragments separated by `---`. No heading inside the body. No tags. No metadata.

## Provenance

Origin: `mattpocock/skills` (MIT, Copyright (c) 2026 Matt Pocock). Pinned revision: `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`. Adaptation: restructured for ODIN 2.0 contract schema; procedure mechanics preserved from source. Obligation: retain copyright and permission notice per license.
