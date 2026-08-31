---
name: decide
description: 'Use when the user has a fork and wants it resolved and applied, not explored: "decide this", "just decide this", "choose the path", or "decide and fix it". Grounds a real fork, frames one single-select with a recommended default, takes the pick, and applies it in the same turn. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Decide

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user has a fork and wants it resolved and applied, not explored: "help me decide", "just decide this", "what should I do here", or "decide and fix it". |
| Authority | Apply the selected reversible local change or dispatch the selected verify/keep/revert loop; ask before unrecoverable or observable-surface removal. |
| Side effect | Local artifacts only; rollback is git revert or edit revert of the applied change. |
| Done | The fork, user pick, and resulting change are named; the pick is implemented and verified in the same turn. |

## Inputs

The fork: the decision point the user named, or one surfaced from the code. Optional: the user's stated preference, which becomes the recommended default only if evidence supports it.

## Procedure

1. Confirm this is a fork the user wants resolved and applied, not a verdict of the agent's own making, an exploration ending in a document, a whole-session director-executor posture, a wide design tree in batched rounds, or ambiguity inside a stated request. If it is any of those, stop; this skill does not route there.
2. Ground the fork before framing it. Resolve from evidence first with `grep`, `glob`, `read`, or `lsp`. A fork the code already answers is not a fork: read it, say what it answers, and do not ask. Never ask what a search settles.
3. Frame one single-select per axis. Two to four options, `(Recommended)` first with the consequence in its description. Each option names what the code looks like afterwards; where two options differ visibly, put the difference in `preview` as a diff or a tree. Never `multiSelect` for override semantics.
4. Take the pick and act in the same turn. A pick applied in one edit gets the edit. A pick needing a verify, keep, or revert loop is restated as its goal and executed as that loop. A pick that removes an observable surface or cannot be reverted from git gets one concern stated, then a yes.
5. When applying one pick opens the next fork, ask it immediately with the settled decision restated in one line. Never bank a queue of questions to fire at the end.
6. When the user picks what the agent would not: execute the pick, state the concern once, never re-litigate.
7. Close with one line naming the fork, the pick, and what changed.

## Failure and recovery
- Fork already answered by the code: not a fork. State what the code answers and stop; do not frame a question.
- Pick removes an observable surface or cannot be reverted from git: state one concern and require a yes before applying. If the user does not confirm, do not apply; leave the working tree unchanged.
- Pick needs a verify/keep/revert loop that does not converge: stop, name the non-converged state, and leave the partial result with the rollback path stated. Never pretend the done predicate holds.
- User pick contradicts evidence: execute the pick, state the concern once, never re-litigate. Do not refuse a confirmed pick.

## Output
One line naming the fork, the pick, and the resulting change, with the pick implemented and verified in the same turn.

## Provenance

Origin: odin-1.x current skill `skills/decide/SKILL.md`. Revision: unpinned. License: project-owned. Adaptation: restructured into the ODIN 2.0 contract section order; routing pointers to peer skills and the askme file-path reference removed per self-containment; the decision-loop mechanism (ground-from-evidence, single-select framing, act-in-same-turn, chained forks, user-picks-against-advice, observable-surface gate) preserved.
