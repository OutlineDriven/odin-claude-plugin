---
name: todo-add
description: 'Use when a message contains `TODO ADD: <requirement>`. Not for deepening coarse lists: use todos-enhance. Not for resyncing lists: use todos-update. Not for retitling/reordering/completing todos.'
---

# Todo add

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A message contains `TODO ADD: <requirement>`. |
| Authority | Reversible local: writes only one durable requirement source and one native todo item; rollback is version control or undo. No remote mutation. |
| Side effect | Native todo is written first; the same requirement is then written to its durable source. |
| Done | Both representations contain the same requirement in the same turn, or a classified duplicate/conflict/artifact-failure result is reported exactly as defined below. |

## Requirement source

Use the current durable plan or specification when one clearly owns the work. If none exists, create or update `.outline/requirements/todo-add.md`. Never scatter the requirement across multiple documents.

## Refusals

- Will not accept an empty requirement.
- Will not touch the durable source if native todo creation fails.
- Will not silently remove a retained todo on partial failure.
- Will not write when a conflict exists: ask one clarifying question first.

## Procedure

1. Parse the text after the first `TODO ADD:` as one requirement. Reject an empty requirement. **Done when:** one non-empty requirement is parsed.
2. Compare it semantically with the current durable source and native todo list. **Done when:** the comparison is complete.
3. If already present in both, return `Duplicate: no change`. **Done when:** the duplicate is reported.
4. If it conflicts with an existing requirement, ask one question that presents the two incompatible forms; write nothing. **Done when:** the clarifying question is asked.
5. Assign the todo phase by the work's owning module or domain, not by wording or chronology. **Done when:** the phase is assigned.
6. Append the native todo first with a backlink or stable reference to the requirement source. **Done when:** the native todo is created with its backlink.
7. Update the durable requirement source with the same normalized requirement and the native todo identifier. **Done when:** the durable source is updated.
8. Verify both sides resolve to the same text and ownership. **Done when:** both representations match.

## Failure handling

If native todo creation fails, do not touch the durable source. If the durable-source write fails after native todo creation, retain the native todo, mark it `requirement-source-write-failed`, and warn with the exact failed path and recovery action. Do not claim success. Never silently remove the retained todo.

## Output

Return `Added`, `Duplicate`, `Conflict`, or `Partial failure`, plus the requirement-source path and native todo identifier when they exist.
