---
name: doc-coauthoring
description: 'Use when drafting a doc, proposal, spec, RFC, design doc, decision doc, or PRD in chat. Not for reviewing an existing plan: use doc-review. No source or remote-system changes.'
---

# Doc coauthoring

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to write a doc, proposal, spec, RFC, design doc, decision doc, or PRD. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. The document is drafted and iterated as chat output only. |
| Side effect | Drafts and iterates a structured document in chat; never writes, creates, or edits files. |
| Done | The document passes reader testing against a fresh-context reader and meets the user''s stated impact goals. |

## Inputs

Required from the user:
- Document type (e.g., technical spec, decision doc, proposal, RFC, PRD, design doc).
- Primary audience.
- Desired impact when someone reads the document.

Optional:
- A template or specific format to follow (link, pasted text, or description).
- Constraints, timeline pressures, organizational context, related discussions, technical architecture, stakeholder concerns.
- An existing draft to edit.

The user may supply context in shorthand, as an unstructured context dump, or by pointing to material to paste. Ask clarifying questions to close gaps; never invent missing context.

## Procedure

1. Offer the three-stage workflow: Context Gathering, Refinement & Structure, and Reader Testing. If the user declines, work freeform and stop this procedure. **Done when:** the user accepts the three-stage workflow or the skill stands down.

2. Stage 1: Context Gathering. **Done when:** context gaps are closed and the user clears the move to drafting.
   1. Ask for meta-context: document type, primary audience, desired impact, template/format, and constraints.
   2. If the user names a template or existing draft, ask them to share or paste it; read what is provided.
   3. Ask for an unstructured dump of all relevant context (background, alternatives rejected, organizational context, timeline, architecture, stakeholder concerns).
   4. Once the initial dump is done, ask 5-10 clarifying questions targeting gaps. The user may answer in shorthand.
   5. Exit Stage 1 when questions reach edge cases and trade-offs without needing basics explained. Ask whether the user wants to add more context before moving on.

3. Stage 2: Refinement & Structure. **Done when:** the section structure and every section are refined.
   1. Agree on the section structure. If unknown, suggest 3-5 sections appropriate to the document type. Start with the section that has the most unknowns (usually the core proposal or technical approach); leave summary sections for last.
   2. For each section, in order:
      1. Announce the section and ask 5-10 clarifying questions about what it should contain.
      2. Brainstorm 5-20 numbered options for content, looking for forgotten context and unmentioned angles.
      3. Ask the user which options to keep, remove, or combine, with brief justifications. If the user gives freeform feedback, parse the preferences and apply them.
      4. Gap-check: ask whether anything important is missing for this section.
      5. Draft the section in chat based on the curated selections. Ask the user to indicate changes rather than editing directly, so their style preferences carry forward.
      6. Refine through surgical edits indicated by the user. After three consecutive iterations with no substantial change, ask whether anything can be removed without losing important information. Confirm the section is complete before moving on.
   3. When 80% or more of sections are drafted, re-read the whole draft and report flow problems, redundancy, contradictions, and generic filler.

4. Stage 3: Reader Testing. **Done when:** fresh-reader questions are answered correctly with no new gaps.
   1. Predict 5-10 questions a fresh reader would realistically ask to discover or use this document.
   2. Test each question with a fresh-context reader that has no conversation history: use a sub-agent if available; otherwise instruct the user to paste the draft into a fresh conversation and ask the questions. For each question, capture whether the reader answered correctly, found anything ambiguous, and what prior knowledge the doc assumed.
   3. Run additional checks for ambiguity, false assumptions, and internal contradictions.
   4. Report gaps and loop back to Stage 2 refinement for any problematic section. Exit Stage 3 when the fresh-context reader consistently answers correctly and surfaces no new gaps.

5. Final review. Recommend the user do a final read-through, double-check facts, links, and technical details, and verify the document achieves the desired impact. Offer one more review; otherwise announce completion. **Done when:** the user receives the final review recommendation and completion offer.
## Failure and recovery
- User declines the workflow: work freeform; this is not a failure.
- Insufficient context to draft a section: ask clarifying questions; never invent content or fill gaps with plausible-sounding material.
- Reader testing surfaces gaps: loop back to Stage 2 refinement for the affected sections; do not declare done.
- Non-convergence: if reader testing repeatedly surfaces new gaps without resolution across iterations, stop and return a non-converged result listing the unresolved gaps and the sections that still fail reader testing. Never claim the done predicate holds while gaps remain.
- Partial result: the current draft is returned in chat with the unresolved gaps explicitly named; no file is written.

## Output
A structured document draft delivered in chat, built and iterated section by section, that passes reader testing against a fresh-context reader and meets the user''s stated impact goals. On non-convergence, a non-converged report naming the unresolved gaps and failing sections. No file is created or modified.
