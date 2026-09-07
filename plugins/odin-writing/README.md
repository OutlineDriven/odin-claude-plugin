# ODIN Writing

ODIN workflows for documentation, editorial prose, and copy.

35 skills, category Writing. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-writing@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-writing@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-writing/skills/<skill> \
  --agent <agent> --scope user
```

`<agent>` is `claude-code`, `codex`, `cursor`, `grok`, or `kimi-cli`.

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-writing:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| articulate | Use when the user knows what they mean but cannot express it completely or clearly. |
| brand-authority | Use when the user asks for branded or style-governed output. |
| clean-and-true | Use when the user just edited a durable artifact, or says "clean and true", "run the hygiene pass", or "taste the output". |
| copywriting | Use when asked to write or fix product/marketing copy, landing pages, UI strings, brand voice, AI tells, an end-of-article CTA, or a hook/lede. |
| copywriting-tone-of-voice-creator | Use when asked to create, refresh, or port a brand tone of voice guide (TONE.md) or measurable prose style rules (PROSE.md). |
| debloat-respect-richness | Use when a user asks to tighten verbose-but-correct prose without a full rewrite. |
| doc-coauthoring | Use when drafting a doc, proposal, spec, RFC, design doc, decision doc, or PRD in chat. |
| doc-review | Use when reviewing a prose plan, spec, PRD, requirements doc, design doc, or brainstorm, or invoking /doc-review. |
| docs-update | Use when documentation has drifted from code changes and the user asks to synchronize. |
| docs-writing | Use when asked to write, restructure, or audit documentation with Diataxis types, or to draft a feature docs page or diagram source. |
| fresh-reader-review | Use when asked to cold-read an artifact with fresh zero-context eyes and cut whatever a stranger cannot follow. |
| good-readme | Use when the user asks to create, rewrite, review, or polish an open-source README, including shop-window READMEs. |
| humaniseur-fr | Use when the user supplies French text that reads like AI output and asks to naturalize it. |
| humanizer-en-asd-ste100 | Use when asked to rewrite technical English for STE compliance, stripping ambiguity and AI-style patterns. |
| linkedin-ghostwriting | Use when a user gives a founder story or result and asks for a LinkedIn post with a chosen hook and humanized body. |
| markdown-to-pdf | Use when the user runs /markdown-to-pdf on Markdown to render a publication-quality PDF. |
| plain-korean | Use when Plain English·Plain Language 원칙으로 한국어 작성·교정·검토, 쉽게 써 줘·명확하게 고쳐 줘·관료적인 표현 줄이기·쉬운 한국어/plain Korean·독자 중심 설명문·이메일·공지·README용, 의미·조건·전문용어 보존, 엄격 통제·절차는 ste-korean 우선, 원문보존·맞춤법만 요청 시 문체 유지 |
| press-release-writer | Use when a user asks to write or announce a press release for any occasion or region, adapting to release type and media format. |
| purge-slop-docs | Use when a human asks to purge stale docs, clean Markdown, or reorder the documentation hierarchy. |
| reorder | Use when asked to reorder a drifted listing under one stated principle, moving items only and rewording nothing. |
| reorder-respect-deliberate | Use when a user asks to fix a listing whose order has gone arbitrary while preserving intentionally ranked items. |
| rewrite-clean-v0 | Use when a document or file has been edited piecemeal and reads as sediment. |
| rewrite-denoise-v0 | Use when a user asks to clean up, sync, dedupe, de-noise, or rewrite an iterated artifact. |
| rhythmic-taste | Use when the user says "give this rhythm", "vary the structure", or "the sections all read the same". |
| save-md | Use when asked to save a URL, file, or pasted text as a .md file with frontmatter, without summarizing. |
| ste-korean | Use when Korean tech docs need unofficial ASD-STE controlled wording, single-step procedures, unified terms; not for plain readability (use plain-korean), official or English STE. |
| substack-ghostwriting | Use when asked to ghostwrite Substack newsletters and web posts from structured intake. |
| sync-docs | Use when a behavioral diff may have left docs or CHANGELOG stale, or when tidy targets stale code comments. |
| technical-article-writer | Use when asked to write, review, or improve a technical article or engineering blog post. |
| technical-writing | Use when technical prose needs writing, reviewing, or draft editing with real symbols and controlled English. |
| training-report | Use when a trainer wants a training session or workshop documented as a compte rendu with a final .docx. |
| unslop | Use when prose is drafted or edited, reviewed for AI tells, or the user asks to remove AI patterns, humanize, or add voice. |
| writing-beats | Use when a grounded piece needs user-selected beat-by-beat assembly of verbatim beats. |
| writing-fragments | Use when exploration needs heterogeneous noticings captured before structure. |
| writing-shape | Use when shaping a source document paragraph by paragraph without modifying it. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
