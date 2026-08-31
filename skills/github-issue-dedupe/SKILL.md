---
name: github-issue-dedupe
description: 'Use when finding duplicate GitHub issues, checking for similar issues, or setting up duplicate detection. Don''t use for closing, labeling, or modifying any duplicate issue.'
disable-model-invocation: true
---

# GitHub issue dedupe

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Find duplicates, check for similar issues, or set up automated duplicate detection |
| Authority | Human-only. Requires explicit human invocation. Preview the target issue and the comment consequence before posting any remote mutation. No credentials, data-at-rest changes, paid actions, publishing, deployment, remote bulk mutation, or irreversible deletion beyond the single optional comment |
| Side effect | Optionally posts one comment on the target issue listing the duplicates, only at 92%+ confidence. Duplicate issues themselves are never modified, closed, labeled, or deleted |
| Done | A high-confidence duplicates list is returned, or a no-duplicates comment is posted only when certain |

## Inputs

- Target issue reference (owner/repo#number or URL). Required.
- GitHub repository scope to search (owner/repo). Required; defaults to the target issue's repository.
- Search terms, symptom phrases, error messages, or stack traces extracted from the target issue. Required; derived from the target issue title and body when not supplied.
- Optional: additional keyword overrides, labels to filter, or a confidence threshold override (default 92%).

## Procedure

1. Resolve the target issue: read its title, body, labels, and comments with `gh issue view`. Extract symptom phrases, error messages, stack traces, and distinctive keywords. Done when: the stated action, evidence, and guard all hold.
2. Bound the search scope to the named repository. Do not search outside it unless the human explicitly supplies a broader scope. Done when: the stated action, evidence, and guard all hold.
3. Run a multi-strategy search over open and recently closed issues using `gh search issues` and `gh issue list`: Done when: the stated action, evidence, and guard all hold.
   - Keyword and title-similarity search from the extracted terms.
   - Error-message and stack-trace overlap search.
   - Symptom-phrase overlap search using multiple phrasings of the reported problem.
4. For each candidate, compare it against the target issue: title similarity, shared error text, overlapping symptom descriptions, and reproduction steps. Discard the target issue itself. Done when: the stated action, evidence, and guard all hold.
5. Score each remaining candidate for duplicate confidence. A candidate is a high-confidence duplicate only when its core problem, error signature, or reproduction matches the target at 92% or above. Done when: the stated action, evidence, and guard all hold.
6. If no candidate reaches the threshold, return a no-duplicates result. Do not post a comment. Done when: the stated action, evidence, and guard all hold.
7. If one or more candidates reach the threshold, present the duplicates list to the human with the target issue reference, each duplicate's number and title, and the matching evidence. Done when: the stated action, evidence, and guard all hold.
8. Only when the human confirms, post one comment on the target issue listing the high-confidence duplicates. Do not modify, close, label, or delete any duplicate issue. Done when: the stated action, evidence, and guard all hold.

## Failure and recovery
- Ambiguous or partial target issue: stop and report what is missing; do not guess the problem or invent search terms.
- Search returns no candidates: return a no-duplicates result; this is a successful terminal classification, not a failure.
- No candidate reaches 92% confidence: return the sub-threshold candidates as a low-confidence list without posting a comment.
- Comment post fails or is unauthorized: report the error and the unposted comment text; do not retry silently or modify any issue.
- Scope drift: if the search would widen beyond the named repository, stop and ask the human rather than expanding scope.
- Partial results: return whatever candidates were found with their confidence scores; never pretend the done predicate holds when the search is incomplete.

## Output
A duplicates report containing the target issue reference, each high-confidence duplicate's number and title with matching evidence, and confidence scores. When the human confirms and confidence is 92%+, one comment is posted on the target issue listing the duplicates. When no duplicate reaches the threshold, a no-duplicates classification is returned and no comment is posted.

## Provenance

Origin: https://github.com/warpdotdev/oz-skills, revision 6c08c49fc6c51b8f768bf8c53c041bc06a160765. License: MIT (Copyright 2026 Warp). Adapted as a clean-room multi-strategy search-and-compare workflow; no third-party expression is copied.
