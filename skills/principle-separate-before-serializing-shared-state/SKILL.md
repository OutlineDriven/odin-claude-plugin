---
name: principle-separate-before-serializing-shared-state
description: 'Use when the user names concurrent shared-write races or reviews shared-mutable state, separate per-actor state from shared state before introducing synchronization, producing per-actor state with an explicit read-boundary merge. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Separate before serializing shared state

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Prevent concurrent shared-write races. |
| Authority | Write only named local artifacts; revert via VCS on failure. |
| Side effect | Reshapes state ownership: per-actor isolation replaces shared-mutable coupling. |
| Done | Per-actor state with explicit read-boundary merge. |

## Inputs

- The codebase, code region, or design under review.
- Optional: a specific type, module, or component named by the user.

## Procedure

1. Identify every shared mutable variable, struct field, object property, or memory location that two or more actors (threads, coroutines, processes, tasks, or agents) can write.
2. Classify each as:
   - Per-actor: state private to one actor and migrated into its ownership.
   - Shared: state genuinely required by multiple actors and requires synchronization.
3. Move per-actor state out of shared scope. Each actor holds its own copy. No actor writes another's per-actor state.
4. For shared state, select the narrowest synchronization primitive that covers the write path: mutex, lock-free structure, channel, or atomic operation. Prefer lock-free or channel-based when contention is low; prefer mutex when critical-section logic is complex.
5. Design every merge point where an actor reads or receives state from another actor. Name the merge operation explicitly; do not let it occur implicitly inside a critical section.
6. If the merge requires combining per-actor deltas (e.g., a reducer), define the merge function before introducing synchronization. Verify it is associative and free of write-write conflicts.
7. Revert all changes via VCS if any step cannot be completed safely.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| Undecouplable state | Two actors cannot be separated without breaking the required merge semantics. | Stop. Return a list of the coupling points and the required merge. Do not introduce a lock that papers over the coupling. |
| Unavailable synchronization | The environment lacks the selected primitive (no mutex, no atomics). | Stop. Report the missing primitive and the shared state it would protect. |
| Deadlock risk | Merge point occurs inside a held lock and creates a cyclic wait. | Revert. Return the cycle with actor names and the merge point. |
| Partial result | Some shared state can be separated but not all. | Return the separable set with per-actor layout and merge points; flag the remaining state as unresolved. |

Rollback rule: revert all local writes via VCS before reporting a failure.

## Output
A concrete state layout:
- Per-actor state: type or variable name, ownership scope, and merge direction.
- Shared state: type, selected synchronization primitive, and the protected write path.
- Merge points: location in code, merge function name, and the actors involved.

If no shared state exists, confirm it and stop.

## Provenance

Origin: `pstack/skills/principle-separate-before-serializing-shared-state/SKILL.md` (cursor/plugins, revision `68836ddaf5697224520f1847d90cdb90ca8babaa`).

License: MIT — pstack authored by Lauren Tan (poteto) per license block at `pstack/LICENSE` blob `6b5400237fdf6545be0b8fae370d6f2fcff8fb25`.

Adaptation: extracted separation-before-locking principle and restructured as a self-contained code-review and refactoring procedure for the odin-code-advanced module; provenance and license preserved.
