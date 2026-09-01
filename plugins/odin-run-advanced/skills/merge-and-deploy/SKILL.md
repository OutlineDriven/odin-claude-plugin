---
name: merge-and-deploy
description: 'Use when a human runs /merge-and-deploy to merge a PR and trigger or verify deployment. Don''t use for tasks that require source changes or without explicit human confirmation at each gate.'
disable-model-invocation: true
---

# Merge and deploy

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /merge-and-deploy |
| Authority | Human only. PR merge and deployment are irreversible remote effects. Every merge, deploy trigger, and revert requires explicit human confirmation at a named gate. The model never auto-merges, auto-deploys, or auto-reverts without a confirmed decision. |
| Side effect | Merges the PR into the base branch, deletes the feature branch, and triggers or verifies the deployment path. A revert creates a new commit on the base branch. |
| Done | Changes are landed and deployment is initiated or verified, reported in a final report |

## Inputs

- A PR on the current branch (auto-detected), or a PR number given as `#NNN`.
- Optional: a production URL for post-deploy canary verification.
- Optional: a staging URL or staging workflow for staging-first verification.
- The GitHub CLI (`gh`) must be authenticated.
- The project test command (read from project config, default `bun test`).

## Procedure

1. Pre-flight. Verify `gh auth status` succeeds; if not, stop and tell the user to run `gh auth login`. Detect the PR: if a `#NNN` argument was given, use it; otherwise run `gh pr view --json number,state,title,url,mergeStateStatus,mergeable,baseRefName,headRefName`. If no PR exists, stop. If `state` is `MERGED` or `CLOSED`, stop and report. If `OPEN`, continue. Record the base branch from `baseRefName`. Done when: `gh auth status` succeeds and one OPEN PR is recorded with its number, base branch, and head branch, or a stop condition is reported with the specific failure.

2. First-run dry-run validation. If this project has no record of a prior confirmed deploy, run a dry run before any irreversible action. Detect deploy infrastructure: check for persisted deploy configuration in the project (conventionally a `## Deploy Configuration` section in `CLAUDE.md`); auto-detect platform from config files (`fly.toml`, `render.yaml`, `vercel.json` or `.vercel/`, `netlify.toml`, `Procfile`, `railway.json` or `railway.toml`); detect deploy workflows under `.github/workflows/` whose name or content matches `deploy`, `release`, `production`, or `cd`. Validate each detected command: platform CLI status, production URL reachability via `curl -sf <url> -o /dev/null -w "%{http_code}"`. Detect staging environments (staging URL in config, staging workflow in `.github/workflows/`). If any validation fails, stop and report the failing component. Done when: every detected deploy path is validated (CLI present, URL reachable, workflow exists) or a failing component is named and the stop is reported, or the project has a prior confirmed deploy and this step is skipped.

3. Pre-merge checks. Run `gh pr checks --json name,state,status,conclusion`. If any required check is failing, stop. If required checks are pending, proceed to step 4. If all checks pass, skip to step 5. Check `gh pr view --json mergeable -q .mergeable`; if `CONFLICTING`, stop and tell the user to resolve conflicts and re-run. Done when: the check state is classified as all-passing (skip to step 5), pending (proceed to step 4), or failing/conflicting (stop with the specific check or conflict named).

4. Wait for CI. If required checks are pending, poll with `gh pr checks --watch --fail-fast` up to 15 minutes. If CI fails, stop. If timeout, stop. Record the CI wait duration. Done when: all required checks reach a terminal conclusion (pass or fail) and the outcome is recorded, or the 15-minute timeout fired and the stop is reported.

5. Readiness gate. This is the last check before an irreversible merge. Gather evidence for each:
   - Review staleness: Query `gh pr view --json reviews`. Find the most recent review and its commit. Compare against current HEAD with `git rev-list --count <review_commit>..HEAD`. 0 commits since review → CURRENT; 1-3 → RECENT; 4+ → STALE. If the rev-list fails (the stored commit was rebased away), treat as STALE. If review is STALE or not run, offer an inline quick review of the diff before proceeding.
   - Test results: Run the project test command. If tests fail, this is a blocker — stop.
   - PR body accuracy: Read the PR body with `gh pr view --json body`. Compare against `git log --oneline <base>..HEAD`. Flag missing features, stale descriptions, or version mismatches as warnings.
   - Documentation check: Check whether `CHANGELOG.md` and `VERSION` were modified on this branch with `git diff --name-only <base>...HEAD -- CHANGELOG.md VERSION`. If new features are present but docs were not updated, warn.
   Build a readiness report listing reviews, tests, documentation, and PR body accuracy with warnings and blockers counted. Present it to the user and require explicit confirmation: merge, hold to fix warnings, or merge anyway understanding the risks. If the user chooses to hold, stop with specific next steps. Only proceed to merge on explicit confirmation. Done when: the readiness report is presented with warnings and blockers counted, and the user has explicitly chosen merge, hold, or merge-with-risk, or a blocker stopped the process.

6. Merge the PR. Record the start timestamp. Try auto-merge first: `gh pr merge --squash --auto --delete-branch`. If `--auto` succeeds, record `MERGE_PATH=auto`. If `--auto` fails (auto-merge disabled for the repo, or the PR is already mergeable with no pending required checks), fall through to direct merge: `gh pr merge --squash --delete-branch`. If direct merge succeeds, record `MERGE_PATH=direct`. If the merge fails with a permission error, stop.
   After any non-zero exit from `gh pr merge`, never retry the merge. Query authoritative PR state: `gh pr view --json state,mergeCommit,mergedAt,mergedBy`. If `state` is `MERGED`, the server-side merge succeeded (possibly a concurrent merge) — capture the merge SHA from `mergeCommit.oid` and continue. Do not require the PR head SHA to be an ancestor of the base branch, since squash merges create a new commit. If `state` is `OPEN`, check `autoMergeRequest`: if non-null, a merge queue is in use; if null, surface both the merge stderr and the open state, then stop. If `state` is `CLOSED`, stop.
   Merge queue: if `MERGE_PATH=auto` and the PR does not immediately become `MERGED`, poll `gh pr view --json state -q .state` every 30 seconds up to 30 minutes. If merged, capture the merge SHA. If the PR returns to `OPEN` (removed from queue), stop. If timeout, stop.
   CI auto-deploy detection: after the merge, check whether a deploy workflow was triggered by the merge commit: `gh run list --branch <base> --limit 5 --json name,status,workflowName,headSha`. Match runs to the merge commit SHA.
   Done when: the PR state is `MERGED` and the merge SHA is captured, or a stop condition is reported with the specific error and the PR state at failure.

7. Detect deploy strategy. Check for persisted deploy config in the project; if found, use it directly. Otherwise auto-detect platform from config files and deploy workflows as in step 2. Classify the diff scope: run `git diff --name-only <base>...HEAD` and categorize changes as frontend, backend, config, or docs. If the only scope is docs, skip verification entirely — report and finish. If no deploy workflow and no URL were detected, ask the user whether this is a web app (provide a URL) or a library/CLI (nothing to verify). If staging was detected and the changes include code, offer staging-first verification: verify on staging, then proceed to production. Done when: the deploy strategy is classified as docs-only (finish), web-app with URL, library/CLI with nothing to verify, or staging-first, and the classification is recorded for step 8.

8. Wait for deploy. If a GitHub Actions deploy workflow was detected, find the run matching the merge commit SHA with `gh run list --branch <base> --limit 10 --json databaseId,headSha,status,conclusion,name,workflowName` and poll `gh run view <run-id> --json status,conclusion` every 30 seconds. For platform CLI deploys (Fly.io, Render, Heroku), poll the platform status command or the production URL with `curl -sf <url> -o /dev/null -w "%{http_code}"`. For auto-deploy platforms (Vercel, Netlify), wait 60 seconds then proceed to canary. Record deploy duration. If the deploy fails, offer: investigate logs, revert the merge, or continue to health checks. If timeout (20 min), warn and ask whether to continue. Done when: the deploy run or platform command reaches a terminal state (success or failure) and the duration is recorded, or the 20-minute timeout fired and the user chose to continue or stop.

9. Canary verification. If a production URL is available, verify deploy health. Run `curl -sf <url> -o /dev/null -w "%{http_code}"` and confirm 200 status. Check that the page has real content (not blank or an error page). Check that load time is under 10 seconds. If all pass, mark HEALTHY. If any fail, present the evidence and offer: mark as warming up, revert the merge, or investigate further. Done when: the production URL returns 200 with real content under 10 seconds and is marked HEALTHY, or a failure is presented with the specific failing check and the user chose an action.

10. Revert (if requested). If the user chooses to revert at any failure point: `git fetch origin <base>`, `git checkout <base>`, `git revert <merge-sha> --no-edit`, `git push origin <base>`. If the base branch has push protections, create a revert PR with `gh pr create --title 'revert: <original PR title>'` instead. If the revert has conflicts, tell the user the merge commit SHA and stop. Note the revert commit SHA. Done when: the revert commit is pushed or the revert PR is created, and the revert SHA is recorded, or a conflict stopped the process and the merge SHA is reported.

11. Deploy report. Produce a final report: PR number and title, branch flow, merge timestamp and method, merge path (auto/direct/queue), merge SHA, timing for each stage (CI wait, queue, deploy, staging, canary, total), review status, CI status, deploy status, staging status, verification verdict and scope, and a final VERDICT: DEPLOYED AND VERIFIED, DEPLOYED (UNVERIFIED), STAGING VERIFIED, or REVERTED. Display it to the user and save it. Done when: the report contains every stage's timing and status and a terminal VERDICT, and it is displayed and saved to disk.

## Failure and recovery

- CI failing: stop; do not merge code that has not passed CI.
- Merge conflicts: stop; tell the user to resolve and re-run.
- Merge command non-zero exit: never retry `gh pr merge`. Query `gh pr view --json state` and act on authoritative server state. A concurrent merge may have succeeded — report `state == MERGED` as "PR is merged on GitHub," not "the merge succeeded."
- Merge queue timeout (30 min): stop; tell the user to check the merge queue page.
- Deploy workflow failure: the code is merged but may not be live. Offer investigate, revert, or continue to health checks. Never silently proceed.
- Canary health failure: present evidence and offer revert. Never silently mark unhealthy as healthy.
- Permission denied on merge: stop; tell the user a maintainer is needed or branch protection rules must be checked.
- Partial result rule: if any stage fails after the merge, the merge is already landed — report the partial state explicitly (merged but deploy unverified, or merged and reverted) rather than claiming the done predicate holds.
- Rollback: revert creates a new commit undoing the merge; the previous version restores once the revert deploys.

## Output

A final deploy report with PR details, merge metadata, per-stage timing, review/CI/deploy/verification status, and a terminal VERDICT. The report is displayed to the user and saved to a deploy-reports directory.
