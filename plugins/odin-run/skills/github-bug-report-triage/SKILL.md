---
name: github-bug-report-triage
description: 'Use when evaluating whether a bug issue has sufficient detail and identifying missing information from the reporter. Don''t use for feature requests, questions, non-bug issues, or repo-wide backlog triage — use github-backlog-triage.'
disable-model-invocation: true
---

# GitHub bug report triage

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Evaluating whether a bug issue has sufficient detail and identifying missing information from the reporter. |
| Authority | Human-only. Read the issue and the project bug-report template; draft the determination and any missing-info comment. Preview the comment text and target issue before posting. Do not post, label, close, or otherwise mutate the issue or repository without explicit human action. |
| Side effect | A comment on the GitHub issue requesting missing information, or a confirmation that the issue is actionable. Posting is a remote mutation performed or explicitly authorized by the human; the model never posts autonomously. |
| Done | Ready issues are confirmed actionable; missing-info issues receive specific, constructive feedback listing exactly what is needed. |

## Inputs

A GitHub bug issue (number or URL) in the target repository. Required.

The project bug-report issue template, if one exists. Optional; located by the procedure.

## Procedure

1. Bound scope to a single bug issue. Do not edit, label, close, or post anything until the human authorizes. Done when: scope is bounded to a single bug issue, and no edit, label, close, or post has been made.
2. Read the issue title, body, and existing comments. Done when: the issue title, body, and existing comments are read and recorded.
3. If the issue is a feature request or a question, stop: do not evaluate it as a bug report. Done when: the issue is confirmed to be a bug, or the run stops with a stated classification as feature request or question.
4. Locate the project bug-report template in this order: `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/bug_report.yml`, `.github/ISSUE_TEMPLATE/*.md`, `.github/ISSUE_TEMPLATE.md`, `ISSUE_TEMPLATE.md`. If none exists, evaluate the issue against this bug-report field set: Summary (what is broken), Expected behavior, Actual behavior (including any error messages), Steps to reproduce or a reproduction link / minimal code example, and Environment (OS, runtime, version or commit, install method). Done when: the bug-report template is located at one of the searched paths, or its absence is confirmed and the default field set is applied.
5. Judge actionability against the minimum information needed to investigate, not against every template field being filled: a clear problem description plus a reproduction path (steps, link, or minimal code) or enough context to debug is sufficient. Done when: actionability is judged against the minimum information needed to investigate (problem description plus reproduction path or debug context), and the judgment is recorded with its reasoning.
6. Classify the issue. Ready: clear problem description, a reproduction path or sufficient debug context, and actually a bug. Needs-info: vague description, missing reproduction and no code example, unclear expected behavior, or missing critical context such as an error message. Done when: the issue is classified as Ready or Needs-info, and the classification names the specific evidence or gap that determined it.
7. If Ready, confirm the issue is actionable. If Needs-info, list each specific missing item constructively. Done when: a Ready issue is confirmed actionable, or a Needs-info issue has each specific missing item listed constructively.
8. Draft the comment text. Preview the comment and the target issue to the human. The human posts the comment or applies any label; the model does not post, label, or close autonomously. Done when: the comment text is drafted and previewed to the human with the target issue, and no comment is posted, no label applied, and no issue closed by the model.

## Failure and recovery
- Non-bug issue: stop without evaluation and report that the issue is a feature request or question.
- Issue inaccessible or template unreadable: report the blocker; do not guess fields or invent missing-information requests.
- Ambiguous boundary (enough context to debug but no explicit reproduction): classify as Ready only when the error or context is specific enough to investigate; otherwise Needs-info, and state the reasoning.
- Partial result: never post a partial or placeholder missing-information request. If the determination is uncertain, return Needs-info naming the specific gap rather than asserting Ready.
- Non-mutation: on any failure no comment is posted and no issue state changes.

## Output
A determination of Ready or Needs-info with reasoning, plus a drafted comment. For Needs-info the comment lists each specific missing item. No issue is mutated until the human posts the comment.
