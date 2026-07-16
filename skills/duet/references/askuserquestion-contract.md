# `AskUserQuestion` tool contract (Claude Code reference)

**Per fire (one tool call):**
- `questions` array: `minItems: 1, maxItems: 4`. All questions in the array render as one batched UI; one user round-trip per fire.

**Per question:**
- `question`: full sentence ending in `?`
- `header`: short chip label, ≤ 12 characters
- `multiSelect`: boolean (default `false`). `false` = single-pick (mutually exclusive options); `true` = subset of additive items (feature toggles, optional sub-tasks)
- `options`: array, `minItems: 2, maxItems: 4`

**Per option:**
- `label`: 1-5 words; the chip text the user sees and ticks. Mark the recommended choice by appending `(Recommended)` to its label and placing it **first** in the array.
- `description`: explanation of the trade-off / consequence; the one-sentence rationale lives here.
- `preview`: optional rendered content (markdown, monospace box). Single-select only (tool constraint). Use for visual comparisons (layout mockups, code diffs, file trees); skip when the difference is purely conceptual.

**Built-in escapes (do not duplicate):**
- The free-text "Other" input is **auto-provided** on every question; never add an explicit "Other" option.
- Users may attach free-text notes via the `annotations` response field.

**Plan-mode caveat:**
- Use this tool only to *clarify requirements* or *choose between approaches* during planning. Do **not** ask "Is the plan ready?" / "Should I proceed?"; that's what `ExitPlanMode` is for.
