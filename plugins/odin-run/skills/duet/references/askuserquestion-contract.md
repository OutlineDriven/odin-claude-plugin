# `AskUserQuestion` tool contract (Claude Code reference)

> Sync lineage: `skills/askme/SKILL.md` (section `AskUserQuestion` tool contract) is this contract's canonical source. Check it for drift before treating this copy as authoritative.

Per fire: `questions` array, `minItems: 1, maxItems: 4`; renders as one batched UI, one user round-trip per fire.

Per question:
- `question`: full sentence ending in `?`
- `header`: chip label, ≤ 12 characters
- `multiSelect` (bool, default `false`): `false` = single-pick, mutually exclusive; `true` = additive subset (feature toggles, optional sub-tasks)
- `options`: array, `minItems: 2, maxItems: 4`

**Per option:**
- `label`: 1-5 words; append `(Recommended)` to the recommended choice and place it **first** in the array
- `description`: one-sentence trade-off/consequence rationale
- `preview`: optional rendered content (markdown, monospace box), single-select only (tool constraint); use for visual comparisons (layout mockups, code diffs, file trees), skip when the difference is purely conceptual

Built-in escapes (do not duplicate): Free-text "Other" is **auto-provided** on every question; never add an explicit "Other" option; free-text notes go in the `annotations` response field.

Plan-mode caveat: Use this tool only to *clarify requirements* or *choose between approaches* during planning, not "Is the plan ready?" / "Should I proceed?"; that's what `ExitPlanMode` is for.
