---
name: handoff-prompt
description: 'Use when the user asks for a handoff, a delegation, or a clipboard-ready prompt for another agent; the run writes a standalone path-free prompt, copies it to the clipboard, and confirms with the task title. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

1. Identify the task from the user text. When the user gives only a short label, infer the boundary from the current repo, recent discussion, branch name, linked issue/PR, docs, and obvious nearby context.
2. Gather enough context to orient a fresh agent: repo/product identity, relevant issue/PR/branch names or URLs, likely modules, constraints, known symptoms, and the desired output shape. Stop short of doing the receiving agent's review or picking its technical direction.
3. Assemble a standalone prompt using portable anchors only — repo owner/name, product or module names, issue/PR URLs, branch names, package or plugin names, public symbols, command names, config keys, exact error text, docs titles, and search terms. Include no absolute paths, home-directory paths, checkout names, or repo-relative file paths unless the user explicitly requests them.
4. The first real instruction to the receiving agent must be to review, discuss, and assess — not a command-only work order. Make clear the receiving agent owns that review; the handoff gives only starting context and known constraints, and the agent should decide whether the task is still real, stale, already solved, over-scoped, or better handled differently.
5. Include constraints, non-goals, validation expectations, the desired output shape, and an instruction to re-check live repo/GitHub/CI state where relevant. Tell the receiving agent not to push, merge, close issues/PRs, label, or post public comments unless the handoff explicitly asks for it.
6. Use this shape by default, filling each bracketed field from gathered context:

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

7. Copy the full assembled prompt to the clipboard. Use a temp file or pipe rather than inline shell quoting, because prompts may contain backticks, `$`, quotes, or user text. On macOS use `pbcopy`; otherwise use the platform clipboard tool (`wl-copy`, `xclip`, `clip.exe`). If no clipboard tool is available, print the prompt and state that clipboard copy was unavailable.
8. Final reply: a terse confirmation with the task title. Do not paste the full prompt unless the user asks.

## Failure and recovery
- **Missing task**: the user gave no task and none is inferable from nearby context. Stop and ask for the task; emit no prompt.
- **Path leakage**: a drafted line contains a filesystem path. Rewrite it as a portable anchor before copying. If a path cannot be rewritten without losing meaning and the user did not explicitly request it, drop the line and note the omission in the confirmation.
- **Invented facts**: a drafted claim was not checked against the repo, issue/PR, or docs. Remove or mark it unverified; never present an unchecked claim as reviewed fact.
- **Clipboard unavailable**: no platform clipboard tool exists. Print the prompt and report that clipboard copy was unavailable; the done predicate is not met for the clipboard portion, so state this explicitly.
- **Partial result**: never copy a prompt that fails the path-free or no-invented-facts rules. Rollback is non-mutation — nothing outside the assembled text and clipboard is touched, so a failed attempt leaves no side effect beyond the confirmation message.

## Output
A standalone, path-free prompt on the clipboard, plus a terse confirmation naming the task title. The prompt orients a fresh receiving agent and opens with a review/assess instruction rather than a command-only work order.

## Provenance

Origin: github.com/openclaw/agent-skills, skills/handoff/SKILL.md at revision ae75f60e8d454f1cf44ec4613e10ec9ea7f2ade7. License: MIT (copyright and permission notice required in copies). Adaptation: renamed to handoff-prompt to avoid collision with a session-snapshot handoff skill; restructured into the ODIN 2.0 contract sections; the prompt template shape, path-free rule, portable anchors, review-first instruction, and clipboard fallback were preserved as the load-bearing mechanism and restated in this skill's own words.
