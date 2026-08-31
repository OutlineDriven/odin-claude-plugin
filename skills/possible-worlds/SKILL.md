---
name: possible-worlds
description: 'Use when a design dispute has at least two live interpretations and the caller wants the alternative worlds made explicit. Emit one paragraph at a five-year-old abstraction level that lays out those worlds and ends with one non-binding recommendation. Don''t use for tasks that require source or remote-system changes.'
---

# Possible worlds

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Use only when a design dispute has at least two live interpretations and the caller wants the alternative worlds made explicit. |
| Authority | Read supplied dispute material only. Do not mutate files, version control, credentials, paid services, publications, deployments, or remote state; do not select or record a decision or authorize downstream mutation. |
| Side effect | Emit one paragraph only; make no mutation, decision record, design selection, or downstream authorization. |
| Done | One paragraph at a five-year-old abstraction level lays out the live interpretations and ends with exactly one recommendation while the dispute remains open. |

## Inputs

Supply a design dispute containing at least two live interpretations. Include any declared premises, axes of disagreement, or evidence needed to distinguish them. A tracked `magicbox` card may be supplied as evidence, but execution does not require one.

## Procedure

1. Confirm that the subject is a design dispute, at least two interpretations remain live, and the caller wants those alternatives made explicit. Otherwise stop with the applicable failure result.
2. Extract the shared premise set and the axes on which the interpretations vary from the supplied dispute. Treat unsupported claims as premises rather than inventing evidence.
3. Construct one possible world for each live interpretation. Keep shared premises fixed, identify the premise delta that reaches each world, and require every world to be internally consistent.
4. Present the worlds neutrally rather than as failure-only scenarios, and make no claim that they cover every possibility.
5. Translate the contrast to a five-year-old abstraction level using familiar objects, simple actions, and direct cause-and-effect language. Keep the entire result in one paragraph.
6. End that paragraph with exactly one recommendation about which disputed premise or evidence to examine next. The recommendation must leave the design unselected and the dispute open.
7. Return the paragraph only after confirming that it contains at least two live worlds, one final recommendation, no decision record, and no authorization to mutate anything.

## Failure and recovery
Return `not-applicable: design dispute does not contain at least two live interpretations` when the trigger does not hold. Return `blocked: dispute cannot support internally consistent alternative worlds without invented premises` when required premises are missing, contradictory, or would require scope beyond the supplied dispute. Emit no partial paragraph and make no mutation. Recovery requires the caller to supply a corrected dispute or the missing premises, after which the procedure starts again.

## Output
On success, return only one prose paragraph at a five-year-old abstraction level. It must lay out the live possible worlds, end with exactly one non-binding recommendation, and leave design selection, decision recording, and any downstream action to the caller.

## Provenance

Project-owned adaptation of the user-named priority-five candidate `priority:priority-five:PF-05` and user-named extension candidate `invention:inventions:INV-05`, adjudicated as NW-01 under AR-1. No source revision or third-party license was supplied. The adaptation combines the dispute-only paragraph contract with premise-delta world construction while remaining self-contained and read-only.
