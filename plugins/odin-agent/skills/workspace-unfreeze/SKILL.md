---
name: workspace-unfreeze
description: 'Use when the user runs /workspace-unfreeze on a frozen path to remove the freeze lock marker so the path is editable again. Resolves the marker from an explicit path or the freeze convention, previews the consequence, and deletes only that marker. Not for automated or unattended runs; requires explicit human invocation.'
disable-model-invocation: true
---

# Workspace unfreeze

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /workspace-unfreeze on a frozen path |
| Authority | Human-only. Requires explicit human invocation; the model must not run this on its own. Preview the target marker file and the deletion consequence before acting |
| Side effect | Deletes the freeze lock marker file for the named path. The deletion is unrecoverable, but the marker is re-creatable by re-creating the `<path>.freeze-lock` file beside the path with content naming the target path |
| Done | The named path is editable again (no freeze lock marker present for it) |

## Inputs

- **Path** (required): the frozen path to unfreeze.

## Procedure

1. Receive the path argument from the explicit /workspace-unfreeze invocation. Do not act on any model-generated or inferred path. Done when: the path argument is confirmed as human-supplied.
2. Resolve the marker path from the invocation: accept an explicit marker path from the human, or derive it from the freeze convention: a marker file named `<path>.freeze-lock` beside the frozen path, whose content names the target path. Verify the resolved file exists and names the target path. If it does not, treat as Marker not found. Never glob or scan for candidate markers. Done when: the marker file path is resolved and verified, or the path is confirmed already editable.
3. Before deleting, preview the marker file path and state the consequence: the `<path>.freeze-lock` marker on that path will be removed and the path will become editable. Done when: the human has seen the preview and the consequence.
4. Delete only that single marker file. Do not delete any other file, do not edit the protected path's contents, and do not touch any other freeze marker. Done when: the single marker file is deleted.
5. Confirm the marker file is gone and the named path is editable again. Done when: the marker file is absent and the path is editable.

## Failure and recovery
- Marker not found: the path is already unfrozen. Report this state; do not delete anything. Done predicate holds.
- Path argument missing: stop and request the path. Do not guess or scan for frozen paths.
- **Deletion fails** (permission, missing parent, I/O error): report the exact error, leave all markers in place, and return blocked. Do not widen scope or attempt partial deletion.
- Marker exists for a different path: do not delete it; report the mismatch and stop.

## Output
Terminal report naming the unfrozen path (or stating it was already editable) and confirming the freeze lock marker is absent.
