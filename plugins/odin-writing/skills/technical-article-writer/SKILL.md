---
name: technical-article-writer
description: 'Use when a user asks to write a technical article or blog post incorporating external references. Fetches and validates reference URLs, applies idea-quality gates, drafts an evidence-based body with explicit citations and a single objective, then runs a humanization pass. Not for source-code changes or landing-page copy.'
---

# Technical article writer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to write a blog post or technical article that incorporates external reference material. |
| Authority | Read-only for external sources. Write-only for the article draft, delivered in chat. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only. Delivers the drafted article text; no writes beyond the conversation. |
| Done | Complete article with chosen title, hook, evidence-based body with explicit citations, CTA block, and humanization pass preserving engineered lines. |

## Inputs

- Topic (required): subject of the article.
- Target audience (required): who will read it.
- Reference URLs or text (required): links, quotes, or prior art to incorporate and cite.
- Key points or outline (optional): specific arguments, data, or examples to include.
- Tone (optional): defaults to authoritative and conversational.

## Failure terminal states

- idea_quality_failed: the topic fails one of the three idea-quality gates (non-obvious, useful, specific). Report which gate failed and why. Ask the user for a revised angle. Do not draft until the idea passes.
- reference_fetch_failed: a reference URL is unreachable or returns content irrelevant to the topic. Report the specific URL and what went wrong. Ask the user for an alternative source or permission to proceed without it. Do not silently drop a reference.
- scope_conflict: the topic spans multiple objectives. Report the conflict and ask the user to choose one objective. Do not merge objectives.
- insufficient_input: no topic or audience after one clarification round. Report the blocker and stop. Do not fabricate audience assumptions.

## Procedure

### Stage 1: Validate topic and audience

Gather the topic and target audience. If either is missing, ask before proceeding.

Apply the three idea-quality gates:

1. **Non-obvious**: would the reader already know this, or hold the wrong mental model? If the article would confirm what the reader already believes, the topic fails this gate.
2. **Useful**: can the reader act on this, build with it, or make a better decision? If the article only informs without enabling action, the topic fails this gate.
3. **Specific**: is the topic narrow enough to cover in one article with concrete examples? If the topic requires a book or a series, the topic fails this gate.

If any gate fails, report which one and why. Ask for a revised angle. Do not draft until all three pass.

Establish one clear objective: the single action the reader should take after reading. Record this objective. Every section must serve it.

Done when: topic and audience are stated, the idea passes all three gates, and one objective is recorded.

### Stage 2: Fetch and validate reference material

For each reference URL or text the user supplied:

1. Fetch the content. If a URL is unreachable, report `reference_fetch_failed` with the specific URL and the error (404, timeout, paywall, DNS failure). Ask the user for an alternative source or permission to proceed without it.
2. Validate relevance: does the content support the article's stated objective? If a source is reachable but irrelevant, report it and ask whether to keep or replace it.
3. Extract key facts, quotes, and data points. Record the source URL, author, publication, and date for each extractable item. These become the citation material for Stage 3.

If the user supplied text rather than URLs, read it and extract the same citation material. If the text is empty or contains no usable evidence, report `reference_fetch_failed`.

Done when: every reference is fetched, validated, and its citation material is recorded, or the user has approved proceeding without a failed reference.

### Stage 3: Draft the article

Draft with an evidence-based body, explicit citations, and the single clear objective from Stage 1.

1. **Hook.** Write a 2-3 sentence opening that creates tension between what the reader currently believes or does and what they should understand instead. The hook must make the problem concrete, not abstract.
2. **Title.** Promise a concrete outcome or insight. The body must deliver what the title claims.
3. **Body.** Structured sections build the argument from the hook through evidence, examples, and actionable detail. Each section advances the single objective. Use subheadings for scanability. Cite every factual claim, data point, and quotation to its source using inline citations (author, publication, date) or numbered references. Uncited claims are opinions and must be marked as such.
4. **CTA block.** Restate the single objective and give the reader one clear next step. Do not introduce a second objective or competing action.

Done when: the draft is complete with hook, title, body with subheadings and citations, and CTA block.

### Stage 4: Run the humanization pass

Read the full draft and smooth AI-typical patterns: repetitive sentence starters, hedging phrases, unnecessary qualifiers, formulaic transitions. Vary sentence length. Add voice where it fits.

Preserve the engineered lines: the hook wording, the title, and the CTA block remain as drafted unless a factual error is found. If a factual error is found in an engineered line, correct it and flag the correction explicitly so the user can review the change.

Check citations: verify every inline citation matches a recorded source from Stage 2. If a citation was dropped or altered during drafting, restore it.

Done when: the draft reads as human-written, engineered lines are preserved (or corrections are flagged), and all citations are intact.

### Stage 5: Verify

Check each item:

- (a) Hook creates concrete tension.
- (b) Body delivers on the title promise.
- (c) Exactly one objective drives the article.
- (d) CTA restates that objective.
- (e) Every factual claim has an explicit citation to a validated source.
- (f) Citations match the recorded source material from Stage 2.
- (g) Text reads as human-written after the humanization pass.
- (h) Engineered lines (hook, title, CTA) are preserved verbatim, or corrections are flagged.

If any check fails, fix it and re-verify. Done when: every check passes.

## Output

Complete article text in chat: title, hook, structured body with subheadings and explicit citations, CTA block. Humanization pass applied, engineered lines (hook, title, CTA) preserved verbatim unless a factual correction was required and flagged.
