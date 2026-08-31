---
name: deployment-setup
description: 'Use when the user runs /deployment-setup, configure and verify the project deployment pipeline through CI or workflow files without triggering a deployment. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Deployment setup

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /deployment-setup |
| Authority | Reversible local writes to CI or workflow files that configure the deployment pipeline; no deployment is triggered |
| Side effect | Local write to CI or workflow files configuring the deployment pipeline only |
| Done | The deployment pipeline is configured and verified |

## Inputs

The project root containing the CI or workflow configuration to edit. The target deployment platform must be supplied if it cannot be detected from existing configuration. Any required deployment secrets, environment names, or build commands must be supplied by the user; this skill does not invent credentials.

## Procedure

1. Detect existing CI or workflow configuration in the project root and identify the deployment platform from it. If none exists, ask the user for the target platform and pipeline shape before creating any file.
2. Bound scope: enumerate the exact CI or workflow files this skill will create or edit and show the set to the user before mutation. Write only those files.
3. Configure the deployment pipeline stages (build, test, deploy) in the CI or workflow files using the user-supplied platform, environment, and commands. Do not add stages the user did not request.
4. Verify the configuration by running the project's local check set (lint, build, test) against the pipeline definition. If the platform provides a local validation command for the workflow file, run it.
5. Do not trigger a deployment. The pipeline is configured and verified locally only.

## Failure and recovery
- Missing platform or required inputs: stop and ask the user; do not create files or guess credentials.
- Validation fails: report the failing check with its file and line; do not mark the pipeline verified. Leave the edited files in place for the user to correct, or revert them to their prior state on user request.
- Rollback: the edited CI or workflow files are version-controlled; restore them from VCS to the pre-edit state.
- Blocked result: name the missing input or failing check and stop; never claim the done predicate holds while a check is unverified.

## Output
Configured CI or workflow files defining the deployment pipeline, plus a report listing the files written, the verification checks run, and each check's pass or fail status. No deployment is triggered.

## Provenance

Adapted from the `setup-deploy` skill in github.com/garrytan/gstack at revision 07b59e396c6be5a86619a43151cb9ed62a15ae69 (MIT, Copyright (c) 2026 Garry Tan). Expressive prose and code were re-derived; no third-party expression was copied wholesale.
