---
name: ci-cd
description: 'Use when asked to set up or modify CI/CD pipelines, quality gates, test runners, or deployment strategy. Produces in-repository workflow and deployment configuration with blocking gates, safe secret placement, bounded pipeline time, and rollback.'
---

# CI/CD and automation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Setting up or modifying CI/CD pipelines, quality gates, test runners, or deployment strategy. |
| Authority | Reversible local writes: may write CI workflow and deployment configuration files in the local repository. Does not execute deployments, publish, or make remote mutations. |
| Side effect | Writes CI workflow and deployment configuration files locally; no deployment, publishing, credential, or remote mutation. |
| Done | Blocking gates, safe secret placement, bounded pipeline time, and rollback configuration are present. |

## Inputs

- The target repository and its CI provider (e.g., GitHub Actions). Required.
- The quality gates the project requires. Required; defaults to the fixed gate order below.
- The project ecosystem commands that realize each gate (lint, type-check, test, build, integration, security audit, bundle size). Required.
- The deployment target and its rollback strategy. Required when a deployment stage is in scope.
- An existing pipeline to modify. Optional; supply when modifying rather than creating.

## Procedure

1. Bound scope: confirm the work is authoring or modifying CI workflow and deployment configuration files in the repository. Do not run deployments, publish artifacts, or mutate remote systems. **Done when:** scope is bounded to local config file authoring or modification.
2. Establish the fixed gate order that every PR and push to main must pass, in this sequence: lint, type check, unit tests, build, integration tests, E2E (optional), security audit, bundle size. The order is fixed across ecosystems; only the commands change (Node: `pnpm exec biome check .`, `pnpm exec tsc --noEmit`, `pnpm exec vitest run`, `pnpm run build`; Python: `uv run ruff check .`, `uv run ruff format --check .`, `uv run pyright`, `uv run pytest`, `uvx pip-audit`; Rust: `cargo clippy`, `cargo test`, `cargo build`, `cargo audit`). **Done when:** the fixed gate order is established with ecosystem-specific commands.
3. Make every gate blocking. No gate may be skipped. If lint fails, fix lint; if a test fails, fix the code. Do not disable the rule or skip the test. **Done when:** every gate is configured as blocking with no skip path.
4. Place secrets in the CI secrets manager and reference them as masked environment variables. Never store secrets in code or in workflow configuration files. **Done when:** secrets are placed in the secrets manager and referenced as masked env vars.
5. Configure branch protection so gate failures block merge, and the pipeline runs on every PR and on push to main. **Done when:** branch protection blocks merge on gate failure and the pipeline runs on every PR and push to main.
6. Add a deployment stage with a rollback mechanism. Verify staging before production. Prefer smaller batches and more frequent releases to reduce deployment risk. **Done when:** the deployment stage has a rollback mechanism and staging verification.
7. Bound pipeline time: target the test suite under 10 minutes. Apply caching and job parallelism to stay within budget; do not drop a gate to meet the budget. **Done when:** the pipeline is bounded under 10 minutes with caching and parallelism, no gates dropped.
8. When a CI run has already failed, route the failure back to the agent that owns the change: copy the failing job name, the error text, and the repo state at failure, so the root cause is fixed rather than re-run. Skip this step when setting up a new pipeline that has no failure yet. **Done when:** the failure is routed to the owning agent with job name, error text, and repo state, or the step is skipped for a new pipeline.
9. Verify all gates are present, the pipeline runs on every PR and push to main, failures block merge, CI results feed back into the development loop, secrets are in the secrets manager, deployment has a rollback mechanism, and the test-suite pipeline runs under 10 minutes. **Done when:** every done-predicate element is verified present.

## Failure and recovery
- **Gate failure:** fix the code or configuration that caused the failure. Never disable the gate, skip the test, or re-run a flaky test; fix the flakiness.
- **Secret leak in a config or code file:** remove the secret from the file, rotate it, and re-place it in the secrets manager before proceeding.
- **Missing rollback:** do not mark deployment configuration done; add the rollback mechanism first.
- **Pipeline exceeds the time budget:** apply caching and job parallelism. Do not drop gates to meet the budget.
- **Partial result:** keep all completed gate configuration, but do not commit a pipeline that is missing a blocking gate, a secret boundary, or a rollback. The blocked, non-converged result is a report listing exactly which done-predicate element is missing (gate, secret placement, rollback, or time bound) and what was tried.

## Output
CI workflow and deployment configuration files in the repository implementing the fixed gate order, blocking branch protection, secrets-manager secret placement, a deployment rollback mechanism, and a bounded pipeline time, plus a verification report confirming each done-predicate element holds.

## Provenance

Origin: odin-1.x current skill (skills/ci-cd/SKILL.md, project-owned, no license) and addyosmani/agent-skills (skills/ci-cd-and-automation/SKILL.md, pinned revision d2c37ef6225dd8726cdd369a8030307f48592d26, MIT, Copyright (c) 2025 Addy Osmani). The addyosmani candidate was an exact four-field duplicate of the current skill and was merged into this survivor with no alias retained. Clean-room adaptation: the gate-order, no-skip, shift-left, failure-feedback, and rollback mechanisms are restated in this skill's own words; no third-party expression is copied.
