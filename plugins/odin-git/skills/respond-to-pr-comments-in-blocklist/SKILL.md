---
name: respond-to-pr-comments-in-blocklist
description: 'Use when the user explicitly wants to walk PR review comments, collect per-comment decisions, and post approved replies or resolve threads on GitHub. Don''t use for analyzing whether a comment is valid (use resolve) or for non-GitHub review feedback.'
disable-model-invocation: true
---

# Respond to PR comments in blocklist

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User explicitly invokes this skill and intends replies posted or threads resolved on GitHub. |
| Authority | Human-only: every remote mutation requires explicit human approval before the call is issued. The model proposes, filters, walks, and previews; the user approves or edits each reply and the final batch before any `gh api` command runs. |
| Side effect | Remote mutation: posts approved replies and resolves threads on GitHub. No other remote targets. |
| Done | Every posted reply matches an approved draft. Every resolved thread appears in the approval set. Any partial post failure stops and reports. |

## Inputs

Required:
- PR context: PR number, owner, repo.
- Review comments and threads with body, author, URL, path, line, thread ID.
- Current GitHub user identity (used to skip already-answered comments).

Optional:
- Per-comment decision already collected outside this skill.

## Procedure

1. **Fetch PR comments.** If comments are not in session context, call `gh pr view` to confirm the PR, then:

   ```sh
   GH_PAGER="" gh api "repos/{owner}/{repo}/pulls/{pull_number}/comments"
   GH_PAGER="" gh api "repos/{owner}/{repo}/pulls/{pull_number}/comments?per_page=100&direction=asc"
   ```

   Also fetch PR-level comments and review bodies via `gh api` or `gh pr view --comments`. Display all comments before proceeding.

2. **Identify current user.** Run `GH_PAGER="" gh api user --jq .login` to get the GitHub username used for skipping already-answered comments.

3. **Filter actionable comments.** Skip without asking about:
   - Automated PR-level overview/status comments (no attached file location, summarize review status or check progress).
   - Comments where the current GitHub user already replied in the thread. Check `reply_metadata.parent_comment_id` and thread metadata; if the thread is resolved or the latest relevant reply is from the current user, skip the original comment. Keep a short internal list of skipped comment URLs with reason.
   When unsure whether a comment is automated or already answered, keep it in the walkthrough.

4. **Collect response mode.** Use the host's structured single-select user-question tool once before processing individual comments; if the host has no such tool, present the same numbered options in chat and wait for the user's explicit reply:
   - `Respond one-by-one`
   - `Collect all decisions, then address in a batch`
   - `Other...`

5. **Walk through each remaining comment.** For each:
   a. State author, file and line reference (e.g. `src/lib.rs:42` or `src/lib.rs:40-48`), and a concise summary.
   b. Inspect relevant files if the fix is not obvious.
   c. Use the same structured question method with:
      - Apply the recommended fix for this comment.
      - Explain what this comment means before deciding.
      - Acknowledge without making code changes.
      - `Other...` (freeform field for custom response or approach).
   d. If the user selects explain: provide concise context about why the reviewer raised it, then re-ask the same question. Do not skip the decision.
   e. If the user selects a fix option: edit the file, run relevant validation, record the draft reply text and whether to resolve the thread.
   f. If the user selects acknowledge: ask for optional rationale to include in the draft reply.
   In batch mode: defer code edits until after all decisions are collected. Information gathering remains interactive.

6. **Maintain a decision record internally for every comment.** Each record includes comment URL, type (review-thread / PR-level / review-body), disposition (fix / explain-then-fix / acknowledge-without-changes / custom / no-action), planned code change, draft reply body, and whether to resolve the thread.

7. **Draft reply format.** Every draft reply begins with `[ODIN Agent]`. If the approved decision cites an existing commit, include that link. Be concise and concrete.

8. **Apply code fixes.** Follow the selected mode:
   - One-by-one: edit and validate each accepted fix before the next comment.
   - Batch: wait until all decisions are collected, then apply all edits together.
   After all changes: run `git diff`, then run formatting, linting, typechecking, build, or tests appropriate to the changed files. Do not commit unless the user explicitly requests.

9. **Show final preview grouped by comment.** For each: comment URL, action (reply only / resolve only / reply and resolve / no action), and reply body. Use the same structured question method:
    - `Post replies and resolve approved threads`
    - `Edit the draft responses first`
    - `Do not post anything`
    - `Other...`
    If the user chooses to edit: collect edits, update the preview, ask again. Do not post until the user selects the approval option.

10. **Post approved replies via GitHub CLI.** For review-thread comments, write the reply body to a temp file and post via the REST API:

    ```sh
    REPLY_BODY_FILE="$(mktemp)"
    cat > "$REPLY_BODY_FILE"
    REPLY_PAYLOAD_FILE="$(mktemp)"
    python3 - "$REPLY_BODY_FILE" "$REPLY_PAYLOAD_FILE" <<'PY'
    import json
    import sys
    from pathlib import Path
    body_file = Path(sys.argv[1])
    payload_file = Path(sys.argv[2])
    payload_file.write_text(json.dumps({"body": body_file.read_text()}))
    PY
    GH_PAGER="" gh api \
      --method POST \
      /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies \
      --input "$REPLY_PAYLOAD_FILE"
    rm -f "$REPLY_BODY_FILE" "$REPLY_PAYLOAD_FILE"
    ```

    For PR-level or review-body comments that cannot be threaded, post a PR comment and quote the original:

    ```sh
    REPLY_BODY_FILE="$(mktemp)"
    cat > "$REPLY_BODY_FILE"
    GH_PAGER="" gh pr comment {pull_number} --body-file "$REPLY_BODY_FILE"
    rm -f "$REPLY_BODY_FILE"
    ```

    If `reply_metadata.parent_comment_id` is not available, query the thread ID first via GraphQL:

    ```sh
    GH_PAGER="" gh api graphql --paginate \
      -f owner="{owner}" \
      -f repo="{repo}" \
      -F number={pull_number} \
      -f query='
        query($owner: String!, $repo: String!, $number: Int!, $endCursor: String) {
          repository(owner: $owner, name: $repo) {
            pullRequest(number: $number) {
              reviewThreads(first: 100, after: $endCursor) {
                pageInfo { hasNextPage endCursor }
                nodes {
                  id isResolved
                  comments(first: 100) { nodes { databaseId url } }
                }
              }
            }
          }
        }'
    ```

11. **Resolve approved threads via GraphQL.**

    ```sh
    GH_PAGER="" gh api graphql \
      -f threadId="$THREAD_ID" \
      -f query='mutation($threadId: ID!) { resolveReviewThread(input: { threadId: $threadId }) { thread { id isResolved } } }'
    ```

12. **Report failure and stop** if any post or resolve call fails. Do not post partial replies or resolve partial threads. Report what succeeded before the failure.

13. **Summarize.** Report: comments addressed, files changed, validation results, whether changes were committed and pushed, replies posted, threads resolved, anything remaining.

## Failure and recovery
- Missing PR context: report and stop.
- Missing comments: report which comment IDs could not be fetched; stop before posting.
- No actionable comments: report and stop without calling any GitHub mutation.
- Code fix failure: stop before posting any GitHub replies; report what failed.
- Post failure: stop immediately; report what was posted and what failed; do not call resolve for unresolved-approval threads.
- Commit or push failure: stop before posting any GitHub replies; report the failure.
- User rejects final preview: stop; report the rejection.
- Partial-result rule: never post a subset of approved replies. Stop on the first failure.

## Output
A final report listing: comments addressed, disposition per comment, files changed, validation outcome, commit and push status, replies posted with URLs, threads resolved, and any unresolved items requiring manual action.
