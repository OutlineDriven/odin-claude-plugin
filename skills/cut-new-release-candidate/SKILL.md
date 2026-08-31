---
name: cut-new-release-candidate
description: 'Use when the user asks to cut, trigger, or start a release candidate for a release branch. Don''t use for full releases, hotfixes, or non-release-candidate workflow dispatches.'
disable-model-invocation: true
---

# Cut new release candidate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to cut, trigger, or start a release candidate for a release branch. |
| Authority | Explicit human invocation only. Preview the target and consequence before each remote mutation; mutate only the one workflow dispatch on the branch the user named and the one Slack update. |
| Side effect | Runs the configured GitHub Actions workflow on the release branch, obtains its run URL, and posts one Slack update. Nothing else changes. |
| Done | The workflow dispatch exits zero, the run query returns a non-null run URL, and the Slack update is posted. |

## Inputs

Required from the user:

- The release branch name. Strip a leading `origin/` before validating.
- Optionally, a Slack channel and an optional thread link. Ask before posting if no destination was supplied.

The operator environment must supply these values before any step:

- `INTERNAL_REPO`: the `owner/repo` containing the release branches and workflow.
- `REPO_DIR`: the absolute path to its local checkout.
- `RC_WORKFLOW_NAME`: default `Cut New Release Candidate`.
- `RELEASE_CHANNELS`: default `preview stable`.
- `RELEASE_BRANCH_PREFIX`: default `{channel}_release/`, with `{channel}` replaced by each channel name.
- `SLACK_BOT_TOKEN`: a bot token with `chat:write`. Read it only from the environment; never hardcode or commit it.

If `INTERNAL_REPO` or `SLACK_BOT_TOKEN` is unset, stop and ask before running. Required tools: `git`, an authenticated `gh`, `jq`, and `curl`. Run all git and gh operations inside the release repo.

## Procedure

1. Validate the branch at the trust boundary — set the requested branch, strip the `origin/` prefix, and reject any branch that does not start with a configured channel prefix:

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

2. Preview the mutation: state `INTERNAL_REPO`, `$RC_WORKFLOW_NAME`, `$BRANCH_NAME`, and the consequence — a release-candidate build starts on that branch and one Slack update is posted. Proceed only on the user's explicit invocation. Done when: the mutation preview is stated and the user explicitly invokes the run.
3. Enter the repo context: `cd "$REPO_DIR"`. If `REPO_DIR` is unset or the path does not exist, ask the user for the local path to the release repo checkout and `cd` there; stop if none is given. Done when: the working directory is inside the release repo checkout.
4. Confirm the branch exists on origin before dispatching:

   ```bash
   git fetch origin
   git ls-remote --exit-code --heads origin "$BRANCH_NAME" >/dev/null
   ```

   Done when: the branch is confirmed to exist on origin.

5. Dispatch the workflow by name on the branch ref:

   ```bash
   gh workflow run "$RC_WORKFLOW_NAME" --repo "$INTERNAL_REPO" --ref "$BRANCH_NAME"
   ```

   Done when: the workflow dispatch exits zero.

6. Fetch the newest run for this workflow on this branch and share its `url`; do not watch or wait for completion:

   ```bash
   gh run list \
     --repo "$INTERNAL_REPO" \
     --workflow "$RC_WORKFLOW_NAME" \
     --branch "$BRANCH_NAME" \
     --limit 1 \
     --json url,status,conclusion,createdAt \
     --jq '.[0]'
   ```

   Done when: the newest run URL is fetched and shared.

7. Post the Slack update carrying the branch name and run URL. Use the channel the user named; for a thread link of the form `https://<workspace>.slack.com/archives/<CHANNEL>/p<TIMESTAMP>`, reply in-thread with `thread_ts` set to the first 10 digits of `<TIMESTAMP>`, a dot, then the remaining 6; if the user gave no destination, stop and ask for the channel and optional thread link. Send:

   ```bash
   curl -s -X POST https://slack.com/api/chat.postMessage \
     -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
     -H "Content-type: application/json; charset=utf-8" \
     -d '{"channel":"<CHANNEL>","thread_ts":"<THREAD_TS>","text":"Triggered *'"$RC_WORKFLOW_NAME"'* for `'"$BRANCH_NAME"'`.\nRun: <RUN_URL>"}'
   ```

   Omit `thread_ts` for a channel-root post. Require `"ok":true` in the response. Done when: the Slack post returns `"ok":true`.

## Failure and recovery
- Non-release branch: the prefix check in step 1 exits — stop before any remote call, report `Not a release branch: $BRANCH_NAME`, and ask for a release branch. Nothing was mutated.
- Missing repo context: `REPO_DIR` is unset or missing and the user supplies no checkout path — stop; nothing was mutated.
- Branch absent on origin: `git ls-remote --exit-code` exits non-zero — do not dispatch; report the branch was not found on `origin`, ask the user to confirm the exact branch name, and re-run step 4.
- `gh` authentication failure: the dispatch or run query fails with an auth error — direct the user to `gh auth status` and `gh auth login`, and retry the failed step after they authenticate.
- Dispatched but no run URL: the run query returns nothing or a null `url` — never re-dispatch, because a second dispatch cuts a duplicate release candidate; report the workflow name, branch, and missing URL, and classify blocked for manual inspection.
- Slack post fails or returns `ok:false` (bad token, missing `chat:write`, unknown channel): the dispatch and run URL still stand; report the partial result, fix the destination or `SLACK_BOT_TOKEN`, and repost. Done is not claimed until the post succeeds.

Report partial results exactly: name which of dispatch, run URL, and Slack post landed. Never swallow an error or claim done while any of the three is missing.

## Output
A report naming the branch, the workflow name, the run URL, the queried `status` and `conclusion` at fetch time (completion is not awaited), the Slack destination posted, and the exact message text. Terminal classification: `done` only when the dispatch exited zero, the run URL is non-null, and the Slack response was `ok:true`; otherwise `blocked` with the failing step and the partial state.

## Provenance

Adapted from `warpdotdev/client-release-agent-oss` — `.warp/skills/cut-new-release-candidate/SKILL.md`, `README.md`, and `.env.example` — at revision `9c1394804c5148820a9bab6c01802fde4330d725`, licensed MIT (`LICENSE`; the copyright and permission notice requirement is met by this attribution). Mechanism-preserving adaptation: environment-driven configuration, channel-prefix validation, origin existence check, named-workflow dispatch on the branch ref, run-URL retrieval without waiting, the follow-up Slack update, the exact message text, and the `gh` auth recovery follow the upstream steps; the upstream hand-off to a peer Slack-reply skill is replaced with a direct Slack Web API `chat.postMessage` call so this skill is self-contained.
