---
name: punishing-practices
description: 'Use when a user invokes a candid after-action account of a completed work cycle. The agent produces a written retrospective with concrete changed practices for the next cycle. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Punishing practices

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User explicitly requests an after-action account, retrospective, or post-mortem of a completed work cycle. |
| Authority | Reversible local write. The agent writes one retrospective artifact to the local filesystem. Rollback: delete the written file. |
| Side effect | Creates a local file containing the after-action account with concrete changed practices. |
| Done | A candid after-action account exists as a written artifact, naming what happened, what failed, what worked, and at least one concrete changed practice for the next cycle. |

## Inputs

- **Work cycle description** (required): the user names the work cycle, session, project phase, or incident to retrospect on. May be a file path, a summary, or a verbal description.
- **Scope hint** (optional): the user may bound the retrospective to a specific subsystem, time window, or decision.

## Procedure

1. Confirm the work cycle and scope with the user. Ask one clarifying question if the cycle boundary is ambiguous.
2. Ask the user to name, in their own words: what was the goal, what actually happened, and what surprised them.
3. From the user's answers, extract and list:
   a. **What was attempted**: concrete actions, decisions, and commits.
   b. **What failed or underperformed**: specific outcomes that fell short, with the user's stated reason.
   c. **What worked**: outcomes that met or exceeded intent.
   d. **What was surprising**: deviations from expectation, whether positive or negative.
4. For each failure or underperformance, ask the user: "What practice, if changed, would prevent this next time?" Record the user's answer verbatim or near-verbatim.
5. Synthesize the account into a written artifact with these sections:
   - **Cycle**: name and boundary of the work cycle.
   - **Goal**: what was intended.
   - **Account**: candid narrative of what happened, written in the user's voice, not sanitized.
   - **Failures**: each failure with its root cause as stated by the user.
   - **Wins**: what worked and why.
   - **Changed practices**: each concrete practice change, stated as an imperative the user can act on next cycle. Each must be specific enough that a future self could check whether it was followed.
6. Present the draft to the user. Ask: "Is this candid enough? What would you soften or sharpen?"
7. Incorporate the user's edits.
8. Write the final artifact to a local file named `retrospective-<cycle-slug>.md` in the current working directory.

## Failure and recovery
- **User declines to be candid**: state that the retrospective value depends on honesty, then ask one targeted question about the single largest deviation. If the user still declines, write whatever they are willing to state and note in the artifact that the account is partial.
- **No clear failure**: if the user reports no failures, record that explicitly and focus changed practices on what could be optimized or hardened, not invented failures.
- **Scope too broad**: if the user names a cycle that spans too many decisions to account for in one sitting, propose splitting into sub-cycles and let the user choose.
- **Write failure**: if the file cannot be written, output the full artifact to the conversation and instruct the user to save it manually.

## Output
A local file `retrospective-<cycle-slug>.md` containing the candid after-action account with concrete changed practices. The file is self-contained and readable without this skill.

## Provenance

Origin: user-curated idea `curated:curated-ideas:curated-061` from `project-owned:user-curated-skill-ideas`. Adapted from the directive "force a candid after-action account with concrete changed practice." No third-party license applies; the source is user-authored project material. This is a clean-room adaptation into a structured retrospective workflow.
