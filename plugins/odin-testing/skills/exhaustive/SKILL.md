---
name: exhaustive
description: 'Use when asked to prove coverage, find missing cases, or enumerate state, decision, requirement, or behavior space. Not for round-based or single-property tests: use askme, property-test-authoring.'
---

# Exhaustive

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user says "exhaustive", "prove coverage", "did I miss any case", "enumerate the state space", or asks for a completeness audit before done. |
| Authority | Reversible local: writes only the coverage manifest artifact; rollback is deleting that file. No remote mutation. Read-only on the target source. |
| Side effect | Writes one classified coverage manifest (human-readable or `exhaustive-manifest/v1` YAML) with gaps prepared in dependency order; no source, VCS, config, or remote mutation. |
| Done | The manifest has zero unclassified cells and a one-line tally; for code state spaces the wildcard-catch-all assertion holds. |

## Inputs

- Must be supplied: the target surface to audit, a code area, a spec or feature, a design with open forks, or a refactor/deletion scope.
- Optional: a request for machine-readable `exhaustive-manifest/v1` output; user-applied fixes to individual `gap` cells (each triggers exactly one re-enumeration).
- If the target space is unbounded or unidentifiable after one read, stop and ask one question to bound it; do not enumerate an infinite space.

## Procedure

1. Choose and name the enumeration that fits the target; restate the choice in the output so the reader knows which space was covered:
   - **State space**, code with lifecycle, state machines, or error paths: the State × Event × Outcome Cartesian matrix.
   - Decision space, a design with open forks: the dependency-respecting set of decision axes.
   - Requirement space, a spec or feature: the requirement-to-symbol map, each acceptance criterion traced to a code or test symbol.
   - Behavior surface, a refactor or deletion: every exported symbol and reachable path in scope.

   Enumeration is algorithmic and single-pass; it is not round-based questioning or hypothesis sampling. Done when: the enumeration type is chosen, named, and restated.

2. Enumerate the full cell list for the chosen space with tool-backed discovery: structural search for code constructors and match arms, reference search for symbols and callsites, direct reads for spec criteria. Every cell carries an `id` and a one-line description. The list is the universe: nothing outside it is in scope, and nothing inside it may be silently dropped. Done when: the full cell list is enumerated with every cell carrying an id and description.

3. Execute the check per cell: run a programmatic check that proves coverage or exposes the gap, structural or reference search for code, a read for prose, or a test run where a test is the proof. A cell with no executable check is classified by an explicit reasoned argument, never by silence. Done when: every cell has an executed check or an explicit reasoned argument.

4. Classify every cell exactly one of `covered`, `gap`, or `deferred`, each with a one-line reason. `deferred` requires a named owner or follow-up; it is not a silent drop. Done when: every cell is classified with a one-line reason.

5. Emit the coverage manifest: the classified cell list plus the one-line tally `covered: N, gap: M, deferred: K, total: T`. For a code state space, also assert zero wildcard catch-alls over the enumerated constructors, verifiable with structural search. Done when: the manifest is emitted with the tally and, for code state spaces, the wildcard-catch-all assertion.

6. Sort `gap` cells in dependency order so a caller can hand them to a follow-up workflow without rebuilding the space, and emit the ordered gaps. Do not run downstream question or ideation workflows. Done when: the gap cells are sorted in dependency order and emitted.

7. After any fix the user applies to a `gap`, re-enumerate once; stop when a re-enumeration adds no new unclassified cell. Done when: a re-enumeration adds no new unclassified cell.

## Failure and recovery
- Unbounded space: stop after one read, ask exactly one bounding question, and mutate nothing; if it remains unbounded, return blocked naming the missing boundary and emit no manifest as done.
- Unverifiable universe: if discovery tooling fails or returns nothing for a region, classify the affected cells `gap` with the tool failure as the reason; if the universe itself cannot be enumerated, return blocked. Never claim zero unclassified cells over an unverified universe.
- Failed catch-all assertion: each wildcard catch-all over the enumerated constructors is a `gap` covering its unexplored arms; the done predicate does not hold until the assertion passes.
- Partial-result rule: `gap` and `deferred` cells are expected outputs, not failures; emit the manifest with them classified.
- Non-mutation rule: the run is read-only on source; the sole possible artifact is the manifest file, so recovery from any mistake is deleting that file (or discarding the chat output) and re-running.
- Non-converged result: if re-enumerations keep adding unclassified cells, stop and return the last manifest with its tally and the open `gap` list; never swallow a check failure or pretend the done predicate holds.

## Output
The coverage manifest: every cell with id, description, classification, reason, and executed check, the tally line, the named target space, the wildcard-catch-all assertion for code state spaces, and the dependency-ordered gap list, emitted as human-readable or `exhaustive-manifest/v1` YAML on request.
