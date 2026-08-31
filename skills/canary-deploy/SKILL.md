---
name: canary-deploy
description: 'Use when the user runs /canary-deploy to drive a canary release to promote or roll back with evidence. Not for full deployments or releases without a canary stage.'
disable-model-invocation: true
---

# Canary deploy

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /canary-deploy. |
| Authority | Human-only. The model never starts a canary on its own. Before any deploy, promote, or rollback, preview the target service, the traffic slice, and the consequence of the state change and get human confirmation. Deployment state changes are external and effectively irreversible. |
| Side effect | Mutates canary deployment state only: deploy a canary, watch metrics, then promote or roll back. No other service, config, credential, or data-at-rest target is touched. |
| Done | The canary is promoted or rolled back with metric evidence recorded. |

## Inputs

- Service and deployment target to canary (must be supplied).
- Canary traffic percentage or slice (must be supplied).
- Watch window duration and the metric thresholds that define healthy versus unhealthy (must be supplied).
- Promote target (full rollout) and rollback target (previous stable revision) (must be supplied).
- Metric source the watch reads from (must be supplied).

## Procedure

1. Confirm the human invoked /canary-deploy. If not, stop. **Done when:** the invocation is confirmed human-initiated, or the run is stopped with the reason named.
2. Read the supplied service, traffic slice, watch window, metric thresholds, promote target, rollback target, and metric source. Stop and report missing inputs rather than guessing defaults. **Done when:** every input is present and recorded, or the missing ones are named and the run stopped.
3. Preview the canary plan to the human: target service, traffic percentage, watch window, healthy/unhealthy thresholds, promote action, and rollback action. Get explicit human confirmation before any state change. **Done when:** the human confirms the plan, or the run is stopped for lack of confirmation.
4. Deploy the canary revision at the supplied traffic slice against the target service. **Done when:** the canary revision is live at the supplied traffic slice.
5. Watch the named metrics over the supplied watch window. Collect the observed values that will serve as evidence. **Done when:** the watch window elapsed with metric values collected.
6. Classify the canary against the thresholds: healthy if every metric stays within its healthy band for the whole window; unhealthy if any metric crosses its unhealthy threshold. **Done when:** the canary is classified healthy or unhealthy.
7. If healthy, promote: route full traffic to the canary revision and record the promote decision with the collected metric evidence. **Done when:** full traffic routes to the canary revision and the promote decision is recorded with evidence.
8. If unhealthy, roll back: route traffic back to the previous stable revision and record the rollback decision with the collected metric evidence. **Done when:** traffic routes to the previous stable revision and the rollback decision is recorded with evidence.
9. If the watch window ends with metrics neither clearly healthy nor clearly unhealthy, do not promote. Report the indeterminate state and the collected evidence, and require a human decision before any further state change. **Done when:** the indeterminate state is reported with evidence and a human decision is requested.

## Failure and recovery
- **Missing inputs:** stop before any deploy; report which inputs are missing. No state is mutated.
- **No human confirmation at the preview step:** stop; no canary is deployed.
- **Metric source unavailable during the watch window:** do not promote on absent data. Roll back to the previous stable revision and record that the decision was forced by unavailable checks, with whatever evidence was collected.
- **Indeterminate metrics at window end:** do not promote. Record the indeterminate classification and evidence; require a human decision before promote or rollback.
- **Partial result:** a canary that deployed but did not reach a promote or rollback decision is not done. The recorded state is `indeterminate` or `unavailable-checks`, never `promoted`.
- **Swallowed metric error:** never report the done predicate as satisfied without collected metric evidence.

## Output
A recorded canary decision — `promoted` or `rolled-back`, each with the collected metric evidence and the threshold classification that justified it; or `indeterminate` / `unavailable-checks` with evidence and no state change beyond rollback forced by unavailable checks.

## Provenance

Origin: https://github.com/garrytan/gstack, path canary/SKILL.md, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69. License: MIT (Copyright (c) 2026 Garry Tan), blob 35029511144443297cad2d26e4bac17d0e352f93. Clean-room adaptation: the canary deploy, metric watch, and promote-or-rollback-with-evidence mechanism is re-derived, not copied.
