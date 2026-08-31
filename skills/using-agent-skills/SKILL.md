---
name: using-agent-skills
description: 'Use when asked to route incoming work to the owning skill or produce an explicit skill-gap note. The agent classifies the task against the installed catalog and invokes the best-matching trigger or records a gap. Don''t use for tasks that require source or remote-system changes.'
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

1. Extract the core action and domain from the task description.
2. Search the installed skill catalog for skills whose trigger predicate matches the extracted action and domain.
3. If exactly one skill matches, invoke it. Report the matched skill name and the trigger sentence that matched.
4. If multiple skills match, select the one whose trigger predicate is most specific to the task. Report the selection rationale.
5. If no skill matches, produce a skill-gap note containing:
   - The task description.
   - Why no existing skill covers it.
   - What a new skill would need to trigger on.
6. Never invent behavior, fork a near-duplicate, or widen scope beyond the matched skill's contract.

## Failure and recovery
| Failure class | Rule |
|---|---|
| Ambiguous task | Stop. Ask the user to clarify the task before routing. |
| Catalog unavailable | Stop. Report that the catalog could not be read. Do not guess. |
| Multiple equal matches | Pick the most specific trigger. If still tied, report both and ask the user. |
| Near-duplicate detected | Produce a skill-gap note instead of forking. Record the overlap. |

No partial results. If routing fails, the output is a gap note or a user clarification request, never a best-effort invocation.

## Output
One of:
- The matched skill name, its trigger sentence, and confirmation that it was invoked.
- A skill-gap note with the task description, the gap reason, and the trigger predicate a new skill would need.

## Provenance

Adapted from addyosmani/agent-skills at revision d2c37ef6225dd8726cdd369a8030307f48592d26 (MIT). Clean-room rewrite for ODIN 2.0 catalog routing. The root PROVENANCE.md contains the full license notice.
