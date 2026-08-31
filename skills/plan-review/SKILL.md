---
name: plan-review
description: 'Use when a plan path or text is supplied. Audits each item against the current codebase and produces an accuracy verdict page. Not for tuning review questions — use plan-review-tune; not for scoring — use planning.'
---

# Visual plan review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A plan path or plan text supplied for audit against the current codebase |
| Authority | reversible-local: write only the verdict page to the diagrams directory; rollback is VCS restore of any unintended side-effect file |
| Side effect | Writes the verdict page to the diagrams directory; opens it |
| Done | Per-change accuracy verdict (correct, stale, risky, unsupported, missing) plus a final approve, revise, or reject decision with rationale |

## Inputs

One of the following must be supplied:
- A path to a plan file (relative to the workspace root or absolute)
- Plan text provided inline

The plan may be a markdown file, a text file, or a structured document. If a path is supplied, the file must be readable.

## Procedure

1. **Receive and bound input.** Accept either a plan path or plan text. Record which form was supplied. Do not widen scope beyond the supplied plan. Done when: the input form is recorded and scope is bounded.
2. **Parse the plan.** Extract every named change, file target, decision, or action item from the plan. If the plan is text, identify discrete items by structural markers (headers, list items, numbered steps, or fenced blocks). Done when: every extractable item is extracted, or the plan is reported empty/unparseable.
3. **Map items to codebase targets.** For each extracted item, identify the file path or symbol it refers to. Normalize paths relative to the workspace root. Skip items that name no target. Done when: each item maps to a normalized target or is skipped as targetless.
4. **Audit each item against the codebase.** For each item with a target, read the target file if it exists, compare the item's described state against the actual content, and classify it: **correct** (accurately describes current state), **stale** (codebase diverged), **risky** (would conflict or break existing code), **unsupported** (target cannot be verified), or **missing** (target does not exist). Done when: every item with a target is classified with supporting evidence.
5. **Record verdicts.** Accumulate the per-item classification and the evidence supporting it. Done when: all verdicts and evidence are accumulated.
6. **Synthesize the final decision.** Based on the distribution of verdicts: **approve** (all verifiable items correct or stale with acceptable rationale), **revise** (at least one stale or risky but no fundamentally incompatible item), or **reject** (at least one risky or unsupported with no reliable decision possible). Include a rationale sentence. Done when: the final decision and rationale are synthesized.
7. **Write the verdict page.** Create the `diagrams/` directory if it does not exist. Write `diagrams/plan-review.html` containing the plan title or first line, a table of items with classification and evidence, the final decision and rationale, and a timestamp. Done when: `diagrams/plan-review.html` is written with all required sections.
8. **Open the verdict page.** Display the path to the user and present the final decision. Done when: the path is displayed and the decision is presented.

## Failure and recovery
**Missing-plan.** If no plan path is supplied and no plan text is given, stop and report that no plan was provided.

**Unreadable-plan.** If the plan path points to a file that cannot be read, stop and report the error.

**Empty-plan.** If fewer than one item can be extracted from the plan, stop and report that the plan is empty or unparseable.

**Unreachable-target.** If a target file cannot be read, mark that item unsupported and continue. Do not abort the audit for one unreachable target.

**Fatal-audit-failure.** If no targets can be verified because the entire codebase is unreachable, stop and report a fatal audit error. Do not produce a verdict page.

**Write-failure.** If the verdict page cannot be written to the diagrams directory, stop and report the error. Do not open the file.

**Partial-result rule:** A verdict page with at least one item classified is considered a partial result. Report the count of unclassifiable items.

**Rollback rule:** If an unintended file is written, restore it from VCS. The verdict page in `diagrams/` is the only intentional write.

## Output
A verdict page at `diagrams/plan-review.html` with per-item accuracy verdicts (correct, stale, risky, unsupported, missing), a final decision (approve, revise, reject), and rationale — opened and displayed to the user.

## Provenance

Origin: nicobailon/visual-explainer (MIT); pinned revision: 7163c3e10660912e0b89e1af465db9f387282b88.

License: MIT.

Adaptation: Audit procedure and verdict taxonomy are rederived from independent clean-room analysis of the codebase. No third-party expression is copied. MIT notice retained per license treatment.
