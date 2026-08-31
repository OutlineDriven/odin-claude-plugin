---
name: issue-triage
description: 'Use when a human invokes triage on a new configured Slack issue report. Don''t use for triaging reports from other channels or posting more than one verdict.'
disable-model-invocation: true
---

# Triage issue reports

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Human invokes this skill on a new configured Slack issue report. |
| Authority | Human-only. Requires explicit human invocation. Preview the target and consequence before any credential use, data-at-rest change, paid action, publishing, or remote mutation. |
| Side effect | Posts at most one Slack thread verdict. Creates at most one tracker issue. |
| Done | Exactly one classified verdict exists in the thread and tracker state is deduped. |

## Inputs

- `slack_report_url` — required. The URL of the new configured Slack issue report to triage.
- `slack_token` — required at runtime. Slack bot token scoped to post thread replies.
- `tracker_token` — optional at runtime. Tracker API token for issue creation. Required only if the triage verdict calls for a tracker issue.
- `tracker_base_url` — required at runtime if `tracker_token` is supplied. The tracker instance base URL.
- `slack_channel_id` — derived from `slack_report_url`. The Slack channel ID containing the report.
- `slack_thread_ts` — derived from `slack_report_url`. The thread timestamp of the report message.

## Procedure

1. **Validate invocation.** Confirm human invoked this skill. Stop if the call is not human-originated. Done when: human origin is confirmed.
2. **Fetch the Slack report.** Retrieve the target Slack message using `slack_report_url`. Validate the channel and thread exist. Stop if the message cannot be fetched. Done when: the report message content is in hand.
3. **Classify the report.** Parse the message content. Apply triage classification to the report content. Accepted verdicts: `ack`, `defer`, `escalate`, `close`, `track`. Produce a single classified verdict. Done when: one verdict from the accepted set is selected.
4. **Check for duplicates.** Query the tracker for any existing issues that reference this Slack report. If a duplicate issue exists and the verdict is `track`, skip creation and mark the existing issue as the target. Done when: the duplicate check is complete and the target issue is identified or confirmed absent.
5. **Post the verdict to Slack.** Post exactly one thread reply containing the classified verdict. Stop on failure. Do not post a second reply. Done when: one Slack reply is posted and its timestamp is captured.
6. **Create tracker issue if warranted.** If the verdict is `track` and no duplicate exists, create exactly one tracker issue linked to the Slack report. Stop on failure. Done when: one tracker issue is created (or skipped as duplicate or not warranted).
7. **Confirm state.** Verify the Slack reply was posted and the tracker state reflects at most one issue per report. Mark done. Done when: the Slack reply exists and the tracker has at most one issue per report.

## Failure and recovery
| Failure class | Rule |
|---|---|
| `not-human-originated` | Stop. No post, no issue. Return error. |
| `report-not-found` | Stop. No post, no issue. Return error. |
| `duplicate-issue` | Skip creation. Use existing issue. Proceed to post verdict. |
| `slack-post-failed` | Stop. No tracker issue. Return error with partial result. |
| `tracker-issue-failed` | Stop. Slack post stands. Return error with partial result. |

Partial-result rule: if Slack post succeeded but tracker issue creation failed, the Slack reply is authoritative. Do not delete or edit the posted reply.

## Output

One JSON object: verdict (ack|defer|escalate|close|track), slack_reply_ts, tracker_issue_url (null when verdict is not track or creation was skipped as duplicate), and is_duplicate.

## Provenance

Origin: `cursor/plugins` at revision `68836ddaf5697224520f1847d90cdb90ca8babaa`.
License: MIT. Source: pstack/automations/benny/skills/triage-issue-reports/SKILL.md and pstack/automations/benny/skills/triage-issue-reports/references/routing.example.md. Authored by Lauren Tan (poteto) under MIT license (pstack/LICENSE blob `6b5400237fdf6545be0b8fae370d6f2fcff8fb25`, 1067 bytes). Adaptation: clean-room rewrite. All expressions restated; no third-party expression copied.
