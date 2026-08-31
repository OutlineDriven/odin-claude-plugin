---
name: unslop
description: 'Use when prose is being drafted or edited, text is under review for AI tells, or the user asks to remove AI patterns, humanize, or add voice. Rewrites the file so all 20 checks pass and meaning is preserved. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Unslop

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Prose is being drafted or edited, text is under review for AI tells, or the user asks to remove AI patterns, humanize, or add voice. |
| Authority | Reversible local write. Edit only the named prose file; the original is recoverable from version control or the user's undo. |
| Side effect | Rewrites user-facing or internal prose files; may remove incidental framework and tool nouns. |
| Done | All 20 checks applied: no canned phrases, fake quotes, em-dash habit, meta-process, or filler; meaning preserved. |

## Inputs

- **Prose file** (required): the file or text block to edit.
- **Tone guidance** (optional): intended register or audience; defaults to the file's existing voice.

## Procedure

1. Read the prose file end to end. If the file is empty or missing, stop and report the failure.
2. Scan every paragraph against these 20 checks:

   **Content**
   1. Puffery and promotional language: "pivotal moment", "testament to", "evolving landscape", "nestled", "vibrant", "breathtaking", "groundbreaking". Cut; state what happened.
   2. Name-dropping and vague attributions: listing media outlets without context, "Experts believe", "Industry reports suggest". Name the source or delete.
   3. Superficial -ing phrases and formulaic challenges: "highlighting...", "ensuring...", "Despite challenges... continues to thrive". Delete or replace with specific facts.

   **Language**
   4. AI vocabulary: additionally, crucial, delve, enduring, enhance, fostering, garner, interplay, intricate, landscape (abstract), pivotal, showcase, tapestry (abstract), testament, underscore, vibrant. Replace with plain words.
   5. Fancy copulas and forced structures: "serves as", "stands as", "Not just X, but Y", rule of three, synonym cycling, false ranges. Say it directly with the natural number of points.

   **Style**
   6. Em-dash overuse: do not stack several in one paragraph; replace each with the punctuation that spot needs (period, comma, colon, parentheses, or nothing). Count look-alikes (en dash, double hyphen, minus sign, horizontal bar); judge each on its own.
   7. Colon overuse, boldface overuse, inline-header lists, title-case headings, decorative emojis, curly quotes: colons only before lists or examples; bold only when earned; convert restating bold-label-colon lines to prose; use sentence case for headings; remove decorative emojis; replace curly quotes with straight quotes.

   **Communication artifacts**
   8. Chatbot phrases, cutoff disclaimers, sycophantic tone: "I hope this helps!", "Let me know if...", "Of course!", "While specific details are limited...", "Great question!" Remove; respond directly.

   **Filler**
   9. Filler phrases, excessive hedging, generic conclusions: "In order to" becomes "To"; "Due to the fact that" becomes "Because"; delete "It is important to note that"; collapse "could potentially possibly be argued that it might" to "may"; replace "The future looks bright" with specific facts.

   **Jargon**
   10. Abstract metaphor nouns: substrate, wedge, vector, locus, vantage, nexus, bedrock, modality, paradigm, ratchet, evacuate (for moving code), endgame, north star, flywheel. Replace with the concrete word: "substrate" becomes "base", "wedge" becomes "add", "vector" becomes "way", "ratchet" becomes the mechanism's real name or "a limit that only tightens", "evacuate" becomes "move out", "endgame" becomes "the last phase". Ban a word only when a plainer concrete word says the same thing.

   **Plain speech**
   11. Name the mechanism, not the feeling: "the database stays close at hand" becomes "`.toSQL()` returns the exact string sent to the database". If the sentence could appear unchanged in another project's docs, cut it.
   12. Dense sentences: if the reader has to backtrack, break the sentence in two. One idea per sentence.
   13. Active voice: catch "is/are/was/were + past participle" and name the actor. Passive is fine only when the actor is unknown or genuinely doesn't matter.
   14. Adverbs and weak verbs: "runs quickly" becomes "is fast" or the measured delta. An adverb propping up a weak verb means the verb is wrong.
   15. Plain word preference: "utilize" becomes "use", "leverage" becomes "use", "facilitate" becomes "help", "numerous" becomes "many", "in the event that" becomes "if".

   **Portability**
   16. Incidental stack nouns: in content meant to travel (skills, rule docs, library READMEs), a tool or vendor name that is not the subject goes stale when the stack changes. "Run `pnpm test`" in a document about testing discipline means "run the project's test command". Judge each noun: load-bearing when the document is about that tool, incidental when it stands in for a mechanism. Replace incidental ones with the mechanism they mean; leave load-bearing ones alone.

   **Trust and structure**
   17. Fabricated voice or quotation: never invent a quote, testimonial, consensus, or attributed reaction. Quote only supplied or cited text; otherwise write the claim without quotation marks and name its evidence.
   18. Previous-pointing prose: replace "as discussed above", "previously noted", and similar navigation with the fact the reader needs at that point. Keep a cross-reference only when the target is the literal source of truth the reader must inspect.
   19. Mechanical symmetry: break repeated paragraph templates, forced three-part lists, and identical sentence openings. Keep repetition only when it carries a real comparison or invariant.
   20. Meta-process narration: remove descriptions of drafting, analysis, response structure, and the writer's own effort unless the process is the subject. State the result, evidence, or required action directly.

3. Rewrite the file. Preserve meaning; match intended tone.
4. Add voice:
   - Have opinions. React to facts instead of neutrally listing pros and cons.
   - Vary rhythm. Short sentences. Then longer ones that take their time.
   - Acknowledge complexity. "Impressive but also kind of unsettling" beats "impressive."
   - Use "I" when it fits. First person isn't unprofessional.
   - Let some mess in. Perfect structure looks machine-made.
   - Be specific. Not "this is concerning" but the concrete thing that is concerning.
5. Self-audit: "What makes this obviously AI-generated?" Fix remaining tells.
6. Verify meaning is preserved. If any edit changes the factual content or logical claim, revert that edit and rephrase.

## Failure and recovery
- **Missing or empty source**: stop; report "source file missing or empty". Do not create a file.
- **Meaning drift**: if an edit changes the factual content or logical claim, revert that edit and rephrase. If no rephrase preserves both meaning and the check, keep the original and flag the conflict.
- **Pattern introduction**: if the rewrite introduces a new pattern from the checklist, re-run step 5 on the affected paragraph.
- **Non-converged**: if three rewrite passes still leave checklist violations, stop and report the remaining violations with their locations.

## Output
The rewritten prose file with all 20 checks passing and original meaning preserved.

## Provenance

Origin: current-odin-skill-tree. Paths: skills/unslop/SKILL.md. Pinned revision: none. License: project-owned. Adaptation: clean-room rewrite of the unslop skill for the odin-create module.
