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

## Refusal

- Idea fails quality filters (non-obvious, useful, specific): report which filter failed and why. Ask the user for a revised angle. Do not draft until the idea passes.
- Scope too broad (multiple objectives): report the scope conflict and ask the user to choose one objective. Do not merge objectives.
- Insufficient input (no topic or audience after one clarification round): report the blocker and stop. Do not fabricate audience assumptions.

## Procedure

1. **Gather topic and target audience.** If either is missing, ask before proceeding. Done when: topic and audience are stated.
2. **Apply idea-quality filters (Evans/Shapiro).** Confirm the idea is non-obvious, useful, and specific enough to sustain an article. Done when: the idea passes all three filters or a failure is reported.
3. **Establish one clear objective** — the single action the reader should take after reading. Record this objective. Every section must serve it. Done when: one objective is recorded.
4. **Draft the hook.** Write a 2-3 sentence opening that creates tension between what the reader currently believes or does and what they should understand instead. The hook must make the problem concrete, not abstract. Done when: a concrete tension hook is drafted.
5. **Draft the title.** Promise a concrete outcome or insight. The body must deliver what the title claims. Done when: a title is drafted.
6. **Draft the body.** Structured sections build the argument from the hook through evidence, examples, and actionable detail. Each section advances the single objective. Use subheadings for scanability. Done when: the body is complete with subheadings.
7. **Draft the CTA block.** Restate the single objective and give the reader one clear next step. Do not introduce a second objective or competing action. Done when: one CTA is drafted.
8. **Run the humanization pass.** Read the full draft and smooth AI-typical patterns — repetitive sentence starters, hedging phrases, unnecessary qualifiers, formulaic transitions. Preserve the engineered lines: the hook wording, the title, and the CTA block remain as drafted unless a factual error is found. Done when: the draft reads as human-written and engineered lines are preserved.
9. **Verify.** Check: (a) hook creates concrete tension, (b) body delivers on the title promise, (c) exactly one objective drives the article, (d) CTA restates that objective, (e) text reads as human-written after the humanization pass. Done when: every check passes.

## Output

Complete article text in chat: title, hook, structured body with subheadings, CTA block — humanization pass applied, engineered lines (hook, title, CTA) preserved verbatim unless a factual correction is required.
