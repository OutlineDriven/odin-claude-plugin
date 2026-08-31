---
name: using-agent-skills
description: 'Use when asked to route incoming work to the owning skill or produce an explicit skill-gap note. The agent classifies the task against the installed catalog and invokes the best-matching trigger or records a gap.'
---

# Using agent skills

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The agent must decide whether a task needs a skill, which one owns it, or how to handle a suspected gap. |
| Authority | Read-only. Consult the installed skill catalog; do not modify any skill, file, or configuration. |
| Side effect | None. Catalog lookup only; no persistent writes. |
| Done | The invoked skill's trigger matches the task, or an explicit skill-gap note is produced instead of a near-duplicate. |

## Inputs

1. The task description or user request that needs routing.
2. The installed skill catalog, available at runtime through the host harness.

Both are required. If the catalog is unavailable, stop and report the blocker.

## Procedure

1. Extract the core action and domain from the task description. **Done when:** the core action and domain are identified.
2. Search the installed skill catalog for skills whose trigger predicate matches the extracted action and domain. **Done when:** the matching set is enumerated.
3. If exactly one skill matches, invoke it. Report the matched skill name and the trigger sentence that matched. **Done when:** the matched skill is invoked and reported.
4. If multiple skills match, select the one whose trigger predicate is most specific to the task. Report the selection rationale. **Done when:** the most specific skill is selected and the rationale is stated.
5. If no skill matches, produce a skill-gap note containing: the task description, why no existing skill covers it, and what a new skill would need to trigger on. **Done when:** the gap note contains all three elements.
6. Never invent behavior, fork a near-duplicate, or widen scope beyond the matched skill's contract. **Done when:** no invention, fork, or scope widening occurred.

## Failure and recovery
| Failure class | Rule |
|---|---|
| Ambiguous task | Stop. Ask the user to clarify the task before routing. |
| Catalog unavailable | Stop. Report that the catalog could not be read. Do not guess. |
| Multiple equal matches | Pick the most specific trigger. If still tied, report both and ask the user. |
| Near-duplicate detected | Produce a skill-gap note instead of forking. Record the overlap. |

No partial results. If routing fails, the output is a gap note or a user clarification request, never a best-effort invocation.

## Output
Either the matched skill name with its trigger sentence and invocation confirmation, or a skill-gap note with the task description, gap reason, and trigger predicate a new skill would need.
