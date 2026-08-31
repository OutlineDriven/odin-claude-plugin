---
name: plan-review
description: 'Use when a plan path or text is supplied. Audits every item in the plan against the current codebase, including targetless decisions and assumptions, and produces an HTML accuracy verdict page. Not for tuning review questions, use plan-review-tune; not for scoring, use planning.'
---

# Plan review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A plan path or plan text supplied for audit against the current codebase. |
| Authority | Reversible-local: write only the verdict page to the `diagrams/` directory; rollback is VCS restore of any unintended side-effect file. |
| Side effect | Writes the verdict page to `diagrams/` and opens it. |
| Done | Per-item accuracy verdict (correct, stale, risky, unsupported, missing) plus a final approve, revise, or reject decision with rationale. |

## Inputs

One of the following must be supplied:
- A path to a plan file (relative to the workspace root or absolute)
- Plan text provided inline

The plan may be a markdown file, a text file, or a structured document. If a path is supplied, the file must be readable.

## Procedure

1. Receive and bound input. Accept either a plan path or plan text. Record which form was supplied. Do not widen scope beyond the supplied plan. If no plan path or text is supplied, stop and report that no plan was provided. If the path points to a file that cannot be read, stop and report the error. Done when: the input form is recorded and scope is bounded, or a failure terminal is reached.
2. Extract all discrete items from the plan: named changes, file targets, decisions, assumptions, constraints, and action items. Identify items by structural markers (headers, list items, numbered steps, fenced blocks). If fewer than one item can be extracted, stop and report that the plan is empty or unparseable. Done when: every extractable item is extracted, including targetless ones, or the plan is reported empty.
3. Map and audit items. For each item with an explicit target, map it to a codebase file or symbol, read the target, compare the item's described state against the actual content, and classify it: correct (accurately describes current state), stale (codebase diverged), risky (would conflict or break existing code), unsupported (target cannot be verified), or missing (target does not exist). For each targetless item (a decision, assumption, or constraint with no file target), audit it for logical consistency and spec compliance: check that it does not contradict other items or known constraints, and classify it as correct, stale (contradicted by a newer item or external fact), or risky (internally inconsistent or violates a stated constraint). If a target file cannot be read, mark that item unsupported and continue. If no targets can be verified because the entire codebase is unreachable, stop and report a fatal audit error. Done when: every item is classified with supporting evidence.
4. Synthesize the final decision using deterministic, non-overlapping thresholds. The decision is the worst classification present, evaluated in severity order: correct < stale < risky < unsupported < missing. Approve when every item is correct or stale (stale items must carry an acceptable rationale). Revise when at least one item is risky but no item is unsupported or missing. Reject when at least one item is unsupported or missing. Include a rationale sentence naming the decisive item. Done when: the final decision and rationale are synthesized from the classification distribution.
5. Write and open the verdict page. Create the `diagrams/` directory if it does not exist. Write `diagrams/plan-review.html` containing the plan title or first line, a table of items with classification and evidence, the final decision and rationale, and a timestamp. If the verdict page cannot be written, stop and report the error. Display the path to the user and present the final decision. Done when: `diagrams/plan-review.html` is written with all required sections and the path is displayed.

## Failure and recovery

- Unreadable plan: if the plan path points to a file that cannot be read, stop and report the error.
- Empty plan: if fewer than one item can be extracted, stop and report that the plan is empty or unparseable.
- Fatal audit failure: if no targets can be verified because the entire codebase is unreachable, stop and report a fatal audit error. Do not produce a verdict page.
- Write failure: if the verdict page cannot be written to the diagrams directory, stop and report the error. Do not open the file.
- Unreachable target: if a single target file cannot be read, mark that item unsupported and continue. Do not abort the audit for one unreachable target.
- Rollback: if an unintended file is written, restore it from VCS. The verdict page in `diagrams/` is the only intentional write.

## Output
A verdict page at `diagrams/plan-review.html` with per-item accuracy verdicts (correct, stale, risky, unsupported, missing), a final decision (approve, revise, reject) determined by non-overlapping severity thresholds, and rationale, opened and displayed to the user.
