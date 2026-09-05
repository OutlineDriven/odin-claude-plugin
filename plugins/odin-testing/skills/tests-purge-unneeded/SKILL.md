---
name: tests-purge-unneeded
description: 'Use when a legacy, slow, or duplicate test suite needs purging, a post-refactor sweep is due, or types cover a contract. Not for tests a new harness supersedes: use test-migration-coverage-gate.'
---

# Purge unneeded tests

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A legacy, slow, or duplicate test suite is being cleaned up, a post-refactor sweep is due, or the type system already covers an asserted contract. |
| Authority | Reversible local: deletes only VCS-tracked test files and makes temporary mutations for mutation proof only in enumerated VCS-tracked production files, all reverted before the next step or before reporting; rollback is version control recovery. No remote, VCS-history, credential, paid, published, or deployed mutation. Shows the exact set before deletion. |
| Side effect | Deletes proved-useless tracked tests in batches, keeps anything whose mutation fails, and runs the full suite after each batch. |
| Done | Each deleted test has one recorded mutation that survived before deletion, the full suite passes, and no protected boundary test was removed. |

## Inputs

- Test suite root (required): directory or glob identifying the test files to audit.
- Language or framework (optional): if omitted, detect from project config files (package.json, Cargo.toml, pyproject.toml, go.mod, pom.xml, build.gradle).
- Scope constraint (optional): limit audit to specific directories, file patterns, or changed-files-only mode.

## Refusals

- Will not delete a test whose injected mutation was caught; it is load-bearing.
- Will not delete a boundary-contract test (protocol compliance, error semantics, security invariants, real-I/O integration).
- Will not delete a test in a dynamic language that verifies a boundary shape the type system cannot guarantee.
- Will not persist any production-code mutation beyond the proof step.
- Will not delete a test whose failure mode cannot be articulated; keep it pending human review.

## Procedure

1. **Bound scope.** Identify the set of test files under audit. List every file path. Do not expand scope beyond the declared root or constraint. **Done when:** every file path in the audit set is listed.
2. **Identify candidates.** For each test, check: (a) it asserts structure the type system already guarantees, (b) it passes input through verbatim, (c) it asserts a mock return against the fixture that configured it, (d) it has survived mutation testing with no caught mutation, or (e) the real bug its failure would indicate cannot be articulated. **Done when:** every test is classified as candidate or not-candidate with a reason.
3. **Articulate the bug.** For each candidate, write one sentence: "this test fails when ___ goes wrong." If the sentence cannot name a concrete failure mode that a real code change could plausibly introduce, the test is a deletion candidate. **Done when:** every candidate has its one-sentence failure mode or is marked unarticulable.
4. **Check static guarantee.** For static-guarantee languages (Rust, TypeScript-strict, Kotlin, Java, C++, OCaml): structural assertions are redundant, a test that asserts a struct has the fields the compiler proved it has catches no bug; mark for deletion. For dynamic languages (Python, JavaScript, Ruby): no compile-time guarantee that a function returns the shape the docstring claims, a boundary shape test is a real-bug test; keep unless step 5 proves otherwise. **Done when:** each candidate is classified by language guarantee.
5. **Check boundary contract.** Does the test verify protocol compliance (HTTP status codes, message formats, retry semantics), error semantics (malformed input, partial failure, timeout), security invariants (authn/authz enforcement, input validation, rate limits), or real-I/O integration (DB transactions, file I/O, network calls)? If yes, keep regardless of step 4. **Done when:** each candidate is classified as boundary or non-boundary.
6. **Inject the bug.** For each remaining deletion candidate, modify the production code to introduce the specific bug the test claims to catch. Run the test. If the test still passes, it does not catch that bug; record the mutation and the test outcome. If the test fails, it is load-bearing: revert the mutation and keep the test. **Done when:** every remaining candidate has a recorded mutation proof (survived or caught).
7. **Delete in batches.** Delete tests whose mutation-proof is recorded. Each batch is an atomic commit with a rationale naming the mutation that survived. Run the full suite after each batch. If the suite regresses, revert the batch and investigate. **Done when:** all proved-useless tests are deleted in atomic commits and the full suite passes after each batch.
8. **Report.** Produce the output artifact. **Done when:** the deletion report is emitted.

## Failure and recovery

| Failure class | Condition | Recovery |
|---|---|---|
| Framework not detected | Cannot identify test runner or language | Abort. Report: test framework not detected; manual identification required. |
| Bug articulation failed | Cannot name a concrete failure mode for a candidate | Keep the test. Report: candidate kept pending human review; failure mode unclear. |
| Static guarantee unclear | Language carve-out not resolvable (mixed codebase, untyped mode) | Keep the test. Report: language carve-out ambiguous; kept pending resolution. |
| Mutation caught | Injected bug triggered test failure | Revert mutation. Keep the test. Report: load-bearing; mutation proof failed. |
| Suite regressed | Full suite fails after batch deletion | Revert the batch via VCS. Report: regression detected; batch rolled back. |

Partial-result rule: if any batch succeeds, its deletions stand. Rolled-back batches do not invalidate successful ones.

Non-mutation rule: no production code mutation persists beyond the proof step. Every injected bug is reverted before the next batch or before reporting.

## Output

A deletion report listing deleted tests (file path, test name, surviving mutation, batch commit hash), kept tests (file path, test name, reason kept), and final suite pass/fail status, ordering: deleted, kept, suite status.
