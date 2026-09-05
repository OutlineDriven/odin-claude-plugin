---
name: post-release-status
description: 'Use when a user asks to post, update, or check cherry-pick status for a release as a single Slack Block Kit board. Not for mutating pull requests or posting to multiple messages.'
disable-model-invocation: true
---

# Post release status

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user explicitly asks to post, update, or check cherry-pick status for a release. |
| Authority | Remote: posts or updates exactly one Slack message; requires explicit human invocation. Read-only against the PR source; one post or one update, never both in the same run. |
| Side effect | Lists pull requests for the named release and creates or updates exactly one Slack Block Kit status board. Does not mutate pull requests or any other Slack message. |
| Done | The resulting Slack message has a permalink, accurately reflects the current pull-request state with manually verified statuses preserved, and the permalink resolves to the intended message. |

## Inputs

- Release identifier (required): the release name, tag, or version that groups the tracked PRs.
- PR-source read credentials (required): independent credentials granting read access to the pull-request source. These are separate from Slack credentials.
- Slack write credentials (required): integration credentials with permission to post or update a message in the target destination.
- Slack destination (required): the workspace and channel where the status board lives.
- Manual status overrides (optional): a set of manually verified statuses. Each entry must identify its pull request and verified status unambiguously.
- **Existing message permalink or timestamp** (required for update, omitted for new post): identifies the message to update.

## Procedure

1. Resolve identifiers and request a preview. Resolve the release, repository or PR source, Slack workspace and channel, and whether the single intended write is a new message or an update to the identified message. Validate each identifier at its boundary: reject an ambiguous release, repository, destination, message identifier, or manually verified entry rather than guessing. Confirm that PR-source read credentials and Slack write credentials are both present and independent. Present a preview naming the release, repository, Slack destination, create-or-update action, and the fact that one Slack message will change. Stop if the requested target or consequence cannot be determined. Done when: all identifiers are resolved and the preview is confirmed.
2. List PRs matching the release using defined mapping logic. A pull request belongs to the release when its labels, milestone, base branch, or cherry-pick source-PR reference matches the release identifier. Query the PR source with the read credentials. For each matching PR, collect its number, title, merge state, and any cherry-pick evidence (target branch, cherry-pick PR status, or backport label). Done when: all PRs belonging to the release are listed with their observed state.
3. Map PR states to defined cherry-pick statuses based on observed evidence. The cherry-pick statuses are: `cherry-picked` (evidence shows the change landed on the release branch), `pending` (cherry-pick PR is open or queued), `not-needed` (the PR does not require a cherry-pick for this release), `blocked` (evidence is missing or contradictory), and `unknown` (no evidence available). Derive each status only from observed state. Mark unavailable or indeterminate evidence as `blocked` or `unknown` rather than inferring success. Done when: every listed PR has a cherry-pick status derived from observed evidence.
4. Merge observed states with manual overrides. A manually verified status is authoritative for its entry and survives refreshes unchanged. Automated observations may update only fields that are not manually verified. Done when: observed state and manual overrides are merged with verified entries preserved.
5. Post or update exactly one Slack message and verify the permalink. Recheck that the previewed destination and action still match. Build one Slack Block Kit status board identifying the release and representing every PR with its current status and verification flag. Either post one new message or update only the identified existing message. Never create a second message during an update. Obtain the resulting message permalink and compare the posted board with the merged data. Done when: one message is posted or updated, the permalink resolves to the intended message, all current PR states are represented accurately, and manually verified statuses remain intact.

## Failure and recovery

- Invalid or ambiguous identifiers: abort before any read. Perform no Slack write. Return `blocked` with the unresolved release, repository, destination, message, or verified-status identity.
- Missing PR-source read credentials or permissions: abort before any read. Perform no Slack write. Return `blocked` naming the missing credential. Do not conflate Slack write permission with PR-source read permission.
- Missing Slack write credentials or permissions: abort before any Slack write. Return `blocked` naming the missing credential.
- Missing PR read evidence: return `blocked` without updating Slack. Name the pull requests or fields that could not be established.
- Slack create or update failure: do not attempt a different channel, message, or additional post. Return `blocked` with whether no write was observed or the remote result is unknown.
- Post-write verification failure: do not claim completion or overwrite manually verified data. Return `blocked` with the message identifier, observed partial result, and fields that failed verification.
- Permalink retrieval failure: treat the operation as incomplete even if a write may have occurred. Return `blocked` with the message identifier and known remote state.

## Output

The release and repository, create-or-update action, Slack destination, resulting message permalink on success, and a concise count of listed PRs and preserved manually verified statuses. Terminal classification `complete` only when the done predicate is verified. Otherwise `blocked` with the failure class, partial-result state, and exact unresolved evidence.
