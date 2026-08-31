---
name: todo-add
description: "Use when the user writes `TODO ADD: <requirement>`. Updates the authoritative durable requirement source and appends the corresponding native todo in the same turn. Applies the native todo first; partial artifact failure retains the todo and emits a warning. Duplicate requirements are a no-op; conflicting requirements require one clarifying question. Don't use for retitling, reordering, or completing existing todos."
---

# Todo Add

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A message contains `TODO ADD: <requirement>`. |
| Authority | Reversible local update to one durable requirement source and one native todo item. |
| Side effect | Native todo is written first; the same requirement is then written to its durable source. |
| Done | Both representations contain the same requirement in the same turn, or a classified duplicate/conflict/artifact-failure result is reported exactly as defined below. |

## Requirement source

Use the current durable plan or specification when one clearly owns the work. If none exists, create or update `.outline/requirements/todo-add.md`. Never scatter the requirement across multiple documents.

## Procedure

1. Parse the text after the first `TODO ADD:` as one requirement. Reject an empty requirement.
2. Compare it semantically with the current durable source and native todo list.
3. If already present in both, return `Duplicate: no change`.
4. If it conflicts with an existing requirement, ask one question that presents the two incompatible forms; write nothing.
5. Assign the todo phase by the work's owning module or domain, not by wording or chronology.
6. Append the native todo first with a backlink or stable reference to the requirement source.
7. Update the durable requirement source with the same normalized requirement and the native todo identifier.
8. Verify both sides resolve to the same text and ownership.

## Failure handling

If native todo creation fails, do not touch the durable source. If the durable-source write fails after native todo creation, retain the native todo, mark it `requirement-source-write-failed`, and warn with the exact failed path and recovery action. Do not claim success. Never silently remove the retained todo.

## Output

Return `Added`, `Duplicate`, `Conflict`, or `Partial failure`, plus the requirement-source path and native todo identifier when they exist.
