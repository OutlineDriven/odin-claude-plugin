---
name: pr-review-canvas
description: 'Use when asked to render a PR review in Cursor Canvas. Produces a local canvas artifact with risky hunks foregrounded. Not for standalone HTML rendering — use pr-review-canvas-html.'
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

- PR diff (required): The unified diff of the pull request to review. Supplied as a file path or piped content.
- PR metadata (optional): PR title, description, and linked issue text. Improves hunk risk classification when available.

## Procedure

1. Read the PR diff. Parse it into individual hunks grouped by file. Done when: the diff is parsed into file-grouped hunks.
2. Classify each hunk as risky or safe. A hunk is risky if it touches control flow, error handling, concurrency, public API boundaries, security-sensitive paths, or data integrity logic. A hunk is safe if it is documentation-only, import reordering, formatting, or trivial renaming with no behavioral change. Done when: every hunk is classified as risky or safe.
3. Within each file, place risky hunks before safe hunks while preserving the file order from the diff. This foregrounds the hunks most likely to contain defects. Done when: risky hunks precede safe hunks within each file with file order preserved.
4. Create a review block for each hunk containing the file path, hunk line range, diff text, and a risk annotation that explains the classification. Done when: every hunk has a review block with path, range, diff text, and risk annotation.
5. Assemble the canvas document with a PR metadata summary, followed by risky hunk blocks and then safe hunk blocks. Make each block a distinct canvas section. Done when: the canvas document is assembled with metadata, risky blocks, then safe blocks.
6. Write the canvas document to `<pr-identifier>.canvas` in the working directory. Overwrite the file if it exists. Done when: the `.canvas` file is written to the working directory.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Empty or unparseable diff | Stop. Report that no hunks were found. Do not write a canvas artifact. |
| Diff exceeds reasonable size (>500 hunks) | Stop. Report the hunk count and recommend splitting the PR. Do not write a partial canvas. |
| Write permission denied | Stop. Report the target path and the permission error. No rollback needed since no file was written. |
| Hunk classification ambiguous | Mark the hunk as risky (conservative default). Note the ambiguity in the risk annotation. Do not drop the hunk. |

The procedure never writes a partial artifact. If it stops before step 6, it does not create or overwrite a canvas file.

## Output
A single `.canvas` file named after the PR identifier, with a header section (PR title, description, file count), risky hunk sections (path, range, diff, annotation), then safe hunk sections in the same format — local only, never published or pushed.
