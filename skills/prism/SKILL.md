---
name: prism
description: 'Use when one reviewer angle is insufficient or the user asks to prism an artifact or review it from different angles. Returns where independent lenses agree or disagree and the single question that resolves any disagreement. Not for source or remote-system changes.'
---

# Prism

## Contract

| Field | Bound contract |
|---|---|
| Trigger | One reviewer angle is insufficient, or the user asks to "prism this" or "review this from different angles." |
| Authority | Read only the supplied artifact and relevant supplied context; do not mutate files, version control, credentials, paid services, publications, deployments, or remote state. |
| Side effect | Produce grouped verdicts in chat only; create or change no files. |
| Done | The reader can see which lenses agreed or disagreed and the single question that matters. |

## Inputs

The artifact to review is required. The user may optionally supply review lenses, relevant context, or a decision the review must inform. If lenses are omitted, derive them from the artifact's genuinely distinct failure modes.

## Procedure

1. Read the artifact end to end before selecting lenses. Treat supplied context as evidence only when it is available and attributable; do not invent missing facts. Done when: the artifact is read completely and no fact is invented.
2. Select two to five lenses, each representing a distinct failure mode. Merge proposed lenses that test the same failure mode; let the artifact determine the count rather than defaulting to a fixed number. Done when: each lens targets a distinct failure mode and duplicates are merged.
3. Evaluate the artifact independently through each lens. Give exactly one verdict (`pass`, `fail`, or `unclear`) and the single most load-bearing reason supported by the artifact or supplied context. Done when: every lens has one verdict and one load-bearing reason.
4. Group the lens verdicts as `full agreement`, `agreement for different reasons`, or `disagreement`. Do not average or flatten conflicting verdicts. Done when: the grouping reflects the verdicts without averaging.
5. For disagreement, state the single next question whose answer would resolve the conflict. For full agreement or agreement for different reasons, state the shared verdict and only reasons that are load-bearing for at least two lenses; mark the resolving question as `none—no lens conflict`. Done when: the decisive question is stated, or `none—no lens conflict` with the shared verdict.
6. Check that every selected lens appears once, every verdict has evidence, and the grouping follows from the verdicts. Return the report only in chat. Done when: every lens appears once, every verdict has evidence, and the grouping follows from the verdicts.

## Failure and recovery
- **Missing or unreadable artifact:** stop and return `blocked`, naming the artifact or access needed; do not substitute a guessed artifact.
- **Lens collapse:** if fewer than two genuinely distinct failure modes remain after merging duplicates, return `blocked: independent lenses unavailable` and explain why a multi-lens verdict would be false precision.
- **Insufficient evidence:** use `unclear` for the affected lens and name the missing evidence; do not convert uncertainty into pass or fail.
- **Unresolved disagreement:** return the conflicting verdicts and the single resolving question as a valid partial result; do not claim convergence.

All failures preserve the read-only boundary: there is no mutation to roll back.

## Output
Return a chat report with sections Lenses, Grouping, Decisive question, Status in that order.

## Provenance

Project-owned adaptation of `skills/prism/SKILL.md` from the `odin-current` source candidate `current:current-c:current:prism`. No source revision or license identifier was supplied. This adaptation preserves the independent two-to-five-lens review, one verdict and one load-bearing reason per lens, explicit agreement grouping, non-averaging of disagreement, and single decisive-question mechanism while translating authority to a read-only, chat-only contract.
