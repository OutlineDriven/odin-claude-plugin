---
name: guillotine
description: 'Cuts proven interior debt across code, documentation, tests, dependencies, configuration, workflows, and generated residue while preserving observable behavior. Use for a cross-surface purge backed by evidence. Not for deleting an already enumerated record set — use clean-clean-cut.'
---

# Guillotine

Remove weight the product does not use. Interior cleanup needs proof, not sentiment.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A repository or subsystem needs dead, duplicate, superseded, or generated residue removed across more than one artifact class. |
| Authority | Reversible local edits and deletion of VCS-tracked interior artifacts. No remote mutation, history rewrite, data migration, credential change, or deletion of untracked or critical data. |
| Invariant | The named observable boundary keeps the same behavior, public contract, and required evidence. |
| Done | Every removed artifact has a proof of non-necessity, no live route remains, the observable boundary still passes, and the repository gate is green. |

## Procedure

1. Name the subsystem and its observable boundary. List the commands, public routes, generated outputs, or user scenarios that must remain unchanged. If no boundary can prove the cut, stop before editing.
2. Build a candidate ledger. For each code path, document, test, dependency, configuration entry, workflow, or generated file, record its claimed job, live callers or readers, source of truth, and evidence that it is dead, duplicate, superseded, or reproducible.
3. Classify every candidate:
   - dead: no live caller, route, import, loader, build step, or documented consumer;
   - duplicate: another artifact owns the same fact or operation and all consumers can move to it;
   - superseded: the active path covers the required contract and no supported path selects the old one;
   - generated residue: the repository generator reproduces the required output and does not select this copy;
   - keep: evidence still names a live job, even when the artifact looks ugly.
4. Prove the cut from both directions. Search from each candidate to its consumers, then from each required consumer back to its owner. Run a focused behavioral, mutation, build, or generation probe when static references cannot prove necessity.
5. Stop for approval if the proposed cut reaches an observable API, user command, stored data, history, remote state, untracked file, credential, or critical target. Show the exact consequence and a recoverable alternative. Interior VCS-tracked debt with a proven unchanged boundary does not need a second approval.
6. Cut one dependency-closed slice at a time. Move live consumers to the single surviving owner, then delete the obsolete implementation, tests that protect only obsolete behavior, dependency entries, configuration, workflow steps, and generated copies. Do not leave aliases, shims, dual paths, tombstones, or "deprecated" wrappers.
7. Regenerate every repository-owned surface affected by the cut. Reject a generator that recreates the removed residue; fix its source selection instead of deleting its output again.
8. Exercise the observable boundary and run the repository-native gate. If behavior changes, restore the smallest failed slice from VCS, correct its ledger classification, and continue with the remaining proven cuts.
9. Re-run route, import, registration, and source-of-truth searches. The old path must be absent, and every required consumer must resolve to one live owner.

## Failure and recovery

| Failure | Action |
|---|---|
| A candidate still has a live consumer | Reclassify it as keep or move that consumer inside the same dependency-closed slice. |
| Two artifacts both appear canonical | Stop the cut and establish one owner before deleting either copy. |
| A test fails only because it asserts obsolete internals | Prove the observable contract elsewhere, then delete or rewrite the test. Do not weaken a real boundary test. |
| A dependency looks unused but participates in loading, build, or delivery | Keep it until a real package or artifact probe proves removal safe. |
| Generation recreates removed files | Fix the generator or membership source. Do not hand-delete generated output as the final state. |
| Boundary verification changes | Restore the failed slice from VCS and report the classification error. |
| The cut reaches an approval-gated boundary | Return the exact target, consequence, evidence, and recovery path; wait for explicit authority. |

## Output

Return the candidate ledger with cut or keep verdicts, removed paths grouped by artifact class, surviving owners, observable-boundary evidence, native gate results, and any approval-gated remainder.
