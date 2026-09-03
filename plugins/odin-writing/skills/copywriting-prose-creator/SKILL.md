---
name: copywriting-prose-creator
description: 'Use when asked to codify, audit, or port measurable prose style rules (syntax, rhythm, mechanics) into a versioned PROSE.md, separate from emotional tone. Not for tone-of-voice guides — use copywriting-tone-of-voice-creator; not for general copywriting — use copywriting.'
---

# Copywriting prose creator

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to codify, audit, or port a brand's measurable prose style rules (syntax, rhythm, mechanics) apart from its emotional tone. |
| Authority | Reversible local write restricted strictly to PROSE.md or PROSE-<channel>.md. Rollback is deleting or reverting that file; no other file is touched. |
| Side effect | Writes PROSE.md or PROSE-<channel>.md. May spawn at most 5 read-only audit sub-agents that read corpus files and report metrics but write nothing. |
| Done | A versioned PROSE.md or PROSE-<channel>.md that an editor can apply line by line, with a semver footer, owner, date, and changelog stub. |

## Inputs

- Mode: one of BUILD, ADAPT, AUDIT. Must be supplied or inferred from the request; ask if ambiguous.
- Content corpus (optional, for AUDIT and for BUILD diagnosis): a folder of .md/.txt files or a list of URLs. When present and > 50 pieces, AUDIT runs before BUILD so codification rests on empirical patterns, not invented ones.
- Existing PROSE.md (required for ADAPT): the source guide to project onto a new channel.
- SOUL.md (optional): storyteller archetype, mission, point of view. Feeds BUILD.
- TONE.md (optional): emotional posture across four dimensions (funny to serious, formal to casual, respectful to irreverent, enthusiastic to matter-of-fact). Tone sets the emotional posture; prose sets its measurable expression. Two brands with identical tone can have non-interchangeable prose; this skill codifies the prose, not the tone. When TONE.md is missing, capture the four dimensions inline during the discovery interview.
- Target channel (required for ADAPT): long-form articles, social posts, email and newsletter, or marketing copy.

## Procedure

Prose is a reproducible craft that a forensic linguist could measure on a page: sentence length, clause depth, lexicon, parallelism, signature moves. Use thorough reasoning on every BUILD and ADAPT invocation; shallow reasoning produces generic guides that flatten into LLM-default register, the exact failure this skill exists to prevent.

Ask the user through the environment's question tool, never as plain-text prose: one question at a time, 2-4 tappable options, wait for the answer. If no question tool exists, ask in prose with the same options, one at a time.

### 1. Select mode and bound scope

If a content corpus is present, offer AUDIT first regardless of mode: empirical patterns beat invented ones. Confirm the output filename before any write; do not touch any file other than PROSE.md or PROSE-<channel>.md.

### 2. AUDIT stage: extract rules from corpus

Run before BUILD when a corpus exists. Findings are presented to the user and carried into BUILD; no separate audit file is written.

1. Take the corpus (folder of .md/.txt or list of URLs).
2. For corpora > 50 pieces, parallelize: spawn at most 5 read-only sub-agents, splitting the corpus by date range, channel, or author. Each reports the same metrics. Sequential reading on a large corpus runs out of context; parallel sub-agents read independently and synthesize.
3. Compute per piece and aggregate: mean sentence length and distribution; top 50 lexemes, top bigrams and trigrams; banned-word and AI-tell frequency; em-dash count per 1,000 words; opening-pattern map (first 50 words of 30 pieces side by side); closing-pattern map.
4. Run an adversarial reading pass on 3-5 representative pieces. Mark every sentence that does not earn its place, every unanswered reader question, every moment authority collapses, every paragraph where a reader would disengage.
5. Sort findings into four buckets: signature (recurring, distinctive, working), default (recurring, generic, neutral), noise (inconsistent, accidental, weak), liability (recurring, actively harming credibility or engagement).
6. Present the audit findings to the user: quantitative tables, qualitative annotated samples, and a keep/kill/differentiate summary. Carry these findings into the BUILD stage.

If the corpus is insufficient to derive rules (fewer than 10 pieces, or pieces too short to measure sentence-length distribution), stop and report the gap. Do not fabricate patterns from thin evidence.

### 3. BUILD stage: author a versioned PROSE.md

#### 3a. Detect inputs

Look in the working directory and common locations (./brand/, ./content/, ./docs/) for SOUL.md, TONE.md, prior PROSE.md, and any corpus. If SOUL.md or TONE.md is missing, surface this. Offer to capture archetype and tone minimally inline if the artifacts are absent.

#### 3b. Discovery interview

Ask in 2-3 batches. Skip any field already supplied by SOUL.md, TONE.md, or prior context. Wait for answers before proceeding. Required fields:

- Brand mission (one sentence).
- Category posture: conformist, adjacent, challenger, outsider.
- Audience: reading age, expertise (Layperson / Practitioner / Expert), locale, language(s), patience.
- Author archetype: journalist, engineer, founder, NGO advocate, politician, consultant, executive, community lead, artist, researcher (read from SOUL.md if present, else ask).
- Objective per channel: awareness, engagement, lead, signup, retention, advocacy.
- Distribution channels: long-form, social, email, marketing copy (multi-select).
- Constraints: legal, regulatory, brand safety, confidentiality.
- Cultural context: HQ locale vs audience locale, language(s) of operation.
- Tone of voice (if TONE.md missing): NN/g four dimensions quick-pick.

#### 3c. Category detection

Match the brand to one of 11 covered categories and apply its defaults for mean sentence length, lexicon, signature structures, anti-patterns, and reference brands:

1. B2B (SaaS / enterprise tech). 2. B2C (consumer products). 3. Consumer brand (lifestyle / DTC). 4. Non-corporate / NGO / non-profit. 5. Consulting / professional services. 6. Product-led (makers, indie hackers, dev tools). 7. Industry (manufacturing, deep-tech, industrial). 8. Volunteering / community / association. 9. Personal branding (per-principal). 10. Politics / advocacy / public figures. 11. Internal corporate communication.

When the brand sits clearly outside the 11 categories (religion, defense, regulated healthcare/pharma, regulated finance, legal practice, cultural institutions, education, government, esports, adult content, crypto/web3, niche luxury, fashion/beauty editorial, kids/edutainment, agritech, climate-advocacy-with-policy-posture), surface the gap and stop; codifying without a matching category produces guides that read like generic LLM output. For personal branding, require a corpus capture of 60-90 minutes of the principal's recorded speech plus prior writing before codifying; generic rules produce ghostwritten posts that read like every LinkedIn founder.

#### 3d. Diagnose the corpus before locking targets

If a corpus exists, measure before declaring targets:

1. Word counts and a sentence-length distribution: establish current mean and standard deviation before declaring targets.
2. Readability against a sample of 5 pieces: sanity-check the reading-age claim from the interview.
3. Search the corpus for each candidate banned word: confirm the brand actually drifts toward it before banning.

#### 3e. Codify the five layers

Codify each layer in order. Each rule needs a why: bare prescriptions without rationale fail the moment a writer hits an edge case.

1. Lexicon: use/avoid A-Z (50-200 entries), terminology table, jargon ladder per channel, acronym policy, naming conventions, foreign-word policy, technical depth scale (Layperson / Practitioner / Expert).
2. Syntax: mean sentence length target (category default, plus or minus 2), distribution targets (at most 10% of sentences at 25+ words; at least 15% at 8 words or fewer for rhythm), clause depth, active-voice default with exception list, parallelism rules, paragraph length and architecture.
3. Rhythm: cadence variance target (sigma at least 6 words per 100-word window), breath points (one 8-word-or-shorter sentence every 3-5 sentences), repetition policy, callbacks, list patterns, white-space cadence.
4. Structure: opening hook types, closing types, transitions, headings (sentence case, frontloaded), subheadings, lists, asides, quotations, citations, blockquotes, reader positioning (Gardner's far-to-close psychic distance: default per channel, shift-signal words, when to close for conversion).
5. Voice markers: 5-12 signature moves, signoffs, recurring metaphors, idioms, taboos, intentional tics, all rationed; unrationed markers collapse into self-parody.

#### 3f. Punctuation and formatting policies

Declare a position on each punctuation mark: em dash, en dash, semicolon, colon, ellipsis, parentheses, italics, bold, single/double quotes, exclamation marks, brackets, compound-modifier hyphens, Oxford comma, capitalization (sentence vs title case).

Formatting policy: heading hierarchy (H1 once, H2 sections, H3 sub-sections, max H4 in technical docs only), bullets (3-7 items, parallel grammar, leading sentence), numbered lists (only when order matters), code blocks (language tag, line cap), images (caption + alt text), callouts (rationed), tables (only for 2D relationships), links (frontloaded link text, never "click here", "learn more", "read more"; frontloaded text serves scannability and accessibility because screen readers extract link lists out of context).

#### 3g. Channel-specific overrides

Channels are four generic groupings, not platform-specific surfaces. Platform quirks live in downstream writer skills, not in PROSE.md:

- Long-form articles: blog posts, pillar pages, evergreen essays, technical deep-dives, opinion essays.
- Social posts: LinkedIn, X, Bluesky, Threads, TikTok captions, Mastodon.
- Email and newsletter: newsletter issues, transactional, drip sequences, lifecycle emails.
- Marketing copy: landing pages, ad copy, press releases, podcast show notes, video scripts, sales decks.

For each in-scope grouping, produce a CHANNEL section with deltas on sentence length, paragraph length, hook types, closing types, formatting, and CTA pattern. Generic groupings keep PROSE.md portable: adding a platform within a grouping (Threads to Bluesky) holds without re-codification.

#### 3h. Cultural and linguistic adaptation

- English variant: declare US / UK / international (spelling, punctuation, date format).
- For French to English: list the few French words permitted in English text (raison d'etre, savoir-faire) and forbid others without translation; declare English loan-words accepted in French (le marketing, le briefing) vs taboo.
- False cognates: eventuellement is not eventually, actuellement is not actually; list all known pairs.
- Transfer budgets: cut 20% of words FR to EN, pad 20% EN to FR. French rewards longer sentences, English brand prose favors shorter.
- Locale conventions per channel grouping: French LinkedIn cadence differs from US conventions in formality, paragraph length, first-person use.
- Accessibility and inclusion: bias-free language section (people-first, singular "they", preferred pronouns).
- For multilingual brands: one PROSE.md per language, not a translated single guide; maintain a mapping of shared pillars and divergent rules.

#### 3i. Anti-LLM countermeasures

The dominant prose-drift risk in content factories is convergence on LLM-default register. Codify rules LLMs do not follow by default.

Headline patterns to ban or ration:

- Lexical tells: delve, leverage, crucial, robust, underscore, navigate (as transitive metaphor), seamlessly, vibrant, dynamic, embark, foster, harness.
- Syntactic tells: uniform 18-22 word sentences, hedge stacks ("it is important to note that"), passive-voice chains, listicle openers ("In this article, we will explore").
- Structural tells: three-beat paragraph rhythm, parallel ad copy ("Metrics show what. Traces show why."), bumper-sticker aphorisms, staccato dramatic fragments.

Detect drift quantitatively:

1. Count lexical tells across the corpus: frequency at or above 1 per 500 words is a strong tell.
2. Measure sentence-length variance: sigma below 4 words per 100-word window indicates flattened rhythm.
3. Track opening-pattern repetition: more than 60% of pieces opening with the same pattern is a tell.

Detection is unreliable as a single source of truth; use these as triage, not verdict. Treat any single signal as suspicion, not proof.

#### 3j. Render PROSE.md

Assemble in this order: Cover (brand, version, owner, last updated, status), Purpose (200 words), Prose Pillars (one page, 5-8 falsifiable pillars), Voice vs Tone note (one paragraph), the five layers, Punctuation Policy, Formatting Policy, Channel Overrides (one section per in-scope grouping), Cultural and Linguistic Adaptation, Anti-LLM Countermeasures, Sample Bank (at least 10 before/after pairs, at least 3 exemplar pieces if provided, hook bank, closing bank), Ghostwriting Addendum (per principal, optional), Do/Don't quick-reference annex, Changelog.

A complete PROSE.md is 20-60 pages. Resist maximizing length: enforceable density beats exhaustiveness. Aim for the density an editor can apply line by line; cut anything an editor cannot turn into a concrete edit.

Versioning footer: semver, date, owner, changelog stub. Prose guides decay; a PROSE.md not re-audited every 12 months is a snapshot, not a living document.

### 4. ADAPT stage: derive channel-specific exceptions from a base PROSE.md

1. Read the existing PROSE.md.
2. Ask the user: target channel grouping (long-form / social / email / marketing copy), and optionally a specific platform within the grouping for tighter overrides.
3. Compute the transformation delta: sentence-length cut or grow factor, paragraph break frequency, hook style adjustment, CTA fit, formatting overrides.
4. Emit a CHANNEL OVERRIDE section appended to PROSE.md, or a standalone PROSE-<channel>.md if the user prefers a separate artifact. Both are within the declared write authority.
5. Cross-reference back to the original PROSE.md for fields unchanged.

If the target channel is unsupported by the base rules (the base PROSE.md has no channel grouping that covers the requested channel), stop and report the gap. Do not fabricate overrides for an unsupported channel.

## Failure and recovery

- Missing inputs (no corpus, no SOUL.md, no TONE.md): surface the gap and offer inline capture; do not proceed on silent assumptions. If the user declines inline capture and the artifact is required for the chosen mode, stop and report the missing prerequisite.
- Corpus insufficient to derive rules: fewer than 10 pieces, or pieces too short to measure sentence-length distribution. Stop and report the gap.
- Uncovered category: the brand sits outside the 11 covered categories. Stop; codifying without a matching category produces generic output. Report the gap and the category detected.
- Personal branding without principal corpus: stop; require 60-90 minutes of recorded speech plus prior writing before codifying.
- Target channel unsupported by base rules: stop and report the gap. Do not fabricate overrides.
- Sub-agent failure: if a read-only audit sub-agent returns no metrics or errors, mark its slice as unmeasured rather than fabricating findings. Do not exceed 5 sub-agents.
- Partial result: audit findings may be incomplete if the corpus is partial; label unmeasured slices explicitly. Never claim the done predicate holds when a layer, channel, or policy lacks rationale.
- Rollback: delete or revert PROSE.md or PROSE-<channel>.md. No other file is touched, so no further rollback is needed.
- Non-converged: if the user cannot supply required interview fields and declines defaults, return blocked with the exact missing fields listed.

## Output

A versioned PROSE.md with the five layers, mechanics, channel overrides, cultural adaptation, anti-LLM controls, semver footer, owner, date, and changelog stub. In ADAPT mode, the appended channel override section or a standalone PROSE-<channel>.md.
