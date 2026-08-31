---
name: shipping
description: 'Use when deploying to production, planning a feature release, or setting up launch safeguards. Drives the staged rollout sequence with pre-launch checks, rollback readiness, and health-signal gating. Not for local dev deploys or deploys without a confirmed rollback plan.'
disable-model-invocation: true
---

# Shipping

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Deploying to production, planning a feature release, or setting up launch safeguards. |
| Authority | Human-only: require explicit human invocation. Preview the target and consequence before credentials, data-at-rest changes, paid actions, publishing, deployment, remote bulk mutation, or irreversible deletion. |
| Side effect | Drives the deployment/rollout sequence and verification; no durable files of its own. |
| Done | Pre-launch checklist green, staged rollout thresholds applied, rollback plan documented and verified. |

## Inputs

- **Deployment target**: the environment, host, or platform being deployed to. Required.
- **Change scope**: the artifact, commit, image, or changeset being shipped. Required.
- **Rollback plan**: the documented procedure to revert the change. Required before any irreversible action.
- **Rollout strategy**: the staged rollout percentage or canary schedule. Required.
- **Monitoring/alerting**: the metrics and alert thresholds active during rollout. Optional.

## Procedure

1. Confirm the human has identified the deployment target, change scope, and rollback plan. **Done when:** all three are confirmed by the human.
2. Validate that the rollback plan is executable without external tooling that may be unavailable during an incident. **Done when:** the rollback plan's first step is independently executable.
3. Present the full change scope and the irreversible consequences to the human before any deployment action. **Done when:** the human confirms after seeing the scope and consequences.
4. Apply pre-deployment checks: confirm the change scope artifact is present, named, and its integrity can be verified. **Done when:** the artifact is present and its integrity is verified.
5. Establish rollback readiness: document and verify the first step of the rollback procedure can be executed immediately. **Done when:** the first rollback step is confirmed executable.
6. Execute the staged rollout. Do not advance to the next threshold without confirmed health signals. **Done when:** all staged thresholds are confirmed green.
7. Stop and surface a named failure at the first non-green health signal. Do not proceed past a failure. **Done when:** the failure is named and the rollout is stopped.
8. On rollback trigger or human request, execute the documented rollback procedure verbatim. **Done when:** the rollback procedure is executed verbatim.
9. Report the final state: successful rollout with thresholds verified, or rollback completed. **Done when:** the final state is reported.

## Failure and recovery

- **Unconfirmed rollback plan:** stop. Do not deploy. Return "rollback plan not confirmed".
- **Health signal failure during rollout:** stop rollout. Do not advance. Return "rollout stopped: unhealthy signal" with the signal name and value.
- **Artifact unavailable:** stop. Return "artifact not available" with the target identifier.
- **Human revocation:** execute rollback verbatim. Do not resume. Return "rollback executed per human request".
- **Partial-result:** never report done when rollout is incomplete or rollback is not confirmed.

## Output

A deployment state report: `rolled out` (all staged thresholds confirmed green, rollback plan verified and documented), `rolled back` (rollback executed, prior state confirmed or explicitly accepted by human), or `blocked` (named failure reason, no state change occurred).
