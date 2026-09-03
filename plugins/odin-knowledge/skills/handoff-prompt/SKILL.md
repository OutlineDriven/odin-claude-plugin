---
name: handoff-prompt
description: 'Use when the user asks for a handoff, delegation, or clipboard-ready prompt for another agent: a standalone path-free prompt copied to the clipboard, confirmed by title. Not for session-snapshot briefs — use handoff; never remote, credential, publish, deploy, or irreversible.'
---

# Handoff prompt

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says handoff <task>, write a handoff, delegate this, or wants a clipboard-ready prompt for another agent |
| Authority | Write only the assembled prompt text and the local clipboard; no repository, VCS, credential, paid, published, or remote mutation |
| Side effect | A standalone, path-free prompt is copied to the clipboard and the user gets a terse confirmation |
| Done | Prompt is on the clipboard, contains no filesystem paths, no invented facts, and gives the receiving agent enough context to orient and decide whether to proceed |

## Inputs

Required: the task the user names or clearly implies.

Optional, gathered only to make the prompt useful: repo or product identity, relevant issue/PR/branch names or URLs, likely modules, constraints, known symptoms, and the desired output shape. Infer these from the current repo, recent discussion, branch name, linked issue/PR, docs, and obvious nearby context when the user gives only a short label. Do not perform the receiving agent's full independent review or decide its final technical direction.

## Procedure

1. Identify the task from the user text. When the user gives only a short label, infer the boundary from the current repo, recent discussion, branch name, linked issue/PR, docs, and obvious nearby context. Done when: the task is named in one sentence, and when inferred, the source of the inference (repo, branch, issue/PR, or discussion) is recorded.
2. Gather enough context to orient a fresh agent: repo/product identity, relevant issue/PR/branch names or URLs, likely modules, constraints, known symptoms, and the desired output shape. Stop short of doing the receiving agent's review or picking its technical direction. Done when: repo identity, issue/PR references, likely modules, constraints, symptoms, and output shape are gathered or marked absent, and no receiving-agent review was performed.
3. Assemble a standalone prompt using portable anchors only — repo owner/name, product or module names, issue/PR URLs, branch names, package or plugin names, public symbols, command names, config keys, exact error text, docs titles, and search terms. Include no absolute paths, home-directory paths, checkout names, or repo-relative file paths unless the user explicitly requests them. Done when: every anchor in the prompt is portable (repo owner/name, URLs, branch names, public symbols, command names, config keys, error text, docs titles, or search terms), and no filesystem path appears unless the user explicitly requested it.
4. The first real instruction to the receiving agent must be to review, discuss, and assess — not a command-only work order. Make clear the receiving agent owns that review; the handoff gives only starting context and known constraints, and the agent should decide whether the task is still real, stale, already solved, over-scoped, or better handled differently. Done when: the first instruction to the receiving agent is to review, discuss, and assess, and the prompt states the agent owns that review.
5. Include constraints, non-goals, validation expectations, the desired output shape, and an instruction to re-check live repo/GitHub/CI state where relevant. Tell the receiving agent not to push, merge, close issues/PRs, label, or post public comments unless the handoff explicitly asks for it. Done when: the prompt includes constraints, non-goals, validation expectations, output shape, and an instruction to re-check live state, plus an explicit ban on pushing, merging, closing, labeling, or posting without explicit request.
6. Use this shape by default, filling each bracketed field from gathered context: Done when: every bracketed field in the template shape is filled from gathered context or marked as needing user input, and no field is left as a placeholder.

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

7. Copy the full assembled prompt to the clipboard. Use a temp file or pipe rather than inline shell quoting, because prompts may contain backticks, `$`, quotes, or user text. On macOS use `pbcopy`; otherwise use the platform clipboard tool (`wl-copy`, `xclip`, `clip.exe`). If no clipboard tool is available, print the prompt and state that clipboard copy was unavailable. Done when: the full prompt text is on the clipboard (clipboard tool exits 0) or printed with a stated unavailability, and no inline shell quoting was used for the copy.
8. Final reply: a terse confirmation with the task title. Do not paste the full prompt unless the user asks. Done when: the final reply is a terse confirmation naming the task title, and the full prompt is not pasted unless the user asked.

## Failure and recovery
- Missing task: the user gave no task and none is inferable from nearby context. Stop and ask for the task; emit no prompt.
- Path leakage: a drafted line contains a filesystem path. Rewrite it as a portable anchor before copying. If a path cannot be rewritten without losing meaning and the user did not explicitly request it, drop the line and note the omission in the confirmation.
- Invented facts: a drafted claim was not checked against the repo, issue/PR, or docs. Remove or mark it unverified; never present an unchecked claim as reviewed fact.
- Clipboard unavailable: no platform clipboard tool exists. Print the prompt and report that clipboard copy was unavailable; the done predicate is not met for the clipboard portion, so state this explicitly.
- Partial result: never copy a prompt that fails the path-free or no-invented-facts rules. Rollback is non-mutation — nothing outside the assembled text and clipboard is touched, so a failed attempt leaves no side effect beyond the confirmation message.

## Output
A standalone, path-free prompt on the clipboard, plus a terse confirmation naming the task title. The prompt orients a fresh receiving agent and opens with a review/assess instruction rather than a command-only work order.
