---
name: show-review
description: 'Use when the user wants a per-finding visual walk through a diff or PR: one finding per turn with a Keep/Skip/Discuss choice and a close tally. Not for written review reports — use review or pr-review; not for codebase tours — use show-me.'
---

# Show review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to be walked through a review or diff one finding at a time: "walk me through this review/PR", "show-review", or "review this interactively". |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Per-finding visuals and the close tally render in chat; nothing is written to disk. |
| Done | Every finding carries Keep or Skip (the remainder explicitly skipped) and the close message reports a kept/skipped/discussed tally. |

## Inputs

- Change-set to walk (required): named files, a PR number (read via `gh pr diff`), the working tree, or a branch against its base. Supplied by the human at invocation.

## Procedure

1. Bound the change-set. Read the diff for the named files, PR, working tree, or branch against its base. For an empty change-set, report `0 findings.` and stop. Binary, lockfile, and generated paths are not findings. Done when: the diff is read and the change-set boundary is named.
2. Rank findings in place by reachable impact: ship-blocker and wrong-on-plausible-input first, degraded uncommon path next, no-behavioral-impact last. Nits take the same Keep/Skip path, Skip first. A line that is not a defect is not a finding. Read enough of the change-set to name the current highest finding; do not write a findings list. Done when: the current highest finding is named without a written list.
3. Emit one finding per message, highest remaining first. Keep remaining titles unsaid. Done when: one finding is emitted with its visual and single-select.
4. Each finding turn has three parts: (a) the smallest view that carries the defect; (b) one or two lines naming what is wrong, the reachable impact, and `file:line`; (c) one single-select: Keep / Skip / Discuss, with `(Recommended)` on the first option. Print the visual in the message body beside the two lines, not in the question-tool preview. Use the harness question tool when it exists (labels only); otherwise number the three options. Done when: the finding turn carries its view, impact lines, and single-select.
5. Recommended first: Keep for a named reachable failure; Skip for a no-behavioral-impact nit. The next message is the answer. A turn is done when Keep or Skip is in hand. Discuss is one round, then Keep / Skip only. A new defect raised in Discuss waits until this finding has Keep or Skip. Done when: Keep or Skip is in hand for this finding.
6. After eight behavioral turns, present one single-select: skip the rest (Recommended) / continue. "Skip the rest" counts unseen findings as skipped; "keep the rest" counts them as kept. Either phrase, on any turn, closes the walk. Done when: the skip-or-continue choice is resolved.
7. Pick the view that carries the defect. One view is the common case; cut every line the defect does not turn on. Match the view to the defect:

   | The defect is | View |
   |---|---|
   | a change against a shape that already exists | focused diff |
   | logic or an algorithm | pseudocode |
   | what calls what at runtime | call tree |
   | UI structure or a module boundary | component tree |
   | file responsibility | shallow file tree |
   | interaction or data flow between parts | diagram |
   | new code, or a missing shape | whole block |

   Done when: the view matches the defect type per the table.
8. When the remaining list is empty, or the rest is skipped, go to Close. One-line tally: kept, skipped, how many were discussed. If kept is empty, stop. Otherwise present one single-select: Stop (Recommended) / apply the kept findings / grill the kept findings until clean. Done when: the close tally is reported and the user's next-action choice is recorded. The walk does not patch.

## Failure and recovery
- Empty change-set: report `0 findings.` and stop. Do not invent findings.
- User stops early: close the walk with whatever was covered. Count unseen findings as skipped. Report the partial tally honestly; do not pretend every finding was decided.
- Wrong route: if the user wants a written sectioned report rather than a per-finding walk, stop: this skill emits one finding per turn, not a report. If the user wants a GitHub PR sectioned report, stop: this is an interactive chat walk, not a PR comment report. If the target is a topic shown without reviewing it, stop: this skill reviews a diff. If the user wants a grill-until-clean pass without a visual walk, stop: this walks findings one at a time. If the target is unfamiliar code with no diff, stop: this walks a change-set, it does not tour a codebase.
- Non-mutation rule: nothing lands on disk. The walk never patches; the Close single-select only records the user's choice of what to do next with kept findings.

## Output
Per turn: one finding as an ephemeral visual (focused diff, pseudocode, call tree, component tree, shallow file tree, diagram, or whole block) with one-two impact lines and a Keep/Skip/Discuss single-select. On close: a one-line kept/skipped/discussed tally and the user's recorded choice (stop, apply kept, grill kept). Nothing written to disk.
