---
name: humanizer-en-asd-ste100
description: 'Use when asked to rewrite technical English for STE compliance, stripping ambiguity and AI-style patterns. Not for French de-AI-ification: use humaniseur-fr.'
---

# Humanizer en ASD-STE100

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for technical English rewrite, STE compliance, controlled-language rewrite, disambiguation, or de-slopping of a manual or document |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Returns the rewritten document to chat output; no durable writes |
| Done | STE-compliant document with residuals flagged, in rewrite or write mode |

## Inputs

- Source text (required): the document or prose passage to rewrite. May be provided inline or as a file path.
- Mode (optional): `rewrite` applies full structural rules and flags lexical residuals; `write` applies full structural and lexical rules. If omitted, infer from document type: procedures and error strings default to `write`; explanatory prose defaults to `rewrite`.
- Rule table (optional, default false): set to `true` to emit a before/after rule-violation table alongside the rewritten text.

## Procedure

1. **Select the mode.**

State the chosen mode in one line. If `write`, apply every rule below fully. If `rewrite`, apply structural rules fully and treat lexical rules as advisory; flag departures without enforcing them.

2. **Scan the source text.**

Walk the text sentence by sentence. Flag every violation of the rules below before rewriting. Do not begin rewriting until what the text must still say afterward is understood.

3. **Apply structural rules (always, in both modes).**

| Rule | Do | Do not |
|---|---|---|
| Active voice (Rule 3.6) | "The agent deletes the file." | "The file is deleted," unless the actor is genuinely unknown |
| No phrasal verbs (Rule 9.3) | "Remove the panel." / "Start the job." | "Take off the panel." / "Spin up the job." |
| One instruction per sentence (Rule 5.2) | "Open the file. Read line 3." | "Open the file and read line 3, then check if it matches." |
| Sentence length | ≤20 words (procedures), ≤25 words (descriptions) | Compound sentences with multiple clauses |
| No semicolons (Rule 8.1) | Split into separate sentences | Any semicolon |
| Noun clusters (Rule 2.1) | ≤3 words stacked ("fuel pump valve") | 4+ word noun stacks |
| No ellipsis | Keep subject, verb, and article explicit | Drop words to save space |
| Keep modality | "The request may have failed." stays | Promote a hedge to a fact |
| Paragraph limits | One topic per paragraph | Multi-topic paragraphs |
| Lists for sequences | Numbered or bulleted list for 3+ steps | Bury a sequence inside prose |

4. **Apply lexical rules.**

In `write` mode, enforce; in `rewrite` mode, flag but do not enforce.

| Rule | Direction |
|---|---|
| One word, one meaning | Use the same word for the same concept throughout; do not rotate synonyms |
| Verb, not noun (Rule 3.7) | "Analyze the log." not "Perform an analysis of the log." |
| Simple tenses (Rule 3.2) | Infinitive, imperative, simple present, simple past, simple future; avoid present perfect unless current relevance is asserted |
| Domain terms | Keep necessary technical nouns; define each once if not common English |

5. **Check modality before rewriting.**

Hedges ("may", "could", "is likely to") carry the author's confidence. Replacing them with assertions changes the claim. If simplifying a sentence would promote a hedge, keep the longer form and flag the trade-off instead of silently changing the claim.

6. **Rewrite each flagged sentence.**

Rewrite to fix each violation while preserving the original meaning exactly. Never add a fact the source did not state.

7. **Output.**

Return the rewritten text. If `rule_table` is `true`, append a markdown table of violations found. If the input already complies, state that and return it unchanged.

## Failure and recovery
| Failure class | Result |
|---|---|
| Source text is empty or absent | Return "No source text provided." |
| Source text is creative or marketing copy where voice is the point | State "STE is not applicable to creative or persuasive copy; this text uses voice and nuance as its mechanism and should not be flattened." |
| Rewrite would require a fact not in the source | Flag the gap; do not invent the missing information; preserve the original phrasing and note the unresolved ambiguity |
| STE dictionary compliance cannot be verified | State which lexical departures are unverified and why; structural compliance is fully verifiable |

Partial-result rule: if the text is long and partially compliant, return the compliant portion with residuals flagged rather than returning nothing.

## Output
- rewrite mode: STE-compliant text with a residual-flagged list; default output.
- write mode: fully rewritten STE-compliant text; no residual list.
- `rule_table: true`: add before/after rule-violation table.

The done predicate holds when the returned document contains no structural STE violations and all lexical departures are named.
