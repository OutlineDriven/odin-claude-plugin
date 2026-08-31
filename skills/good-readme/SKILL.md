---
name: good-readme
description: 'Use when the user asks to create, rewrite, review, or polish an open-source README, edit README.md into a progressively disclosed, evidence-grounded introduction, example, and getting-started guide whose claims are sourced and whose headings alone tell the story. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Good README

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to create, rewrite, review, or polish an open-source README. |
| Authority | Reversible local write to README.md only; recover by restoring the prior README.md from version control or the editor undo history. |
| Side effect | Edits README.md into a progressively disclosed, evidence-grounded project introduction, example, and getting-started guide. |
| Done | Claims are sourced, the opening explains benefit and difference, the 4–10-line example is self-explanatory, clean-machine setup works, and headings alone tell the story. |

## Inputs

- The project repository containing or awaiting a README.md. A README may not yet exist; create it.
- The user's answers for any fact not present in the repo: real differentiators from alternatives, benchmark numbers, exact file sizes, and supported platforms. Required when the repo lacks them; ask the user rather than guess.

## Procedure

1. Read the existing README.md if present, plus the repo's package manifest, source entry points, and any benchmark or size data. Record which facts (differentiators, numbers, sizes, platforms) are present and which are missing.
2. In an existing README, remove all badges; if a badge carries a real fact such as version or build status, state that fact in text instead.
3. Write the opening block first: one plain-language paragraph answering what the project does, how the user benefits, and what makes it different from alternatives. If the real differentiators are not in the repo, ask the user before writing them.
4. Add a scannable facts list right after the opening: lead each bullet with 1–2 bold keywords, then back it with concrete evidence from the repo — real benchmark numbers, exact sizes, side-by-side code comparison with the closest alternative, or a screenshot or diagram that replaces a paragraph. For any number not present in the repo, ask the user or how to measure it; never estimate.
5. Add a 4–10-line self-explanatory usage example that shows its output in a comment, so the reader sees the result without running anything. The example illustrates usage; the real setup guide comes next.
6. Add a getting-started guide: explicit, copy-pasteable commands for adding the tool to an existing project, with every step present. Validate it by following it from scratch as if the project had never been seen, and fix every gap.
7. Format for skimmers: headings for hierarchy, bold for key points, lists over dense paragraphs, horizontal rules between layers, and must-not-miss lines in blockquotes or bold. If the README exceeds roughly two screens, add a table of contents after the opening block. Confirm that skimming only headings and bold text still tells the story.
8. Run the finishing checklist: the first paragraph alone sells the project (what, benefit, difference); every number and claim is real and sourced from the repo, the user, or a measurement; the example is self-explanatory, 4–10 lines, and shows its output; getting started works from a clean machine; headings and bold text alone tell the story.

## Failure and recovery
- Unsourced claim: if a needed fact (differentiator, number, size, platform) is not in the repo and the user cannot supply it, omit that claim rather than estimate. Never write a number not measured or received.
- Setup gap: if the getting-started guide cannot be validated from a clean machine because a step is missing or a command fails, fix the step before finishing; if the gap cannot be resolved, mark the guide incomplete and stop.
- Non-mutation when blocked: if the opening differentiators or required facts are missing and the user does not supply them, do not fabricate them; leave the README with the sourced content written so far and report exactly which claims are blocked.
- Partial result: a README with sourced content but missing sections is a partial result; report which sections are complete and which are blocked. Never claim the done predicate holds when a checklist item fails.

## Output
An edited README.md structured as opening block, facts list, 4–10-line example with output, and getting-started guide, formatted for skimmers, with every claim sourced from the repo, the user, or a measurement. When blocked, the partial README plus a report naming the unsourced claims and the unresolved clean-machine setup gaps.

## Provenance

- Origin: https://github.com/evilmartians/agent-skills, skills/good-readme/SKILL.md.
- Pinned revision: a2a83b280a2c5b9a6176c5934298fad0224bbce4.
- License: MIT (LICENSE). Copyright and permission notice must be preserved in all copies or substantial portions; adaptation and rewrite are permitted with attribution retained.
- Adaptation: clean-room rewrite preserving the README authoring mechanism — progressive-disclosure structure, never-invent-facts rule, opening what/benefit/difference block, bold-keyword evidence list, 4–10-line example with output in a comment, clean-machine getting-started validation, and skim-by-headings check — without copying Evil Martians' expression.
