---
name: punishing-practices
description: 'Use when a user invokes a candid after-action account of a completed work cycle. Produces a written retrospective with concrete changed practices for the next cycle. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Punishing practices

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User explicitly requests an after-action account, retrospective, or post-mortem of a completed work cycle. |
| Authority | Reversible local write. The agent writes one retrospective artifact to the local filesystem. Rollback: delete the written file. |
| Side effect | Creates a local file containing the after-action account with concrete changed practices. |
| Done | A candid after-action account exists as a written artifact, naming what happened, what failed, what worked, and at least one concrete changed practice for the next cycle. |

## Refusals

- **Remote, credential, publish, deploy, or irreversible changes**: rejected. This skill writes one local file only.
- **Invented failures**: rejected. If the user reports no failures, record that explicitly rather than fabricating them.
- **Sanitized account**: rejected when the user declines to be candid. State that the retrospective value depends on honesty, then write whatever the user is willing to state with a note that the account is partial.

## Inputs

- **Work cycle description** (required): the user names the work cycle, session, project phase, or incident to review. This may be a file path, a summary, or a verbal description.
- **Scope hint** (optional): the user may bound the retrospective to a specific subsystem, time window, or decision.

## Procedure

1. Confirm the work cycle and scope with the user. Ask one clarifying question if the cycle boundary is ambiguous. **Done when**: the cycle boundary is named and agreed.
2. Ask the user to state in their own words what the goal was, what happened, and what surprised them. **Done when**: the user has stated goal, outcome, and surprises.
3. From the user's answers, extract and list: what was attempted (concrete actions, decisions, commits), what failed or underperformed (specific outcomes with the user's stated reason), what worked (outcomes that met or exceeded intent), and what was surprising (deviations from expectation). **Done when**: all four categories are populated from the user's answers.
4. For each failure or underperformance, ask the user: "What practice, if changed, would prevent this next time?" Record the answer verbatim or near-verbatim. **Done when**: each failure has a user-stated practice change.
5. Synthesize the account into a written artifact with sections: Cycle (name and boundary), Goal (what was intended), Account (candid narrative in the user's voice), Failures (each with root cause as stated by the user), Wins (what worked and why), Changed practices (each as an imperative specific enough that a future self could check whether it was followed). **Done when**: all six sections are written.
6. Present the draft to the user. Ask: "Is this candid enough? What would you soften or sharpen?" **Done when**: the user has reviewed and responded.
7. Incorporate the user's edits. **Done when**: all user edits are applied.
8. Write the final artifact to a local file named `retrospective-<cycle-slug>.md` in the current working directory. **Done when**: the file exists on disk.

## Failure and recovery

- **User declines to be candid**: state that the retrospective value depends on honesty, then ask one targeted question about the single largest deviation. If the user still declines, write whatever they are willing to state and note in the artifact that the account is partial.
- **No clear failure**: record that explicitly and focus changed practices on what could be optimized or hardened.
- **Scope too broad**: propose splitting into sub-cycles and let the user choose.
- **Write failure**: output the full artifact to the conversation and instruct the user to save it manually.

## Output

A local file `retrospective-<cycle-slug>.md` with sections Cycle, Goal, Account, Failures, Wins, Changed practices, ordered as listed.
