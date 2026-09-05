---
name: property-test-authoring
description: 'Use when authoring property tests, assessing PBT fit for a code path, reviewing existing property tests, or triaging a failing counterexample. Not for test-first features: use tdd.'
---

# Property test authoring

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to add or improve generated property tests for an inverse, invariant, oracle, idempotence rule, parser, normalizer, algorithm, data structure, or smart-contract state machine; to decide whether property-based testing fits a code path; to review existing property tests; or to classify a failing counterexample. |
| Authority | Reversible local: mode author writes only property tests to local files tracked by version control, plus user-approved production-code seams; modes assess, review, and triage write nothing; rollback is `git revert` or `git checkout` of the touched file. No remote mutation. |
| Side effect | Mode author writes property tests in the existing framework and adds a testing dependency or production-code seam only with user approval. Modes assess, review, and triage return chat output only. |
| Done | Mode author: the strongest grounded property is encoded with domain-aware generators and pinned edge cases, and the targeted run passes while a plausible contract violation fails it. Mode assess: a verdict names property, domain, strategy seam, and library, or declines to example tests. Mode review: every test is classified against the defect taxonomy with evidence, severity, and the strongest replacement property. Mode triage: the counterexample is classified with cited evidence and a minimal repair. |

## Inputs

- Mode: `author` (default), `assess`, `review`, or `triage`. Inferred from the request when not stated.
- Target code: the function, module, or contract under test. Required for author and assess; required reading for triage.
- Test framework: the project's property-based testing library (Hypothesis, fast-check, proptest, jqwik, rapid, Echidna, Medusa, or equivalent). Required for author; detected from the tree in review and triage.
- Existing tests: current property or example tests for the target. Optional for author; required for review.
- Counterexample: the failing value, original or shrunk, plus the test that produced it. Required for triage; supply the original generated value when a shrunk one is given.
- Dependency manifest: required for the assess library verdict; it reveals an existing PBT library.
- Known edge cases: domain-specific boundary values. Optional.
- Specification: a requirements document, when one exists. Optional; assess and triage use it when present.

## Procedure

Steps 1 and 2 are shared by every mode. Then run the named mode.

1. Examine the target code for an algebraic plan. Check whether the plan is missing or merely buried. A calculation wrapped in I/O, a string built by concatenation, an in-place mutation, or a value read from a global or the environment may hold a property with no seam to assert it through. Done when: the code's algebraic plan is named (inverse, invariant, idempotence, oracle, roundtrip, commutativity, associativity, identity, or determinism), or the plan is absent and recorded as such.
2. Consult the property catalog and strength ordering. The catalog lives here once; every mode uses it.

   | Property | Formula |
   |---|---|
   | Roundtrip | `decode(encode(x)) == x` |
   | Inverse | `f(g(x)) == x` |
   | Oracle | `new(x) == reference(x)` |
   | Idempotence | `f(f(x)) == f(x)` |
   | Invariant | Holds before and after |
   | Easy to verify | `is_sorted(sort(x))` |
   | Commutativity | `f(a, b) == f(b, a)` |
   | Associativity | `f(f(a,b), c) == f(a, f(b,c))` |
   | Identity | `f(x, e) == x` |

   Strength ordering, weakest to strongest: `no crash` then `type preservation` then `invariant` then `idempotence` then `roundtrip / oracle`. Done when: the strongest property the code supports is named, or "no crash" is recorded as the ceiling.

Mode author (default):

3. If the plan is buried, name the refactoring that exposes it and propose it to the user before proceeding. Done when: the seam exists, or the user declined and the reachable property is used.
4. Design the generator. Put constraints in the strategy, not in `assume()`. `assume()` discards inputs after generation, so a filter that rejects most candidates wastes the budget and trips the exhausted-filter guard. Build compound inputs with the framework's composition primitives (e.g. `st.builds`, `st.composite`, `.flatmap`) rather than generating independently and filtering. Reserve `assume()` for conditions no strategy can express, a relationship between two already-generated values. Done when: the generator produces valid inputs directly from the strategy, and `assume()` appears only for inter-value relationships.
5. Pin the edge cases the domain already reveals. Empty, single-element, all-duplicates, zero, negative, and the maximum representable value recur across domains. Use the framework's example-pin mechanism (e.g. `@example`) so these run on every execution and document that the boundary was considered. Done when: the example-pin mechanism lists each domain boundary, and every pinned case is one the domain actually exposes.
6. Configure settings for the execution context: local iteration `max_examples=10`; CI `max_examples=200`; nightly `max_examples=1000, deadline=None`. Always set `deadline=None` for anything doing real work; the default deadline turns a slow machine into a failing test, and that flake gets the suite deleted. Done when: `max_examples` matches the execution context and `deadline=None` is set for any test doing real work.
7. Assert determinism where it is not obvious. `f(x) == f(x)` is a tautology for a pure function and a real test for serializers over dicts or sets, hashing, iteration order, or time-dependent code. Assert it where a broken implementation could falsify it. Done when: a determinism assertion is present for every target whose purity is not obvious, and absent where it could not fail on a real bug.
8. Test the error path. For decoders and parsers, the contract is usually "raises the documented exception or succeeds, never an unexpected exception, never hangs." Catch only the documented exception and let everything else fail the test. Done when: the error-path test catches only the documented exception type.
9. Verify the test by running it against the target. Confirm it passes, then confirm a plausible contract violation would fail it; a test that passes regardless of implementation correctness is tautological or vacuous and must be strengthened. Done when: the test passes against the correct implementation and fails on a planted mutation.
10. Guard against tautology and vacuity. A tautology restates the implementation (`assert add(a, b) == a + b`); pick a property that constrains the function without recomputing it. A vacuous `assume()` filters out nearly every input or is self-contradictory; push constraints into the strategy. Done when: the assertion does not recompute the function's own logic, and no `assume()` filter discards the majority of generated inputs.

Mode assess:

3. Bound the assessment to the named code path and its direct tests; never sweep the module. Detect an existing PBT library in tests and manifests: `hypothesis`, `fast-check`, `proptest`, `quickcheck`, `pgregory.net/rapid`, `net.jqwik`, `ScalaCheck`, `FsCheck`, `StreamData`, `test.check`, `PropCheck`, `Kotest`, `RapidCheck`, `SwiftCheck`, `echidna_`, `invariant_`. A hit names the recommendation and forbids proposing a second library. Done when: the path is bounded, its direct tests are read, and an existing library is detected or confirmed absent.
4. Select the strongest property from the step-2 ordering. "No crash" alone does not justify a library. If the plan is buried, name exactly one rearrangement (extract the pure core, add the inverse, split a structured value from its renderer, return a value instead of mutating, or inject the bound as a parameter), state the property it unlocks, and mark it as the user's production-code decision. Done when: the strongest property is selected, or the buried plan is named with one rearrangement as the user's decision.
5. Vacuity-check the candidate before naming it. Reject a tautology that restates the implementation; no bug it shares with the code can fail it. `f(x) == f(x)` is a genuine determinism property only when purity is not obvious. Reject an `assume()` filter that discards nearly every generated input or is self-contradictory; the strategy must produce the valid domain, and the verdict must name that strategy as the domain. For Solidity: type bounds are compiler guarantees, not properties (`uint256` is never negative; `address(this).balance >= 0` is always true), and a property over state no call sequence can reach is vacuous until coverage output shows otherwise. Done when: the candidate passes the vacuity check or is rejected with the specific reason.
6. Name the library. An existing one from step 3 wins outright. Otherwise use the language default: Python Hypothesis; TypeScript or JavaScript fast-check; Rust proptest; Go rapid; Java jqwik; Scala ScalaCheck; C# FsCheck; Elixir StreamData; Haskell QuickCheck; Clojure test.check; Ruby PropCheck; Kotlin Kotest; C++ RapidCheck; Swift SwiftCheck only after checking it is still maintained. For EVM contracts: Echidna by default, Medusa when parallel or coverage-guided execution matters; state whether the property is property mode (a `bool` function that must never become false) or assertion mode (an `assert` inside a fuzzer-callable function), chosen by where the property lives. Done when: the library is named, existing or language default.
7. Deliver the verdict. Recommend PBT when steps 4-6 produced a non-vacuous property stronger than "no crash": state the property, domain, strategy seam, and library; when a new dependency or the step-4 refactor is needed, offer it once bound to that specific property and accept either answer as final. Decline when the only reachable property is "no crash" after the buried-shape check, or the code has no computable relation to constrain: example tests are the better method, and saying so plainly is a correct outcome. Never implement either path. Done when: the verdict is delivered.

Mode review:

3. Locate property tests. If the user names specific files, read them. Otherwise search for framework markers:
   - Python/Hypothesis: `rg "@given\(|from hypothesis import" --type py`
   - TypeScript/fast-check: `rg "fc\.(assert|property)" --type ts --type js`
   - Rust/proptest: `rg "proptest!|#\[quickcheck\]" --type rust`
   - Java/jqwik: `rg "@Property|@ForAll" --type java`
   - Solidity/Echidna/Medusa: `rg "function test|echidna_" -g '*.sol'`
   Done when: every property test file in scope is read, or the search returned no matches and the no-tests-found stop is reported.
4. Classify each test against the defect taxonomy:

   | Defect | Severity | Detection rule |
   |---|---|---|
   | Tautological | CRITICAL | Assertion is true regardless of the implementation. `assert result == result` or `assert f(x) == f(x)` where `f` is obviously pure. Exception: `f(x) == f(x)` is a genuine determinism property when `f` is not obviously pure, serializers over dicts or sets, hashing, anything reading the clock. Ask whether a broken implementation could falsify it. |
   | Vacuous | CRITICAL | `assume()` filters out nearly every input, or self-contradictory `assume()` passes having run zero cases. `assume(x == 42)` is the subtler version: it runs, it passes, and it is an example test wearing a `@given` decorator. |
   | No assertion | HIGH | Body calls the function and stops. No `assert`, `expect`, or property check. |
   | Reimplementation | HIGH | Assertion recomputes the function's own logic. `assert add(a, b) == a + b` restates the implementation; no bug they share can fail it. |
   | Weaker property available | MEDIUM | Length checked, ordering not. The code supports a stronger property the suite does not assert. |
   | Over-filtered | MEDIUM | Stacked `assume()` where a strategy constraint belongs. Push constraints into the generator so it produces valid inputs directly. |
   | Settings | LOW | `max_examples=5`, or no deadline on an expensive strategy. |

   Done when: every test has exactly one defect class assigned with the specific assertion or configuration that triggered it, or is recorded as clean.
5. Compare against the step-2 catalog: for each tested function, name the strongest property the code supports but the suite does not assert. Done when: the gap between the asserted property and the strongest supported property is stated per function.
6. Flag fragile patterns regardless of defect class: floating-point equality without a tolerance, assertions on dict/set iteration order, anything reading the clock. These produce flakes that get blamed on the PBT framework and then deleted. Done when: every fragile pattern is listed with its file, line, and the flake mechanism it creates.
7. Assemble the report. For each finding include the test location, defect class, severity, evidence, and strongest available replacement property; add a summary counting tests reviewed and findings by severity. Done when: the report lists one finding per defective test plus the summary.

Mode triage:

3. Confirm the counterexample is a concrete execution trace; if absent or only a framework-generated failure with no concrete input, return `failure-input-missing`. Identify the framework and shrinker from the test file or build configuration; if the test file cannot be read, return `test-file-unreadable`. Done when: the counterexample is concrete and the framework is identified, or the named stop is returned.
4. Extract the property statement (the predicate that evaluated to false), the generators or data sources, and any custom shrink configuration; if the property cannot be extracted, return `property-unreadable`. Read the implementation and build a minimal reproduction by substituting the counterexample into the code path the property exercises; if the implementation cannot be read, return `implementation-unreadable`. Done when: the property is extracted and the reproduction is built, or the named stop is returned.
5. Classify the failure into exactly one category, in precedence order:
   a. Code Bug: the implementation produces an incorrect result or side effect for the counterexample, and the property correctly describes the intended behavior. Minimal repair: a code change to the implementation.
   b. Over-broad Property: the predicate rejects a value the implementation is permitted to produce under the current specification. Minimal repair: narrow the property to the guaranteed set.
   c. Incorrect Property: the predicate describes behavior the implementation does not claim to guarantee, or is logically wrong independent of the implementation. Minimal repair: correct or remove the property.
   d. Unsettled Specification: neither implementation nor property can be declared wrong because the requirement is ambiguous, absent, or contested. Minimal repair: resolve the specification with the maintainer before touching code or property.
   Cite the evidence for the chosen category: for Code Bug, quote the exact implementation behavior and the predicate and name the branch or operation at fault; for Over-broad, quote the specification clause or implementation comment that permits the outcome; for Incorrect, quote the predicate and demonstrate the logical inconsistency with the documented contract; for Unsettled, name the absent or ambiguous requirement and what must be decided first. Done when: one category is assigned with cited evidence.
6. State the minimal repair in one concrete imperative sentence; add no extra refactorings, style changes, or tests. If evidence supports more than one category, report the competing classifications and let the maintainer decide; do not force a resolution. Done when: the minimal repair is stated, or the ambiguity is reported with competing classifications.

## Failure and recovery

- No algebraic plan: report that the code is a poor property-test candidate and recommend example tests. Do not force a weak property.
- Generator cannot produce valid inputs: move constraints into the strategy; if the framework still cannot express the domain, report the limitation with the specific constraint that blocks generation.
- Tautological or vacuous test: strengthen the property or fix the generator before declaring done. Never ship a test that cannot fail on a real bug.
- User rejects new dependency: work within the existing framework or report what is possible without it. Do not add a dependency without explicit approval.
- Named path missing or unreadable (assess): stop that path, ask for the corrected location, and issue no verdict for it; do not guess a nearby target.
- Stack not determinable (assess): ask which language and runtime to assume before the library verdict; a guessed default is an invented recommendation.
- No property tests found (review): report that the codebase contains no property tests; do not generate them here.
- Ambiguous tautology (review): when `f(x) == f(x)` could be either tautological or a genuine determinism property, report the ambiguity and ask whether a broken implementation could falsify it. Do not decide on the author's behalf.
- Triage stops: `failure-input-missing`, `test-file-unreadable`, `property-unreadable`, `implementation-unreadable`, `ambiguous-classification`; report the named stop and stop. If classification succeeds but the minimal repair cannot be stated without speculation, return `minimal-repair-unknown` with the classification and evidence.
- Partial result: report the encodable, assessable, or reviewable subset and name the remainder with the reason. Never issue a blanket verdict over a partial read.

## Output

- Mode author: a property test file in the project's existing framework containing the strongest grounded property, domain-aware generators with constraints in the strategy, pinned edge cases, and a passing test run; or a written recommendation for example tests with the specific reason no property applies.
- Mode assess: a chat verdict naming the property with its formula, the input domain, the strategy seam, and the library (existing, or proposed with the once-only consent note), plus at most one optional refactor marked as the user's decision; or the reason example tests are the better method. No files change.
- Mode review: a structured report with a summary (tests reviewed, count by severity, overall assessment), one finding per defective test (location, class, severity, evidence, strongest replacement property), prioritized recommendations, and any unreviewable tests with reasons.
- Mode triage: a triage report with classification category, quoted evidence, minimal repair action, any ambiguity, and `is_defect` boolean, in that order.
