---
name: copywriting-prose-creator
description: 'Use when asked to codify, port, or audit a brand house prose style into a versioned PROSE.md. Not for tone-of-voice guides — use copywriting-tone-of-voice-creator; not for general copywriting — use copywriting.'
---

# Copywriting prose creator

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to codify, port, or audit house prose style (PROSE.md, house style). |
| Authority | Reversible local write. Writes only `PROSE.md` and `AUDIT-MEMO.md` in the working directory. Rollback is `git checkout -- PROSE.md AUDIT-MEMO.md` or deletion of those two files; no other file is touched. |
| Side effect | Writes `PROSE.md` and `AUDIT-MEMO.md`; may spawn at most 5 read-only audit sub-agents that read corpus files and report metrics but write nothing. |
| Done | A versioned `PROSE.md` (or a channel-override section) that an editor can apply line by line, with a semver footer, owner, date, and changelog stub. |

## Inputs

- **Mode** — one of BUILD, ADAPT, AUDIT. Must be supplied or inferred from the request; ask if ambiguous.
- **Content corpus** (optional, for AUDIT and for BUILD diagnosis) — a folder of `.md`/`.txt` files or a list of URLs. When present and > 50 pieces, AUDIT runs before BUILD so codification rests on empirical patterns, not invented ones.
- **Existing `PROSE.md`** (required for ADAPT) — the source guide to project onto a new channel grouping.
- **`SOUL.md`** (optional) — storyteller archetype, mission, point of view. Feeds BUILD Phase 1 and 3.
- **`TONE.md`** (optional) — emotional posture across four dimensions (funny↔serious, formal↔casual, respectful↔irreverent, enthusiastic↔matter-of-fact). Tone sets the emotional posture; prose sets its measurable expression. Two brands with identical tone can have non-interchangeable prose; this skill codifies the prose, not the tone. When `TONE.md` is missing, capture the four dimensions inline during the discovery interview.
- **Target channel grouping** (required for ADAPT) — long-form articles, social posts, email & newsletter, or marketing copy.

## Procedure

Prose is a reproducible craft that a forensic linguist could measure on a page: sentence length, clause depth, lexicon, parallelism, signature moves. Use thorough reasoning on every BUILD and ADAPT invocation; shallow reasoning produces generic guides that flatten into LLM-default register, the exact failure this skill exists to prevent.

Ask the user through the environment's question tool, never as plain-text prose: one question at a time, 2–4 tappable options, wait for the answer. If no question tool exists, ask in prose with the same options, one at a time.

### 1. Select mode and bound scope

If a content corpus is present, offer AUDIT first regardless of mode: empirical patterns beat invented ones. Confirm the two output filenames before any write; do not touch any other file.

### 2. AUDIT mode — empirical corpus analysis (run before BUILD when a corpus exists)

1. Take the corpus (folder of `.md`/`.txt` or list of URLs). Done when: this step’s stated action, evidence, and checks are complete.
2. For corpora > 50 pieces, parallelize: spawn at most 5 read-only sub-agents, splitting the corpus by date range, channel, or author. Each reports the same metrics. Sequential reading on a large corpus runs out of context; parallel sub-agents read independently and synthesize. Done when: this step’s stated action, evidence, and checks are complete.
3. Compute per piece and aggregate: mean sentence length and distribution; top 50 lexemes, top bigrams and trigrams; banned-word and AI-tell frequency; em-dash count per 1,000 words; opening-pattern map (first 50 words of 30 pieces side by side); closing-pattern map. Done when: this step’s stated action, evidence, and checks are complete.
4. Run an adversarial reading pass on 3–5 representative pieces — challenge the assumption that they work. Mark every sentence that does not earn its place, every unanswered reader question, every moment authority collapses, every paragraph where a reader would disengage. Done when: this step’s stated action, evidence, and checks are complete.
5. Sort findings into four buckets: **signature** (recurring, distinctive, working) · **default** (recurring, generic, neutral) · **noise** (inconsistent, accidental, weak) · **liability** (recurring, actively harming credibility or engagement — the adversarial pass surfaces these). Done when: this step’s stated action, evidence, and checks are complete.
6. Write `AUDIT-MEMO.md`: 5–10 pages of quantitative tables, qualitative annotated samples, and a keep/kill/differentiate summary. Feed it into BUILD Phase 6. Done when: this step’s stated action, evidence, and checks are complete.

### 3. BUILD mode — codify a fresh PROSE.md

#### 3a. Detect inputs

Look in the working directory and common locations (`./brand/`, `./content/`, `./docs/`) for `SOUL.md`, `TONE.md`, prior `PROSE.md`, and any corpus. If `SOUL.md` or `TONE.md` is missing, surface this — proceeding without them forces inline assumptions that lock the guide to a sketch. Offer to capture archetype and tone minimally inline if the artifacts are absent.

#### 3b. Discovery interview

Ask in 2–3 batches. Skip any field already supplied by `SOUL.md`, `TONE.md`, or prior context. Wait for answers before proceeding — assumptions compound into a wrong guide that downstream writers faithfully reproduce. Required fields:

- Brand mission (one sentence).
- Category posture: conformist, adjacent, challenger, outsider.
- Audience: reading age, expertise (Layperson / Practitioner / Expert), locale, language(s), patience.
- Author archetype: journalist · engineer · founder · NGO advocate · politician · consultant · executive · community lead · artist · researcher (read from `SOUL.md` if present, else ask).
- Objective per channel: awareness · engagement · lead · signup · retention · advocacy.
- Distribution channels: long-form · social · email · marketing copy (multi-select).
- Constraints: legal, regulatory, brand safety, confidentiality.
- Cultural context: HQ locale vs audience locale, language(s) of operation.
- Tone of voice (if `TONE.md` missing): NN/g four dimensions quick-pick.

#### 3c. Category detection

Match the brand to one of 11 covered categories and apply its defaults for mean sentence length, lexicon, signature structures, anti-patterns, and reference brands:

1. B2B (SaaS / enterprise tech). 2. B2C (consumer products). 3. Consumer brand (lifestyle / DTC). 4. Non-corporate / NGO / non-profit. 5. Consulting / professional services. 6. Product-led (makers, indie hackers, dev tools). 7. Industry (manufacturing, deep-tech, industrial). 8. Volunteering / community / association. 9. Personal branding (per-principal). 10. Politics / advocacy / public figures. 11. Internal corporate communication. Done when: this step’s stated action, evidence, and checks are complete.

When the brand sits clearly outside the 11 categories (religion, defense, regulated healthcare/pharma, regulated finance, legal practice, cultural institutions, education, government, esports, adult content, crypto/web3, niche luxury, fashion/beauty editorial, kids/edutainment, agritech, climate-advocacy-with-policy-posture), surface the gap and stop; codifying without a matching category produces guides that read like generic LLM output. For personal branding, require a corpus capture of 60–90 minutes of the principal's recorded speech plus prior writing before codifying; generic rules produce ghostwritten posts that read like every LinkedIn founder.

#### 3d. Diagnose the corpus before locking targets

If a corpus exists, measure before declaring targets:

1. Word counts and a sentence-length distribution — establish current mean and standard deviation before declaring targets. Done when: this step’s stated action, evidence, and checks are complete.
2. Readability against a sample of 5 pieces — sanity-check the reading-age claim from the interview. Done when: this step’s stated action, evidence, and checks are complete.
3. Search the corpus for each candidate banned word — confirm the brand actually drifts toward it before banning. Done when: this step’s stated action, evidence, and checks are complete.

#### 3e. Codify the five layers

Codify each layer in order. Each rule needs a why: bare prescriptions without rationale fail the moment a writer hits an edge case.

1. **Lexicon** — use/avoid A–Z (50–200 entries), terminology table, jargon ladder per channel, acronym policy, naming conventions, foreign-word policy, technical depth scale (Layperson / Practitioner / Expert). Done when: this step’s stated action, evidence, and checks are complete.
2. **Syntax** — mean sentence length target (category default, ±2), distribution targets (≤10% of sentences ≥ 25 words; ≥15% ≤ 8 words for rhythm), clause depth, active-voice default with exception list, parallelism rules, paragraph length and architecture. Done when: this step’s stated action, evidence, and checks are complete.
3. **Rhythm** — cadence variance target (σ ≥ 6 words per 100-word window), breath points (one ≤ 8-word sentence every 3–5 sentences), repetition policy, callbacks, list patterns, white-space cadence. Done when: this step’s stated action, evidence, and checks are complete.
4. **Structure** — opening hook types, closing types, transitions, headings (sentence case, frontloaded), subheadings, lists, asides, quotations, citations, blockquotes, reader positioning (Gardner's far↔close psychic distance: default per channel, shift-signal words, when to close for conversion). Done when: this step’s stated action, evidence, and checks are complete.
5. **Voice markers** — 5–12 signature moves, signoffs, recurring metaphors, idioms, taboos, intentional tics, all rationed; unrationed markers collapse into self-parody. Done when: this step’s stated action, evidence, and checks are complete.

#### 3f. Punctuation and formatting policies

Declare a position on each punctuation mark: em dash, en dash, semicolon, colon, ellipsis, parentheses, italics, bold, single/double quotes, exclamation marks, brackets, compound-modifier hyphens, Oxford comma, capitalization (sentence vs title case).

Formatting policy: heading hierarchy (H1 once, H2 sections, H3 sub-sections, max H4 in technical docs only), bullets (3–7 items, parallel grammar, leading sentence), numbered lists (only when order matters), code blocks (language tag, line cap), images (caption + alt text), callouts (rationed), tables (only for 2D relationships), links (frontloaded link text — never "click here", "learn more", "read more"; frontloaded text serves scannability and accessibility because screen readers extract link lists out of context).

#### 3g. Channel-specific overrides

Channels are four generic groupings, not platform-specific surfaces — platform quirks live in downstream writer skills, not in PROSE.md:

- **Long-form articles** — blog posts, pillar pages, evergreen essays, technical deep-dives, opinion essays.
- **Social posts** — LinkedIn, X, Bluesky, Threads, TikTok captions, Mastodon.
- **Email & newsletter** — newsletter issues, transactional, drip sequences, lifecycle emails.
- **Marketing copy** — landing pages, ad copy, press releases, podcast show notes, video scripts, sales decks.

For each in-scope grouping, produce a CHANNEL section with deltas on sentence length, paragraph length, hook types, closing types, formatting, and CTA pattern. Generic groupings keep PROSE.md portable: adding a platform within a grouping (Threads → Bluesky) holds without re-codification.

#### 3h. Cultural and linguistic adaptation

- English variant: declare US / UK / international (spelling, punctuation, date format).
- For French ↔ English: list the few French words permitted in English text (raison d'être, savoir-faire) and forbid others without translation; declare English loan-words accepted in French (le marketing, le briefing) vs taboo.
- False cognates: éventuellement ≠ eventually, actuellement ≠ actually; list all known pairs.
- Transfer budgets: cut 20% of words FR→EN, pad 20% EN→FR — French rewards longer sentences, English brand prose favors shorter.
- Locale conventions per channel grouping: French LinkedIn cadence differs from US conventions in formality, paragraph length, first-person use.
- Accessibility and inclusion: bias-free language section (people-first, singular "they", preferred pronouns).
- For multilingual brands: one PROSE.md per language, not a translated single guide; maintain a mapping of shared pillars and divergent rules.

#### 3i. Anti-LLM countermeasures

The dominant prose-drift risk in content factories is convergence on LLM-default register. Codify rules LLMs do not follow by default. That is the durable defense.

Headline patterns to ban or ration:

- **Lexical tells**: delve, leverage, crucial, robust, underscore, navigate (as transitive metaphor), seamlessly, vibrant, dynamic, embark, foster, harness.
- **Structural tells**: tricolons in series ("X, Y, and Z"), summative closers ("In conclusion…"), colon-titles ("The Future of X: A New Paradigm"), bullet-list overuse, hedged claims without source.
- **Punctuation tells**: em-dash overuse (a single signal, not proof), ellipsis outside quotation.
- **Formula constructions**: "It's not just X, it's Y" · "Picture this:" · "Imagine a world where" · "What if I told you" · "Whether you're a seasoned X or a curious newcomer" · "In the realm of" · "Navigating the landscape of".

Detect drift quantitatively:

1. Count lexical tells across the corpus — frequency ≥ 1 per 500 words is a strong tell. Done when: this step’s stated action, evidence, and checks are complete.
2. Sentence-length σ < 4 across a 100-sentence window — uniformity is a stronger tell than any single lexical signal. Done when: this step’s stated action, evidence, and checks are complete.
3. n-gram comparison between the brand's pre-AI and post-AI corpus — divergence in top trigrams flags drift. Done when: this step’s stated action, evidence, and checks are complete.

Detection is unreliable as a single source of truth; use these as triage, not verdict. Treat any single signal as suspicion, not proof.

#### 3j. Render PROSE.md

Assemble in this order: Cover (brand, version, owner, last updated, status) · Purpose (200 words) · Prose Pillars (one page, 5–8 falsifiable pillars) · Voice vs Tone note (one paragraph) · the five layers · Punctuation Policy · Formatting Policy · Channel Overrides (one section per in-scope grouping) · Cultural & Linguistic Adaptation · Anti-LLM Countermeasures · Sample Bank (≥ 10 before/after pairs, ≥ 3 exemplar pieces if provided, hook bank, closing bank) · Ghostwriting Addendum (per principal, optional) · Do/Don't quick-reference annex · Changelog.

A complete PROSE.md is 20–60 pages. Resist maximizing length: enforceable density beats exhaustiveness. Aim for the density an editor can apply line by line; cut anything an editor cannot turn into a concrete edit.

Versioning footer: semver, date, owner, changelog stub. Prose guides decay; a PROSE.md not re-audited every 12 months is a snapshot, not a living document.

### 4. ADAPT mode — port an existing PROSE.md to a new channel grouping

1. Read the existing `PROSE.md`. Done when: this step’s stated action, evidence, and checks are complete.
2. Ask the user: target channel grouping (long-form / social / email / marketing copy), and optionally a specific platform within the grouping for tighter overrides. Done when: this step’s stated action, evidence, and checks are complete.
3. Compute the transformation delta: sentence-length cut or grow factor, paragraph break frequency, hook style adjustment, CTA fit, formatting overrides. Done when: this step’s stated action, evidence, and checks are complete.
4. Emit a `CHANNEL OVERRIDE — <grouping>` section appended to `PROSE.md`, or a standalone `PROSE-<grouping>.md` if the user prefers a separate artifact. Offer both because content teams publishing across many channels prefer one master file, while agencies handling a single channel prefer per-channel files. Done when: this step’s stated action, evidence, and checks are complete.
5. Cross-reference back to the original PROSE.md for fields unchanged. Done when: this step’s stated action, evidence, and checks are complete.

## Failure and recovery
- **Missing inputs (no corpus, no SOUL.md, no TONE.md)** — surface the gap and offer inline capture; do not proceed on silent assumptions. If the user declines inline capture and the artifact is required for the chosen mode, stop and report the missing prerequisite.
- **Uncovered category** — the brand sits outside the 11 covered categories. Stop; codifying without a matching category produces generic output. Report the gap and the category detected.
- **Personal branding without principal corpus** — stop; require 60–90 minutes of recorded speech plus prior writing before codifying.
- **Sub-agent failure** — if a read-only audit sub-agent returns no metrics or errors, mark its slice as unmeasured in `AUDIT-MEMO.md` rather than fabricating findings. Do not exceed 5 sub-agents.
- **Partial result** — `AUDIT-MEMO.md` may be incomplete if the corpus is partial; label unmeasured slices explicitly. Never claim the done predicate holds when a layer, channel, or policy lacks rationale.
- **Rollback** — `git checkout -- PROSE.md AUDIT-MEMO.md` or delete the two files. No other file is touched, so no further rollback is needed.
- **Non-converged** — if the user cannot supply required interview fields and declines defaults, return blocked with the exact missing fields listed.

## Output
Return, in order: `PROSE.md` with the five layers, mechanics, channel overrides, cultural adaptation, anti-LLM controls, semver footer, owner, date, and changelog stub; then `AUDIT-MEMO.md` in AUDIT or corpus-backed BUILD mode; in ADAPT mode, the appended or standalone channel override.
