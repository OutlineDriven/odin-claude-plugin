---
name: offense
description: 'Use when a change spans multiple files, exceeds roughly 100 lines, adds a feature, or refactors. Produce atomic compilable commits with explicit invariants, fail-fast violations, and no special-case branches. Don''t use for untracked data or changes without a version-control rollback.'
---

# Offense

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A change spans multiple files, exceeds roughly 100 lines, adds a feature, or refactors, and must be implemented invariant-first and fail-fast. |
| Authority | Modify only an exact, disclosed set of repository paths governed by version control; create atomic commits and use version control to recover from an invalid increment. |
| Side effect | Produce atomic compilable commits containing an invariant-first, fail-fast, special-case-eliminating implementation; do not hide incomplete behavior behind a feature flag. |
| Done | Every invariant is named and continuously revalidated, each violation is impossible by construction or fails fast, special-case branches are eliminated, the feature works end to end, and the applicable verifier is green. |

## Inputs

Supply the requested behavior, acceptance criteria, repository state, and permitted path scope. Supply required verification commands when the repository does not define them. An implementation plan or known invariants are optional; derive them from the requested behavior and existing contracts when absent, but do not invent requirements.

## Procedure

1. Translate the requested behavior into explicit invariants and an end-to-end done predicate. Identify each trust boundary and define how invalid input fails immediately or becomes unrepresentable.
2. Inspect the existing implementation and list the exact repository paths that may change. Stop before mutation if the request cannot be completed within that set; do not widen scope implicitly.
3. Partition the work into atomic logical increments. Each increment must preserve the named invariants, compile, and leave applicable existing behavior verifiable.
4. Implement the general case directly. Encode invariants in types or construction where practical; otherwise validate at the boundary and return or raise the repository's explicit error form. Replace branch-by-branch exceptions with the general rule, and do not add a dark feature flag for incomplete behavior.
5. After each increment, run the narrowest applicable compile and behavioral checks that exercise its changed contract. If they pass, commit that one logical change with a descriptive message. Revalidate all named invariants affected by the next increment before continuing.
6. Exercise the completed behavior end to end and run the applicable final verifier. Confirm the changed-path set is exactly the disclosed set and that no special-case branch or uncommitted partial increment remains.

## Failure and recovery
Classify failure as invalid input, invariant violation, verification failure, unavailable verification, scope breach, or non-convergence. On invalid input or an invariant violation, fail before mutation when possible and report the violated invariant. On verification failure, stop; restore only the current atomic increment to the last green commit while preserving earlier green commits. On unavailable verification or a required path outside the disclosed set, make no further changes and return `blocked` with the missing check or exact additional path. If repeated attempts preserve neither the invariants nor the done predicate, return `non-converged` with the last green commit, failed increment, and verifier evidence. Never report success from a partial result or swallow an error.

## Output
Return the ordered atomic commit identifiers, exact changed paths, named invariants and how each is enforced, verification commands with observed results, and the end-to-end outcome. The terminal classification is `complete`, `blocked`, or `non-converged`; `complete` requires the bound done predicate.

## Provenance

Project-owned adaptation of `current:current-b:current:incremental` from `skills/incremental/SKILL.md`. Source revision is unpinned and the source license is project-owned. The adaptation replaces thin-slice and feature-flag guidance with the mandated invariant-first, fail-fast, special-case-eliminating baseline while retaining atomic compilable commits, continuous verification, scoped changes, and version-control recovery.
