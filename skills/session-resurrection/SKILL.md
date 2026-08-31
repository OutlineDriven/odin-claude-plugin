---
name: session-resurrection
description: 'Use when an agent session dies or is interrupted and must be resumed cheaply. SDD notes, progress graph, and death point exist so another session can pick up where the prior session stopped. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

1. **Check for prior artifacts.** Read the resurrection directory in ignored repository-local storage. If SDD notes, a progress graph, and a death point exist, load them and set mode to `resume`. Otherwise set mode to `fresh`.
2. **Initialize or resume SDD notes.** On `fresh` mode, create SDD notes recording the session goal, initial scope, and any decisions already made. On `resume` mode, append a resumption header with the current timestamp and the death point context from the prior run.
3. **Maintain progress graph.** Represent work as a directed graph of nodes (tasks, decisions, blockers) with edges (dependencies, sequence). On `fresh` mode, build the initial graph from the session goal. On `resume` mode, load the prior graph and mark the death-point node as `resumed`.
4. **Update on significant events.** After each meaningful decision, discovery, or task completion, update SDD notes with the decision and its rationale, and update the progress graph with the new node and edges. Do not record trivial or intermediate states.
5. **Record death point on session end.** When the session terminates (normal exit, interruption, timeout, or crash), write a death point record containing: the last completed action, the next intended action, any active blockers, and the timestamp. Flush all SDD notes and the progress graph to the resurrection directory.
6. **On normal completion.** If the session reaches its goal, mark the death point as `completed` and write final SDD notes summarizing what was achieved and what remains, if anything.

## Failure and recovery
- **Session dies before any notes written.** Write a minimal death point with whatever context is available (session goal, timestamp). The next session starts in `fresh` mode with that death point as context.
- **Resurrection artifacts are corrupted or incomplete.** Start in `fresh` mode. Record in SDD notes that prior artifacts were unrecoverable. Do not attempt to repair corrupted files.
- **Session completes normally.** Mark death point as `completed`. Resurrection artifacts remain for audit but the next session starts `fresh`.
- **Scope widens beyond original goal.** Record the scope change in SDD notes as a decision. Do not suppress or ignore scope growth; surface it to the resuming session.

## Output
Resurrection artifacts in ignored repository-local storage:
- **SDD notes**: decisions, discoveries, and context accumulated during the session.
- **Progress graph**: directed graph of tasks, decisions, blockers, and their relationships.
- **Death point**: last action, next action, blockers, and timestamp.

These artifacts are sufficient for another session to resume without replaying the full prior session.

## Provenance

- **Origin**: `project-owned:user-curated-skill-ideas`, curated-013 (`session-resurrection`).
- **Pinned revision**: none (source is user-curated, not version-controlled).
- **License**: project-owned.
- **Adaptation**: clean-room adaptation of the user-curated resume workflow concept. No third-party expression copied.
