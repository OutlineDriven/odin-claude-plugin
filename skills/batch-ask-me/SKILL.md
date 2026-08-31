---
name: batch-ask-me
description: 'Use when the user faces multi-fork decisions, unresolved prerequisites, or explicitly says "batch questions" or "clarify the design space". Maps a decision tree, fires the current frontier as batched single-select questions round by round, and loops until the frontier is empty and shared understanding is confirmed. Don''t use for tasks that require source or remote-system changes.'
---

# Batch ask me

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user faces multi-fork decisions, unresolved prerequisites, or explicitly says "batch ask me" or "clarify the design space". |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Conversation-only question batches and decision-tree state. |
| Done | Frontier empty, all branches of the design tree visited, and shared understanding confirmed by the user. |

## Inputs

The user's problem or design space to explore, stated in the conversation or inferable from it. Optional: any decisions already settled by prior context, which seed the design tree as resolved nodes.

## Procedure

1. Run Verbalized Sampling before round one: sample multiple intent hypotheses, each with an explicit weight on a 0 to 1 scale and a concrete falsifier. Present the weighted hypotheses and falsifiers visibly immediately before the first question batch. Seed the roots of the design tree and the initial frontier from the surviving hypotheses.
2. Build a design tree where each node is a decision. The frontier is every decision whose prerequisites are already settled — the questions to ask now without guessing at answers not yet heard.
3. Each round, ask the whole frontier as a batch of single-select questions, each with a recommended answer. Wait for the user's answers, then recompute the frontier and ask the next round. A question whose answer depends on another open question belongs to a later round, not this one.
4. Question shape: one single-select question per axis, mark the recommended option first with "(Recommended)", at most four questions per fire, and never use multiSelect for override semantics.
5. When the frontier contains more than four questions, keep the whole frontier in one round. Route the four highest-impact questions through the question tool; put every remaining question in the same message as numbered Markdown in the form `**Q<n>: <question title>**` followed by the body, choices, and `-> Recommended: <answer>`. Answers from the tool and the Markdown questions settle together in one round-trip; recompute the frontier once after the full answer set rather than advancing four questions at a time.
6. Choose the four tool questions by how many downstream decisions each answer unblocks. Break ties toward the question whose default is least safe to assume.
7. Finding facts is the agent's job, not the user's. When a frontier question needs an environmental fact (filesystem, tools, codebase), dispatch a sub-agent to find it; never ask the user for something that can be looked up directly. A running exploration is an unsettled prerequisite; only its downstream questions wait, so ask the rest of the frontier now.
8. Do not resample Verbalized Sampling on subsequent rounds unless user answers materially change the survivor set. If resampling is triggered, update the survivor set, adjust the design-tree roots, and recompute the frontier.
9. The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on the result until the user confirms a shared understanding has been reached.

## Failure and recovery
- **User answer contradicts a falsifier**: update the survivor set, adjust the design-tree roots, and recompute the frontier. Do not discard already-settled answers.
- **Environmental fact lookup fails or is ambiguous**: mark that prerequisite unsettled, continue asking the rest of the frontier, and retry or reframe the lookup. Never ask the user for a fact that can be looked up directly.
- **User declines to answer or says stop**: record the unresolved frontier, stop, and report what remains open. Do not act on a partial understanding.
- **Non-mutation**: this skill changes only conversation state. No rollback is needed; the design tree is rebuilt from recorded answers at any point.

## Output
A confirmed shared understanding of the design space: every branch of the decision tree visited, the frontier empty, and the user's confirmation recorded. No file, state, or external mutation occurs.

## Provenance

Origin: ODIN 1.x current skill at `skills/batch-ask-me/SKILL.md`. Revision: unpinned (current). License: project-owned. Adaptation: restructured into the ODIN 2.0 contract format; the Verbalized Sampling procedure and the single-select question-shape contract are restated inline without referencing peer skills; the decision-tree frontier round-loop mechanism is preserved.
