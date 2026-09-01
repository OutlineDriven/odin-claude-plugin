---
name: property-test-review
description: 'Use when reviewing existing property tests for coverage and defects. Reports tautological, vacuous, assertion-free, reimplemented, weak, or over-filtered tests with evidence, severity, and strongest replacement property. Not for generating tests — use property-test-authoring.'
---

# Property test review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to review existing Hypothesis, fast-check, proptest, jqwik, rapid, Echidna, Medusa, or equivalent property tests for meaningful coverage and defects. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Read existing property tests and production contracts and return findings without changing code unless fixes are separately requested. |
| Done | The report identifies tautological, vacuous, assertion-free, reimplemented, weak, over-filtered, or misconfigured tests with evidence, severity, and the strongest available replacement property. |

## Inputs

- Test files: Property test source files (required). The user names them or the skill discovers them via framework-specific search patterns.
- Production contracts: The code under test — function signatures, type annotations, docstrings, or specifications (required). Needed to compare asserted properties against the code's algebraic shape.
- Property catalog reference: The property catalog below (included). Used to identify the strongest unasserted property.

## Procedure

1. Locate property tests. If the user names specific files, read them. Otherwise search for framework markers:
   - Python/Hypothesis: `rg "@given\(|from hypothesis import" --type py`
   - TypeScript/fast-check: `rg "fc\.(assert|property)" --type ts --type js`
   - Rust/proptest: `rg "proptest!|#\[quickcheck\]" --type rust`
   - Java/jqwik: `rg "@Property|@ForAll" --type java`
   - Solidity/Echidna/Medusa: `rg "function test|echidna_" --type sol`
   Done when: every property test file in scope is read into context, or the search returned no matches and the no-tests-found stop is reported.

2. Read production contracts. For each tested function, read its implementation, type signature, and any specification. Identify the function's algebraic shape — whether it has an inverse, preserves an invariant, is idempotent, commutative, associative, or admits an oracle. Done when: each tested function has a named algebraic shape or is recorded as having none, so the defect classification in step 3 has the ground truth it compares against.

3. Classify each test against the defect taxonomy. For every property test, determine which defect class applies:

   | Defect | Severity | Detection rule |
   |---|---|---|
   | Tautological | CRITICAL | Assertion is true regardless of the implementation. `assert result == result` or `assert f(x) == f(x)` where `f` is obviously pure. Exception: `f(x) == f(x)` is a genuine determinism property when `f` is not obviously pure — serializers over dicts or sets, hashing, anything reading the clock. Ask whether a broken implementation could falsify it. |
   | Vacuous | CRITICAL | `assume()` filters out nearly every input, or self-contradictory `assume()` passes having run zero cases. `assume(x == 42)` is the subtler version: it runs, it passes, and it is an example test wearing a `@given` decorator. |
   | No assertion | HIGH | Body calls the function and stops. No `assert`, `expect`, or property check. |
   | Reimplementation | HIGH | Assertion recomputes the function's own logic. `assert add(a, b) == a + b` restates the implementation; no bug they share can fail it. |
   | Weaker property available | MEDIUM | Length checked, ordering not. The code supports a stronger property the suite does not assert. |
   | Over-filtered | MEDIUM | Stacked `assume()` where a strategy constraint belongs. Push constraints into the generator so it produces valid inputs directly. |
   | Settings | LOW | `max_examples=5`, or no deadline on an expensive strategy. |

   Done when: every test has exactly one defect class assigned with the specific assertion or configuration that triggered it, or is recorded as clean.

4. Compare against the property catalog. For each tested function, identify the strongest property the code supports but the suite does not assert:

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

   Strength ordering, weakest to strongest: `no crash` then `type preservation` then `invariant` then `idempotence` then `roundtrip / oracle`. Assert the strongest property the code supports. "No crash" alone rarely justifies the dependency — if that is all that can be found, either a small rearrangement exposes something stronger, or the honest report is that this code is a poor PBT candidate.

   Done when: each tested function has a named strongest property the code supports, and the gap between the asserted property and that strongest property is stated.

5. Flag fragile patterns. Report these regardless of defect class:
   - Floating-point equality without a tolerance
   - Assertions on dict/set iteration order
   - Anything reading the clock
   - These patterns produce flakes that get blamed on the PBT framework and then deleted.
   Done when: every fragile pattern found is listed with its file, line, and the flake mechanism it creates.

6. Assemble the report. For each finding, include: the test location, the defect class, the severity, the evidence (the specific assertion or configuration), and the strongest available replacement property. Done when: the report lists one finding per defective test, each with location, class, severity, evidence, and replacement property, and a summary counts tests reviewed and findings by severity.

## Failure and recovery

- No property tests found. Report that the codebase contains no property tests. Do not generate tests — that is a separate skill.
- No algebraic shape found. If the code under test has no inverse, invariant, oracle, or other assertable property, report that honestly. A small rearrangement may expose something stronger; note this possibility. If not, the code is a poor PBT candidate.
- Ambiguous tautology. When `f(x) == f(x)` could be either tautological or a genuine determinism property, report the ambiguity and ask whether a broken implementation could falsify it. Do not decide on the author's behalf.
- Partial results. If some tests are reviewable and others are not (missing source, generated code, external dependencies), report findings for the reviewable subset and name the unreviewable tests with the reason.

## Output

A structured report containing: 1. Summary: Total tests reviewed, count by severity, overall assessment. 2. Findings: For each defect found — location (file, line, test name), defect class and severity, evidence (the specific assertion, configuration, or pattern), strongest replacement property the code supports. 3. Recommendations: Prioritized list of improvements, ordered by severity. 4. Unreviewable tests: If any, with reasons.
