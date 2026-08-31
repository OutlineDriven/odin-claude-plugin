---
name: improve-architecture
description: 'Use when improving modular design, testability, or agent navigability, or when surfacing deepening refactors. Produce one resolved deep-module design with replacement tests and updated domain artifacts. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Improve architecture

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to improve modular design, testability, or agent navigability, or to surface deepening refactors. |
| Authority | Read the scoped local codebase and write only the chosen refactor and its tests, `CONTEXT.md` entries for newly established domain terms, and an optional local ADR that the user accepts. All writes must be reversible by restoring the pre-change file contents. Do not mutate credentials, paid services, published or deployed state, or remote state. |
| Side effect | Reversibly change only the files named in the accepted candidate; update `CONTEXT.md` inline when a domain term is established; optionally add or amend an ADR after acceptance; optionally dispatch two parallel read-only interface-design passes for the chosen candidate. |
| Done | One chosen deepening candidate is grilled to resolution, its shallow path is replaced rather than layered, tests exercise the resulting interface, obsolete shallow tests and code are removed, and established domain terms and accepted decisions are recorded locally. |

## Inputs

Required: a local codebase and either a user-named direction or permission to identify candidates in actively changing code. Before writing, require the user to select one candidate and resolve its design decisions. Optional inputs are existing `CONTEXT.md` or context-map files, local ADRs, and a user request for alternative interface designs. Absence of domain or ADR files is not an error.

Use this vocabulary when assessing the code:

- A **module** is any unit with an interface and implementation, at any scale.
- An **interface** is every fact a caller must know, including types, invariants, ordering, errors, configuration, and performance shape.
- **Depth** is behavior hidden per unit of interface learned; a deep module provides high leverage through a small interface.
- A **seam** is a place where behavior can be changed without editing that behavior in place.
- An **adapter** is a concrete implementation used at a seam.
- **Leverage** is capability gained per unit of interface learned.
- **Locality** is concentrating a change, bug, or required knowledge at one maintenance site.

## Procedure

1. Make the first execution action a read-only explorer dispatch. Put the scope in its brief. If the user named a direction, inspect that direction; otherwise inspect recent local change history first and bias the walk toward actively developed paths. Read applicable context files and local ADRs when present, then walk only the selected paths.
2. Classify concrete friction with three tests. Apply the deletion test: if deleting a module removes complexity, it is likely pass-through; if the complexity spreads into callers, the module earns its place. Treat the public interface as the test surface. Introduce a seam only for two real implementations, normally production and test; do not create a port for a hypothetical second adapter.
3. Present a numbered candidate list. For each candidate, name the files, the concrete problem and deletion-test result, a plain-language solution without an interface proposal, and expected locality, leverage, and testability changes. Surface an ADR conflict only when the observed friction supplies a specific reason to reopen it. Do not bundle unrelated refactors. Ask the user to select one candidate before writing or proposing its interface.
4. Grill the selected candidate adversarially. Resolve one dependent design decision at a time and recommend one answer. Bound the changed-file set before mutation. If a new domain term becomes established, update or lazily create `CONTEXT.md` immediately. If the user rejects a design for a reason future maintainers need, offer a local ADR and write it only after acceptance.
5. If the user requests interface alternatives, dispatch exactly two parallel read-only design passes over the selected candidate. Require each pass to minimize caller knowledge and state invariants, errors, ordering, configuration, and performance shape. Compare the two designs against leverage, locality, and test-surface quality; resolve their differences with the user before implementation.
6. Choose the dependency treatment by observed class. Merge pure or in-memory behavior behind the new interface without an adapter. For a local substitutable dependency, run the real stand-in in tests and keep its seam internal. For a remote owned service, use a port with its production protocol adapter and an in-memory test adapter. For a true external service, inject a port with production and mock adapters.
7. Implement only the accepted design. Validate external and serialized inputs at the new interface. Migrate every scoped caller, delete the replaced shallow path, and delete shallow-module tests after equivalent interface tests exist; do not layer the new design over the old one or leave compatibility paths.
8. Exercise the changed behavior through the same interface callers use. Confirm the accepted invariants, error modes, and relevant dependency implementation. Review the final changed-file set against the bound scope and verify that domain terms and accepted architectural decisions are recorded where required. Stop rather than widening scope or inventing evidence.

## Failure and recovery
- **No defensible candidate:** return `no-candidate` with the inspected scope and observed friction; make no changes.
- **No selection or unresolved decision:** return `blocked` with the candidate list or exact unresolved decision; preserve any completed read-only analysis and make no implementation change.
- **ADR conflict without a load-bearing reopening reason:** preserve the ADR and return `blocked-by-decision`; do not re-litigate or bypass it.
- **Missing required implementation fact or unavailable behavioral check:** return `blocked` with the missing fact or check and the files already changed. Do not claim the done predicate.
- **Failed implementation or verification:** restore every modified named file to its captured pre-change contents, remove only newly created artifacts from this run, and return `failed-rolled-back` with the failing observation. If exact restoration cannot be proved, stop with `recovery-required`, listing each affected file and its pre-change source.
- **Partial result:** analysis, candidate lists, and resolved decisions may be reported, but partially migrated code is never a successful output and must be rolled back.

## Output
Return the selected candidate and resolved interface contract; the exact files changed; the replacement and deletion performed; the interface-level checks and observed results; any `CONTEXT.md` or accepted ADR update; and one terminal classification: `done`, `no-candidate`, `blocked`, `blocked-by-decision`, `failed-rolled-back`, or `recovery-required`.

## Provenance

Adapted from the project-owned ODIN 1.x `improve-architecture` skill at `skills/improve-architecture/SKILL.md`. No source revision or license identifier was supplied. This self-contained adaptation retains scoped exploration, the deletion test, interface-as-test-surface and two-adapter seam discipline, candidate selection before interface design, adversarial grilling, optional design-twice comparison, dependency-class testing, replace-don't-layer migration, and inline domain-decision updates without depending on external skill or reference text.
