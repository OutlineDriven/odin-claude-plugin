---
name: github-issue-dedupe
description: 'Use when finding duplicate GitHub issues or checking for similar issues against a target issue. Runs a multi-strategy search and returns a duplicates classification. Don''t use for closing, labeling, or modifying any duplicate issue.'
disable-model-invocation: true
---

# GitHub issue dedupe

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Find duplicates or check for similar issues against a target GitHub issue. |
| Authority | Human-only. Requires explicit human invocation. Preview the target issue and the comment consequence before posting any remote mutation. No credentials, data-at-rest changes, paid actions, publishing, deployment, remote bulk mutation, or irreversible deletion beyond the single optional comment. |
| Side effect | Optionally posts one comment on the target issue listing the duplicates, only when the human confirms. Duplicate issues themselves are never modified, closed, labeled, or deleted. |
| Done | A duplicates classification is returned: a high-confidence duplicates list, or a no-duplicates classification for negative results. |

## Inputs

- Target issue reference (owner/repo#number or URL). Required.
- GitHub repository scope to search (owner/repo). Required; defaults to the target issue's repository.
- Search terms, symptom phrases, error messages, or stack traces extracted from the target issue. Required; derived from the target issue title and body when not supplied.
- Optional: additional keyword overrides, labels to filter.

## Procedure

1. Resolve the target issue: read its title, body, labels, and comments with `gh issue view`. Extract symptom phrases, error messages, stack traces, and distinctive keywords. Done when: the target issue is resolved and its search terms are extracted.
2. Bound the search scope to the named repository. Do not search outside it unless the human explicitly supplies a broader scope. Done when: the search scope is bounded to the named repository.
3. Run a multi-strategy search over open and recently closed issues using `gh search issues` and `gh issue list`:
   - Keyword and title-similarity search from the extracted terms.
   - Error-message and stack-trace overlap search.
   - Symptom-phrase overlap search using multiple phrasings of the reported problem.
   Done when: all three search strategies have been run or recorded as non-runnable.
4. For each candidate, compare it against the target issue across these dimensions: title similarity, shared error text, overlapping symptom descriptions, and matching reproduction steps. Discard the target issue itself. Done when: every candidate is compared across all four dimensions.
5. Classify each remaining candidate as a duplicate or not. A candidate is a high-confidence duplicate only when 2 or more dimensions match the target issue. Done when: every candidate has a duplicate classification with the matching dimensions named.
6. If no candidate has 2 or more matching dimensions, return a no-duplicates classification. Do not post a comment. Done when: the no-duplicates classification is returned.
7. If one or more candidates qualify, present the duplicates list to the human with the target issue reference, each duplicate's number and title, and the matching dimensions. Done when: the duplicates list is presented to the human.
8. Only when the human confirms, post one comment on the target issue listing the high-confidence duplicates. Do not modify, close, label, or delete any duplicate issue. Done when: the comment is posted or the human declines.

## Failure and recovery

- Ambiguous or partial target issue: stop and report what is missing; do not guess the problem or invent search terms.
- Search returns no candidates: return a no-duplicates classification; this is a successful terminal, not a failure.
- No candidate has 2 or more matching dimensions: return a no-duplicates classification and no comment is posted.
- Comment post fails or is unauthorized: report the error and the unposted comment text; do not retry silently or modify any issue.
- Scope drift: if the search would widen beyond the named repository, stop and ask the human rather than expanding scope.
- Partial results: return whatever candidates were found with their matching dimensions; never pretend the done predicate holds when the search is incomplete.

## Output

A duplicates report containing the target issue reference, each high-confidence duplicate's number and title with the matching dimensions named. When the human confirms, one comment is posted on the target issue listing the duplicates. When no duplicate has 2 or more matching dimensions, a no-duplicates classification is returned and no comment is posted.
