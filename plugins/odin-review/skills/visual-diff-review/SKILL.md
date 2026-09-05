---
name: visual-diff-review
description: 'Use when asked to review a diff and produce a 7-section visual page. Not for interactive review walks or PR-specific review: use show-review.'
---

# Visual diff review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Diff review of a branch, commit, range, PR, or working tree against main or master by default |
| Authority | Reversible local: writes only named local artifacts; rollback is undo. No remote mutation. State the rollback path before mutation. |
| Side effect | Writes the 7-section review page to the diagrams directory; opens it |
| Done | Scope, before/after behavior, risk, coupling, and a merge recommendation all cited from evidence |

## Inputs

The diff target must be supplied: a branch name, commit hash or range, PR identifier, or working tree. The comparison base defaults to `main`; supply a named base only when it differs. The source is the live git diff of the named target against the named or default base.

## Procedure

1. **Collect.** Resolve the diff target to the named comparison base. Extract the full diff. **Done when:** the full diff is extracted against the named base.
2. **Scope.** Enumerate every file and component affected. Classify the change surface. **Done when:** every affected file and component is enumerated and classified.
3. **Before/After.** Describe the behavior before and after each hunk. Capture the delta in concrete terms. **Done when:** every hunk has a before/after behavioral description.
4. **Risk.** Assess each risk dimension: correctness, performance, security, and compatibility. Cite evidence from the diff. **Done when:** every risk dimension is assessed with cited evidence.
5. **Coupling.** Identify cross-component dependencies and side-effect surfaces within the diff. **Done when:** every cross-component dependency and side-effect surface is identified.
6. **Merge recommendation.** State merge, defer, or reject with the specific evidence from steps 2–5. **Done when:** a merge recommendation is stated with cited evidence.
7. **Render.** Write the 7-section review page to `diagrams/visual-diff-review.html`. Open it. **Done when:** the page is written and opened, or the path is reported.

## Failure and recovery
- **Unresolvable diff target.** Report the exact name that failed and stop. Do not widen scope.
- **Empty diff.** Report that no changes were found and stop. The done predicate does not hold.
- **Unavailable external reference.** Mark the affected section as `INSUFFICIENT EVIDENCE` and continue. Do not fabricate citations.
- **Filesystem error on write.** Report the error and stop. Roll back any partial file. Do not proceed to open.

Partial results are acceptable only when each incomplete section is explicitly labeled. Silence is not a partial result.

## Output
A self-contained `diagrams/visual-diff-review.html` with seven sections in order: Overview, Before State, After State, Risk Assessment, Coupling Analysis, Merge Recommendation, Evidence Log: every section citing evidence or marked `INSUFFICIENT EVIDENCE`.
