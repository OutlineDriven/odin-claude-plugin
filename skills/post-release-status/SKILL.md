---
name: post-release-status
description: 'Use when a user explicitly asks to post, update, or check cherry-pick status for a release as a Slack Block Kit status board. Not for mutating pull requests or posting to multiple Slack messages.'
disable-model-invocation: true
---

# Post release status

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user explicitly asks to post, update, or check cherry-pick status for a release. |
| Authority | Human-only remote mutation. Preview the Slack destination, release, message action, and consequence before accessing credentials or writing to Slack; proceed only under the explicit request. |
| Side effect | List pull requests for the named release and create or update exactly one Slack Block Kit status board. Do not mutate pull requests or any other Slack message. |
| Done | The resulting Slack message has a permalink, accurately reflects the current pull-request state, and retains every manually verified status. |

## Inputs

Required inputs are the release identifier, the repository or pull-request source to inspect, and the Slack destination. The Slack integration must provide read access to pull-request state and permission to post or update a message in that destination. An existing status-board message permalink or timestamp is required for an update and omitted for a new post. A supplied set of manually verified statuses is optional; when present, each entry must identify its pull request and verified status unambiguously.

## Procedure

1. Confirm that the request explicitly authorizes this release-status operation. Resolve the release, repository, Slack workspace and channel, and whether the single intended write is a new message or an update to the identified message. Done when: the release, repository, destination, and create-or-update action are resolved.
2. Validate identifiers at their boundaries. Reject an ambiguous release, repository, destination, message identifier, or manually verified entry rather than guessing. Do not print, persist, or transmit credentials outside the integrations needed for the requested reads and Slack write. Done when: all identifiers are validated or rejected at their boundaries.
3. Before accessing credentials or writing remotely, present a preview naming the release, repository, Slack destination, create-or-update action, existing message when applicable, and the fact that one Slack message will change. Stop if the requested target or consequence cannot be determined from the supplied inputs. Done when: the preview is presented and the target and consequence are confirmed.
4. List the pull requests associated with the release and obtain their current state from the pull-request source. For each pull request, derive its current cherry-pick status only from observed state; mark unavailable or indeterminate evidence as such instead of inferring success. Done when: all pull requests for the release are listed with state derived from observed evidence.
5. Merge observed state with manually verified statuses by pull-request identity. A manually verified status is authoritative for its entry and must survive refreshes unchanged; automated observations may update only fields that are not manually verified. Done when: observed state and manually verified statuses are merged with verified entries preserved.
6. Build one Slack Block Kit status board that identifies the release and represents every listed pull request, its current status, and which statuses are manually verified. Ensure the rendered content is based on the merged data from the same run. Done when: the status board is built from merged data identifying the release and every pull request.
7. Recheck that the previewed destination and action still match the intended write, then either post one new status-board message or update only the identified existing status-board message. Never create a second message while performing an update. Done when: one new message is posted or the identified message is updated, with no second message created.
8. Obtain the resulting message permalink and compare the posted or updated board with the merged status data. Report success only when the permalink resolves to the intended message, all current pull-request states are represented accurately, and all manually verified statuses remain intact. Done when: the permalink resolves to the intended message with all states accurate and verified statuses intact.

## Failure and recovery
- **Invalid or ambiguous input:** perform no Slack write and return `blocked` with the unresolved release, repository, destination, message, or verified-status identity.
- **Pull-request read failure or incomplete evidence:** perform no Slack write and return `blocked` with the pull requests or fields that could not be established.
- **Preview mismatch:** perform no Slack write and return `blocked` with the expected and resolved targets.
- **Slack create or update failure:** do not attempt a different channel, message, or additional post. Return `blocked` with whether no write was observed or the remote result is unknown.
- **Post-write verification failure:** do not claim completion or overwrite manually verified data in a repair attempt. Return `blocked` with the message identifier if available, the observed partial result, and the fields that failed verification so a human can inspect or reverse the single Slack message.
- **Permalink retrieval failure:** treat the operation as incomplete even if a write may have occurred; return `blocked` with the message identifier and remote state known from the integration.

## Output
The release and repository, create-or-update action, Slack destination, resulting message permalink on success, and a concise count of listed pull requests and preserved manually verified statuses — terminal classification `complete` only when the done predicate is verified, otherwise `blocked` with the failure class, partial-result state, and exact unresolved evidence.
