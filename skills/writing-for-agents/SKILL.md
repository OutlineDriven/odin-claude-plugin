---
name: writing-for-agents
description: 'Use when asked to author or restructure any agent-consumed document so the agent routes and executes predictably. Produces a self-contained document with no stale duplication or unreachable pointers. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

1. Read the target document fully. Identify its content type: steps (ordered actions), reference (definitions, rules, facts), or both.
2. Apply the information hierarchy: rank material by how immediately the agent needs it:
   - **In-file step**: the primary tier, what the agent does, in order.
   - **In-file reference**: consulted on demand. A flat peer-set of rules on one rung is fine.
   - **Disclosed reference**: pushed to a separate file, reached by a context pointer, loaded only when the pointer fires.
3. For each context pointer (a reference naming out-of-context material with a trigger condition):
   - Front-load the leading word: the pointer's wording decides when the agent reaches the material.
   - One trigger per branch. Collapse synonyms that rename a single branch.
   - Cut identity the body already carries.
4. For each step, verify the completion criterion is both checkable and exhaustive. A vague bound invites premature completion. Sharpen the bound first; only if irreducibly fuzzy and the rush is observed, hide later steps by splitting across a real context boundary.
5. Apply progressive disclosure: inline what every branch needs; push behind a pointer what only some branches reach. Keep a concept's definition, rules, and caveats under one heading (co-location), not scattered.
6. Hunt leading words: compact concepts from pretraining that anchor behaviour in few tokens. Refactor restatements into single tokens. Avoid negation: prompt the positive target so the banned behaviour is never spoken.
7. Prune:
   - Keep each meaning in a single source of truth. Duplication costs maintenance and tokens.
   - Cache only what the agent cannot find by looking. Leave one-file, one-command lookups to the environment.
   - Check every line for relevance. A line loses relevance by never bearing on the task or going stale.
   - Hunt no-ops sentence by sentence: an instruction the model already obeys by default pays load to say nothing. When a sentence fails, delete the whole sentence.
8. For skill documents specifically:
   - Choose invocation: model-invoked (omit `disable-model-invocation`, write a model-facing description with trigger branches) or user-invoked (set `disable-model-invocation: true`, description becomes human-facing summary). Pick model-invocation only when the agent must reach the skill on its own or another skill must.
   - Split by invocation when a distinct leading word should trigger independently; pay context load only if that independent reach is worth it.
   - Split by sequence when post-completion steps tempt the agent to rush the one in front of it.
9. Verify the final document is self-contained: it restates every safety, authority, execution, and proof rule the workflow needs. It contains no pointer to AGENTS.md, a system prompt, a rule file, another skill, or an optional peer step.

## Failure and recovery
- **Pointer failure**: a pointer's wording does not reliably trigger reaching the target. Recovery: sharpen the wording first; inline the material only if sharpening fails.
- **Premature completion**: agent ends a step before it is genuinely done. Recovery: sharpen the completion criterion; if irreducibly fuzzy, split the sequence across a real context boundary.
- **Sprawl**: document too long even when every line is live. Recovery: disclose reference behind pointers, split by branch or sequence so each path carries only what it needs.
- **Duplication**: same meaning in more than one place. Recovery: collapse to a single source of truth.
- **No-op retention**: instruction the model already obeys by default. Recovery: delete the whole sentence.
- **Stale pointer**: a pointer's target no longer exists or has moved. Recovery: update or remove the pointer; never leave a dangling reference.

## Output
The target document, edited or restructured, with:
- Every line earning its place by changing routing, authority, reads/writes, procedure, success proof, failure handling, or attribution.
- No stale duplication, no unreachable pointers, no peer-skill runtime routing.
- Self-contained: all necessary mechanics inlined.

## Provenance

Origin: mattpocock/skills, pinned revision 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76. License: MIT, Copyright (c) 2026 Matt Pocock. Obligation: Retain the copyright and permission notice in licenses/NOTICE. Adapted into odin-agent: authoring and restructuring discipline for agent-consumed documents; SKILL-MECHANICS.md content inlined; peer-skill runtime routing and local authoring-contract pointers removed.
