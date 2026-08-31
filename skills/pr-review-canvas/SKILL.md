---
name: pr-review-canvas
description: 'Use when asked to render a PR review in Cursor Canvas. Produces a local canvas artifact with risky hunks foregrounded. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# PR review canvas

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Render a PR review in Cursor Canvas. |
| Authority | Reversible local write only. Creates one canvas artifact in the working directory. No remote, VCS, credential, paid, published, or deployed mutation. |
| Side effect | Creates a local `.canvas` artifact file. Overwrites any prior canvas for the same PR. |
| Done | Review canvas artifact exists with risky hunks foregrounded above safe hunks. |

## Inputs

- **PR diff** (required): The unified diff of the pull request to review. Supplied as a file path or piped content.
- **PR metadata** (optional): PR title, description, and linked issue text. Improves hunk risk classification when available.

## Procedure

1. Read the PR diff. Parse it into individual hunks grouped by file.
2. Classify each hunk as risky or safe. A hunk is risky if it touches control flow, error handling, concurrency, public API boundaries, security-sensitive paths, or data integrity logic. A hunk is safe if it is documentation-only, import reordering, formatting, or trivial renaming with no behavioral change.
3. Order hunks: risky hunks first within each file, preserving file order from the diff. This foregrounds the hunks most likely to contain defects.
4. For each hunk, generate a review block containing: file path, hunk line range, the diff text, and a risk annotation explaining why the hunk is classified as risky or safe.
5. Assemble the canvas document: header with PR metadata summary, then risky hunk blocks, then safe hunk blocks. Each block is a distinct canvas section.
6. Write the canvas document to `<pr-identifier>.canvas` in the working directory. If the file exists, overwrite it.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Empty or unparseable diff | Stop. Report that no hunks were found. Do not write a canvas artifact. |
| Diff exceeds reasonable size (>500 hunks) | Stop. Report the hunk count and recommend splitting the PR. Do not write a partial canvas. |
| Write permission denied | Stop. Report the target path and the permission error. No rollback needed since no file was written. |
| Hunk classification ambiguous | Mark the hunk as risky (conservative default). Note the ambiguity in the risk annotation. Do not drop the hunk. |

No partial artifacts are committed. If the procedure stops before step 6, no canvas file exists on disk.

## Output
A single `.canvas` file named after the PR identifier. The file contains:
- A header section with PR title, description, and file count.
- Risky hunk sections, each with file path, line range, diff text, and risk annotation.
- Safe hunk sections in the same format, listed after all risky hunks.

The canvas is a local artifact. It is not published, pushed, or sent to any remote service.

## Provenance

Adapted from `cursor/plugins` commit `68836ddaf5697224520f1847d90cdb90ca8babaa`. Original license: MIT, declared by the cursor/plugins root README and the candidate plugin manifest as recorded in the pinned source audit. This is a clean-room adaptation preserving the Cursor Canvas review rendering mechanism; no third-party expression is copied.
