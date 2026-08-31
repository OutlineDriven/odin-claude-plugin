---
name: setup-tool-credentials
description: 'Use when the user asks to gather tool credentials into a non-overwriting .env and verify repository and tool access. Appends validated credentials, never overwrites existing keys, and runs prerequisite checks. Not for publishing, deploying, or removing credentials.'
disable-model-invocation: true
---

# Setup tool credentials

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to set up, configure, or verify credentials and environment for tools they name. |
| Authority | Human-only: explicit invocation required. Preview the target and consequence before credentials, data-at-rest changes, or remote access verification. |
| Side effect | Creates but never overwrites `.env`, gathers non-secret credentials at prompts, validates format, appends safely, and verifies repository and tool access. |
| Done | All selected prerequisites pass, `.env` is present and loadable, and the user is told which workflows are ready. |

## Not for

- Publishing releases, deploying, or removing credentials.

## Inputs

- Required: none. The user initiates and supplies credentials at prompts.
- Gathered at runtime: credentials for the tools the user names. Each is entered at a human-facing prompt. No credential is requested without the user's explicit signal.
- Optional: a specific repository URL or tool version constraint, if the user names one.

## Procedure

1. Confirm which tools the user wants to set up and whether they are working in an existing repository or starting fresh. Done when: the tool set and repository state are confirmed.

2. Identify the target environment. If the user is in a repository, scan for an existing `.env` file. If none exists, create an empty `.env` from scratch. If one exists, do not modify it; report its current keys and ask the user whether to add to it. Done when: `.env` exists or its current state is reported.

3. Present the set of credentials this skill will collect, as named by the user or the tool's documented requirements. For each credential the user supplies, validate basic format: non-empty string, plus any known format rule the tool's convention defines. For example, a Slack bot token starts with `xoxb-` and a Sentry DSN contains `://`. These examples demonstrate the general format-validation mechanism; the skill applies whichever rule the named tool requires. Discard any value that fails format validation and prompt again. Done when: every credential is validated or the user declines.

4. Append each validated credential as a `KEY=VALUE` line to `.env`, one per line. Do not write any other content to `.env`. Do not overwrite existing keys; if a key already exists in `.env`, report the existing value to the user and skip writing that line. Done when: every validated credential is appended or skipped with reason.

5. Verify repository and tool access, then run prerequisite checks. If a repository was supplied or detected: confirm the remote URL is reachable via an authenticated HEAD request or `git ls-remote`; confirm the token in `.env` grants at least read access; report pass or fail without exposing token values. Run prerequisite checks for each selected tool. Stop on the first failure. Report each check's pass or fail result. Done when: repository access is verified or the failure is reported, and every prerequisite passes or the first failure is reported.

6. Confirm `.env` is loadable. Parse it with `dotenv` or equivalent and report the keys found. Done when: `.env` parses and its keys are reported.

7. Summarize. List each selected tool, its prerequisite result, which credentials are present, and name the workflows now ready for the user. Done when: the summary is emitted.

## Failure and recovery

- Credential-format failure: the specific credential is rejected; the prompt repeats. `.env` is not touched for that credential.
- Repository access failure: report which token or URL failed and stop. `.env` is not rolled back; credentials already written remain.
- Prerequisite failure: name the tool and the failing check. Stop. Do not claim the workflow is ready. Do not suggest the failure is minor or temporary.
- Existing `.env` conflict: if a key already exists, report it and skip writing that line. Do not overwrite.
- No rollback rule: once a credential is written to `.env` it is not automatically removed. The user must explicitly request deletion.
- Partial result: if steps 1 through 4 complete but step 5 fails, report exactly what passed and what did not. Do not claim full success.

## Output

A human-readable report naming each selected tool, its prerequisite status, which credentials are present in `.env`, and which workflows are ready. The `.env` file contains the keys the user supplied. No credentials are echoed in the report.
