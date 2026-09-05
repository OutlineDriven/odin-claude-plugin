---
name: plan-review
description: 'Use when a plan path or text is supplied for audit against the current codebase, or when tuning which plan-review questions fire. Not for scoring: use plan.'
---

# Plan review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A plan path or plan text supplied for audit against the current codebase, plan-mode enforcement hooks intercepting a plan review, or a request to tune which plan-review questions fire. |
| Authority | Reversible local: writes only the verdict page under `diagrams/` and, in tune mode, the plan-review question-registry and hook configuration under the harness config directory; rollback is version control or restoring the prior files. No remote mutation. |
| Side effect | Writes the verdict page to `diagrams/` and displays the path to it; in tune mode, persists the question-registry and hook configuration. |
| Done | Audit mode: per-item accuracy verdict (correct, stale, risky, unsupported, missing) plus a final approve, revise, or reject decision with rationale. Tune mode: the tuned question flow is persisted, or the dual-track profile and preference map are rendered for an inspect request. |

## Inputs

- Mode: one of `audit` (default) or `tune`. Tune mode fires when plan-mode enforcement hooks intercept a plan review or the user asks to tune, enable, disable, or inspect the plan-review question flow.

Audit mode requires one of:
- A path to a plan file (relative to the workspace root or absolute)
- Plan text provided inline

The plan may be a markdown file, a text file, or a structured document. If a path is supplied, the file must be readable.

Tune mode inputs:
- Tuning request (required): one of (a) a question id plus a preference of `never-ask`, `always-ask`, or `ask-only-for-one-way`; (b) enable or disable question tuning; (c) inspect the current state.
- Question-registry (optional): the persisted per-question preference map; treated as empty if absent.
- Developer profile (optional): the dual-track record of declared preferences versus behavior-suggested preferences; treated as empty if absent.

## Procedure

### Mode audit

1. Receive and bound input. Accept either a plan path or plan text. Record which form was supplied. Do not widen scope beyond the supplied plan. If no plan path or text is supplied, stop and report that no plan was provided. If the path points to a file that cannot be read, stop and report the error. Done when: the input form is recorded and scope is bounded, or a failure terminal is reached.
2. Extract all discrete items from the plan: named changes, file targets, decisions, assumptions, constraints, and action items. Identify items by structural markers (headers, list items, numbered steps, fenced blocks). If fewer than one item can be extracted, stop and report that the plan is empty or unparseable. Done when: every extractable item is extracted, including targetless ones, or the plan is reported empty.
3. Map and audit items. For each item with an explicit target, map it to a codebase file or symbol, read the target, compare the item's described state against the actual content, and classify it: correct (accurately describes current state), stale (codebase diverged), risky (would conflict or break existing code), unsupported (target cannot be verified), or missing (target does not exist). For each targetless item (a decision, assumption, or constraint with no file target), audit it for logical consistency and spec compliance: check that it does not contradict other items or known constraints, and classify it as correct, stale (contradicted by a newer item or external fact), or risky (internally inconsistent or violates a stated constraint). If a target file cannot be read, mark that item unsupported and continue. If no targets can be verified because the entire codebase is unreachable, stop and report a fatal audit error. Done when: every item is classified with supporting evidence.
4. Synthesize the final decision using deterministic, non-overlapping thresholds. The decision is the worst classification present, evaluated in severity order: correct < stale < risky < unsupported < missing. Approve when every item is correct or stale (stale items must carry an acceptable rationale). Revise when at least one item is risky but no item is unsupported or missing. Reject when at least one item is unsupported or missing. Include a rationale sentence naming the decisive item. Done when: the final decision and rationale are synthesized from the classification distribution.
5. Write the verdict page and display its path. Create the `diagrams/` directory if it does not exist. Write `diagrams/plan-review.html` containing the plan title or first line, a table of items with classification and evidence, the final decision and rationale, and a timestamp. If the verdict page cannot be written, stop and report the error. Display the path to the user and present the final decision. Done when: `diagrams/plan-review.html` is written with all required sections and the path is displayed.

### Mode tune

1. Load the question-registry and developer profile from the local harness config directory; treat absent files as empty maps. Done when: the registry and profile are loaded or treated as empty.
2. For an inspect request, render the dual-track profile (declared versus behavior-suggested) and the current per-question preferences, then stop. Done when: the dual-track profile and preference map are rendered.
3. For a per-question preference request, validate that the question id is a member of the plan-review question set and that the preference is one of `never-ask`, `always-ask`, `ask-only-for-one-way`. Reject unknown ids or values before any write. Done when: the question id and preference are validated or rejected.
4. For an enable or disable request, set the question-tuning flag in the hook configuration. Done when: the flag is set in the hook configuration.
5. Persist the registry and hook configuration atomically: write to a temporary file in the config directory, then rename over the target. Leave every field the request did not name unchanged. Done when: the registry and hook configuration are persisted atomically with unnamed fields unchanged.
6. Re-read the persisted files and confirm the persisted state matches the request exactly. Done when: the re-read confirms the persisted state matches the request.

## Failure and recovery

- Unreadable plan: if the plan path points to a file that cannot be read, stop and report the error.
- Empty plan: if fewer than one item can be extracted, stop and report that the plan is empty or unparseable.
- Fatal audit failure: if no targets can be verified because the entire codebase is unreachable, stop and report a fatal audit error. Do not produce a verdict page.
- Write failure: if the verdict page cannot be written to the diagrams directory, stop and report the error. Do not open the file.
- Unreachable target: if a single target file cannot be read, mark that item unsupported and continue. Do not abort the audit for one unreachable target.
- Unknown question id (tune): stop, list the valid plan-review question ids, do not mutate the registry.
- Invalid preference value (tune): stop, list the valid values, do not mutate the registry.
- Concurrent modification between read and persist (tune): re-read, re-apply the requested change, re-persist; if the conflict persists, block and report the conflicting state without guessing.
- Write or rename failure (tune): leave the prior configuration intact, report the error, and do not claim the done predicate holds.
- Rollback: if an unintended file is written, restore it from VCS. The verdict page in `diagrams/` and the tune-mode registry and hook configuration are the only intentional writes.

## Output

Audit mode: a verdict page at `diagrams/plan-review.html` with per-item accuracy verdicts (correct, stale, risky, unsupported, missing), a final decision (approve, revise, reject) determined by non-overlapping severity thresholds, and rationale, written and its path displayed to the user. Tune mode: the persisted question-registry and hook configuration plus a one-line confirmation naming the changed question id or flag and its new value, or, for an inspect request, the rendered dual-track profile and preference map.
