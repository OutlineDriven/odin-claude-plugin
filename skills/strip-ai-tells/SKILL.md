---
name: strip-ai-tells
description: 'Use when asked to edit prose to remove AI tells while preserving meaning. Removes AI tells from prose to produce natural, precise text with preserved intent. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Strip AI tells

Edit text to remove AI patterns and add human voice.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Edit prose to remove AI tells while preserving meaning. |
| Authority | Reversible local edits to the prose file only. |
| Side effect | Edits prose within the specified file. |
| Done | Natural, precise text with preserved intent. |

## Inputs

The prose to edit. Supply the text as the sole input.

## Procedure

1. Read the supplied prose.
2. Remove AI tell patterns listed below.
3. Preserve meaning and intended tone throughout.
4. Self-audit: ask what still makes the text obviously AI-generated. Fix remaining tells.

### AI tell patterns

### Content

1. **Puffery.** "pivotal moment", "testament to", "evolving landscape", "setting the stage for", "indelible mark", "deeply rooted". Cut puffery; state what happened.
2. **Name-dropping.** Listing media outlets without context. Pick one; say what was said.
3. **Superficial -ing phrases.** "highlighting...", "ensuring...", "reflecting...", "showcasing...", "fostering...". Delete or expand with real sources.
4. **Promotional language.** "nestled", "vibrant", "breathtaking", "groundbreaking", "renowned", "stunning", "must-visit". Use neutral descriptions.
5. **Vague attributions.** "Experts believe", "Industry reports suggest", "Some critics argue". Name the source or delete.
6. **Formulaic challenges.** "Despite challenges... continues to thrive." Replace with specific facts.

### Language

7. **AI vocabulary.** Additionally, crucial, delve, enduring, enhance, fostering, garner, interplay, intricate, landscape (abstract), pivotal, showcase, tapestry (abstract), testament, underscore, vibrant. Replace with plain words.
8. **Fancy ways to say "is".** "serves as", "stands as", "boasts", "features". Say "is" or "has" instead.
9. **"Not just X, but Y."** State the point directly.
10. **Rule of three.** Forcing ideas into groups of three. Use the natural number.
11. **Synonym cycling.** Using four different nouns for the same entity in one paragraph. Pick one; repeat it.
12. **False ranges.** "from X to Y" where X and Y are not on a meaningful scale. List topics directly.

### Style

13. **Em dash overuse.** Do not stack em dashes in one paragraph. Do not reach for one where a period or comma is the cleaner break. When replacement is needed, use the punctuation that spot needs: period, comma, colon, parentheses, or nothing.
14. **Colon overuse.** Colons are fine before a list or example, not as mid-sentence connectors. Rewrite to let the point stand without comparison framing.
15. **Boldface overuse.** Do not bold every proper noun or acronym.
16. **Inline-header lists.** A bold label and colon that restates the line is a tell: "**Performance:** Performance improved...". Convert to prose. A bold lead-in that names the item and is followed by genuinely new detail is not a tell.
17. **Title case headings.** Use sentence case.
18. **Decorative emojis.** Remove from headings and bullets.
19. **Curly quotes.** Replace with straight quotes.

### Communication

20. **Chatbot phrases.** "I hope this helps!", "Let me know if...", "Of course!", "Certainly!", "Found the smoking gun!". Remove.
21. **Cutoff disclaimers.** "While specific details are limited..." Find sources or remove.
22. **Sycophantic tone.** "Great question! You're absolutely right!" Respond directly.

### Filler

23. **Filler phrases.** "In order to" becomes "To". "Due to the fact that" becomes "Because". "It is important to note that" gets deleted.
24. **Excessive hedging.** "could potentially possibly be argued that it might" becomes "may".
25. **Generic conclusions.** "The future looks bright." State specific plans or facts.

### Jargon

26. **Abstract metaphor nouns.** Substrate, wedge, vector, locus, vantage, nexus, bedrock, modality, paradigm, ratchet, evacuate (for moving code), endgame, north star, flywheel. Replace with a plain concrete word. "Substrate" becomes "base". "Ratchet" becomes the mechanism's real name. Ban a word when a plainer concrete word says the same thing.

### Plain speech

27. **Say what it does.** "the database stays close at hand", "SQL you can read", "types that follow your schema" name a feeling. The fix names the mechanism or a number. If a sentence could appear unchanged in another project's docs, it says nothing. Cut it.
28. **Shorten or split dense sentences.** If the reader has to backtrack, break the sentence in two or drop clauses.
29. **Active voice.** "is/are/was/were + past participle" is passive. Name the actor. Passive is fine only when the actor is unknown or genuinely does not matter.
30. **Cut adverbs, or use a stronger verb.** "runs quickly" becomes "is fast" or the number. A weak verb with an adverb means the verb is wrong.
31. **Prefer the plain word.** "utilize" becomes "use". "leverage" becomes "use". "facilitate" becomes "help". "numerous" becomes "many". "in the event that" becomes "if".

## Failure and recovery
- **Already clean.** If the text contains no AI tell patterns, return it unchanged and report the text is already clean.
- **Meaning lost.** If meaning cannot be preserved after removing tells, stop and report meaning was lost.
- **Fix introduces new tell.** If a fix itself reads as AI-generated, undo it and try a different approach or leave that pattern.

## Output
The edited prose with AI tell patterns removed. Meaning and intended tone are preserved.

## Provenance

Origin: cursor/plugins (Lauren Tan / poteto), revision 68836ddaf5697224520f1847d90cdb90ca8babaa. License: MIT (pstack/LICENSE, evidence blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25). Adaptation: Clean-room adaptation of the cursor unslop skill to the focused AI-tell removal procedure for the ODIN skill catalog. The source skill is a 32-pattern comprehensive checklist; this adaptation is scoped to the AI-tell removal procedure only.
