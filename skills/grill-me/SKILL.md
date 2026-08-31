---
name: grill-me
description: 'Use when a complex decision tree needs round-by-round user choices to stress-test a plan, decision, or idea; interviews in numbered rounds until the design tree''s frontier is empty. Not for single-select batching — use grilling; never source or remote-system changes.'
---

# Grill me

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A complex decision tree needs round-by-round user choices to stress-test a plan, decision, or idea. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. The decisions are the user's; facts are looked up, never asked of the user. |
| Side effect | None. No file, state, or external system is mutated. |
| Done | The frontier is empty: every branch of the design tree visited, nothing left silently assumed, and the user confirms shared understanding. |

## Inputs

A plan, decision, or idea to stress-test. Optional: an initial set of known decisions or constraints. The user supplies answers each round; no input file is required.

## Procedure

1. Map the user's plan, decision, or idea as a design tree: every decision branches into the decisions that hang off it. Done when: the stated action, evidence, and guard all hold.
2. Compute the frontier: every decision whose prerequisites are already settled — the questions askable now without guessing at answers not yet heard. Done when: the stated action, evidence, and guard all hold.
3. For each frontier question that needs a fact from the environment, dispatch a sub-agent to find it. Never ask the user for anything that can be looked up directly. Do not block on a running exploration: it is an unsettled prerequisite, so only the questions downstream of it wait; ask the rest of the frontier now. Done when: the stated action, evidence, and guard all hold.
4. Ask the whole frontier in one round. Number each question, give its title and body (including multiple choices where relevant), and state a recommended answer. Format each question as `❓ **Q<n>** - **<title>**: <body>` followed by `➡️ <recommended answer>`, with questions separated by `---`. Done when: the stated action, evidence, and guard all hold.
5. Wait for the user's answers before the next round. Done when: the stated action, evidence, and guard all hold.
6. After the user answers, recompute the frontier: settled decisions push it outward and unblock questions that depended on them. A question whose answer depends on a question still open this round belongs to a later round, not this one. Done when: the stated action, evidence, and guard all hold.
7. Repeat rounds until the frontier is empty: every branch visited, nothing silently assumed. Done when: the stated action, evidence, and guard all hold.
8. Do not act on the result until the user confirms that you have reached a shared understanding. Done when: the stated action, evidence, and guard all hold.

## Failure and recovery
- User stops answering mid-round: stop, report the current frontier and what remains unsettled; do not infer answers or act.
- Sub-agent fails to find a needed fact: report the gap, mark that branch's downstream questions as blocked, and continue asking the unblocked frontier.
- Contradiction between user answers: surface it and ask a clarifying question in the next round before proceeding.
- Never swallow errors or pretend the done predicate holds. The blocked result names the unsettled decisions; the non-converged result names the open contradiction.

## Output
The output is a shared understanding of the exhausted design tree. Terminal classification is either "frontier empty, shared understanding confirmed" or "blocked: <unsettled decisions>".

## Provenance

Origin: mattpocock/skills, revision 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76, MIT (Copyright (c) 2026 Matt Pocock). Adaptation: the source skill delegated at runtime to a separate interview procedure; that delegation is eliminated by inlining the procedure here so this skill is self-contained.
