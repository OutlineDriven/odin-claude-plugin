---
name: create-learning-path
description: 'Use when asked to create a multi-session learning plan. Returns a milestoned plan, practice, and review rubric. Don''t use for tasks that require source or remote-system changes.'
---

# Create learning path

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Create a multi-session learning plan. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Conversation artifact only. |
| Done | Milestoned plan, practice, and review rubric returned. |

## Inputs

Required inputs from the learner:
- Learning goal: the skill or topic to master.
- Current level: what the learner already knows or can do.

Optional inputs; request any that are absent:
- Session count or total time budget.
- Session length and cadence.
- Constraints (materials, deadlines, prior gaps).

## Procedure

1. Collect the required inputs and any optional inputs the learner supplies. Ask for missing required inputs before proceeding; do not invent them. Done when: required inputs are collected or missing ones are requested.
2. Decompose the goal into ordered milestones, each a demonstrable capability, sequenced so no milestone depends on a later one. Done when: milestones are ordered with no forward dependencies and each is a demonstrable capability.
3. Map milestones onto the available sessions, respecting the session count, length, and cadence. If no budget is given, propose a default and label it as proposed. Done when: every milestone is mapped to a session within the stated or proposed budget.
4. For each milestone, define one practice exercise that produces observable evidence the milestone was reached. Done when: each milestone has one practice exercise with observable evidence.
5. Define a review rubric for each milestone with criteria that distinguish not-yet, partial, and met, so the learner can self-assess. Done when: each milestone has a rubric with not-yet, partial, and met criteria.
6. Return the plan, practice, and rubric as a single conversation artifact. Done when: the plan, practice exercises, and rubrics are returned as one artifact.

## Failure and recovery
- Missing required input: stop and request it; do not fabricate a goal or level.
- Goal too broad for the stated budget: report the mismatch, propose a narrowed scope, and let the learner confirm before continuing. Do not silently widen the budget.
- No recovery action mutates files, credentials, or remote state. A partial result is returned only as an explicit incomplete plan with the missing milestone or rubric named.

## Output
Return a conversation artifact with ordered milestones mapped to sessions, one practice exercise per milestone, and a review rubric with not-yet, partial, and met criteria for each milestone.
