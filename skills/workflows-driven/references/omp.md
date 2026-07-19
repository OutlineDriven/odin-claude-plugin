# task-batch workflows (oh-my-pi)

The `task` tool is the fan-out primitive: one call per wave, every independent
assignment in the same `tasks[]` array. Shell loops and eval helper APIs are
not batching substitutes.

## Wave shape

- `context`: the shared contract for the whole wave (`# Goal`,
  `# Constraints`, `# Contract`).
- `tasks[]`: one entry per assignment, with a stable CamelCase `name`, an
  `agent` type, and a self-contained `task` body (`# Target`, `# Change`,
  `# Acceptance`). Add `outputSchema` when the parent will parse the return.

## Agent typing

Type every dispatch; an omitted agent inherits the default worker.

- Read-only research and code survey: `scout`. External libraries and docs:
  `librarian`.
- Edits and multi-step work: choose `task_fast`, `task_budget`, `task_deep`,
  or `task_ultra`; omit `agent` for the default worker. Size the worker to
  the slice, never to the session's model.
- Gates: `reviewer` (post-diff audit), `critic` (pre-commitment red-team).

## Coordination and durability

- Large payloads travel as `local://` files or `artifact://` ids named in the
  prompt, never pasted into it.
- Workers coordinate through `hub` messages when slices touch; the parent
  blocks with `hub` wait, not polling.
- Task jobs do not checkpoint: durable progress lives in the todo list and a
  ledger file. A wave that dies is re-dispatched from the ledger, not
  reconstructed from memory.

## The `workflowz` keyword

omp users can put the standalone lowercase word `workflowz` in a prompt to
inject this same contract natively for that turn. The skill and the keyword
agree; when both fire, follow the shared contract once. There is nothing to
reconcile.
