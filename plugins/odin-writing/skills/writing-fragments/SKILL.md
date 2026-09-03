---
name: writing-fragments
description: 'Use when exploration needs heterogeneous noticings captured before structure. Useful noticings are preserved without premature synthesis. Not for beat-by-beat assembly from selected sources — use writing-beats; not for paragraph-by-paragraph shaping — use writing-shape.'
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

1. Confirm the working title with the human if not yet established. Done when: the working title is confirmed.
2. Locate the fragment file at the given path. If no path was provided, ask once where to save and record the answer. Done when: the fragment file path is known.
3. Re-read the file from disk before every write. The human may have edited, reordered, or deleted fragments between turns; preserve their changes. Done when: the file is re-read from its current disk state.
4. On first write, create the file with a single H1 heading containing the working title and nothing else: no metadata, no table of contents, no date. Done when: the file is created with only the H1 heading.
5. When the human or model produces a fragment, append it to the file. Separate fragments with a horizontal rule (`\n---\n`). Never write a heading, tag, or metadata inside the body. Done when: the fragment is appended with a horizontal rule separator and no heading or metadata.
6. Never overwrite the file. Only append new fragments, or edit in place a specific fragment the human names. Done when: the write is append-only or a named in-place edit is applied.
7. Execute user instructions such as "cut the last one", "merge those two", or "rewrite that sharper", then confirm. Done when: the user instruction is executed and confirmed.
8. If the human changes the working title, update the H1 silently on the next write. Done when: the H1 is updated to the new working title.
9. Capture the very first thing the human says — including the initial prompt itself — as the opening fragment. Done when: the opening fragment is captured.
10. When the conversation circles a recurring idea, push the human to coin one leading word that names the concept; that word is load-bearing for all later structure. Done when: the human coins a leading word or declines.

## Failure and recovery
If no working title is provided, the skill cannot route; return blocked with the reason. If the file write fails, return write-failed with the file path and error class; do not append or guess. If the user deletes or rewrites the file between turns, the next write resumes from the file's current disk state; no rollback of user edits occurs. On an append collision, re-read and retry once; if the file changed again, return non-converged. Fragments written before a failure remain on disk; the skill ends and reports what was written.

## Output
A markdown file — first line `# Working title`, remaining content fragments separated by `---`; no heading inside the body, no tags, no metadata.
