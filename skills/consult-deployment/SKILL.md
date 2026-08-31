---
name: consult-deployment
description: 'Use when the user asks to rank deployment platforms and stacks against their product with quantitative trade-offs, return a ranked platform and stack list with the per-axis numbers that determined the order. Don''t use for tasks that require source or remote-system changes.'
---

# Consult deployment

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to rank deploy platforms and stacks against the product with quantitative trade-offs. |
| Authority | Read-only advisory research. No file, VCS, credential, paid, published, deployed, or remote mutation. No deployment action is taken. |
| Side effect | A ranked list of deployment platforms and stacks with quantitative trade-offs is written to chat output only. |
| Done | A deployment platform/stack ranking with quantitative trade-offs is returned. |

## Inputs

Required from the user: the product being deployed (language, runtime, framework, and artifact shape) and the weighting intent (which trade-offs matter most).

Optional but requested before ranking: expected traffic or request volume, monthly budget ceiling, latency or cold-start target, target regions, compliance or regulatory constraints, team size, and any existing infrastructure that must be reused.

If a required input is missing, ask for it before ranking rather than guessing.

## Procedure

1. Collect the required inputs and any optional constraints the user supplies. Stop and ask when a required input is absent.
2. Enumerate candidate deployment platforms and stacks that plausibly fit the product and constraints. Include at least the obvious default and one divergent alternative so the ranking is not a single entry.
3. For each candidate, score it on quantitative axes drawn from the stated constraints: monthly cost at the stated scale, cold-start or p99 latency, build and deploy time, autoscale ceiling, managed-service coverage breadth, vendor lock-in cost, observability depth, and security or compliance posture. Use measured or documented numbers; where a number is unavailable, mark the axis unknown instead of inventing a value.
4. Apply the user's weighting to the per-axis scores to produce a single ranked order. Record the weighting used.
5. Return the ranked list with each candidate's per-axis numbers and a short statement of the trade-off that placed it where it sits.

## Failure and recovery
- Missing required input: ask for it; do not rank on assumed product or constraints. Partial results are not returned for this class.
- Unknown axis value: mark the axis unknown and continue ranking the remaining axes. Do not fabricate a number to fill the gap.
- Insufficient product or constraint information to rank any candidate: return a blocked result naming exactly which inputs are missing and what would unblock the ranking. Do not present an unranked or single-candidate list as a completed ranking.
- Conflicting constraints that no candidate satisfies: return the conflict and the candidates that come closest, rather than silently dropping a constraint.

## Output
A ranked list of deployment platforms and stacks, each with its per-axis quantitative scores, the weighting applied, and the trade-off statement that determined its position. The result is chat output only; no files, deployments, or remote state are changed.

## Provenance

Origin: user-curated skill idea `consult-deployment` from the local Skill Foundry curated-ideas brief, supplemented by the raw Korean source chat. Revision: none pinned. License: project-owned. Adaptation: clean-room restatement of an advisory research workflow; no third-party expression copied.
