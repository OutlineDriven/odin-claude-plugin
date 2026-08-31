---
name: walk-with-me
description: 'Use when the user wants to be walked through code rather than handed a report: "walk through this", "guided code walk", or "explain this codebase". Renders a visual shape and hands the user the next step each turn. Don''t use for tasks that require source or remote-system changes.'
---

# Walk with me

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to be walked through code: "walk me through this", "walk with me", or "help me understand this codebase". |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Per-turn visuals and single-selects render in chat; nothing is written to disk. |
| Done | The covered tally is reported and the user's stop, write-down, or act single-select is recorded. |

## Inputs

- Codebase to walk through (required): supplied as a directory path, file set, or repository URL.
- Entry point or starting file (optional): if omitted, the agent identifies the main entry point from the code structure.

## Procedure

1. Identify the entry point. If the user named a starting file, use it. Otherwise infer the main entry point from the code structure. Done when: the entry point is identified or the user supplied one.
2. Render one visual of the whole codebase before any detail: a shallow file tree naming what each directory owns, or a module diagram. Then present one single-select of which part to descend into, offering three or four real named targets from the code, with `(Recommended)` on the one the entry point reaches first. Done when: visual is rendered and single-select with real named targets is presented.
3. Each subsequent turn: render one visual, write one or two lines of prose, and present one single-select of where to go next. Options are always real named targets read from the code, never "continue" or "go deeper". Print the visual in the message body beside the prose, not in the question preview. Done when: one visual with one single-select of real named targets is presented.
4. After six turns, present one single-select offering to close (recommended) or continue. Any stop phrase closes the walk on any turn. Done when: close-or-continue single-select is presented or a stop phrase is received.
5. On close: report a one-line tally of what was covered, then present one single-select: stop (recommended), write it down, or act on it. Done when: tally is reported and the user's decision is recorded.

## Failure and recovery
- No code found: report the blocker and stop the walk. Do not fabricate a codebase or invent structure.
- User stops early: close the walk with whatever was covered. Report the partial tally honestly; do not pretend the full codebase was walked.
- Codebase too large to walk in six turns: present the high-level shape and let the user choose where to focus. Do not widen scope beyond what the user selects.
- The walk never issues the conclusion the walk exists to let the user reach. If the agent states a finding instead of asking, the walk has failed its contract.

## Output
Per-turn: one visual (file tree, module diagram, or code excerpt) with one single-select of real named targets. On close: a covered-tally line and the user's recorded decision (stop, write down, or act). Nothing lands on disk.
