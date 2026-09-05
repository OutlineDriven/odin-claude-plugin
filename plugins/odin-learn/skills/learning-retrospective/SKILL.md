---
name: learning-retrospective
description: 'Use when asked to review learning progress after a milestone. Not for engineering retrospectives, use engineering-retrospective. For agent-environment ones, use agent-environment-retrospective.'
---

# Learning retrospective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Review learning progress after a milestone. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Conversation artifact only. |
| Done | A learning retrospective, adjusted plan, and measurable next milestone. |

## Inputs

- Milestone or learning plan (required): the goal, topic, or checkpoint under review.
- Evidence of progress (required): completed exercises, notes, project artifacts, or session records that demonstrate what was attempted and what was produced.
- Current plan or curriculum (optional): the existing learning plan, if one exists, to be adjusted.

## Procedure

1. Confirm read-only authority. Done when: read-only authority is confirmed and no mutation has been performed.
2. Collect the milestone definition and all supplied evidence of progress. If evidence is absent or insufficient, stop and report the gap; do not invent evidence. Done when: the milestone definition and all supplied evidence are collected, or the gap is reported and the run stops.
3. Review the evidence against the milestone criteria. Classify each criterion as met, partially met, or unmet, citing the specific artifact or record that supports the classification. Done when: every milestone criterion is classified with a cited supporting artifact or record.
4. Identify gaps between the milestone definition and the observed evidence. For each gap, state what was expected and what was actually produced. Done when: every gap is stated with its expected and observed values.
5. Analyze which learning strategies, resources, or approaches were effective and which were not, grounded only in the supplied evidence. Done when: each strategy is assessed as effective or not with its evidentiary basis.
6. Propose adjustments to the learning plan: what to continue, what to change, what to drop, and what to add. Each adjustment must cite the evidence that motivates it. Done when: every adjustment is stated with its motivating evidence cited.
7. Define the next milestone. It must be specific, measurable, and achievable based on the current trajectory. State the success criteria explicitly. Done when: the next milestone is stated with explicit, measurable success criteria.
8. Assemble the learning-retrospective report per the Output section. Done when: the report is assembled with all five Output sections present.

## Failure and recovery
- Insufficient evidence: report which criteria cannot be evaluated and why. Do not fill gaps with assumptions. Ask the learner to supply missing artifacts before proceeding.
- No existing plan: proceed with the learning retrospective using the milestone and evidence alone. Propose an initial plan as part of the adjusted plan output.
- Conflicting evidence: surface the conflict, state both interpretations, and ask the learner to clarify before finalizing the learning retrospective.
- Scope creep detected: if the review expands beyond the stated milestone, stop and report that the scope has widened. Recommend a separate learning-retrospective for the additional scope.

## Output
A learning-retrospective report containing:

1. **Evidence review**: classification of each milestone criterion (met / partially met / unmet) with cited evidence.
2. **Gap analysis**: what was expected versus what was observed.
3. **Strategy assessment**: which approaches worked, which did not, and why, grounded in evidence.
4. **Adjusted plan**: concrete changes to the learning plan, each motivated by evidence.
5. **Next milestone**: a specific, measurable goal with explicit success criteria.
