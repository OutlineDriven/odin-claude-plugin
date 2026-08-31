---
name: property-test-authoring
description: 'Use when adding or improving property tests for invariants, oracles, parsers, algorithms, data structures, or smart-contract state machines. Encodes the strongest grounded property with domain-aware generators and pinned edge cases. Not for review — use property-test-review.'
---

# Property test authoring

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to add or improve generated property tests for an inverse, invariant, oracle, idempotence rule, parser, normalizer, algorithm, data structure, or smart-contract state machine. |
| Authority | Reversible-local: write property tests to local files tracked by version control. Roll back with `git revert` or `git checkout` of the test file. |
| Side effect | Write property tests in the existing framework. Add a new testing dependency or production-code seam only with user approval. |
| Done | The strongest grounded property is encoded with domain-aware generators and pinned edge cases, avoids tautology and vacuity, and the targeted test run passes while a plausible contract violation would fail it. |

## Inputs

- Target code: the function, module, or contract under test. Required.
- Property type: roundtrip, inverse, oracle, idempotence, invariant, commutativity, associativity, identity, or determinism. Inferred from the code's algebraic shape when not stated.
- Test framework: the project's existing property-based testing library (Hypothesis, fast-check, proptest, jqwik, rapid, Echidna, Medusa, or equivalent). Required.
- Existing tests: any current property or example tests for the target. Optional.
- Known edge cases: domain-specific boundary values. Optional.

## Procedure

1. **Examine the target code** for an algebraic shape. Check whether the shape is missing or merely buried. A calculation wrapped in I/O, a string built by concatenation, or an in-place mutation may have a property but no seam through which to assert it. If the shape is buried, identify the refactoring that exposes it and propose it to the user before proceeding. Done when: the stated outcome holds.

2. **Determine which property applies.** Use the property catalog and strength ordering: Done when: the stated outcome holds.

   | Property | Formula | Where it applies |
   |---|---|---|
   | Roundtrip | `decode(encode(x)) == x` | Serialization, conversion pairs |
   | Inverse | `f(g(x)) == x` | encrypt/decrypt, compress/decompress |
   | Oracle | `new(x) == reference(x)` | Optimization, refactoring, reimplementation |
   | Idempotence | `f(f(x)) == f(x)` | Normalization, formatting, sorting |
   | Invariant | Holds before and after | Any transformation, contract state |
   | Easy to verify | `is_sorted(sort(x))` | Complex algorithms with cheap checkers |
   | Commutativity | `f(a, b) == f(b, a)` | Binary and set operations |
   | Associativity | `f(f(a,b), c) == f(a, f(b,c))` | Combining operations |
   | Identity | `f(x, e) == x` | Operations with a neutral element |

   Strength ordering, weakest to strongest: `no crash → type preservation → invariant → idempotence → roundtrip / oracle`.

   Assert the strongest property the code supports. If "no crash" is all that can be found, explore whether a small rearrangement exposes something stronger before settling.

3. **Design the generator.** Put constraints in the strategy, not in `assume()`. `assume()` discards inputs after generation, so a filter that rejects most candidates wastes the budget and trips the exhausted-filter guard. Build compound inputs with the framework's composition primitives (e.g. `st.builds`, `st.composite`, `.flatmap`) rather than generating independently and filtering. Reserve `assume()` for conditions that genuinely cannot be expressed as a generator — a relationship between two already-generated values. Done when: the stated outcome holds.

4. **Pin the edge cases** the domain already reveals. Empty, single-element, all-duplicates, zero, negative, and the maximum representable value recur across domains. Use the framework's example-pin mechanism (e.g. `@example`) so these run on every execution and document that the boundary was considered. Done when: the stated outcome holds.

5. **Configure settings** for the execution context: Done when: the stated outcome holds.
   - Local iteration: `max_examples=10`.
   - CI: `max_examples=200`.
   - Nightly: `max_examples=1000, deadline=None`.
   - Always set `deadline=None` for anything doing real work. The default deadline turns a slow machine into a failing test, and that flake gets the suite deleted.

6. **Assert determinism** where it is not obvious. `f(x) == f(x)` is a tautology for a pure function and a real test for serializers over dicts or sets, hashing, iteration order, or time-dependent code. Assert it where a broken implementation could falsify it. Done when: the stated outcome holds.

7. **Test the error path.** For decoders and parsers, the contract is usually "raises the documented exception or succeeds, never an unexpected exception, never hangs." Catch only the documented exception and let everything else fail the test. Done when: the stated outcome holds.

8. **Verify the test** by running it against the target. Confirm it passes. Then confirm a plausible contract violation would fail it — if the test passes regardless of implementation correctness, it is tautological or vacuous and must be strengthened. Done when: the stated outcome holds.

9. **Guard against tautology and vacuity:** Done when: the stated outcome holds.
   - *Tautology*: `assert add(a, b) == a + b` restates the implementation. Pick a property that constrains the function without recomputing it. Exception: `f(x) == f(x)` is a genuine determinism property when `f` is not obviously pure.
   - *Vacuity*: `assume()` that filters out nearly every input passes without exercising anything. Self-contradictory `assume()` passes having run zero cases. Push constraints into the strategy.

## Failure and recovery

- No algebraic shape: report that the code is a poor property-test candidate and recommend example tests. Do not force a weak property.
- Generator cannot produce valid inputs: move constraints into the strategy; if the framework still cannot express the domain, report the limitation with the specific constraint that blocks generation.
- Tautological or vacuous test: strengthen the property or fix the generator before declaring done. Never ship a test that cannot fail on a real bug.
- User rejects new dependency: work within the existing framework or report what is possible without it. Do not add a dependency without explicit approval.
- Partial result: if only some properties are encodable, write those and report which properties could not be encoded and why.

## Output
A property test file in the project's existing framework containing: the strongest grounded property for the target code, domain-aware generators with constraints in the strategy, pinned edge cases for known boundaries, and a passing test run. If the code lacks an algebraic shape, the output is a written recommendation for example tests with the specific reason no property applies.
