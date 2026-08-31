---
name: presentation-creator
description: 'Use when asked to create a presentation, pitch deck, or web deck from a topic and audience. Originates the narrative spine, slide content, and speaker notes, then applies design and runs an editorial QA pass. Not for formatting existing content into slides.'
---

# Presentation creator

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Create a complete presentation including narrative, slides, and speaker notes from a topic and audience. |
| Authority | Reversible local write for the generated deck and supporting files. |
| Side effect | Local write: produces a deck as markdown or web-deck HTML, plus supporting files in the working directory. |
| Done | A completed presentation file at a deterministic path in the requested format, passing editorial QA with no blocking issues. |

## Inputs

- Topic or subject (required): the presentation's central theme or argument.
- Audience (required): who will view the deck; drives tone, depth, and vocabulary.
- Format (optional): `markdown` (default) or `web-deck`. If omitted, produce markdown.
- Source material (optional): existing notes, outlines, documents, or data to incorporate.

## Procedure

1. Derive the narrative spine. Establish the situation, introduce the complication, raise the turning question, deliver the resolution, and land the takeaway. Each subsequent slide group must serve this spine. If a section cannot connect to the spine, remove it rather than force a weak link. Done when: the narrative spine states situation, complication, resolution, and takeaway.

2. Outline the slide groups. Map the spine to ordered sections: opening hook, problem or context, core content, key takeaways, closing call-to-action. For pitch decks, follow the arc: problem, solution, market, traction, team, ask. Done when: every slide group is outlined in order and each serves the spine.

3. Write slide headlines and concise visual content. For each slide, write a headline that states the slide's single point. Keep body text to no more than four bullet points or one short paragraph. Specify any visual element (chart, diagram, image placeholder, icon). Done when: every slide has a headline, body content, and visual specification.

4. Generate standalone speaker notes for every slide. Expand on the slide text: provide the full talking point, anticipate audience questions, include data citations or examples not shown on the slide, and mark transitions to the next slide. Notes must be usable as a standalone script. Done when: every slide has speaker notes that work as a script.

5. Apply design template and write to the specified output path. Set a consistent color palette and typography pairing for the audience and topic. Define layout templates: title slide, content slide, visual-heavy slide, closing slide. For web-deck format, add transitions and responsive layout. Write the deck to `presentation-<topic-slug>.md` (markdown) or `presentation-<topic-slug>.html` (web-deck) in the working directory. Done when: the file exists at the deterministic path with design applied.

6. Run editorial QA. Check every slide: headline accurately represents content, speaker notes exist and are complete, visual design is consistent across all slides, story spine is traceable from opening to close, no orphaned or redundant slides, no broken references, and text is free of typos and grammatical errors. Fix each issue found. If a slide's content cannot be fixed without new information from the user, flag it as a blocker. Done when: every QA check passes with no blockers, or blockers are explicitly listed.

## Failure and recovery

- Missing required inputs: stop immediately. Report which inputs are missing. Do not proceed with defaults or invented content.
- Story spine does not connect: report the broken links and ask the user whether to remove disconnected sections or supply additional material.
- Design QA fails: return a partial blocked result naming the blockers. Do not silently degrade the format. If web-deck tooling is unavailable, report the failure and ask the user whether to accept markdown instead; do not fall back without confirmation.
- Partial result rule: a deck with unresolved QA blockers is a partial result, not a successful delivery. Label it explicitly.

## Output

A completed presentation file at `presentation-<topic-slug>.md` or `presentation-<topic-slug>.html` in the working directory, containing the full slide deck, a story spine summary, speaker notes for every slide, visual design specifications, and QA pass results.
