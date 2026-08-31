---
name: gut-sync
description: 'Use when a user resumes work and needs an orientation card without full human recall; returns a small card of shape, invariants, and smell locations. Not for packaging context for another agent or session — use handoff; never source or remote-system changes.'
---

# Gut sync

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User resumes work and needs an orientation card without full human recall. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Reads current workspace state, recent artifacts, and session context only. |
| Done | A small orientation card is returned containing shape, invariants, and smell locations. |

## Inputs

- Current workspace directory to orient on (must be supplied).
- Optional: session or handoff notes, plan/todo files, or recent artifacts the user points at. When absent, recover what is reachable from the workspace alone.

## Procedure

1. Bound scope to read-only inspection of the current workspace directory and any session or handoff notes the user supplies. Do not open files outside that scope. Done when: the stated action, evidence, and guard all hold.
2. List the workspace tree depth-limited and read the most recently modified files, any plan/todo/handoff notes, and reachable session context to recover what work was in flight. Done when: the stated action, evidence, and guard all hold.
3. Derive the shape: name the active work unit, its current state, and the next intended action. Done when: the stated action, evidence, and guard all hold.
4. Derive the invariants: list constraints, contracts, or rules the work must not violate. Done when: the stated action, evidence, and guard all hold.
5. Derive the smell locations: point at files or areas where decay, drift, risk, or unfinished work is concentrated. Done when: the stated action, evidence, and guard all hold.
6. Assemble the orientation card from steps 3-5 only. Mark any field that could not be recovered as unknown rather than guessing. Done when: the stated action, evidence, and guard all hold.

## Failure and recovery
- Empty or unreadable workspace: return a card stating the workspace yielded no recoverable state; do not fabricate shape, invariants, or smells.
- Missing session context: mark the unrecoverable fields as unknown and return the partial card with gaps labeled.
- No mutation occurs, so no rollback is needed.
- Blocked result: a card whose every field is unknown, with the reason stated.

## Output
A small orientation card with three sections - Shape, Invariants, Smell locations - each populated from workspace reads or marked unknown.
