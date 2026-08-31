---
name: breaking-driven
description: 'Use when asked to demolish bloated code and re-derive it clean when the user says "this module is bloated", "rewrite this properly", or "break it and rebuild". The replacement is built from a consumer-side contract, every old behavior is classified essential or residue, residue is cut, and the repo verifier is green. Don''t use for untracked data or changes without a version-control rollback.'
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

A named path or identified target is the whole job and must be supplied or named in the request. Optional: a blank invocation or explicit repo-wide wording surveys the repo and works a ranked list, one target at a time.

## Procedure

1. **Pick the target.** A named path goes straight to step 2. Survey only on explicit repo-wide intent, ranking candidates by bloat signal — size, duplication, indirection depth, branch density — then work the list in order. Any identifiable target scopes to itself; escalating a named grievance into a whole-tree campaign is this skill's worst failure, and trigger phrasing alone cannot tell a single target from a sweep.

2. **Classify the surface.** Inventory consumers. Mark **interior** (every caller in-tree, nothing persisted or shipped) or **boundary** (public API, wire or on-disk format, config running in someone else's deployment, plugin point, anything a version was promised against). Interior is a conclusion, not a default: every consumer channel static analysis cannot resolve — reflection, string dispatch, generated code, external integrations, operator runbooks — carries boundary class until evidence or an explicit yes moves it. An empty grep over dynamic dispatch is not evidence; unresolved means boundary.

3. **State the contract, then derive blind.** Write what the target owes its callers, sourced from call-site usage, existing tests, and the public signature — never from the target's own internals. Build the replacement from that statement alone. Reaching into the old structure for the contract is how the accretion reproduces itself under fresh names; state the contract, then look away.

4. **Audit the divergence.** Walk the old implementation function by function, branch by branch within a single function, and for each behavior name where it lives in the replacement or classify it residue. Read for behavior rather than structure: branches, guards, early returns, side effects, ordering guarantees, error and failure semantics, state transitions. This audit is the only backstop in the method — nothing executable proves the replacement equivalent — so a behavior never read is a feature deleted by accident and the walk is exhaustive, not impressionistic. Classify each behavior **essential** (fold it in) or **residue** (cut it) with a one-line reason. Performance characteristics are out of scope; benchmark separately when the target is hot.

5. **Gate the boundary.** Present every surface marked boundary in step 2 and get an explicit answer before touching it. Interior surfaces need no ask; demolish them. Every boundary surface carries a recorded **yes** (cut it) or **no** (keep it permanently — it is contract, not residue). None are cut on silence, and none are cut after a no. This is the one place the skill stops; stopping is the design, not hedging.

6. **Cut the residue and land it.** Delete the old implementation and every surface reachable only from it. Do not write an adapter from the new shape back to the old — that resurrects the demolished structure under a new name. Run the repo's existing test suite, and cover every behavior step 4 classified essential that had no test. Commit this target atomically before starting the next. A search for every symbol classified residue must return nothing; no unused imports, deps, types, or files survive. Surfaces kept essential or refused at the boundary gate keep their identifiers — they are the contract, not leftovers. Half-demolished is the forbidden state: finish a target or revert it, never ship the middle.

## Failure and recovery
- **Residue remains (exit 1):** symbols, imports, config keys, or doc references classified residue still resolve. Delete them; do not ship until the search is empty.
- **Verifier red (exit 2):** the repo's own tests or build fail against the replacement. Fix the replacement or revert the target; never ship red.
- **Campaign stalled mid-target (exit 3):** a target is half old, half new. Finish it or revert it via version control to the last green commit; never ship the middle.
- **Divergence unclassified (exit 4):** old behavior neither folded in as essential nor cut as residue. Complete the walk before proceeding.
- **Boundary cut without an answer (exit 5):** a published surface was destroyed on silence or after a no. Restore it from version control and settle the question.
- **Scope exceeded (exit 6):** a repo-wide sweep ran off a named target. Revert the untargeted work.
- Partial-result rule: a half-demolished target is never left in the tree. Revert to the last green commit rather than widen scope or invent evidence. Never swallow a verifier failure or pretend the done predicate holds.

## Output
A clean demolition per target: the consumer contract restated, the replacement implementation derived from it, every old behavior classified essential or residue, residue deleted, essential behaviors tested, and the target committed atomically with the repo verifier green. A repo-wide campaign produces one such commit per target in ranked order.

## Provenance

Origin: ODIN 1.x current skill `skills/breaking-driven/SKILL.md`. No pinned revision or third-party license; project-owned marker. Clean-room adaptation to the ODIN 2.0 literal contract: frontmatter and section order rewritten, while the load-bearing mechanism — bloat-triggered demolition, consumer-contract re-derivation, interior/boundary classification, exhaustive divergence audit, residue cutting, essential-behavior tests, and atomic per-target commits — is preserved.
