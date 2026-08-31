---
name: workspace-unfreeze
description: 'Use when the user runs /workspace-unfreeze on a frozen path to remove the freeze lock marker so the path is editable again. Don''t use for automated or unattended runs; the deletion requires explicit human invocation and a preview of the consequence.'
disable-model-invocation: true
---

# Workspace unfreeze

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /workspace-unfreeze on a frozen path |
| Authority | Human-only. Requires explicit human invocation; the model must not run this on its own. Preview the target marker file and the deletion consequence before acting |
| Side effect | Deletes the freeze lock marker file for the named path. The deletion is unrecoverable, but the marker is re-creatable by re-applying the freeze guardrail |
| Done | The named path is editable again (no freeze lock marker present for it) |

## Inputs

- A path argument naming the frozen path to unfreeze. Required.

## Procedure

1. Receive the path argument from the explicit /workspace-unfreeze invocation. Do not act on any model-generated or inferred path.
2. Locate the freeze lock marker file associated with the named path. If no marker exists, the path is already editable; report that and stop.
3. Before deleting, preview the marker file path and state the consequence: the freeze guardrail on that path will be removed and the path will become editable.
4. Delete only that single marker file. Do not delete any other file, do not edit the protected path's contents, and do not touch any other freeze marker.
5. Confirm the marker file is gone and the named path is editable again.

## Failure and recovery
- Marker not found: the path is already unfrozen. Report this state; do not delete anything. Done predicate holds.
- Path argument missing: stop and request the path. Do not guess or scan for frozen paths.
- Deletion fails (permission, missing parent, I/O error): report the exact error, leave all markers in place, and return blocked. Do not widen scope or attempt partial deletion.
- Marker exists for a path other than the one named: do not delete it; report the mismatch and stop.

## Output
A terminal report stating which path was unfrozen (or that it was already editable), and confirmation that the freeze lock marker for that path is absent so the path is editable again.

## Provenance

Adapted from the gstack freeze/workspace-unfreeze guardrail (https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69, source path unfreeze/SKILL.md). License MIT, copyright (c) 2026 Garry Tan (LICENSE blob sha 35029511144443297cad2d26e4bac17d0e352f93). This is a clean-room re-derivation of the procedure; no third-party expression is copied verbatim.
