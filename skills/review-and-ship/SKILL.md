---
name: review-and-ship
description: 'Use when the user explicitly asks to review changes, verify behavior, and open or update a PR. Not when the task includes merging PRs, force pushes, history rewrites, or deployments — use publish-pr for ship-only and review for review-only.'
disable-model-invocation: true
---

# Review and ship

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Explicit human request to review changes, verify behavior, and open or update a PR |
| Authority | Requires explicit human invocation. Preview the target and consequence before credentials, data-at-rest changes, paid actions, publishing, deployment, remote bulk mutation, or irreversible deletion |
| Side effect | Commits, pushes, and opens or updates PR. Publishes only the reviewed branch by ordinary fast-forward push after explicit human approval; force flags are forbidden |
| Done | Findings, check results, and confirmed PR URL returned |

## Inputs

The repository must be clean or have staged changes, and the working tree must be on the target branch. The human must specify the target branch or confirm the default. GitHub CLI (`gh`) must be authenticated.

## Procedure

1. Confirm HEAD with `git log --oneline -1`, fetch the target remote with `git fetch <remote>`, and confirm `gh` authentication with `gh auth status`. Stop on any failure.
2. Produce `git diff [--cached] [<base>..<HEAD>]` for the full diff and read every changed file.
3. Review the diff: flag logic errors, scope creep, missing tests, and violations of project conventions.
4. Run the local check suite relevant to the changed surface (lint, type-check, unit tests). If a check command is not supplied, infer it from the project tooling (Makefile, package.json scripts, pyproject.toml, Cargo.toml, or equivalent). Stop if any check fails; report the failure with the command and output.
5. Classify the publication: run `git status --porcelain`, `git log --oneline -n 10`, and `git rev-list --left-right --count <remote>/<branch>...HEAD`. Record each commit SHA-1 that will be pushed and classify the branch as ahead-only, behind-only, diverged, or a new-branch publication when `<remote>/<branch>` does not exist.
6. Present findings, check results, planned commits, and the publication classification to the human, and wait for explicit confirmation. If the branch is behind-only or diverged, state that an ordinary push will be refused and that the divergence must be resolved by the human before this skill runs again; do not propose force flags, history rewrite, `git reset`, or branch deletion.
7. After explicit confirmation, publish with `git push <remote> <branch>`. Use no force flag of any kind (`--force`, `-f`, `--force-with-lease`, or a `+<branch>` refspec). If the remote rejects the push, stop and return the verbatim rejection output to the human.
8. Create or update the PR without discarding any command output:
   - Run `gh pr view --json number,state,url`. On a non-zero exit, read the error: a no-PR-for-branch result proceeds to creation; an authentication, permission, or network error stops the skill and is reported.
   - If a PR exists, run `gh pr edit <number> --title '<title>' --body '<composed body>'`.
   - If no PR exists, run `gh pr create --title '<title>' --body '<composed body>'`.
   - Compose `<body>` inline to summarize findings, check results, and planned commits; use no stdin pipe and no `--body-file -` redirection.
9. Extract the PR URL from the `gh` JSON output and return it in the final report.

## Failure and recovery
- **Auth failure**: `gh auth status` or any `gh` call reports an authentication error. Do not push or open a PR. Return the exact error output.
- **Check failure**: A relevant check exits non-zero. Do not push or open a PR. Return the failing command, its output, and the affected files.
- **Non-fast-forward rejection**: The remote refuses `git push`. Keep the rejection output verbatim in the report. Never retry with a force flag; never `git reset`, rebase, or delete the branch to clear the error. Stop and return the state to the human.
- **Remote unavailable**: `git push` fails with a connection error. Return the error. Do not retry silently.
- **No PR URL**: `gh pr create` or `gh pr edit` returns no URL. Surface the remote URL and the branch name as the best available record, labeled blocked.
- **Evidence preservation**: Keep verbatim stdout and stderr of every failed command in the report. Never silence, truncate, or discard command output, and never delete logs, diffs, or failure artifacts as cleanup.
- **Partial result**: If steps 1–6 succeed but step 7 or 8 fails, do not report success. Return the findings and check results collected so far and mark the PR step as blocked.

## Output
A report with sections in order: Review findings, Check results, Planned commits, Publication, PR. Each section carries its own pass-or-blocked status; a blocked section names the reason.
