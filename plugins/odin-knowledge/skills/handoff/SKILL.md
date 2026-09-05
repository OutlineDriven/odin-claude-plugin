---
name: handoff
description: 'Use when work reaches a session boundary or the user asks to hand off, delegate, or get a clipboard-ready prompt. Mode brief packages continuity; mode prompt builds the delegation prompt.'
---

# Session continuity and handoff

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Substantive work starts, reaches a significant boundary, resumes after interruption, completes, or must move to another session, agent, harness, directory, repository, or person. An explicit handoff request selects the mode. |
| Authority | Reversible local: mode brief writes only ignored repository-local continuity files and one brief under `.handoff/handoffs/` or stdout; mode prompt writes only the assembled prompt text and the clipboard. Rollback is version control or undo. No remote mutation. |
| Side effect | Continuity files under `.handoff/continuity/`, portable briefs under `.handoff/handoffs/`, or clipboard text. No receiver launch, data-at-rest changes outside these artifacts, bulk mutation, or irreversible effects. |
| Done | Continuity status (`fresh`, `resumed`, `interrupted`, or `completed`) with the death-point path. On explicit handoff: mode brief, one compliant brief path or stdout result; mode prompt, a path-free prompt on the clipboard or printed with a stated unavailability. |

## Inputs

- Mode (required on explicit handoff): `brief` for a session continuity brief file or stdout, `prompt` for a clipboard-ready, path-free delegation prompt.
- Current repository identity, session handle, goal, scope, active files, and current time.
- Current tasks, decisions with rationale, blockers, evidence, and next action.
- Existing continuity artifacts, when present.
- Mode `brief`: optional source handle, destination path, and project exclude list.
- Mode `prompt`: the task the user names or clearly implies, plus optional repo or product identity, issue/PR/branch names or URLs, likely modules, constraints, known symptoms, and desired output shape, inferred from nearby context when the user gives only a short label.

Use `.handoff/continuity/` for `notes.md`, `graph.md`, and `death-point.md`. Use `.handoff/handoffs/` for portable briefs. Before the first write, prove `.handoff/` is ignored. If it is not, add the repository-local exclusion and prove it again. Do not stage these files.

## Procedure

1. **Choose resume or fresh.** Follow [resume.md](references/resume.md). Resume only from the complete, readable, unfinished continuity set whose recorded repository identity matches the current repository. Start fresh when it is absent, completed, corrupt, stale, incomplete, or belongs to another project. A minimal emergency death point starts a fresh record with its available context. Preserve unusable files and report why they were rejected. Done when: the continuity mode is selected and the source is ready for resume or fresh initialization.

2. **Initialize continuity state.** In fresh mode, write `death-point.md` first with the available goal, repository identity, session handle, timestamp, status `active`, and next action `initialize continuity state`. Flush that minimal death point before creating `notes.md` and `graph.md`. Then write the goal, scope, repository identity, session handle, and initial rationale to `notes.md`; create a directed graph of task, decision, and blocker nodes with dependency, sequence, and resolution edges; and replace the death point with the last completed action, next action, blockers, timestamp, and status `active`. In resume mode, append a timestamped resumption record, mark the prior death-point node `resumed`, and reconcile current facts without rewriting prior decisions or rationale. Done when: the continuity set is consistent with current facts and the death point is up to date.

3. **Maintain one live record.** At each decision, discovery that changes the plan, task-state transition, blocker change, phase boundary, interruption risk, or scope change, update the rationale notes, graph, and death point before continuing. Record the changed fact and why it matters; omit tool chatter and intermediate noise. Flush all three artifacts after the update. Done when: the changed fact is recorded and the artifacts are flushed.

4. **Mark the ending.** On interruption or ordinary session exit, set the death point to `interrupted` with the last completed action, exact next action, active blockers, and timestamp. On goal completion, append the achieved result and residual work to the notes, resolve or classify every open graph node, and set the death point to `completed`. A later session always starts fresh after a `completed` marker. Done when: the session is correctly classified and the death point is flushed.

5. **Package only on explicit handoff.** Resolve the requested source by exact handle when supplied; otherwise use the current live state. Reject ambiguity and wrong-project matches. Before reading source content into a package, apply the exclude list to the canonical project identity and every candidate path. Refuse the package if any source is excluded; a stale index does not override the current exclude list. Then select the mode: `brief` packages a session continuity brief; `prompt` builds a path-free delegation prompt. Done when: the source is resolved, excluded items are refused, and the mode is selected.

6. **Mode brief: print the source receipt.** Show session or harness kind, canonical project identity, short session handle, source timestamp, and computed age. Treat future or invalid timestamps as unknown age. For work older than seven days, print a warning with its age before continuing. If policy withholds newer matching work, disclose that this is the newest visible source. Done when: the receipt is printed, age warnings are shown, and any visibility policy is disclosed.

7. **Mode brief: build one UTF-8 brief of at most 6,144 bytes.** Include typed sections for source receipt, goal and scope, active files, task/decision/blocker graph, decisions with rationale, evidence, next action, and `Where it stopped`. Filter raw transcript, tool output, command dumps, JSON or CLI walls, system reminders, repeated material, and long token runs. Preserve conclusions in order. Reserve at least one quarter of the budget for `Where it stopped`, containing the final substantive, noise-filtered exchanges or the death-point facts. When truncation is required, end that section with `[cut for handoff budget]`; do not leave an empty heading or append content after the marker. Done when: the brief is at most 6,144 bytes and every required section is nonempty.

8. **Mode brief: emit and stop.** Write the brief under `.handoff/handoffs/` or emit it to stdout. End with: `Continue from this compact context; do not re-derive completed work.` Report the path or stdout result and current continuity status. Never launch or instruct tooling to launch the receiver. Done when: the brief is written or emitted and the continuity status is reported.

9. **Mode prompt: identify the task and gather context.** Name the task in one sentence, recording the inference source when the user gave only a short label. Gather enough to orient a fresh agent: repo or product identity, issue/PR/branch names or URLs, likely modules, constraints, known symptoms, and the desired output shape. Stop short of doing the receiving agent's review or picking its technical direction. Done when: the task is named, context is gathered or marked absent, and no receiving-agent review was performed.

10. **Mode prompt: assemble the prompt from portable anchors.** Use repo owner/name, product or module names, issue/PR URLs, branch names, public symbols, command names, config keys, exact error text, docs titles, and search terms. Include no absolute, home-directory, checkout, or repo-relative paths unless the user explicitly requested them. Make the first instruction to the receiving agent a review-and-assess instruction, not a command-only work order, and state that the agent owns that review and decides whether the task is still real, stale, already solved, over-scoped, or better handled differently. Include constraints, non-goals, validation expectations, the desired output shape, an instruction to re-check live repo/GitHub/CI state, and a ban on pushing, merging, closing issues/PRs, labeling, or posting without explicit request. Fill this shape by default:

```text
I want to discuss and possibly work on: <short task title>

Context:
- <portable repo/product context>
- <what triggered this task>
- <known current state, branch/issue/PR names or URLs if relevant>
- <important constraints and ownership boundaries>

Before doing any implementation:
- Find the right repository from the current directory, a parent directory, or the usual workspace.
- Read the local agent/repo instructions.
- Inspect the relevant code, docs, tests, recent commits, and linked issue/PR state.
- Decide whether this task is still real, whether the proposed direction is a good idea, and whether a smaller or better fix exists.
- Call out stale assumptions, hidden risks, and anything that should stop the work.

Task:
- <what to investigate or implement if the review supports it>
- <expected behavior or decision criteria>
- <non-goals>

Validation:
- <focused tests, checks, or live proof expected>
- <what evidence should be included>
- <what is explicitly not required>

Output:
- Start with the review findings and recommendation.
- Then give the proposed plan or patch summary.
- If you edit code, keep changes scoped and report exact proof run.
- Do not push, merge, close issues/PRs, label, or post public comments unless explicitly told.
```

Done when: every anchor is portable, no unrequested filesystem path appears, the first instruction is review-and-assess, and every template field is filled or marked as needing user input.

11. **Mode prompt: deliver to the clipboard.** Copy the full prompt with a temp file or pipe, never inline shell quoting. On macOS use `pbcopy`; otherwise use the platform clipboard tool (`wl-copy`, `xclip`, `clip.exe`). When none is available, print the prompt and state that clipboard copy was unavailable. Done when: the prompt is on the clipboard or printed with a stated unavailability.

12. **Mode prompt: confirm tersely.** Reply with the task title only; do not paste the full prompt unless the user asks. Done when: the confirmation names the task title and no unprompted full paste occurred.

## Failure and recovery

- Unusable prior state: preserve it, name `corrupt`, `stale`, `incomplete`, `completed`, or `wrong project`, and start fresh.
- Unverified ignore rule: stop before writing continuity state and name the failed ignore check.
- Ambiguous or absent handoff source: stop packaging and request an exact handle; keep maintaining current continuity state.
- Excluded source: name the matched project or path and emit no brief.
- Budget failure: emit no complete brief until its UTF-8 byte count is at most 6,144 and every required section is nonempty.
- Partial write: preserve every complete artifact and report the failed file. A complete minimal `death-point.md` is an emergency recovery marker: the next session starts fresh from its available goal and timestamp, then rebuilds notes and graph from current evidence. Any other partial set is not a usable resume point.
- Missing task: the user gave no task and none is inferable from nearby context. Stop and ask for the task; emit no prompt.
- Path leakage: a drafted line contains a filesystem path. Rewrite it as a portable anchor before copying. If a path cannot be rewritten without losing meaning and the user did not explicitly request it, drop the line and note the omission in the confirmation.
- Invented facts: a drafted claim was not checked against the repo, issue/PR, or docs. Remove or mark it unverified; never present an unchecked claim as reviewed fact.
- Clipboard unavailable: no platform clipboard tool exists. Print the prompt and report that clipboard copy was unavailable.

## Output

During work, output the ignored local continuity status: `fresh`, `resumed`, `interrupted`, or `completed`, with the death-point path. On resume, also name any rejected continuity set and its reason. On explicit handoff, output the source receipt, any age or visibility warning, and one compliant brief path or stdout result (mode `brief`), or a standalone path-free prompt on the clipboard with a terse confirmation naming the task title (mode `prompt`). The procedure ends there; no receiver is launched.
