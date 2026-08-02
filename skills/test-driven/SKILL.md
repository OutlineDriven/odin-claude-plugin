---
name: test-driven
description: Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests.
---

# Test-Driven Development

TDD is the red → green loop. This skill is the reference that makes that loop produce tests worth keeping: what a good test is, where tests go, the anti-patterns, and the rules of the loop. Every section applies on every cycle — consult them before and during the loop, not after.

When exploring the codebase, read `CONTEXT.md` if it exists so test names and interface vocabulary match the project's domain language, and respect ADRs in the area you are changing.

## What a good test is

Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests should not. A good test reads like a specification — “a user can check out with a valid cart” tells you exactly what capability exists — and survives refactors because it does not care about internal structure.

See [tests.md](references/tests.md) for good and bad examples, [mocking.md](references/mocking.md) for mocking guidance, [examples.md](references/examples.md) for cycle patterns in each language family, and [frameworks.md](references/frameworks.md) for test-runner and property-testing tools.

## Seams — where tests go

A **seam** is the public boundary you test at: the interface where you observe behavior without reaching inside. Tests live at seams, never against internals.

**Test only at pre-agreed seams.** Before writing any test, write down the seams under test and confirm them with the user. No test is written at an unconfirmed seam. You cannot test everything — agreeing seams up front puts testing effort on critical paths and complex logic instead of every edge case.

Ask: “What is the public interface, and which seams should we test?”

## Anti-patterns

- **Implementation-coupled** — mocks internal collaborators, tests private methods, or verifies through a side channel such as querying the database instead of using the interface. The tell: the test breaks when you refactor but behavior has not changed.
- **Tautological** — the assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, or a constant asserted equal to itself), so it passes by construction and can never disagree with the code. Expected values must come from an independent source of truth: a known-good literal, a worked example, or the specification. See [tests.md](references/tests.md).
- **Horizontal slicing** — writing all tests first, then all implementation. Bulk tests verify imagined behavior: you test the shape of things rather than user-facing behavior, the tests become insensitive to real changes, and you commit to test structure before understanding the implementation. Work in **vertical slices** instead — one test → one implementation → repeat, each test a **tracer bullet** that responds to what the last cycle taught you.

## Rules of the loop

- **Red before green.** Write the failing test first, then only enough code to pass it. Do not anticipate future tests or add speculative features.
- **One slice at a time.** One seam, one test, one minimal implementation per cycle.
- **Refactoring is not part of the loop.** It belongs to the review stage, not the red → green implementation cycle.
