---
name: shipping
description: 'Use when deploying to production, planning a feature release, or setting up launch safeguards. Drives the staged rollout sequence with pre-launch checks, rollback readiness, and health-signal gating. Don''t use for local development deploys, non-production environments, or deployments without a confirmed rollback plan.'
disable-model-invocation: true
---

# Shipping

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Deploying to production, planning a feature release, or setting up launch safeguards |
| Authority | Human-only: require explicit human invocation. Preview the target and consequence before credentials, data-at-rest changes, paid actions, publishing, deployment, remote bulk mutation, or irreversible deletion. |
| Side effect | Drives the deployment/rollout sequence and verification; no durable files of its own |
| Done | Pre-launch checklist green, staged rollout thresholds applied, rollback plan documented and verified |

## Inputs

- **Deployment target**: the environment, host, or platform being deployed to. Required.
- **Change scope**: the artifact, commit, image, or changeset being shipped. Required.
- **Rollback plan**: the documented procedure to revert the change. Required before any irreversible action.
- **Rollout strategy**: the staged rollout percentage or canary schedule. Required.
- **Monitoring/alerting**: the metrics and alert thresholds active during rollout. Optional.

## Procedure

1. Confirm the human has identified the deployment target, change scope, and rollback plan.
2. Validate that the rollback plan is executable without external tooling that may be unavailable during an incident.
3. Present the full change scope and the irreversible consequences to the human before any deployment action.
4. Apply pre-deployment checks: confirm the change scope artifact is present, named, and its integrity can be verified.
5. Establish rollback readiness: document and verify the first step of the rollback procedure can be executed immediately.
6. Execute the staged rollout. Do not advance to the next threshold without confirmed health signals.
7. Stop and surface a named failure at the first non-green health signal. Do not proceed past a failure.
8. On rollback trigger or human request, execute the documented rollback procedure verbatim.
9. Report the final state: successful rollout with thresholds verified, or rollback completed.

## Failure and recovery
- **Unconfirmed rollback plan**: stop. Do not deploy. Return "rollback plan not confirmed".
- **Health signal failure during rollout**: stop rollout. Do not advance. Return "rollout stopped: unhealthy signal" with the signal name and value.
- **Artifact unavailable**: stop. Return "artifact not available" with the target identifier.
- **Human revocation**: execute rollback verbatim. Do not resume. Return "rollback executed per human request".
- Partial-result rule: never report done when rollout is incomplete or rollback is not confirmed.

## Output
A deployment state report:
- `rolled out`: all staged thresholds confirmed green, rollback plan verified and documented.
- `rolled back`: rollback executed, prior state confirmed or explicitly accepted by human.
- `blocked`: named failure reason prevents proceeding. No state change occurred.

## Provenance

- **Origin**: odin-current (`skills/shipping/SKILL.md`) — project-owned, no external license.
- **Absorbed duplicate**: addyosmani/agent-skills (`skills/shipping-and-launch/SKILL.md`, MIT, pinned d2c37ef6225dd8726cdd369a8030307f48592d26). The MIT obligation (retain copyright notice and permission text) is met by this attribution block. No third-party expression copied; mechanism absorbed into the odin-current adaptation.

Retained MIT permission text for Copyright (c) 2025 Addy Osmani:

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
