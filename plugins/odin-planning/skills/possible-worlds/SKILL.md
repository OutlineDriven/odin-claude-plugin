---
name: possible-worlds
description: 'Use when a design dispute has at least two live interpretations and the caller wants those worlds made explicit or needs one plain-language paragraph ending in one recommendation. Emits one paragraph at a five-year-old abstraction level with one non-binding recommendation. Not for selecting a design or changing source or remote systems.'
---

# Possible worlds

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A design dispute has at least two live interpretations and the caller wants the alternative worlds made explicit, or wants a plain-language paragraph ending in one recommendation. |
| Authority | Read supplied dispute material only. Do not mutate files, version control, credentials, paid services, publications, deployments, or remote state; do not select or record a decision or authorize downstream mutation. |
| Side effect | Emit one paragraph only; make no mutation, decision record, design selection, or downstream authorization. |
| Done | One paragraph at a five-year-old abstraction level lays out the live interpretations and ends with exactly one recommendation while the dispute remains open. |

## Inputs

Supply a design dispute containing at least two live interpretations. Include any declared premises, axes of disagreement, or evidence needed to distinguish them. No file, repository, card, or external state is read.

## Procedure

1. Confirm that the subject is a design dispute, at least two interpretations remain live, and the caller wants those alternatives made explicit or a recommendation. Otherwise stop with the applicable failure result. Done when: the subject is confirmed as a design dispute with at least two live interpretations.
2. Extract the shared premise set and the axes on which the interpretations vary from the supplied dispute. Treat unsupported claims as premises rather than inventing evidence. Done when: the shared premise set and variation axes are extracted.
3. Construct one possible world for each live interpretation. Keep shared premises fixed, identify the premise delta that reaches each world, and require every world to be internally consistent. When the caller wants a quick recommendation without the full worlds analysis, produce the paragraph directly from the dispute without requiring world construction. Done when: one internally consistent world is constructed per live interpretation, or the direct-production path is taken.
4. Present the worlds neutrally rather than as failure-only scenarios, and make no claim that they cover every possibility. Done when: the worlds are presented neutrally with no exhaustiveness claim.
5. Translate the contrast to a five-year-old abstraction level using familiar objects, simple actions, and direct cause-and-effect language. Keep the entire result in one paragraph. Use plain words, no jargon, no framework names. Done when: the contrast is translated to one paragraph at a five-year-old level.
6. End that paragraph with exactly one recommendation about which disputed premise or evidence to examine next. The recommendation must leave the design unselected and the dispute open. If no single recommendation follows from the dispute, stop and report that no one recommendation follows; do not force a selection. Done when: the paragraph ends with exactly one non-binding recommendation leaving the design unselected.
7. Return the paragraph only after confirming that it contains at least two live worlds, one final recommendation, no decision record, and no authorization to mutate anything. Done when: the paragraph is confirmed to contain two worlds, one recommendation, no decision record, and no mutation authorization.

## Failure and recovery

- Fewer than two live interpretations: stop before emitting anything. Report that the dispute does not meet the two-interpretation threshold. Emit no paragraph.
- Dispute cannot support internally consistent alternative worlds without invented premises: return `blocked: dispute cannot support internally consistent alternative worlds without invented premises`. Recovery requires the caller to supply a corrected dispute or the missing premises, after which the procedure starts again.
- Ambiguous or missing dispute statement: stop and ask the user to state the dispute. Do not invent interpretations.
- No single recommendation reachable: stop and report that no one recommendation follows. Do not force a selection.
- Partial-result rule: the output is atomic. Never emit a partial paragraph.
- Non-mutation rule: no file, VCS, credential, or downstream state is touched on any path, including failure paths.

## Output

One prose paragraph at a five-year-old abstraction level laying out the live possible worlds and ending with exactly one non-binding recommendation. Design selection, decision recording, and downstream action are left to the caller. No file, repository, card, or external state is read or modified.
