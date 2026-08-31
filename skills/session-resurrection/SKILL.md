---
name: session-resurrection
description: 'Use when an agent session dies or is interrupted and must be resumed cheaply. Writes SDD notes, progress graph, and death point so another session can pick up where the prior session stopped.'
---

# Session resurrection

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An agent session dies or is interrupted and must be resumed cheaply. |
| Authority | Reversible local writes only. Write named resurrection artifacts to ignored repository-local storage. Rollback is deletion of the resurrection directory. |
| Side effect | SDD notes, progress graph, and explicit death point written to ignored repository-local storage. |
| Done | SDD notes, progress graph, and death point exist so another session can resume cheaply. |

## Inputs

- **Session context** (required): the current session's working goal, accumulated decisions, and active file set.
- **Prior resurrection artifacts** (optional): existing SDD notes, progress graph, or death point from a previous run. If present, the procedure resumes from them rather than starting fresh.

## Procedure

1. **Check for prior artifacts.** Read the resurrection directory in ignored repository-local storage. If SDD notes, a progress graph, and a death point exist, load them and set mode to `resume`. Otherwise set mode to `fresh`. **Done when:** mode is set to `resume` or `fresh`.

2. **Initialize or resume SDD notes.** In `fresh` mode, create SDD notes recording the session goal, initial scope, and any decisions already made. In `resume` mode, append a resumption header with the current timestamp and the death point context from the prior run. **Done when:** SDD notes exist with goal, scope, and decisions or a resumption header.

3. **Maintain progress graph.** Represent work as a directed graph of nodes (tasks, decisions, blockers) with edges (dependencies, sequence). In `fresh` mode, build the initial graph from the session goal. In `resume` mode, load the prior graph and mark the death-point node as `resumed`. **Done when:** the graph exists with at least the initial node or the resumed death-point node.

4. **Update on significant events.** After each meaningful decision, discovery, or task completion, update SDD notes with the decision and its rationale, and update the progress graph with the new node and edges. Do not record trivial or intermediate states. **Done when:** the event is recorded in both SDD notes and the progress graph.

5. **Record death point on session end.** When the session terminates (normal exit, interruption, timeout, or crash), write a death point record containing: the last completed action, the next intended action, any active blockers, and the timestamp. Flush all SDD notes and the progress graph to the resurrection directory. **Done when:** the death point is written and all artifacts are flushed.

6. **On normal completion.** If the session reaches its goal, mark the death point as `completed` and write final SDD notes summarizing what was achieved and what remains, if anything. **Done when:** the death point is marked `completed` and final notes are written.

## Failure and recovery

- **Session dies before any notes are written:** write a minimal death point with whatever context is available (session goal, timestamp). The next session starts in `fresh` mode with that death point as context.
- **Resurrection artifacts are corrupted or incomplete:** start in `fresh` mode. Record in SDD notes that prior artifacts were unrecoverable. Do not attempt to repair corrupted files.
- **Session completes normally:** mark death point as `completed`. Resurrection artifacts remain for audit but the next session starts `fresh`.
- **Scope widens beyond original goal:** record the scope change in SDD notes as a decision. Do not suppress or ignore scope growth; surface it to the resuming session.

## Output

Resurrection artifacts in ignored repository-local storage: SDD notes (decisions, discoveries, context), progress graph (directed graph of tasks, decisions, blockers, relationships), and death point (last action, next action, blockers, timestamp); sufficient for another session to resume without replaying the full prior session.
