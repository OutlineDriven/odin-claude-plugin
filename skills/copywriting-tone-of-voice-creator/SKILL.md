---
name: copywriting-tone-of-voice-creator
description: 'Use when a user asks to create, refresh, or port a brand voice guide. Not for prose style guides — use copywriting-prose-creator; not for general copywriting — use copywriting.'
---

# Copywriting tone of voice creator

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to create, refresh, or port a brand voice guide. |
| Authority | Reversible local write: writes only TONE.md or TONE-<channel>.md in the working directory or a user-supplied path. Rollback is deleting or reverting that file. |
| Side effect | Writes TONE.md or TONE-<channel>.md at the working directory root or a user-supplied path. No other files, VCS, credentials, paid actions, publishing, or remote mutation. |
| Done | A machine-parseable TONE.md exists with validated voice attributes, a tone modulation matrix, a lexicon, and one channel section per channel in scope. |

## Inputs

- Optional: a SOUL.md in the working directory or a user-supplied path. If present, read it to pre-fill brand name, mission, audience, values, archetype, and banned topics, then confirm the extraction with the user before proceeding.
- Required: user answers to the discovery questions (Create mode).
- Adapt mode: the path to an existing TONE.md plus the target channel.

## Procedure

Create mode runs steps 1-13 in order. Adapt mode runs steps 14-17. Ask every question through the environment's question tool one at a time with 2-4 tappable options; if no question tool exists, ask in prose with the same options, one at a time.

### Create mode

1. Glob for SOUL.md in the working directory. If found, read and extract brand name, mission, audience, values, archetype, and banned topics; display the extraction and ask the user to confirm or correct; skip discovery questions SOUL.md already answers. Done when: this step’s stated action, evidence, and checks are complete.

2. Run discovery in four batches, one question-tool call each: (A) mode, brand category, primary markets and languages, primary content goal; (B) primary audience, channels in scope, reading-age target, risk tolerance; (C) primary archetype guess, 3-5 voice reference brands, 3-5 anti-reference brands, founder/CEO voice contribution; (D) regulatory regime, cultural taboos, existing brand book or banned-word list path, localisation strategy. Done when: this step’s stated action, evidence, and checks are complete.

3. If the brand category is outside the covered set (politics, religious organisations, defense, healthcare professional comms, gaming, adult content, sports teams, fintech-crypto, or any "Other"), spawn a research sub-agent briefed to cover typical category voice attributes, common pitfalls and audience reactions to off-tone copy, 2-3 reference brands with publicly observable voice patterns cited from primary sources, and regulatory, cultural, or platform constraints. For broad cross-market categories spawn up to 3 parallel agents split by region or sub-category and synthesise. Use the output to populate the category section and refine voice attributes; footnote sources inline. Done when: this step’s stated action, evidence, and checks are complete.

4. Define voice. Position the brand on the Nielsen Norman Group four dimensions (funny/serious, formal/casual, respectful/irreverent, enthusiastic/matter-of-fact), each on a 3-point scale. Do not cluster all four near the midpoint; lean to one side on at least three of four dimensions. Mid-range scores fail to differentiate from the category default. Done when: this step’s stated action, evidence, and checks are complete.

5. Define 3-5 voice attributes, no fewer and no more, each in the "X but never Y" pattern. For each attribute write a one-line definition, 3 do's, 3 don'ts, 1 example sentence, and 1 anti-example pulled from the brand's own past content where possible. Done when: this step’s stated action, evidence, and checks are complete.

6. Choose a primary archetype (optional secondary). Use archetype as a positioning shortcut rather than a complete voice definition; do not lean on it exclusively. Done when: this step’s stated action, evidence, and checks are complete.

7. Build the tone modulation matrix: rows are situations (launch, crisis, complaint, win, sensitive topic, routine, sales objection, layoffs or bad news, apology), columns are the channels in scope. Each cell names the dominant tone plus 2-3 prohibited tones. Done when: this step’s stated action, evidence, and checks are complete.

8. Define the lexicon: preferred terms (named concepts, the customer noun such as "members" vs "users"), banned terms (jargon, marketing clichés, exclusionary language), 10-30 power words, jargon policy (when allowed and for which audience), and naming conventions for brand, product, features, and competitors. Done when: this step’s stated action, evidence, and checks are complete.

9. Define mechanics: person (1st plural "we" or 2nd "you"), contractions policy, Oxford comma, sentence-length norm (general public average 15-20 words; expert audiences may go longer), active/passive default (active unless softening a sensitive message), sentence case vs title case, emoji policy, punctuation tics, and numerals. Done when: this step’s stated action, evidence, and checks are complete.

10. Define inclusive language based on the Conscious Style Guide and APA Inclusive Language Guidelines: gendered language, ability and disability, race, age, nationality, and neurodiversity, per market if multi-locale. Done when: this step’s stated action, evidence, and checks are complete.

11. Write channel-specific guidance: one subsection per channel in scope, capturing hard platform constraints (character limits, format) and tonal shifts. Done when: this step’s stated action, evidence, and checks are complete.

12. Write TONE.md as plain markdown with these stable sections in order: Context; Voice attributes; Archetype; NN/g 4 dimensions positioning; Tone modulation matrix; Lexicon; Mechanics; Inclusive language; Channel-specific guidance; Global Do's and Don'ts (a consolidated scannable list); Examples library (before/after pairs). Keep section names and order exact for downstream parsing. Done when: TONE.md has exactly 3-5 attributes, brand-sourced anti-examples, at least 3 of 4 NN/g dimensions off-centre, a non-empty banned-word list, one subsection per channel, and concrete do/don't samples; otherwise surface the gap before writing.

### Adapt mode

14. Read the existing TONE.md. Confirm with the user that voice attributes do not change: only tone modulates per channel. If the user wants to change voice attributes, stop: that is a rebrand outside this skill's scope or a new TONE.md via Create mode, not an adaptation. Done when: this step’s stated action, evidence, and checks are complete.

15. Ask the target channel and whether to append a channel section to the existing TONE.md or fork a new TONE-<channel>.md. Done when: this step’s stated action, evidence, and checks are complete.

16. Apply channel modulation: capture hard constraints (character limits, format, supported markdown), tonal shifts (e.g. LinkedIn dampens irreverence; in-product UI strips flourish), and prohibited registers. Re-derive 3 do's and 3 don'ts specific to the channel, concretised to the medium. Re-derive the relevant column of the tone modulation matrix. Done when: this step’s stated action, evidence, and checks are complete.

17. Write the adapted section or the new TONE-<channel>.md. Done when: this step’s stated action, evidence, and checks are complete.

## Failure and recovery
- Voice-vs-tone confusion: if the user asks to "change the voice for LinkedIn" or wants to rewrite voice attributes for a channel, stop and clarify. Modulating tone is Adapt mode; changing voice is a rebrand outside this skill's scope. Do not mutate voice attributes during an adaptation.
- Uncovered category without research: do not apply consumer-brand defaults to politics, regulated industries, religious organisations, defense, healthcare professional comms, gaming, adult content, sports teams, or fintech-crypto. Block at step 3 until research is complete and sources are cited.
- Validation failure: if any check in step 13 fails, surface the specific gap and ask the user; do not write a TONE.md that fails validation.
- Partial-result rule: never write a partial or placeholder-filled TONE.md. The file is written only after every mandatory section is filled and every validation check passes.
- Non-mutation rule: until validation passes, no TONE.md is written; prior files are untouched.
- Blocked result: report the missing input, unresolved validation gap, or unresolvable voice-vs-tone conflict, and stop.

## Output
Return, in order: plain-markdown `TONE.md` with the stable step-12 sections and pass conditions; or, in Adapt mode, the appended channel section or `TONE-<channel>.md`; never PDF, decorative formatting, or ASCII art.
