---
name: cut-new-release-candidate
description: 'Use when the user asks to cut, trigger, or start a release candidate for a release branch. Not for full releases, hotfixes, or non-release-candidate workflow dispatches.'
disable-model-invocation: true
---

# Cut new release candidate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to cut, trigger, or start a release candidate for a release branch. |
| Authority | Remote: dispatches the release workflow on the named branch and posts one status notification; requires explicit human invocation. Preview the target and consequence before each remote mutation; mutate only the one workflow dispatch on the branch the user named and the one status notification. |
| Side effect | Runs the configured release workflow on the release branch, obtains its run URL, and posts one status notification. Nothing else changes. |
| Done | The workflow dispatch exits zero, the run query returns a non-null run URL, and the status notification is posted. |

## Inputs

Required from the user:

- The release branch name. Strip a leading `origin/` before validating.
- Optionally, a notification destination (channel, thread, or recipient). Ask before posting if no destination was supplied.

The operator environment must supply these values before any step:

- `INTERNAL_REPO`: the `owner/repo` containing the release branches and workflow.
- `REPO_DIR`: the absolute path to its local checkout.
- `RC_WORKFLOW_NAME`: the release-candidate workflow name. Default: `Cut New Release Candidate`.
- `RELEASE_CHANNELS`: space-separated channel names. Default: `preview stable`.
- `RELEASE_BRANCH_PREFIX`: per-channel branch prefix template, with `{channel}` replaced by each channel name. Default: `{channel}_release/`.
- `NOTIFICATION_TOKEN`: a token for the notification service with write scope. Read it only from the environment; never hardcode or commit it.
- `NOTIFICATION_ENDPOINT`: the API endpoint for posting the status notification.

If `INTERNAL_REPO` or `NOTIFICATION_TOKEN` is unset, stop and ask before running. Required tools: `git`, an authenticated `gh`, `jq`, and `curl`. Run all git and gh operations inside the release repo.

## Procedure

1. Validate the branch at the trust boundary: set the requested branch, strip the `origin/` prefix, and reject any branch that does not start with a configured channel prefix:

   ```bash
   BRANCH_NAME="<release_branch>"
   case "$BRANCH_NAME" in origin/*) BRANCH_NAME="${BRANCH_NAME#origin/}";; esac
   is_release=0
   for ch in $RELEASE_CHANNELS; do
     prefix=$(printf '%s' "$RELEASE_BRANCH_PREFIX" | sed "s|{channel}|$ch|")
     case "$BRANCH_NAME" in
       "$prefix"*) is_release=1; break;;
     esac
   done
   [ "$is_release" = 1 ] || { echo "Not a release branch: $BRANCH_NAME"; exit 1; }
   ```

   Done when: the branch passes the channel-prefix check or the run stops with `Not a release branch`.

2. Preview the mutation: state `INTERNAL_REPO`, `$RC_WORKFLOW_NAME`, `$BRANCH_NAME`, and the consequence, a release-candidate build starts on that branch and one status notification is posted. Proceed only on the user's explicit invocation. Done when: the mutation preview is stated and the user explicitly invokes the run.
3. Enter the repo context: `cd "$REPO_DIR"`. If `REPO_DIR` is unset or the path does not exist, ask the user for the local path to the release repo checkout and `cd` there; stop if none is given. Done when: the working directory is inside the release repo checkout.
4. Confirm the branch exists on origin before dispatching:

   ```bash
   git fetch origin
   git ls-remote --exit-code --heads origin "$BRANCH_NAME" >/dev/null
   ```

   Done when: the branch is confirmed to exist on origin.

5. Dispatch the workflow by name on the branch ref. Record the UTC dispatch timestamp immediately before dispatching; step 6 uses it to tell this dispatch's run from the previous one:

   ```bash
   DISPATCH_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
   gh workflow run "$RC_WORKFLOW_NAME" --repo "$INTERNAL_REPO" --ref "$BRANCH_NAME"
   ```

   Done when: the workflow dispatch exits zero and the dispatch timestamp is recorded.

6. Fetch this dispatch's run and share its `url`, `status`, and `conclusion`; do not watch or wait for completion. A run list taken right after dispatch can still show the previous run, so poll until the newest run's `createdAt` is at or after the dispatch timestamp (ISO-8601 UTC strings compare lexicographically), up to ten tries ten seconds apart:

   ```bash
   RUN_JSON=""
   for i in $(seq 1 10); do
     RUN_JSON=$(gh run list \
       --repo "$INTERNAL_REPO" \
       --workflow "$RC_WORKFLOW_NAME" \
       --branch "$BRANCH_NAME" \
       --limit 1 \
       --json url,status,conclusion,createdAt \
       --jq '.[0] // empty')
     CREATED=$(jq -r '.createdAt // empty' <<<"$RUN_JSON")
     if [ -n "$CREATED" ] && [ ! "$CREATED" \< "$DISPATCH_TS" ]; then
       break
     fi
     RUN_JSON=""
     sleep 10
   done
   RUN_URL=$(jq -r '.url // empty' <<<"$RUN_JSON")
   ```

   Guards: `// empty` keeps an empty run list from printing the literal `null`, which would otherwise pass `-n` and compare greater than any timestamp; the `! ... \<` comparison accepts a run created in the same second as the dispatch. A run whose `createdAt` predates the dispatch timestamp is the previous run, not this one. After the loop, verify `RUN_URL` is non-empty and not `null` before posting anything: an empty or `null` URL means this dispatch's run never appeared, which is the "Dispatched but no run URL" failure below, never a notification. Done when: the URL, `status`, and `conclusion` for this dispatch's run are fetched and shared.

7. Post the status notification carrying the branch name and run URL. Use the destination the user named. If the user gave no destination, stop and ask for one. Send the notification through the configured endpoint:

   ```bash
   if [ -z "$RUN_URL" ] || [ "$RUN_URL" = "null" ]; then
     printf 'Blocked: no run URL for workflow %s on branch %s after dispatch at %s\n' \
       "$RC_WORKFLOW_NAME" "$BRANCH_NAME" "$DISPATCH_TS" >&2
     exit 1
   fi
   JSON=$(jq -n --arg destination "$DESTINATION" --arg wf "$RC_WORKFLOW_NAME" --arg br "$BRANCH_NAME" --arg url "$RUN_URL" '{destination: $destination, text: ("Triggered " + $wf + " for " + $br + ".\nRun: " + $url)}')
   curl -s -X POST "$NOTIFICATION_ENDPOINT" \
     -H "Authorization: Bearer $NOTIFICATION_TOKEN" \
     -H "Content-type: application/json; charset=utf-8" \
     -d "$JSON"
   ```

   Require a success response from the notification API. Done when: the notification post returns success.

## Failure and recovery

- Non-release branch: the prefix check in step 1 exits, stop before any remote call, report `Not a release branch: $BRANCH_NAME`, and ask for a release branch. Nothing was mutated.
- Missing repo context: `REPO_DIR` is unset or missing and the user supplies no checkout path, stop; nothing was mutated.
- Branch absent on origin: `git ls-remote --exit-code` exits non-zero, do not dispatch; report the branch was not found on `origin`, ask the user to confirm the exact branch name, and re-run step 4.
- `gh` authentication failure: the dispatch or run query fails with an auth error, direct the user to `gh auth status` and `gh auth login`, and retry the failed step after they authenticate.
- Dispatched but no run URL: the run query returns nothing or a null `url`, never re-dispatch, because a second dispatch cuts a duplicate release candidate; report the workflow name, branch, and missing URL, and classify blocked for manual inspection.
- Notification post fails: the dispatch and run URL still stand; report the partial result, fix the destination or `NOTIFICATION_TOKEN`, and repost. Done is not claimed until the post succeeds.

Report partial results exactly: name which of dispatch, run URL, and notification post landed. Never swallow an error or claim done while any of the three is missing.

## Output

A report naming the branch, the workflow name, the run URL, the queried `status` and `conclusion` at fetch time (completion is not awaited), the notification destination posted, and the exact message text. Terminal classification: `done` only when the dispatch exited zero, the run URL is non-null, and the notification response was success; otherwise `blocked` with the failing step and the partial state.
