---
name: technical-article-writer
description: 'Use when a user asks to write a blog post or technical article. Delivers a complete draft with title, hook, body, CTA block, and humanization pass. Don''t use for tasks that require source or remote-system changes.'
---

# Technical article writer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to write a blog post or technical article. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only. Delivers the drafted article text; no writes beyond the conversation. |
| Done | Complete article with chosen title, hook, CTA block, and humanization pass preserving engineered lines. |

## Inputs

- **Topic** (required): subject of the article.
- **Target audience** (required): who will read it.
- **Key points or outline** (optional): specific arguments, data, or examples to include.
- **Reference material** (optional): links, quotes, or prior art to incorporate.
- **Tone** (optional): defaults to authoritative and conversational.

## Procedure

1. Gather topic and target audience from the user. If either is missing, ask before proceeding.
2. Apply idea-quality filters (Evans/Shapiro): confirm the idea is non-obvious, useful, and specific enough to sustain an article. If the idea fails a filter, report which filter failed and ask the user for a stronger angle. Do not proceed with a weak idea.
3. Establish one clear objective for the article — the single action the reader should take after reading. Record this objective. Every section must serve it.
4. Draft the hook: a 2-3 sentence opening that creates tension between what the reader currently believes or does and what they should understand instead. The hook must make the problem concrete, not abstract.
5. Draft the title: promise a concrete outcome or insight. Avoid clickbait; the body must deliver what the title claims.
6. Draft the body: structured sections that build the argument from the hook through evidence, examples, and actionable detail. Each section advances the single objective. Use subheadings for scanability.
7. Draft the CTA block: restate the single objective and give the reader one clear next step. Do not introduce a second objective or competing action.
8. Run the humanization pass: read the full draft and smooth AI-typical patterns — repetitive sentence starters, hedging phrases, unnecessary qualifiers, formulaic transitions. Preserve the engineered lines: the hook wording, the title, and the CTA block remain as drafted unless a factual error is found.
9. Verify: (a) hook creates concrete tension, (b) body delivers on the title promise, (c) exactly one objective drives the article, (d) CTA restates that objective, (e) text reads as human-written after the humanization pass.

## Failure and recovery
- **Idea fails quality filters**: report which filter (non-obvious, useful, specific) failed and why. Ask the user for a revised angle. Do not draft until the idea passes.
- **Scope too broad**: if the topic spans multiple objectives, report the scope conflict and ask the user to choose one objective. Do not merge objectives.
- **Insufficient input**: if the user cannot provide topic or audience after one clarification round, report the blocker and stop. Do not fabricate audience assumptions.
- **Partial result rule**: if the procedure is interrupted after step 6 but before step 8, deliver the draft without the humanization pass and note which steps were skipped.
- **Non-mutation rule**: this skill produces no side effects beyond chat output. No rollback is needed.

## Output
Complete article text delivered in the conversation: title, hook, structured body with subheadings, and CTA block. The humanization pass is applied to the full draft. Engineered lines (hook, title, CTA) are preserved verbatim unless a factual correction is required.

## Provenance

- Origin: samber/cc-skills, skills/technical-article-writer/SKILL.md.
- Pinned revision: f9953962e135235137628ea92d06ea085688031f.
- License: MIT.
- Adaptation: clean-room adaptation for ODIN 2.0. Source mechanisms (Evans/Shapiro idea-quality filters, one-objective CTA, delegated hooks and CTA) preserved. No third-party expression copied.
