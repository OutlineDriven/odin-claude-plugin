---
name: grilling
description: 'Use when a complex decision tree needs round-by-round user choices; fire batched single-select questions and loop until the frontier is empty and understanding is confirmed. Not for numbered stress-test rounds — use grill-me; never source or remote-system changes.'
---

# Grilling

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A complex decision tree needs round-by-round user choices. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Questions and the decision frontier stay in chat. |
| Side effect | None. The only output is questions and a resolved decision tree spoken into the conversation. |
| Done | Decision frontier empty and shared understanding confirmed. |

## Inputs

The user's stated problem or decision topic, supplied in the invoking message or inferable from the open conversation context. Optional: an explicit decision scope the user wants bounded. If no decision-bearing problem is identifiable after one read of the context, stop and ask one question naming what to grill; do not invent a decision tree from nothing.

## Procedure

1. **Map the decision tree.** From the user's stated problem and the conversation context, enumerate every decision point and the dependency edges between them (which decision gates which downstream decisions). This open set is the frontier. Done when: the stated action, evidence, and guard all hold.
2. **Resolve agent-owned facts first.** For each decision point whose answer is an environmental or codebase fact, look it up with read-only tools (`read`, `grep`, `glob`) rather than asking the user. Record the resolution and its basis, and remove that point from the frontier. The agent owns facts; it never asks the user for something the repo can answer. Done when: the stated action, evidence, and guard all hold.
3. **Fire the frontier as batched single-select questions.** Present the current frontier as one batch of single-select questions, one question per open decision point, each carrying a recommended default marked as non-binding. The user owns the decision; the agent never selects on the user's behalf. Done when: the stated action, evidence, and guard all hold.
4. **Apply the answers and advance the frontier.** For each user answer, prune the resolved branch, unblock dependent decision points the answer exposes, and re-scan for newly revealed decisions. Add any new decision points to the frontier. Done when: the stated action, evidence, and guard all hold.
5. **Loop round by round.** Repeat steps 2 through 4 until the frontier is empty. Each round is one fact-resolution pass plus one question batch; never batch a second round before the user answers the first. Done when: the stated action, evidence, and guard all hold.
6. **Confirm shared understanding.** Once the frontier is empty, restate the full resolved decision tree back to the user as a single summary and ask one final confirmation question. The skill is done only when the user confirms. Done when: the stated action, evidence, and guard all hold.

## Failure and recovery
- **Empty frontier, no decisions found.** The stated problem was not a decision tree. Stop and report that no decisions were found; do not invent questions to justify a run.
- **Blocked decision.** If the user defers or cannot answer a decision, mark it open, record the blocker reason, and continue with the rest of the frontier. Do not select a default on the user's behalf. If the entire remaining frontier is blocked, stop and report the blocked decisions rather than claiming done.
- **Non-convergence.** If rounds repeat the same open decisions without progress (oscillation) or the frontier keeps growing without contracting, stop and report `non-converged` with the unresolved set.
- **No mutation, no rollback.** This skill changes nothing outside chat, so there is no rollback. The partial result at any stop is the current frontier state plus every decision resolved so far, each with its basis.

## Output
A resolved decision tree: every decision point with its answer (user-chosen or agent-resolved fact) and the basis for it, followed by the final shared-understanding confirmation. Terminal classification is exactly one of `converged` (frontier empty and understanding confirmed), `blocked` (frontier non-empty, remaining decisions listed with their blockers), or `non-converged` (oscillation or unbounded frontier growth).

## Provenance

Origin: `mattpocock/skills`, pinned revision `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`. License: MIT, `Copyright (c) 2026 Matt Pocock`; the copyright and permission notice is retained in `licenses/NOTICE`. Adapted into ODIN as a self-contained round-by-round decision-interviewing procedure with agent-owned facts and user-owned decisions; expression is rewritten, mechanism preserved.
