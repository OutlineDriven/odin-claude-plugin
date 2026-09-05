---
name: technical-article-writer
description: 'Use when asked to write, review, or improve a technical article or engineering blog post. Blog mode covers deep dives, postmortems, and launches; article mode cites references. Not for code changes.'
---

# Technical article writer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to write, review, or improve a technical article or an engineering blog post such as a deep dive, architecture overview, product launch, postmortem, benchmark study, or tutorial. Mode selects the output and validation rules. |
| Authority | Reversible local: mode `article` writes nothing and delivers in chat; mode `blog` writes only one local markdown draft. Rollback is deleting the draft or reverting the file. No remote mutation. |
| Side effect | Chat output; in mode `blog`, one local markdown draft file. No remote changes. |
| Done | Mode `article`: complete article with title, hook, evidence-based body with subheadings and citations, CTA block, and humanization pass preserving engineered lines. Mode `blog`: local markdown draft with named author byline, verified metrics, tested code, labeled diagrams where needed, information-rich headings, and an actionable technical close. |

## Inputs

- Mode (required): `article` for a citation-driven piece delivered in chat, or `blog` for an engineering post of a named post type with a named byline.
- Topic (required): subject of the article.
- Target audience (required): who will read it.
- Reference URLs or text (article required, blog optional): links, quotes, or prior art to incorporate or cite.
- Key points or outline (optional): specific arguments, data, or examples to include.
- Tone (optional): defaults to authoritative and conversational.
- Post type (blog required): one of engineering deep dive, architecture overview, product launch, postmortem, benchmark study, or technical tutorial.
- Author name (blog required): named byline; reject anonymous or generic team bylines.
- Supporting technical evidence (blog, required for claims): verified baseline and result metrics, tested code snippets with dependencies, and architecture topology.

## Failure and recovery

- idea_quality_failed: the topic fails one of the three idea-quality gates (non-obvious, useful, specific). Report which gate failed and why. Ask the user for a revised angle. Do not draft until the idea passes.
- reference_fetch_failed: a reference URL is unreachable or returns content irrelevant to the topic. Report the specific URL and what went wrong. Ask the user for an alternative source or permission to proceed without it. Do not silently drop a reference.
- scope_conflict: the topic spans multiple objectives. Report the conflict and ask the user to choose one objective. Do not merge objectives.
- insufficient_input: no topic or audience after one clarification round. Report the blocker and stop. Do not fabricate audience assumptions.
- missing_byline: mode `blog` reached draft completion with no named author. Halt and request the author name. Do not output a finished post with a generic team byline.
- unverified_code: a code sample was not run. Flag it as unverified, request runnable confirmation, or remove it from the draft.
- unsupported_metric: a performance claim lacks baseline and result data. Remove the claim or mark it as an unverified estimate.
- marketing_filler_detected: mode `blog` draft contains empty superlatives, canned announcement phrases, buzzwords, filler transitions, staccato fragments, bumper-sticker slogans, three-beat reveals, unearned simplicity, or parallel ad copy. Rewrite the affected section as direct, mechanism-based prose.
- shallow_content: mode `blog` draft lacks technical depth. Return it with a specific list of missing technical details, trade-offs, or reproduction steps.
- Rollback: in mode `blog`, delete the generated draft or revert the file; in mode `article`, there is no write to undo.

## Procedure

### Stage 1: Validate topic, audience, and mode

Gather the topic, target audience, and the requested mode. Ask before proceeding when any is missing.

Apply the three idea-quality gates:

1. Non-obvious: would the reader already know this, or hold the wrong mental model? If the article would confirm what the reader already believes, the topic fails this gate.
2. Useful: would the reader be able to do something concrete with the knowledge? If the topic is purely descriptive with no actionable insight, it fails this gate.
3. Specific: does it have a single, focused claim? If the topic could be split into two separate articles, it fails this gate.

If any gate fails, report which one and why. Ask for a revised angle. Do not draft until all three pass.

In mode `blog`, confirm the post type and author byline. Map the post type to its objective: engineering deep dive explains an internal architecture, algorithm, or technical decision so peers learn; architecture overview traces the system topology and constraints; product launch explains the mechanism, why it matters, and how to use it; postmortem provides a transparent failure analysis with a timeline, root cause, and systemic mitigations; benchmark study shares reproducible empirical data and methodology; technical tutorial guides a developer through solving one concrete problem. Stop and request the author name if none is provided.

Establish one clear objective: the single action the reader should take after reading. Record this objective. Every section must serve it.

Done when: topic, audience, and mode are stated, the idea passes all three gates, one objective is recorded, and mode `blog` has a confirmed post type and author byline.

### Stage 2: Fetch and validate reference material

For each reference URL or text the user supplied:

1. Fetch the content. If a URL is unreachable, report `reference_fetch_failed` with the specific URL and the error (404, timeout, paywall, DNS failure). Ask the user for an alternative source or permission to proceed without it.
2. Extract the specific claim, data, or quotation that supports the article, and record the source (title, author, publication, date, URL) with a unique citation key.
3. If the user supplied text rather than URLs, read it and extract the same citation material. If the text is empty or contains no usable evidence, report `reference_fetch_failed`.
4. For mode `blog`, treat supplied technical evidence (metrics, code, architecture notes) the same way: record what is verified and flag what is not.

Done when: every reference is fetched, validated, and its citation material is recorded, or the user has approved proceeding without a failed reference.

### Stage 3: Draft the piece

Draft with an evidence-based body, explicit citations or verified evidence, and the single objective from Stage 1.

#### Mode article

1. **Hook.** Write a 2-3 sentence opening that creates tension between what the reader currently believes or does and what they should understand instead. The hook must make the problem concrete, not abstract.
2. **Title.** Promise a concrete outcome or insight. The body must deliver what the title claims.
3. **Body.** Structured sections build the argument from the hook through evidence, examples, and actionable detail. Each section advances the single objective. Use subheadings for scanability. Cite every factual claim, data point, and quotation to its source using inline citations (author, publication, date) or numbered references. Uncited claims are opinions and must be marked as such.
4. **CTA block.** Restate the single objective and give the reader one clear next step. Do not introduce a second objective or competing action.

Done when: the draft is complete with hook, title, body with subheadings and citations, and CTA block.

#### Mode blog

1. Open with the concrete technical problem or direct conclusion in the first two paragraphs. Do not open with company history, generic industry background, or marketing hype.
2. Structure the body around reader questions: what specific problem this solves, how the system works under the hood, what trade-offs, constraints, and discarded alternatives were evaluated, and how to run, implement, or reproduce the solution. For deep dives and postmortems, explicitly document what failed during development and current system limits.
3. Write as a senior engineer explaining a technical system to a peer. Use first-person perspective (`I` or `we` for the engineering team, `you` for the reader) consistently. Remove marketing jargon, empty superlatives, canned announcement phrases, buzzwords, and filler transitions. Rewrite synthetic patterns into connected technical prose: staccato dramatic fragments, bumper-sticker slogans, three-beat reveals, unearned simplicity, and parallel ad copy.
4. Use headings that convey the finding or mechanism (for example, `Why pre-aggregating metrics discarded debugging context`) instead of generic labels (`Background`, `Architecture`, `Results`, `Conclusion`).
5. Enforce empirical technical quality: exact numbers with units for performance claims (for example, `reduced p99 query latency from 320 ms to 42 ms`), runnable code samples with imports, setup, and configuration, an ASCII or text diagram with labeled components and data flow when more than two components interact, and honest scope that acknowledges known limitations and edge cases.
6. Write an informative title that makes a specific technical claim or promises a concrete payoff. Close with actionable next steps that link to source code, documentation, reproduction repositories, or technical discussion threads.
7. Apply the technical depth test. Ensure the post provides at least one of: an architectural decision evaluated with explicit trade-offs; original empirical benchmark data or workload measurements; a reproducible debugging investigation with concrete root-cause evidence; or a step-by-step technical solution that saves practitioner time. If none are present, report `shallow_content`.
8. Write the draft as one local markdown file with the named author byline.

Done when: the draft is a complete local markdown file with named byline, verified metrics, tested code, diagrams where needed, information-rich headings, and an actionable technical close.

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
- (d) CTA restates that objective (mode `article` only).
- (e) Every factual claim has an explicit citation to a validated source.
- (f) Citations match the recorded source material from Stage 2.
- (g) Text reads as human-written after the humanization pass.
- (h) Engineered lines (hook, title, CTA) are preserved verbatim, or corrections are flagged.
- (i) Mode `blog` only: the byline is a real named individual, all architectural claims are verified, code samples run, metric units and baselines are valid, headings convey mechanisms, the opening states the problem immediately, no marketing filler remains, and reference links resolve.
- (j) Mode `blog` review only: quoted deficient passages, explanations, and explicit rewrites are included for each issue found.

If any check fails, fix it and re-verify. Done when: every check passes.

## Output

Mode `article`: complete article text in chat: title, hook, structured body with subheadings and explicit citations, CTA block. Humanization pass applied, engineered lines (hook, title, CTA) preserved verbatim unless a factual correction was required and flagged.

Mode `blog`: the local markdown draft path with named author byline, verified technical metrics, tested code, labeled diagrams where required, information-rich headings, and an actionable technical closing. For review requests, a marked-up draft with passage quotes and suggested rewrites.
