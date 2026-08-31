---
name: tdd
description: 'Offensive-first TDD: write tests that attack the contract before any green. Use when asked to develop test-first, plan a TDD build, or work red-to-green slices. Attacks precede implementation; tests never bend to code. Not for hardening existing code without a change — use tests-adversarial.'
---

# Offensive-first TDD

Classic agent TDD rots in a known way: the red test is written as a polite specification, the implementation drifts, and the agent — lacking the metacognition to notice — bends fixtures, weakens assertions, and monkey-patches contracts until green appears. The tokens burn twice and the suite proves nothing. This skill inverts the stance. Red is an attack, not a description: before any implementation, write the tests that try to BREAK the contract — boundary raids, invariant violations, error-path probes, adversarial orderings. Green means the attacks failed to break the code, never that a fixture was satisfied.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Develop a fix or feature test-first, plan a multi-step TDD build from a spec, or work behaviour red-to-green in slices. |
| Authority | Reversible-local: write only named test and source files; rollback via VCS revert of the implementation commit. Tests and implementation never change in the same repair step. |
| Side effect | Adds an attack suite and the minimal implementation that survives it, one vertical slice at a time; multi-step work also writes a plan document. |
| Done | Per slice: every contract clause has an attack that failed red for the right reason and passes green unweakened, plus one mutation probe the suite caught. Named evidence: test paths, failing output, passing output, probe output. |

## Inputs

- **Target and requirement** (required): the behavior to build or fix, and the public seam where it is observed. A seam is confirmed with the user before any test exists at it.
- **Contract source** (required): spec, caller evidence, or known-good literals — the independent truth attacks are derived from. Never the implementation's own logic.
- **Test framework** (optional if discoverable): the project's runner. Stop and report if absent and not discoverable; never install one unasked.

## Refusals

- Never weaken an assertion, bend a fixture, skip a test, or loosen a contract to reach green. Any such edit during a green phase is a stop-the-line violation: revert it, then either fix the implementation or declare a contract change and re-attack from red.
- Never edit a test and its implementation in the same repair step. Test-fixing and code-fixing are separate cycles, each with a named justification.
- Never accept a tautological attack (expected value recomputed the way the code computes it) or an implementation-coupled one (mocks internals, tests private methods). Attacks fire at confirmed public seams only.
- Not for hardening existing code with no behavior change — use tests-adversarial. Not for deleting weak tests — use tests-purge-unneeded.

## Procedure

1. **State the contract under attack.** From the spec, callers, and known-good literals, write the clauses the code must honor: valid behavior, boundaries, invariants, error semantics. Confirm the seam with the user. Done when: clauses are listed with an independent truth source each, and the seam is confirmed.
2. **Attack first.** For the current slice, write the breaking suite before any implementation: for each clause, the boundary raid, the invalid input, the invariant violation, the error-path probe, the adversarial ordering that would expose a sloppy implementation. Run it. Every attack must fail red **for the right reason** — assert the failure mode, not just any failure; an attack that passes against absent code is tautological, discard and rewrite it. Done when: the suite is red with each failure matching its predicted mode.
3. **Implement until the attacks stop breaking it.** Minimal but real: only enough code to survive the suite, no speculative features, no refactor of unrelated code. Rerun until green. If green cannot be reached, revert the implementation and try a different minimal approach; the attacks do not move. Done when: the suite is green with tests byte-identical to their red state.
4. **Grill the green.** Diff every test, fixture, and contract file against its red-phase state. Any drift is a violation: revert it, classify the change (implementation bug → fix code; genuine contract change → declare it, update the clause list, return to step 2). Done when: the diff over test surfaces since red is empty or every change is a declared contract change with its own re-attack.
5. **Probe the suite's teeth.** Mutate the implementation once — flip the fix, invert a branch, off-by-one a bound — and confirm at least one attack catches it; then revert the mutation. A suite that survives its mutation probe proves nothing and returns to step 2 for a sharper attack. Done when: the probe was caught and the revert is clean.
6. **Advance by vertical slice.** Commit the slice (attack suite + implementation, one commit naming the behavior), then take the next clause or seam from step 2. Multi-step work runs from a plan document listing one attack-entry per requirement, ordered by dependency; the plan's only execution mode is offensive-first — there is no implementation-first option. Done when: all agreed seams are exhausted and every test in the tree maps to a confirmed seam.

## Failure and recovery

| Failure class | Rule |
|---|---|
| Green by test-bending | The signature drift this skill exists to kill. Revert the test edit, keep the red, fix the code or declare the contract change out loud. |
| Attack cannot be written | Missing prerequisite (unclear requirement, unconfirmed seam, no framework). Stop and report; never proceed to implementation on an unattacked contract. |
| Implementation cannot survive within the slice | Revert the implementation, keep the attacks. Try a different minimal approach or stop and report; partial result = red suite + its output, never a weakened green. |
| Mutation probe survives | The suite is decorative. Sharpen the attack before touching more implementation. |
| Existing suite breaks | Revert; narrow the change until only the new slice's behavior moves. |

Partial-result rule: completed slices are retained; a blocked cycle never invalidates prior green slices and never claims the done predicate.

## Output

Per slice, in order: attack files, red run output (failure modes matched), green run output, mutation-probe evidence, implementation commit SHA. Multi-step work prepends the plan document path.

## Provenance

Merged offensive-first from four ODIN skills and their sources:
- `tdd` — cursor/plugins pstack/skills/tdd at revision 68836ddaf5697224520f1847d90cdb90ca8babaa, MIT (pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25, Lauren Tan): named failing-before/passing-after evidence, false-green check.
- `test-driven` — current ODIN tree merged with addyosmani/agent-skills (test-driven-development, MIT, Copyright (c) 2025 Addy Osmani, revision d2c37ef6225dd8726cdd369a8030307f48592d26) and obra/superpowers (test-first-iron-law, MIT, Copyright (c) 2025 Jesse Vincent, revision b36e0829c6d0140e93cfef2ca599b1b07d4a7797): seam confirmation, anti-pattern guard (tautological, implementation-coupled, horizontal slicing), never-weaken rule.
- `tdd-plan-writer` — obra/superpowers skills/writing-plans, same revision and license: one plan entry per requirement, dependency ordering, placeholder scan; the execution-mode choice is residue — offensive-first is the only mode.
- `tdd-vertical-slices` — mattpocock/skills, MIT, Copyright (c) 2026 Matt Pocock, revision 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76: one failing test + minimal implementation per slice, red-before-green end state. The root `licenses/NOTICE` retains the MIT notices for all named copyright holders.

The offensive inversion (attack-first red, green-grill diff, mutation probe, test/code edit separation) is original to this derivation. The MIT permission notice from each source is retained in derived distributions: Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
