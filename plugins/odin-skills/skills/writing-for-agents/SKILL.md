---
name: writing-for-agents
description: 'Use when asked to author or restructure any agent-consumed document so the agent routes and executes predictably. Produces a self-contained document with no stale duplication or unreachable pointers. Not for skill-specific mechanics like invocation choice — use writing-skills.'
---

# Writing for agents

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Author or restructure any agent-consumed document. |
| Authority | Reversible-local: write only the named target document; rollback is undo or version-control restore. No remote mutation. |
| Side effect | Target document edited, split, or pruned. No other file touched. |
| Done | Cold agent routes and executes predictably with no stale duplication. |

## Inputs

Must be supplied: the target document path and the agent-consumed document type (skill, AGENTS.md, CLAUDE.md, or pointer-reached doc). Optionally: the current document content; if absent, read it before editing.

## Procedure

1. Read the target document fully. Identify whether it contains steps (ordered actions), reference (definitions, rules, facts), or both. Done when: the document is read and its content type (steps, reference, or both) is identified.
2. Apply the information hierarchy: rank material by how immediately the agent needs it:
   - In-file step: the primary tier, what the agent does, in order.
   - In-file reference: consulted on demand. A flat peer-set of rules on one rung is fine.
   - Disclosed reference: pushed to a separate file, reached by a context pointer, loaded only when the pointer fires.
   Done when: every piece of material is placed on the hierarchy.
3. For each context pointer (a reference naming out-of-context material with a trigger condition):
   - Front-load the leading word: the pointer's wording decides when the agent reaches the material.
   - One trigger per branch. Collapse synonyms that rename a single branch.
   - Cut identity the body already carries.
   Done when: every context pointer has a front-loaded leading word, one trigger per branch, and no redundant identity.
4. For each step, verify the completion criterion is both checkable and exhaustive. A vague bound invites premature completion. Sharpen the bound first; only if irreducibly fuzzy and the rush is observed, hide later steps by splitting across a real context boundary. Done when: every step has a checkable and exhaustive completion criterion.
5. Apply progressive disclosure: inline what every branch needs; push behind a pointer what only some branches reach. Keep a concept's definition, rules, and caveats under one heading (co-location), not scattered. Done when: branch-specific material is behind pointers and co-located concepts share one heading.
6. Hunt leading words: compact concepts from pretraining that anchor behaviour in few tokens. Refactor restatements into single tokens. Avoid negation: prompt the positive target so the banned behaviour is never spoken. Done when: restatements are collapsed into leading words and negation is replaced with positive targets.
7. Prune:
   - Keep each meaning in a single source of truth; duplication costs maintenance and tokens.
   - Cache only what the agent cannot find by looking. Leave one-file, one-command lookups to the environment.
   - Check every line for relevance. A line is irrelevant if it does not bear on the task or has gone stale.
   - Hunt no-ops sentence by sentence. If an instruction does not change the model's default behavior, delete the whole sentence.
   Done when: each meaning has one source of truth, no no-op sentences remain, and every line bears on the task.
8. For skill documents specifically:
   - Choose invocation: model-invoked (omit `disable-model-invocation`, write a model-facing description with trigger branches) or user-invoked (set `disable-model-invocation: true`, description becomes human-facing summary). Pick model-invocation only when the agent must reach the skill on its own or another skill must.
   - Split by invocation when a distinct leading word should trigger independently; pay context load only if that independent reach is worth it.
   - Split by sequence when post-completion steps tempt the agent to rush the one in front of it.
   Done when: the invocation mode is chosen and any split decisions are made with their trade-off justified.
9. Verify the final document is self-contained: it restates every safety, authority, execution, and proof rule the workflow needs. It contains no pointer to AGENTS.md, a system prompt, a rule file, another skill, or an optional peer step. Done when: the document is self-contained with no external runtime pointers.

## Failure and recovery
- Pointer failure: a pointer's wording does not reliably trigger reaching the target. Recovery: sharpen the wording first; inline the material only if sharpening fails.
- Premature completion: agent ends a step before it is genuinely done. Recovery: sharpen the completion criterion; if irreducibly fuzzy, split the sequence across a real context boundary.
- Sprawl: document too long even when every line is live. Recovery: disclose reference behind pointers, split by branch or sequence so each path carries only what it needs.
- Duplication: same meaning in more than one place. Recovery: collapse to a single source of truth.
- No-op retention: instruction the model already obeys by default. Recovery: delete the whole sentence.
- Stale pointer: a pointer's target no longer exists or has moved. Recovery: update or remove the pointer; never leave a dangling reference.

## Output
The target document, edited or restructured — every line earning its place by changing routing, authority, reads/writes, procedure, success proof, failure handling, or attribution; no stale duplication, no unreachable pointers, no peer-skill runtime routing, all necessary mechanics inlined.
