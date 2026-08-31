---
name: final-grain
description: 'Use when asked to push an already-working artifact to finished composition, texture, and feel without confusing implementation completion with composition. Not for remote, credential, publish, deploy, or irreversible changes. Not for hygiene routing — use clean-and-true.'
---

# Final grain

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to push an already working artifact to finished composition, texture, and feel. Not for hygiene routing — use clean-and-true. |
| Authority | Reversible local writes to the named artifact only. Use its current VCS version as the rollback source. If it is not tracked, require a human-supplied recovery source before mutation. |
| Side effect | Produce a polished local artifact at the named path. No VCS, remote, credential, or paid mutation. |
| Done | The artifact exists at the named path with visible polish applied and original functionality confirmed intact. |

## Inputs

- Artifact: the working file or set of files to be polished. Required; user provides the path.
- Polish targets: the specific structure, grain, or feel dimensions the human wants refined. Optional; if absent, the agent proposes three targets and the human confirms before proceeding.

## Procedure

1. Confirm the artifact path and that it is working as delivered. Done when: the artifact path is confirmed and the artifact is working.
2. Classify the artifact type (document, code file, config, spec, report, or other). Done when: the artifact type is classified.
3. Propose three polish dimensions (structural coherence, compositional refinement, and presentational polish) unless the human named them. Done when: three polish dimensions are proposed or the human's named targets are adopted.
4. Obtain explicit human confirmation of the polish targets before mutating any file. Done when: the human confirms the polish targets.
5. If the artifact is tracked in version control, note its current committed version as the rollback source. If it is not tracked, require the human to supply an existing recovery source before mutation; otherwise stop as blocked. Done when: the rollback source is noted or the run is blocked for lacking one.
6. Apply polish to the artifact along the confirmed dimensions only. Do not change implementation correctness. Done when: polish is applied along the confirmed dimensions with implementation correctness unchanged.
7. Verify the polished artifact preserves the original functionality: run a smoke test if applicable. Done when: original functionality is confirmed intact.
8. Replace the original artifact with the polished version. Done when: the polished version replaces the original at the named path.

## Failure and recovery
- Polish broke the artifact: restore the named artifact from its VCS version or the human-supplied recovery source. Return `rollback` and a report of what broke.
- Human withheld or withdrew confirmation: stop without mutation. Return `blocked`.
- **Polish oscillates or degrades without progress**: stop after three refinement cycles. Return `non-converged`. Do not produce an artifact under this outcome.

## Output
A polished artifact at the named path plus a one-paragraph summary of which dimensions were refined and which choices were made in each dimension.
