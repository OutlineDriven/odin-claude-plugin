---
name: implement-spec
description: 'Use when a ticket DAG from a complete specification needs parallel execution into a green draft PR. A single approved feature is the degenerate one-ticket DAG. Not for a single settled ticket with no spec — use work; not for ticket decomposition — use to-tickets.'
disable-model-invocation: true
---

# Implement spec

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A ticket DAG from a complete specification needs parallel execution. |
| Authority | Run only on explicit human invocation. Before using credentials, publishing commits or a pull request, mutating remote state, or deleting cleanup targets, preview the exact target and consequence and obtain explicit human approval for that action. |
| Side effect | Create implementation commits in isolated worktrees, integrate them on the named branch, publish the approved branch and draft pull request, and remove only the previewed temporary worktrees and branches. |
| Done | Every ticket is complete, the dependency frontier is empty, required checks pass, review has no unresolved actionable finding, and the green draft pull request exists. |

## Inputs

- Required: the complete specification; a finite ticket DAG with stable ticket identifiers, dependencies, acceptance criteria, and owned file scopes; the repository and integration base; the required check commands; the review-clear criterion; and the remote repository, target branch, and draft pull-request destination.
- Approval: the human must supply publication and cleanup approval when prompted. Credentials may be used only after that approval.
- Optional: ticket-specific verification commands and a pull-request title or body.

## Procedure

1. Validate that every ticket traces to the specification, has measurable acceptance criteria and a unique owned file scope, and references only existing ticket identifiers; reject cycles, missing dependencies, overlapping ownership, an unclean or wrong repository, and an ambiguous publication target without mutation.
2. Record the bounded execution set, integration base, initial ready frontier, required checks, review-clear criterion, and cleanup targets. Do not add work outside this set or invent missing evidence.
3. Create one isolated worktree and branch per ready ticket. Give each worker only its ticket, the exact specification sections and repository paths needed to execute it, its acceptance criteria, dependencies, owned files, and verification command; use artifact paths or commit identifiers for results instead of copying unrelated context.
4. Execute independent ready tickets in parallel. Each worker may change only its owned files, must run its ticket verification, and must return the commit identifier, changed paths, verification result, and any blocker. A ticket without a passing acceptance proof remains incomplete.
5. Integrate completed ticket commits onto the named integration branch in dependency order. Resolve a conflict only when the specification and ownership make the intended result unambiguous; otherwise stop the affected path as blocked. After each integration, mark the ticket complete and release newly ready tickets whose dependencies are all complete.
6. Continue frontier execution until every ticket is integrated or no incomplete ticket is ready. If the frontier is empty while tickets remain, return `blocked` with the unmet dependency or failed-ticket evidence; do not bypass the DAG.
7. Run all required checks on the integrated branch. Review the full integrated change against the specification, ticket acceptance criteria, ownership boundaries, and repository safety. Turn each actionable finding into a bounded correction on the owning ticket branch, verify it, reintegrate it, and repeat checks and review until clear. Return `non-converged` if a finding repeats without progress, checks are unavailable, or correction would widen the bounded scope.
8. Preview the integration branch, commits, remote, target branch, draft pull-request title and body, and publication consequences. After explicit human approval, use the approved credentials to publish the branch and create the draft pull request; verify the remote pull request points to the reviewed commit and reports the required checks as passing.
9. Preview the exact temporary worktrees and branches eligible for cleanup. After explicit human approval, remove only those whose commits are reachable from the published integration branch. Preserve any target containing unintegrated or uncommitted work and report it instead of deleting it.

## Failure and recovery

- `invalid-input`: the specification, DAG, ownership, repository, commands, or destination cannot be validated. Make no mutation.
- `ticket-failed`: preserve the ticket worktree and commit evidence; block its dependents.
- `integration-conflict`: preserve both commits and the integration branch at the last verified state.
- `check-failed` or `review-blocked`: permit only bounded correction through the owning ticket. Return `non-converged` when checks are unavailable, an equivalent failure repeats, results oscillate, or correction requires wider scope.
- `publication-failed`: preserve the verified local branch and report the attempted remote operation without claiming that a pull request exists.
- `cleanup-blocked`: preserve every uncertain target.

For any partial result, report completed tickets, the remaining frontier, commits, checks, findings, remote state, and retained worktrees. Never discard unintegrated work, swallow an error, or claim the done predicate.

## Output
On success, return the ticket-to-commit ledger, empty frontier, integrated commit identifier, passing check evidence, review-clear evidence, draft pull-request URL and head commit, and cleanup result. Otherwise return exactly one terminal classification—`invalid-input`, `blocked`, `ticket-failed`, `integration-conflict`, `check-failed`, `review-blocked`, `non-converged`, `publication-failed`, or `cleanup-blocked`—with the partial-result ledger and the next human-resolvable blocker.

## Single-feature case (degenerate DAG)

When the specification is one approved feature described by a product spec and a tech spec (for example `PRODUCT.md` and `TECH.md`), the DAG has exactly one ticket. Run the procedure with that single ticket: validate it traces to both specs, execute it in one worktree, integrate trivially, and ship the draft PR. Two extra rules apply only to the spec-driven single-feature case:

- **Spec-code alignment in the same PR.** If implementation reveals that intended behavior or design should change, update the checked-in spec immediately rather than leaving it stale. Update the product spec when user-facing behavior or success criteria change; update the tech spec when architecture or validation strategy changes. Do not leave specs and code unsynchronized.
- **Spec drift is a failure.** If code diverges from a spec, either correct the code or update the spec to match the reality discovered during implementation. Stage the spec updates, code, and tests together in the same PR.

Read the product spec first as the source of truth for user-facing behavior, UX, edge cases, and success criteria; read the tech spec as the source of truth for architecture, module boundaries, sequencing, and implementation shape. If either spec file is absent, stop and report the missing file before writing any code.
