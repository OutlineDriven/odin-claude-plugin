# Prompt guides

Fetched 2026-09-03: every row was read and stamped during a re-grounding run. Re-verify any row older than one release cycle. The audit consults this index before asserting anything about a target model; a claim whose row is stale or unfetched is `unverified`.

## How to read the evidence

Each row ends with a tag: `(Tier N, source, status)`.

Tiers:

- Tier 1: guide text read verbatim.
- Tier 2: official vendor documentation.
- Tier 4: official vendor changelog or third-party commentary.

Status: `Verified <ISO date>` means a Tier 1 or 2 page was fetched and its content confirmed. `Probable <ISO date>` means a Tier 4 page was fetched and its content confirmed. `unreachable <ISO date>` means the URL no longer serves, with the replacement page the vendor now serves named in the Governs cell.

Role: `current` is the row the audit targets by default; `heavy`, `middle`, and `light` are tiers within a current generation; `legacy-avoid` is a versus-audit row, where a pattern present only in that guide is dated and the successor row names what replaced it. A `commentary` row grounds no finding on its own.

The rows carry URLs and a one-line scope only. Vendor prose is not copied into this tree, because a copy goes stale, carries no license grant, and is gated as tracked prose. An auditor needing more than the scope line fetches the guide.

## OpenAI

| Model or line | Role | Guide URL | Governs | Evidence |
|---|---|---|---|---|
| GPT-5.6 | current | `https://developers.openai.com/api/docs/guides/latest-model?model=gpt-5.6#prompting-best-practices` | Leaner prompts, autonomy and approval boundaries, response length through `text.verbosity`, pro mode, and Programmatic Tool Calling routing; its own pointers `prompt-guidance-gpt-5p6.md` and `upgrading-to-gpt-5p6-sol.md` | (Tier 2, vendor documentation, Verified 2026-09-03) |
| GPT-5.5 | legacy-avoid | `https://developers.openai.com/api/docs/guides/latest-model?model=gpt-5.5#prompting-best-practices` | URL now serves the GPT-5.6 guide; GPT-5.5-specific patterns no longer retrievable, successor GPT-5.6 | (Tier 2, vendor documentation, Verified 2026-09-03) |
| GPT-5.4 | legacy-avoid | `https://developers.openai.com/api/docs/guides/latest-model?model=gpt-5.4#prompting-best-practices` | URL now serves the GPT-5.6 guide; GPT-5.4-specific patterns no longer retrievable, successor GPT-5.6 | (Tier 2, vendor documentation, Verified 2026-09-03) |
| GPT-5.3-codex | legacy-avoid | `https://developers.openai.com/api/docs/guides/latest-model?model=gpt-5.3-codex#prompting-best-practices` | URL now serves the GPT-5.6 guide; GPT-5.3-codex-specific patterns no longer retrievable, successor GPT-5.6 | (Tier 2, vendor documentation, Verified 2026-09-03) |
| GPT-5.6 commentary | commentary | `https://yage.ai/share/gpt56-prompt-guidance-result-certainty-en-20260724.html` | Process-certainty to result-certainty framing; commentary, so no finding rests on it alone | (Tier 4, third-party commentary, Probable 2026-09-03) |

## Claude

| Model or line | Role | Guide URL | Governs | Evidence |
|---|---|---|---|---|
| Cross-model | current | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview` | Prompt engineering overview across the current generation | (Tier 2, vendor documentation, Verified 2026-09-03) |
| Cross-model | current | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices` | Best practices across the current generation | (Tier 2, vendor documentation, Verified 2026-09-05) |
| Claude Fable 5.1 | heavy | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1` | Heavy-tier prompting guidance | (Tier 2, vendor documentation, Verified 2026-09-03) |
| Claude Fable 5 | heavy | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5` | Heavy-tier prompting guidance | (Tier 2, vendor documentation, Verified 2026-09-03) |
| Claude Opus 5 | middle | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5` | Middle-tier prompting guidance | (Tier 2, vendor documentation, Verified 2026-09-03) |
| Claude Sonnet 5 | light | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5` | Light-tier prompting guidance | (Tier 2, vendor documentation, Verified 2026-09-03) |
| Claude Opus 4.8 | legacy-avoid | `https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-4-8` | Versus-audit row: a pattern present only here is dated; successor Claude Opus 5 | (Tier 2, vendor documentation, Verified 2026-09-03) |
| Migration | current | `https://platform.claude.com/docs/en/models/opus-5/migration-guide` | Per-target migration checklist; the upstream `skills/claude-api/shared/model-migration.md` at `anthropics/skills` commit `53048666b05b4799081517d00e09e0a2dd688678` carries the same checklist per model | (Tier 2, vendor documentation, Verified 2026-09-03) |

## Grok

| Model or line | Role | Guide URL | Governs | Evidence |
|---|---|---|---|---|
| Grok 4.5 and 4.6 | current | `https://venice.ai/blog/grok-4-6-prompt-tips` | Role and goal framing, structured output shape, and reasoning-effort selection; Tier 4 because the host is not the model vendor | (Tier 4, third-party host, Probable 2026-09-03) |
