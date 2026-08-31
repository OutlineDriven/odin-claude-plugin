---
name: test-driven
description: 'Build features or fixes test-first as red-green-refactor slices at agreed seams. Also handles integration tests at public boundaries. Not for adversarial hardening — use tests-adversarial; not for test deletion — use tests-purge-unneeded.'
---

# Test-driven development

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants test-first development, mentions red-green-refactor, or wants integration tests. |
| Authority | Reversible local writes only. Write failing tests and implementation at agreed seams; rollback is reverting the current slice's files. |
| Side effect | Writes failing tests at agreed seams and only enough implementation to pass them, in vertical slices. |
| Done | Each cycle ends in a passing vertical slice at an agreed seam and no test exists at an unconfirmed seam. |

## Inputs

- **Feature or fix** (required): the behavior to implement and the public interface or seam under test.
- **Project context** (optional): existing project test patterns, a specification, or a known-good literal for expected values.

## Refusals

- Will not write a test at an unconfirmed seam — ask the user to name the public boundary first.
- Will not weaken a test to make implementation pass — revise the implementation instead.
- Will not add tests at unagreed seams, refactor during the loop, or implement beyond the current slice.
- Will not accept a tautological test whose expected value is recomputed the same way the code computes it.

## Procedure

1. **Identify the seam.** Ask the user which public boundary to test. A seam is the interface where behavior is observed without reaching into internals. No test is written at an unconfirmed seam. **Done when:** the seam is named and confirmed by the user.
2. **Write the failing test.** Author one test at the agreed seam that specifies observable behavior. Use a known-good literal, worked example, or specification as the expected value; never recompute it the way the implementation does. The test must fail when run. **Done when:** the test exists and fails for the right reason.
3. **Run the test and confirm red.** Execute the project test runner. If the test passes without implementation, the expected value is tautological; discard and rewrite step 2 with an independent source of truth. **Done when:** the test fails.
4. **Write minimal implementation.** Write only enough code to make the failing test pass. Do not anticipate future tests or add speculative features. **Done when:** the implementation is the smallest change that could turn the test green.
5. **Run the test and confirm green.** Execute the project test runner. If the test fails, revise the implementation; do not weaken the test. **Done when:** the test passes.
6. **Advance or stop.** If agreed seams remain, return to step 1 for the next seam. If all agreed seams have passing tests, proceed to step 7. **Done when:** either the next seam is started or all seams are exhausted.
7. **Verify seam coverage.** Confirm every passing test lives at an agreed seam. If any test exists at an unconfirmed seam, remove it. **Done when:** every test maps to an agreed seam and no unconfirmed-seam test remains.

### Anti-pattern guard

Before writing or accepting any test, check:
- **Implementation-coupled**: mocks internal collaborators, tests private methods, or verifies through a side channel. Reject; refactor to test at the seam.
- **Tautological**: expected value is recomputed the same way the code does, is a hand-derived snapshot using the same logic, or is a constant asserted equal to itself. Reject; supply an independent source of truth.
- **Horizontal slicing**: all tests written before any implementation. Reject; work in vertical slices: one test, one implementation, repeat.

## Failure and recovery

| Failure class | Rule |
|---|---|
| Unclear seam | Stop. Ask the user to clarify the public boundary before writing any test. Do not guess or infer a seam. |
| Implementation cannot pass test within slice | Revert the implementation. Do not weaken the test. Try a different minimal approach. If no approach works within the current scope, stop and report. |
| Tautological test detected | Discard the test. Rewrite with an expected value from an independent source of truth (specification, known-good literal, worked example). |
| Scope widening detected | Stop. Do not add tests at unagreed seams, refactor during the loop, or implement beyond the current slice. |

Partial-result rule: completed vertical slices are retained. A blocked cycle does not invalidate prior passing slices.

## Output

Each cycle produces one passing test and its matching minimal implementation as a vertical slice at an agreed seam — final state: a test suite covering every agreed seam, each specifying observable behavior, no test at an unconfirmed seam.

## Provenance

- Origin: current ODIN skill tree (test-driven), merged with addyosmani/agent-skills (test-driven-development, MIT, Copyright (c) 2025 Addy Osmani, revision d2c37ef6225dd8726cdd369a8030307f48592d26) and obra/superpowers (test-first-iron-law, MIT, Copyright (c) 2025 Jesse Vincent, revision b36e0829c6d0140e93cfef2ca599b1b07d4a7797).
- License: MIT. Retain copyright notices from both sources in derived distributions.
- Adaptation: Clean-room adaptation synthesizing the red-green loop, seam contract, anti-pattern taxonomy, and vertical-slice discipline from all three sources into a single self-contained procedure.

The derived distribution must retain the full MIT permission text and both notices: Copyright (c) 2025 Addy Osmani and Copyright (c) 2025 Jesse Vincent.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
