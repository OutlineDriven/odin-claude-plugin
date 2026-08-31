---
name: post-daily-new-issues
description: 'Use when a human explicitly requests the daily on-call Sentry issue digest for a configured Slack channel. Don''t use for posting without explicit human authorization for that run.'
disable-model-invocation: true
---

# Post daily new issues

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly requests the daily on-call issue digest; a scheduled invocation may prepare the run but must not use credentials or post without explicit human authorization for that run. |
| Authority | Preview the bounded Sentry query, destination Slack channel, release URL, and posting consequence, then require explicit human authorization before using credentials or making the remote mutation. |
| Side effect | Read only the stated UTC window from the stated Sentry scope and, only when it contains issues, create one Slack message in the configured channel containing the total and at most three issue bullets. |
| Done | If the window contains no issues, make no Slack mutation; otherwise, prove that the configured channel received one message containing the release URL, total issue count, and top three issue counts. |

## Inputs

Require the UTC window start and end, the Sentry organization and project scope, Sentry read credentials, the destination Slack channel, Slack posting credentials, and the release URL. The end must be later than the start, both bounds must include an explicit UTC offset, and the Sentry and Slack credentials must be limited to the stated scopes. An optional human-supplied label may identify the digest; it must not alter the query window or destination. Do not infer a missing bound, scope, channel, credential, or release URL.

## Procedure

1. Before accessing either service, present the UTC window, Sentry organization and project, Slack channel, release URL, and the consequence that a nonempty result creates one remote Slack message. Obtain explicit human authorization for this exact run; if it is absent, stop without using credentials.
2. Validate the time bounds, identifiers, release URL, and credential availability at their input boundaries. Stop on malformed, missing, or broader-than-stated input rather than widening the query or destination.
3. Fetch Sentry issues created in the inclusive-start, exclusive-end UTC window from only the authorized organization and project. Preserve each issue's count and display identity needed for the digest; do not mutate Sentry.
4. If the fetch returns no issues, stop without calling Slack or emitting digest content.
5. Compute the total number of fetched issues, rank them by count from highest to lowest, and retain no more than the first three for issue bullets. Build one message containing the release URL, the total, and each retained issue's display identity and count.
6. Preview the final message and confirm that its channel, URL, total, and issue counts derive from the validated inputs and fetched result. If any value cannot be traced to them, stop without posting.
7. Post the message once to the configured Slack channel. Treat Slack's successful response identifying the created message and channel as proof; do not post a second copy to obtain proof.

## Failure and recovery
Classify invalid or missing inputs and absent human authorization as `blocked-input`; make no remote request. Classify Sentry authentication, authorization, transport, pagination, or response errors as `blocked-fetch`; make no Slack mutation and do not report a partial digest. Classify message construction or provenance failures as `blocked-digest`; make no Slack mutation. Classify a definite Slack rejection as `blocked-post`; retain the prepared message in the result for a human-directed retry, but do not retry automatically. Classify a timeout or lost response after sending as `post-unknown`; do not retry because the first post may have succeeded, and report the channel and attempted message so a human can check for a duplicate before authorizing recovery. A confirmed Slack post has no automatic rollback: do not delete or amend it without a new explicit human request. Never report the done predicate when fetch completeness or posting proof is unavailable.

## Output
For an empty Sentry window, return a silent `no-op` with no Slack message or digest content. For success, return `posted` with the UTC window, Slack channel, created-message identifier, release URL, total issue count, and the three-or-fewer posted issue identities and counts. For failure, return the exact terminal classification `blocked-input`, `blocked-fetch`, `blocked-digest`, `blocked-post`, or `post-unknown` with the failed stage and available non-secret recovery evidence.

## Provenance

Adapted from `warpdotdev/client-release-agent-oss` at revision `9c1394804c5148820a9bab6c01802fde4330d725`, using the daily Sentry fetch and bounded Slack digest mechanism from `.warp/skills/post-daily-new-issues/SKILL.md` and `.warp/skills/post-daily-new-issues/scripts/fetch_new_issues.sh`, with configuration context from `README.md` and `.env.example`. Licensed under MIT; retain the upstream copyright and permission notice with copies or substantial portions of this adaptation.
