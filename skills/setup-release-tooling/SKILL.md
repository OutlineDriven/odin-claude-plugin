---
name: setup-release-tooling
description: 'Use when the user asks to set up, install, configure, or deploy release tooling. Clones and verifies tools, creates (never overwrites) .env, gathers non-secret credentials at prompts, and validates repository access. Not for publishing releases or removing credentials.'
disable-model-invocation: true
---

# Setup release tooling

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to set up, install, configure, or deploy release tooling. |
| Authority | Human-only: explicit invocation required. Preview the target and consequence before credentials, data-at-rest changes, paid actions, publishing, deployment, remote bulk mutation, or irreversible deletion. |
| Side effect | Clones when needed, verifies tools, creates but never overwrites .env, gathers non-secrets, and validates credentials and repository access. |
| Done | All selected prerequisites pass, .env is present and loadable, and the user is told which workflows are ready. |

## Not for

- Publishing releases, deploying, or removing credentials.

## Inputs

- **Required**: none (user initiates and supplies credentials at prompts).
- **Gathered at runtime**: Slack bot token, Sentry DSN, GitHub token: each entered at a human-facing prompt. No credential is requested without the user's explicit signal.
- **Optional**: a specific repository URL or release-tooling version constraint, if the user names one.

## Procedure

1. Acknowledge the request. Ask the user to confirm which release tools to set up (e.g. GitHub Releases, semantic-release, npm publish, Cargo release) and whether they are working in an existing repository or starting fresh. **Done when:** the tool set and repository state are confirmed.
2. Identify the target environment. If the user is in a repository, scan for an existing `.env` file. If none exists, create an empty `.env` from scratch. If one exists, do not modify it; report its current keys and ask the user whether to add to it. **Done when:** `.env` exists or its current state is reported.
3. Present the set of credentials this skill will collect: Slack bot token (SLACK_BOT_TOKEN), Sentry DSN (SENTRY_DSN), GitHub token (GH_TOKEN or GITHUB_TOKEN). For each credential the user supplies, validate basic format (non-empty string; Sentry DSN must contain `://`; Slack token must start with `xoxb-`; GitHub token must be non-empty and not obviously a placeholder). Discard any value that fails format validation and prompt again. **Done when:** every credential is validated or the user declines.
4. Append each validated credential as a `KEY=VALUE` line to `.env`, one per line, using the names above. Do not write any other content to `.env`. Do not overwrite existing keys; if a key already exists in `.env`, report the existing value to the user and skip writing that line. **Done when:** every validated credential is appended or skipped with reason.
5. Verify the repository, if one was supplied or detected: confirm the remote URL is reachable via an authenticated HEAD request or `git ls-remote`; confirm the token in `.env` grants at least read access to the repository; report pass or fail for each check without exposing token values. **Done when:** repository access is verified or the failure is reported.
6. Run prerequisite checks for each selected tool. Stop on the first failure. Report each check's pass/fail result. **Done when:** every prerequisite passes or the first failure is reported.
7. Confirm `.env` is loadable — parse it with `dotenv` or equivalent and report the keys found. **Done when:** `.env` parses and its keys are reported.
8. Summarise: list each selected tool, its prerequisite result, which credentials are present, and name the release workflows now ready for the user. **Done when:** the summary is emitted.

## Failure and recovery

- **Credential-format failure:** the specific credential is rejected; the prompt repeats. The `.env` file is not touched for that credential.
- **Repository access failure:** report which token or URL failed and stop. The `.env` is not rolled back; credentials already written remain.
- **Prerequisite failure:** name the tool and the failing check. Stop; do not claim the workflow is ready. Do not suggest the failure is minor or temporary.
- **Existing `.env` conflict:** if a key already exists, report it and skip writing that line. Do not overwrite.
- **No rollback rule:** once a credential is written to `.env` it is not automatically removed. The user must explicitly request deletion.
- **Partial-result:** if steps 1-4 complete but step 5 or 6 fails, report exactly what passed and what did not. Do not claim full success.

## Output

A human-readable report naming each selected release tool, its prerequisite status, which credentials are present in `.env`, and which release workflows are ready; the `.env` file contains the keys the user supplied; no credentials are echoed in the report.

## Provenance

Origin: https://github.com/warpdotdev/client-release-agent-oss
Revision: 9c1394804c5148820a9bab6c01802fde4330d725
License: MIT — requires the copyright notice and permission notice in all copies or substantial portions.
Adaptation: adapted from `.warp/skills/setup/SKILL.md`, `.env.example`, and `README.md` of the upstream repository. Setup-and-verify mechanism preserved; scope broadened to odin-run's full release-tooling breadth. Credential gathering (Slack, Sentry) added. Human-only invocation required because `.env` creation with user-supplied credentials is a credential-or-data-at-rest side effect under the authoring contract.
