---
name: tdd-vertical-slices
description: 'Use when asked to build or fix behaviour test-first. One failing test and minimal implementation per vertical slice, red-to-green with no tautological or implementation-coupled tests. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# TDD vertical slices

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Build or fix behaviour test-first |
| Authority | Reversible local write only. Write failing tests and minimal implementation at agreed seams; rollback is reverting the current slice's files |
| Side effect | One failing test and minimal implementation per vertical slice |
| Done | All slices went red-to-green with no tautological or implementation-coupled tests |

## Inputs

- **Required**: A feature, bug fix, or behaviour to implement or fix; the seam or public interface under test.
- **Optional**: Existing test patterns in the project for convention alignment; a specification or known-good literal for expected values.

## Procedure

1. **Identify the seam.** Confirm with the user the public boundary to test. A seam is the interface where behaviour is observed without reaching into internals. No test is written at an unconfirmed seam.
2. **Write the failing test.** Author one test at the agreed seam that specifies observable behaviour. Use a known-good literal, worked example, or specification as the expected value; never recompute it the way the implementation does. The test must fail when run.
3. **Run the test and confirm red.** Execute the project test runner. If the test passes without implementation, the expected value is tautological; discard and rewrite step 2 with an independent source of truth.
4. **Write minimal implementation.** Write only enough code to make the failing test pass. Do not anticipate future tests or add speculative features.
5. **Run the test and confirm green.** Execute the project test runner. If the test fails, revise the implementation; do not weaken the test.
6. **Advance or stop.** If more seams remain, return to step 1 for the next slice. If all agreed seams have passing tests, proceed to step 7.
7. **Verify seam coverage.** Confirm every passing test lives at an agreed seam. If any test exists at an unconfirmed seam, remove it.

### Anti-pattern guard

Before writing or accepting any test, check:
- **Implementation-coupled**: mocks internal collaborators, tests private methods, or verifies through a side channel (database query instead of interface). Reject; refactor to test at the seam.
- **Tautological**: expected value is recomputed the same way the code does, is a hand-derived snapshot using the same logic, or is a constant asserted equal to itself. Reject; supply an independent source of truth.
- **Horizontal slicing**: all tests written before any implementation. Reject; work in vertical slices: one test, one implementation, repeat.

Mock at system boundaries only (external APIs, databases, time, randomness). Do not mock internal collaborators or classes under the developer's control.

## Failure and recovery
| Failure class | Rule |
|---|---|
| Unclear seam | Stop. Ask the user to clarify the public boundary before writing any test. Do not guess or infer a seam |
| Implementation cannot pass test within slice | Revert the implementation. Do not weaken the test. Try a different minimal approach. If no approach works within the current scope, stop and report |
| Tautological test detected | Discard the test. Rewrite with an expected value from an independent source of truth |
| Scope widening detected | Stop. Do not add tests at unagreed seams, implement beyond the current slice, or refactor during the loop |

Partial-result rule: completed vertical slices are retained. A blocked cycle does not invalidate prior passing slices.

## Output
Each cycle produces one passing test and its matching minimal implementation as a vertical slice at an agreed seam. Final state: all agreed seams covered by passing tests that specify observable behaviour, no tautological tests, no implementation-coupled tests.

## Provenance

- Origin: mattpocock/skills (MIT, Copyright (c) 2026 Matt Pocock, revision 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76).
- License: MIT. Retain the copyright notice in derived distributions.
- Adaptation: Clean-room adaptation preserving the red-before-green vertical slice procedure and anti-tautology end-state from the source SKILL.md; guidance from source mocking.md and tests.md inlined into the Anti-pattern guard and Failure sections.

The root `licenses/NOTICE` must retain the MIT copyright and permission notice for Copyright (c) 2026 Matt Pocock, as required by the source license.
