---
name: presentation-creator
description: 'Use when asked to create a deck, presentation, pitch deck, speaker notes, or web deck. Creates a deck artifact in markdown or web format with story spine, speaker notes, visual design, and a QA pass. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Presentation creator

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Explicit human invocation: create a deck, presentation, pitch deck, speaker notes, story spine, or web deck |
| Authority | Reversible-local: write only named local artifacts; rollback by deleting generated files or reverting to prior version |
| Side effect | Local write: produces a deck as markdown or web app; may generate supporting files in the working directory |
| Done | Deck artifact exists with a story spine connecting all sections, speaker notes for each slide, visual design applied, and a QA pass completed with no blocking issues |

## Inputs

- **Topic or subject** (required): the presentation's central theme or argument.
- **Audience** (required): who will view the deck; drives tone, depth, and vocabulary.
- **Format** (optional): output format preference — `markdown` (default) or `web-deck`. If omitted, produce markdown.
- **Deck type** (optional): one of `presentation`, `pitch-deck`, `speaker-notes`, or `general`. Defaults to `general`.
- **Source material** (optional): existing notes, outlines, documents, or data to incorporate.

## Procedure

1. **Gather inputs.** Confirm topic, audience, and format. If topic or audience is missing, stop and request them before proceeding. Done when: the stated outcome holds.

2. **Build the outline structure.** Define the deck's sections in a logical order: opening hook, problem or context, core content sections, key takeaways, and closing call-to-action. Each section maps to a slide group. For pitch decks, follow the pitch-deck arc: problem, solution, market, traction, team, ask. Done when: the stated outcome holds.

3. **Develop the story spine.** Write a narrative throughline that connects every section: establish the situation, introduce the complication, raise the turning question, deliver the resolution, and land the moral or takeaway. Each section of the outline must serve the spine. If a section cannot be connected, remove it rather than force a weak link. Done when: the stated outcome holds.

4. **Write slide content.** For each slide, write a clear headline that states the slide's single point, keep the supporting body text concise (no more than three to four bullet points or one short paragraph), and specify any visual element (chart, diagram, image placeholder, icon). Apply visual hierarchy: headline dominates, body supports, visuals reinforce. Done when: the stated outcome holds.

5. **Generate speaker notes.** For each slide, write speaker notes that expand on the slide text: provide the full talking point, anticipate audience questions, include data citations or examples not shown on the slide, and mark transitions to the next slide. Notes must be usable as a standalone script. Done when: the stated outcome holds.

6. **Apply visual design.** Set a consistent color palette appropriate to the audience and topic. Choose typography pairing (heading and body fonts). Define slide layout templates: title slide, content slide, visual-heavy slide, and closing slide. Apply consistent spacing, alignment, and margins. For web-deck format, add transitions and responsive layout. Done when: the stated outcome holds.

7. **Run the QA pass.** Check every slide against these criteria: headline accurately represents content, speaker notes exist and are complete, visual design is consistent across all slides, story spine is traceable from opening to close, no orphaned or redundant slides, no broken references to visuals or data, and text is free of typos and grammatical errors. Record any issues found. Done when: the stated outcome holds.

8. **Resolve QA issues.** Fix each issue found in step 7. If a slide's content cannot be fixed without new information from the user, flag it as a blocker and deliver the deck with the blocker noted rather than shipping broken content. Done when: the stated outcome holds.

9. **Generate output.** Produce the deck in the requested format: markdown as a single `.md` file with frontmatter and slide separators, or web deck as a self-contained HTML file with embedded styles and scripts. Include the story spine summary, complete speaker notes, and the QA pass results in the output. Done when: the stated outcome holds.

## Failure and recovery
- **Missing required inputs.** Stop immediately. Report which inputs are missing. Do not proceed with defaults or invented content.
- **Story spine does not connect.** If sections cannot form a coherent narrative, report the broken links and ask the user to confirm whether to remove disconnected sections or supply additional material.
- **Visual design fails.** If the requested format cannot be produced (e.g., web-deck tooling unavailable), fall back to markdown format and note the fallback in the output.
- **QA finds blocking issues.** Report each issue. Do not deliver the deck as done. Deliver it as partial with blockers listed, or wait for user resolution.
- **Partial result rule.** A deck with a valid story spine, complete speaker notes, and unresolved QA blockers is a partial result, not a successful delivery. Label it explicitly.

## Output
A complete deck artifact containing: - The full slide deck in the requested format (markdown or web-deck HTML). - A story spine summary showing the narrative throughline. - Speaker notes for every slide. - Visual design specifications (palette, typography, layout templates). - QA pass results listing any issues found and their resolution status.
