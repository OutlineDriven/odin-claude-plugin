---
name: backlog
description: 'Use when asked to park an undecided idea without representing it as decided or active work. The idea lands in a reversible local backlog entry with recorded evidence and a readiness threshold for later promotion. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Backlog

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to park an undecided idea without representing it as decided or active work. |
| Authority | Reversible local write only: create or update one backlog entry file. No VCS commit, no remote call, no credential use, no published artifact. |
| Side effect | One backlog entry as a reversible local state change with recorded evidence. |
| Done | The idea is parked in the backlog and ready to be promoted when it meets the readiness threshold. |

## Inputs

- **Idea statement** (required): one or two sentences naming the idea and the problem it would address.
- **Undecided reason** (required): the specific missing input that blocks a decision now — an unverified assumption, absent evidence, an open question, or a competing alternative.
- **Readiness threshold** (required): the concrete, falsifiable condition that, when met, would make the idea promotable (a measurement, a resolved question, or a confirmed constraint that yields a yes/no).
- **Existing evidence** (optional): links, measurements, or notes already in hand that bear on the idea.
- **Backlog location** (optional): path to the backlog file or directory; default is a `backlog.md` file in the current workspace.

## Procedure

1. Validate inputs at their trust boundary: confirm the idea statement is a single coherent proposal, the undecided reason names a concrete missing input, and the readiness threshold is falsifiable — a human or tool could test it and get a yes/no.
2. Bound scope: this skill only parks the idea. Do not evaluate, rank, or promote it. Do not create tasks, requirements, or tickets.
3. Locate or create the backlog store. If a backlog file exists, append to it; otherwise create one with a header marking it as undecided-parking only.
4. Write one entry containing: a stable identifier, the idea statement, the undecided reason, the readiness threshold, any supplied evidence, and the timestamp. Mark the entry status `parked`.
5. Record the entry as a reversible local state change: the file write is the only mutation. No commit, push, or remote call occurs.
6. Confirm the done predicate: the entry exists, is marked `parked`, and carries its readiness threshold so a later promotion step can test it.

## Failure and recovery
- **Non-falsifiable threshold**: if the readiness threshold cannot be checked with a yes/no outcome, stop and ask the user to restate it as a testable condition. Do not park an entry whose promotion trigger is subjective.
- **Idea already decided or active**: if the idea is already represented as a task, requirement, or in-progress work, stop. The backlog is for undecided ideas only; parking a decided item duplicates state.
- **Write failure**: if the backlog file cannot be written, do not mutate any other file. Report the write error and the intended entry content so the user can retry or relocate.
- **Partial result**: no partial state is valid. Either the full entry is written or nothing is written. A failed write leaves the backlog unchanged.

## Output
One backlog entry in the local backlog store, marked `parked`, carrying its idea statement, undecided reason, readiness threshold, evidence, and timestamp. The entry is ready to be promoted by a later decision step that tests the threshold.

## Provenance

Origin: user-curated idea-intake workflow recorded in `project-owned:user-curated-skill-ideas` (supplemented by `project-owned:user-supplied-source-brief`). Revision: unpinned. License: project-owned. Adaptation: clean-room restatement of the idea-intake and triage mechanism — park undecided ideas with recorded evidence, promote ready items when they meet a reversible readiness threshold.
