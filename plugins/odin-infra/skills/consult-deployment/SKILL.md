---
name: consult-deployment
description: 'Use when the user asks to rank deployment platforms and stacks against their product with quantitative trade-offs. Enumerates candidates, gathers raw metrics, normalizes them to a common scale, applies user weighting, and returns a ranked list with per-axis scores. Read-only; no source or remote mutation.'
---

# Consult deployment

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to rank deployment platforms and stacks against the product with quantitative trade-offs. |
| Authority | Read-only advisory research. No file, VCS, credential, paid, published, deployed, or remote mutation. No deployment action is taken. |
| Side effect | A ranked list of deployment platforms and stacks with quantitative trade-offs is written to chat output only. |
| Done | A ranked deployment list with per-axis normalized scores, applied weights, and a summary trade-off statement is returned. |

## Inputs

Required from the user: the product being deployed (language, runtime, framework, and artifact shape) and the weighting intent (which trade-offs matter most).

Optional but requested before ranking: expected traffic or request volume, monthly budget ceiling, latency or cold-start target, target regions, compliance or regulatory constraints, team size, and any existing infrastructure that must be reused.

If a required input is missing, ask for it before ranking rather than guessing.

## Procedure

1. Collect the required inputs and any optional constraints the user supplies. Stop and ask when a required input is absent. Done when: all required inputs are collected or the missing input is named and the skill stops.
2. Enumerate candidate deployment platforms and stacks that satisfy the stated constraints. Include at least the obvious default and one divergent alternative so the ranking is not a single entry. Done when: at least two candidates are enumerated.
3. For each candidate, gather raw metrics on the quantitative axes drawn from the stated constraints: monthly cost at the stated scale, cold-start or p99 latency, build and deploy time, autoscale ceiling, managed-service coverage breadth, vendor lock-in cost, observability depth, and security or compliance posture. Use measured or documented numbers from primary sources. Where a number is unavailable, mark the axis unknown. Done when: every candidate is scored on every applicable axis or the unknown axis is marked.
4. Normalize each raw metric to a common 0-10 relative scale across the candidates on that axis. For lower-is-better axes (cost, latency, deploy time, lock-in), invert so that 10 is best. For higher-is-better axes (autoscale ceiling, managed-service coverage, observability depth, security posture), score directly so that 10 is best. Missing-value rule: when a candidate's raw value is unknown, assign it no normalized score on that axis and exclude that axis from that candidate's weighted total; record the exclusion. Done when: every known raw metric has a 0-10 normalized score and every unknown is recorded as excluded.
5. Apply the user's weighting to the normalized scores. Convert the weighting intent to per-axis weights summing to 1.0: if the user named specific axes that matter most, assign those higher weights and distribute the remainder across the rest; if the user gave no weighting, use equal weights. For each candidate, multiply each normalized axis score by its weight and sum the weighted scores over the axes that have values for that candidate. Record the weights used. Done when: a single weighted score is produced for each candidate with the weights recorded.
6. Rank candidates by weighted score descending. Return the ranked list with each candidate's per-axis normalized scores, the applied weights, any excluded axes, and a one-sentence trade-off statement explaining why each candidate placed where it did. Done when: the ranked list is returned with normalized scores, weights, exclusions, and trade-off statements.

## Failure and recovery

- Missing required input: ask for it; do not rank on assumed product or constraints. Partial results are not returned for this class.
- Unknown axis value: mark the axis unknown, exclude it from that candidate's weighted total, and record the exclusion. Do not fabricate a number to fill the gap.
- No candidate satisfies the constraints: return the conflict and the candidates that come closest, rather than silently dropping a constraint.
- Insufficient product or constraint information to enumerate or score any candidate: return a blocked result naming exactly which inputs are missing and what would unblock the ranking.

## Output

Ranked list of deployment platforms and stacks, each with per-axis 0-10 normalized scores, the applied weights, any excluded axes with reasons, and a one-sentence trade-off statement. Chat output only.
