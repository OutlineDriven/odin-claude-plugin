---
name: breaking-driven
description: 'Use when bloated code needs clean re-derivation, or the user says "this module is bloated" or "break it and rebuild". Classifies old behavior as essential or residue, cuts residue, and leaves the verifier green. Not for untracked data or changes without VCS rollback.'
---

# Breaking-driven development

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user says "this module is bloated", "rewrite this properly", or "break it and rebuild". |
| Authority | Destructive changes restricted to VCS-tracked targets; show the exact set before mutation and use version control as recovery. |
| Side effect | Deletes obsolete implementation and residue, writes the replacement, and adds essential-behavior tests. |
| Done | Consumer contract preserved, every divergence classified, residue absent, and verifier green. |

## Inputs

A named path or identified target must be supplied or named in the request and defines the whole job. Optionally, a blank invocation or explicit repo-wide wording surveys the repo and works through a ranked list one target at a time.

## Procedure

1. **Pick the target.** A named path goes straight to step 2. Survey only on explicit repo-wide intent, ranking candidates by bloat signal — size, duplication, indirection depth, branch density — then work the list in order. Any identifiable target scopes to itself; escalating a named grievance into a whole-tree campaign is this skill's worst failure, and trigger phrasing alone cannot tell a single target from a sweep. Done when: a single target is selected or a ranked survey list is produced on explicit repo-wide intent.

2. **Classify the surface.** Inventory consumers. Mark **interior** (every caller in-tree, nothing persisted or shipped) or **boundary** (public API, wire or on-disk format, config running in someone else's deployment, plugin point, anything a version was promised against). Interior is a conclusion, not a default: every consumer channel static analysis cannot resolve — reflection, string dispatch, generated code, external integrations, operator runbooks — carries boundary class until evidence or an explicit yes moves it. An empty grep over dynamic dispatch is not evidence; unresolved means boundary. Done when: every consumer is classified interior or boundary with evidence for interior claims.

3. **State the contract, then derive blind.** Write what the target owes its callers, sourced from call-site usage, existing tests, and the public signature — never from the target's own internals. Build the replacement from that statement alone. Reaching into the old structure for the contract is how the accretion reproduces itself under fresh names; state the contract, then look away. Done when: the consumer contract is stated from call-site evidence and the replacement is derived from it alone.

4. **Audit the divergence.** Walk the old implementation function by function, branch by branch within a single function, and for each behavior name where it lives in the replacement or classify it residue. Read for behavior rather than structure: branches, guards, early returns, side effects, ordering guarantees, error and failure semantics, state transitions. This audit is the only backstop in the method — nothing executable proves the replacement equivalent — so a behavior never read is a feature deleted by accident and the walk is exhaustive, not impressionistic. Classify each behavior **essential** (fold it in) or **residue** (cut it) with a one-line reason. Performance characteristics are out of scope; benchmark separately when the target is hot. Done when: every old behavior is classified essential or residue with a one-line reason.

5. **Gate the boundary.** Present every surface marked boundary in step 2 and get an explicit answer before touching it. Interior surfaces need no ask; demolish them. Every boundary surface carries a recorded **yes** (cut it) or **no** (keep it permanently — it is contract, not residue). Cut none on silence or after a no. This is the one place the skill stops; stopping is the design, not hedging. Done when: every boundary surface has a recorded yes or no, with no cuts on silence or after a no.

6. **Cut the residue and land it.** Delete the old implementation and every surface reachable only from it. Do not write an adapter from the new shape back to the old — that resurrects the demolished structure under a new name. Run the repo's existing test suite, and cover every behavior step 4 classified essential that had no test. Commit this target atomically before starting the next. A search for every symbol classified residue must return nothing; no unused imports, deps, types, or files survive. Surfaces kept essential or refused at the boundary gate keep their identifiers — they are the contract, not leftovers. Half-demolished is the forbidden state: finish a target or revert it, never ship the middle. Done when: the target is committed atomically with residue deleted, essential behaviors tested, and the verifier green.

## Failure and recovery
- Residue remains (exit 1): symbols, imports, config keys, or doc references classified residue still resolve. Delete them; do not ship until the search is empty.
- Verifier red (exit 2): the repo's own tests or build fail against the replacement. Fix the replacement or revert the target; never ship red.
- Campaign stalled mid-target (exit 3): a target is half old, half new. Finish it or revert it via version control to the last green commit; never ship the middle.
- Divergence unclassified (exit 4): old behavior neither folded in as essential nor cut as residue. Complete the walk before proceeding.
- Boundary cut without an answer (exit 5): a published surface was destroyed on silence or after a no. Restore it from version control and settle the question.
- Scope exceeded (exit 6): a repo-wide sweep ran off a named target. Revert the untargeted work.
- Partial-result rule: a half-demolished target is never left in the tree. Revert to the last green commit rather than widen scope or invent evidence. Never swallow a verifier failure or pretend the done predicate holds.

## Output
Each target produces a clean demolition: consumer contract restated, replacement derived from it, every old behavior classified essential or residue, residue deleted, essential behaviors tested, target committed atomically with verifier green — a repo-wide campaign produces one such commit per target in ranked order.
