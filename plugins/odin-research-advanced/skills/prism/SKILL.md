---
name: prism
description: 'Use when one reviewer angle is insufficient or the user asks to prism an artifact or review it from different angles. Selects independent lenses, strips session framing, fans out fresh zero-context reads, and reports divergences before convergences with one decisive resolving question. Not for source or remote-system changes.'
---

# Prism

## Contract

| Field | Bound contract |
|---|---|
| Trigger | One reviewer angle is insufficient, the user asks to "prism this" or "review this from different angles," or one read may be an artifact of how the question was framed. |
| Authority | Read only the supplied artifact and relevant supplied context; do not mutate files, version control, credentials, paid services, publications, deployments, or remote state. Spawns fresh zero-context reads only. |
| Side effect | Produce a divergence-first report in chat only; create or change no files. |
| Done | The reader can see which perspectives diverged or converged, divergences sharing a root are collapsed to that root, convergence is labeled reassurance rather than proof, and the single decisive resolving question is stated. |

## Inputs

The artifact to review is required. The user may optionally supply review lenses, relevant context, or a decision the review must inform. Optional: read count between 2 and 5 (default 3). The same model is allowed across reads: this checks framing blind spots, not cross-model truth. If lenses are omitted, derive them from the artifact's genuinely distinct failure modes.

## Procedure

1. Read the artifact end to end before selecting lenses. Treat supplied context as evidence only when it is available and attributable; do not invent missing facts. Done when: the artifact is read completely and no fact is invented.
2. Select two to five lenses, each representing a distinct failure mode. Merge proposed lenses that test the same failure mode; let the artifact determine the count rather than defaulting to a fixed number. Done when: each lens targets a distinct failure mode and duplicates are merged.
3. Strip the framing. Remove the session's own examples, suggested answers, preferred naming, and framing-specific wording down to the underlying goal, constraints, and known facts. Restate the bare review question in neutral terms that do not carry the session's loaded vocabulary; if a term is load-bearing, keep its denotation but drop the framing that points at one answer. Done when: the bare question is restated in neutral terms with loaded framing removed.
4. Fan out 2 to 5 fresh zero-context reads of the bare question, default 3, each evaluated independently through one lens. The same model is allowed. Done when: 2 to 5 fresh reads are dispatched, each through a distinct lens.
5. Normalize verdicts. For each lens give exactly one verdict (`pass`, `fail`, or `unclear`) and the single most load-bearing reason supported by the artifact or supplied context. Do not average or flatten conflicting verdicts. Done when: every lens has one verdict and one load-bearing reason.
6. Classify each perspective against the current direction: `divergent-incompatible` (challenges a premise the direction depends on), `divergent-compatible` (adds or reframes without discarding the direction), or `convergent`. Done when: every perspective is classified.
7. Cluster divergences by shared root before reporting. When several divergences share one root, name the root and put the instances under it as evidence. Done when: divergences sharing a root are collapsed to that root.
8. Report divergence-first: incompatible divergence, then compatible divergence, then convergence. Label convergence as reassurance, never proof. No majority vote, no averaging, no "verified." Done when: the divergence-first report is emitted with convergence labeled as reassurance.
9. Name one decisive resolving question whose answer would resolve the deepest disagreement. For full convergence, state the shared verdict and mark the resolving question as `none—no lens conflict`. Done when: the decisive question is stated, or `none—no lens conflict` with the shared verdict.
10. Check that every selected lens appears once, every verdict has evidence, every perspective is classified, and the grouping follows from the verdicts. Return the report only in chat. Done when: every lens appears once, every verdict has evidence, every perspective is classified, and the grouping follows from the verdicts.

## Failure and recovery

- Missing or unreadable artifact: stop and return `blocked`, naming the artifact or access needed; do not substitute a guessed artifact.
- Framing cannot be stripped: if the bare question still carries the session's loaded terms and no neutral restatement exists, report that the framing cannot be separated and stop. Do not fan out a still-loaded question.
- Lens collapse: if fewer than two genuinely distinct failure modes remain after merging duplicates, return `blocked: independent lenses unavailable` and explain why a multi-lens verdict would be false precision.
- Insufficient evidence: use `unclear` for the affected lens and name the missing evidence; do not convert uncertainty into pass or fail.
- Read refuses or returns empty: report the refusal as a divergence lead rather than retrying with re-primed prompts.
- Partial result: return every read obtained with its classification. Never fabricate a read, invent a classification, or upgrade convergence to proof.
- Unresolved disagreement: return the conflicting verdicts and the single resolving question as a valid partial result; do not claim convergence.

All failures preserve the read-only boundary: there is no mutation to roll back.

## Output

Return a chat report with sections in this order: Lenses, Verdicts, Divergences, Convergence, Decisive question, Status.

| Section | Content |
|---|---|
| Lenses | Each selected lens and the failure mode it targets. |
| Verdicts | Per lens: the normalized verdict (`pass` / `fail` / `unclear`), the load-bearing reason, and the perspective classification (`divergent-incompatible` / `divergent-compatible` / `convergent`). |
| Divergences | Roots with their divergent perspectives clustered underneath, incompatible divergence first, then compatible divergence. |
| Convergence | Convergent perspectives described as reassurance, never proof. |
| Decisive question | The single question whose answer would resolve the deepest disagreement, or `none—no lens conflict` with the shared verdict. |
| Status | `complete` when all lenses evaluated and all perspectives classified; `partial` when some reads were obtained but not all; `blocked` when the artifact is missing, framing cannot be stripped, or independent lenses are unavailable. |
