---
name: make-pr-easy-to-review
description: 'Use when a human explicitly asks to reshape or annotate one pull request for review. Don''t use for pushing the rewritten branch or mutating any remote.'
disable-model-invocation: true
---

# Make PR easy to review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly invokes this skill to reshape or annotate one pull request for review. |
| Authority | Inspect and annotate the named pull request locally. Rewrite its local branch history only after previewing the exact commits and consequences and receiving explicit human consent for that rewrite. Do not push, publish, alter credentials, or mutate any remote. |
| Side effect | May rewrite only the named local branch history. Preserve a recovery ref and use version control to restore the original history if recovery is needed. |
| Done | The review surface accurately emphasizes risk, the revised commit sequence is coherent, and the final tree identity exactly matches the pre-rewrite intended tree. |

## Inputs

Required: the pull request or local branch, its base ref, and the human's requested review outcome. The branch and base must resolve locally, and the working tree must have no uncommitted changes that could be confused with the pull request. If history rewriting is proposed, explicit consent is required after the rewrite preview; annotation-only work does not require rewrite consent.

## Procedure

1. Resolve the named branch and base ref. Record the branch tip, merge-base, commit range, changed paths, and final tree identifier. Stop if the target is ambiguous, the base is unavailable, or unrelated working-tree changes are present. Done when: the branch tip, merge-base, commit range, changed paths, and tree identifier are all recorded.
2. Read the complete diff and commit sequence. Identify behavioral changes, data or migration effects, security and trust boundaries, concurrency or lifecycle changes, compatibility breaks, and tests or evidence tied to those risks. Do not invent risk or verification evidence. Done when: every risk category is assessed and each identified risk is mapped to its paths and evidence.
3. Draft a review surface that states the pull request's purpose, orders the risky areas first, maps each risk to the relevant paths and available evidence, and calls out unresolved or unverified claims explicitly. Done when: the review surface is drafted with risks ordered first and every claim mapped to evidence or marked unverified.
4. Decide whether annotation alone provides an accurate review surface. If so, return the proposed title, description, review order, and risk notes without changing history. Done when: the annotation-only decision is made and, if yes, the result is returned.
5. If reshaping history would materially improve reviewability, design a commit sequence in which each commit has one coherent purpose, preserves dependency order, and contains the tests or evidence that belong to its change. Preview the exact source commit range, proposed sequence, local branch to be rewritten, recovery ref, and the fact that commit identifiers will change. Done when: the proposed sequence and its preview are complete.
6. Obtain explicit human consent to that exact rewrite. Without consent, make no history change and return the annotation-only result plus the declined rewrite preview. Done when: consent is obtained or the annotation-only result is returned with the declined preview.
7. Create a recovery ref at the original branch tip, then perform only the approved local rewrite. Do not widen the changed-path set or alter the intended final content while splitting, reordering, or combining commits. Done when: the rewrite is performed and the recovery ref exists.
8. Recompute the rewritten branch's final tree identifier and compare it byte-for-byte with the identifier recorded in step 1. Also inspect the rewritten commit range to confirm that its order and messages match the approved sequence. Done when: the tree identifiers match and the commit sequence matches the approved preview.
9. If tree identity differs, stop, restore the original branch tip from the recovery ref, and report the mismatch. If it matches, retain the recovery ref, report the old and new tip identifiers and the identical tree identifier, and return the risk-oriented review surface. Do not push the rewritten branch. Done when: the result is returned with the tree-identity verdict and the review surface.

## Failure and recovery

- Invalid target: if the branch, base, merge-base, or commit range cannot be resolved unambiguously, make no mutation and return `blocked` with the unresolved input.
- Dirty worktree: if unrelated or uncommitted changes could contaminate the operation, make no mutation and return `blocked` with the affected paths.
- Consent absent or changed: if explicit consent does not cover the exact previewed rewrite, do not rewrite history; return the annotation-only result and classify the rewrite as `not-authorized`.
- Rewrite failure: if the rewrite stops partway, restore the original branch tip from the recovery ref. Return `blocked` with the failed operation and recovery state; do not present a partial sequence as complete.
- Tree mismatch: if the post-rewrite tree identifier differs from the recorded tree identifier, restore the original branch tip and return `tree-mismatch` with both identifiers.
- Evidence gap: mark unsupported risk or verification claims as unverified. Never infer that the done predicate holds from a successful command alone.

## Output

Return the proposed pull request title and description, an ordered reviewer path, a risk-to-path-and-evidence table, and a terminal classification. For an approved successful rewrite, also return the original and rewritten tip identifiers, recovery ref, identical pre- and post-rewrite tree identifier, and `ready-local`. For annotation-only work, return `annotated`. For failure, return exactly the applicable `blocked`, `not-authorized`, or `tree-mismatch` result with recovery status.
