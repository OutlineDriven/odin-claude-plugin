---
name: breaking-driven
description: 'Demolish bloated code and re-derive it clean, cutting every surface the rebuilt contract does not name. Use for a repo-wide bloat sweep, when patching a subsystem has stopped paying, or when the user says "this is bloated", "rewrite this properly", or "break it and rebuild".'
argument-hint: "[path to a subsystem, or blank for a repo-wide survey]"
metadata:
  short-description: Bloat-triggered demolition and re-derivation
---

# Breaking-Driven Development

Patching an accreted subsystem preserves its shape. Every fix threads through the structure that caused the bug, and the structure survives the fix. This skill stops patching. Tear the implementation out, state what it owes, and build the replacement from that statement — not from the wreckage.

Bloat is the trigger, and derivation is the method. You do not know the right shape when you start; you derive it. What the old code did that the derived contract never names is **residue**, and residue gets cut.

One veto point: a **boundary** surface — something outside this repo depends on — stops for an explicit yes before it is cut. Everything **interior** gets demolished without asking.

## Scope

Repo-wide is opt-in, never inferred.

- A named path, or a target identified in the request, is the whole job. Start at step 2 on it.
- A bare invocation, or wording that asks for a sweep, surveys the repo and works the ranked list.

"This module is bloated" demolishes that module. Escalating a named grievance into a whole-tree campaign is this skill's worst failure, and trigger phrasing alone cannot tell the two apart — so any identifiable target scopes to itself.

A repo-wide run is a campaign, not an edit: one target at a time, each landing as its own atomic commit. Half-demolished is the forbidden state. Finish a target or revert it; never ship the middle.

## Workflow

1. **Pick the target.** A named path or identified target goes straight to step 2. Survey only on explicit repo-wide intent, ranking candidates by bloat signal — size, duplication, indirection depth, branch density — then work the list in order.
   *Done when:* the target set matches what was asked for, and any ranking names the signal behind each candidate.

2. **Classify the surface.** Inventory consumers. Mark **interior** (every caller in-tree, nothing persisted or shipped) or **boundary** (public API, wire or on-disk format, config running in someone else's deployment, plugin point, anything a version was promised against).

   Interior is a conclusion, not a default. Interior code turns boundary-like through deployment, data migration, and undocumented automation. Every consumer channel static analysis cannot resolve — reflection, string dispatch, generated code, external integrations, operator runbooks — carries **boundary** class until evidence or an explicit yes moves it. Skip this and step 5's gate is defeated by exactly the consumers nobody could enumerate.
   *Done when:* every consumer is named and classified, with unresolved channels listed by name and holding boundary class.

3. **State the contract, then derive blind.** Write down what the target owes its callers. Build the replacement from that statement alone, without reading the old implementation's structure — reading it is how the accretion reproduces itself under fresh names.
   *Done when:* the new implementation builds and stands on its own.

4. **Audit the divergence.** Now read the old implementation, for behavior rather than structure. Anything it does that the replacement does not is a special case the contract failed to name: branches, guards, early returns, side effects, ordering guarantees, error and failure semantics, state transitions.

   This audit is the only backstop in the method. Nothing executable proves the replacement equivalent, so an unclassified behavior is a feature deleted by accident.
   *Done when:* every such behavior is classified **essential** (fold it in) or **residue** (cut it), each with a one-line reason, and nothing is left unclassified. Performance characteristics are out of scope — benchmark separately when the target is hot.

5. **Gate the boundary.** Present every surface marked boundary in step 2 and get an explicit yes before cutting it. Interior surfaces need no ask; demolish them.
   *Done when:* no boundary surface has been cut without a recorded confirmation.

6. **Cut the residue and land it.** Delete the old implementation and every surface reachable only from it. Run the test suite the repo already has. Commit this target atomically before starting the next.
   *Done when:* a search for every symbol classified residue returns nothing, no unused imports/deps/types/files survive, the repo's verifier is green, and no target sits half-demolished. Surfaces kept as essential or held at the boundary gate keep their identifiers — they are the contract, not leftovers.

## When NOT to Apply

- Compat shims, feature flags, version gates, deprecation markers — the contract is deliberately changing. That is `refactor-break-compat`.
- A single function, or local dead fields and wrappers in code you are already editing — `cleanup-codebase`.
- Debug leftovers, placeholder bodies, swallowed errors — `deslop`.
- Restraint on code not yet written — `minimalism-driven`.
- A target whose contract cannot be stated: a god-object with no coherent responsibility. Derivation needs something to derive from. Split it first, then come back.

## Anti-patterns

- **Reading the old structure while deriving.** It comes back with new names and the same shape. State the contract, then look away.
- **Skipping the divergence audit.** Derivation alone is the rewrite that silently drops edge cases — and here it is the only check standing.
- **Calling a target interior on an empty search.** An empty grep over dynamic dispatch is not evidence. Unresolved means boundary.
- **Cutting a boundary surface without the yes.** The one place this skill stops. Stopping is the design, not hedging.
- **Starting the next target with one half-demolished.** Land it or revert it.
- **Escalating a named target into a repo-wide sweep.** Scope equals the ask.
- **Writing an adapter from the new shape back to the old.** That is the corpse climbing out of the grave you dug.

## Validation Gates

| Gate | Condition |
|------|-----------|
| Scope honored | Repo-wide survey ran only on explicit repo-wide intent; a named target stayed its own job |
| Consumers classified | Every consumer named interior or boundary; every channel static analysis cannot resolve carries boundary class and is listed by name |
| Derived blind | The replacement was written from the stated contract, before the old implementation was read for behavior |
| Divergence audited | Every old behavior — control flow, side effects, ordering, error semantics, state transitions — classified essential or residue with a reason |
| Boundary confirmed | Every boundary surface cut has a recorded yes against it |
| Zero residue | Searching the symbols, imports, config keys, and doc references classified residue returns nothing; surfaces kept essential or held unconfirmed at the boundary gate are exempt |
| Landed atomically | Repo verifier green; the target committed on its own; no half-demolished target in the tree |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Clean demolition: contract stated, replacement derived, divergence classified, residue gone, verifier green |
| 1 | Residue remains: symbols, imports, config keys, or doc references classified residue still resolve |
| 2 | Verifier red: the repo's own tests or build fail against the replacement |
| 3 | Campaign stalled mid-target: a target is half old, half new (the forbidden state). Finish it or revert it, never ship it |
| 4 | Divergence unclassified: old behavior neither folded in as essential nor cut as residue |
| 5 | Boundary cut without confirmation: a published surface was destroyed unasked. Restore it and get the yes |
| 6 | Scope exceeded: a repo-wide sweep ran off a named target. Revert the untargeted work |
