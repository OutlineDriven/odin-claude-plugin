---
name: property-testing-fit-assessment
description: 'Use when deciding whether PBT fits a code path, which property and library to choose, or whether a design exposes a meaningful property. Returns a verdict with strongest non-vacuous property, domain, strategy seam, and library, or a decline. Not for writing or reviewing.'
---

# Property testing fit assessment

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks whether property-based testing fits a code path, which property and library to choose, or whether an existing design exposes a meaningful property. |
| Authority | Read-only: inspect source, tests, and manifests. Never edit files, change VCS state, install dependencies, or perform package-manager or network mutations. |
| Side effect | Chat output only: one fit assessment. Dependency adoption and any production refactor remain the user's decisions; offer them at most once and never carry them out. |
| Done | The response names a grounded property, domain, strategy seam, and existing-or-proposed library with consent boundaries, or explains why example tests are the better method. |

## Inputs

- The code path in question (required). Without it there is nothing to assess.
- Tests covering that path (expected; their absence is assessment evidence, not a blocker).
- The dependency manifest and test files of the enclosing project (required for the library verdict; they reveal an existing PBT library).
- Optional: the target language or stack when not evident from the code, and any written invariants or specifications the user wants honored.

## Procedure

1. Bound the assessment to the named code path and its direct tests. Read the implementation and every test that exercises it. Assess additional paths only when the user names them; never sweep the module. Done when: the assessment is bounded to the named path and its direct tests are read.
2. Detect an existing PBT library before proposing anything. Search tests and manifests for `hypothesis`, `fast-check`, `proptest`, `quickcheck`, `pgregory.net/rapid`, `net.jqwik`, `ScalaCheck`, `FsCheck`, `StreamData`, `test.check`, `PropCheck`, `Kotest`, `RapidCheck`, `SwiftCheck`, `echidna_`, and `invariant_`. A hit names the recommendation and forbids proposing a second library. Done when: an existing PBT library is detected or confirmed absent.
3. Read the algebraic shape of the code against the catalog: roundtrip `decode(encode(x)) == x`; inverse `f(g(x)) == x`; oracle `new(x) == reference(x)`; idempotence `f(f(x)) == f(x)`; invariant holding before and after a transformation; easy-to-verify `is_sorted(sort(x))`; commutativity `f(a, b) == f(b, a)`; associativity `f(f(a, b), c) == f(a, f(b, c))`; identity `f(x, e) == x`. Done when: the algebraic shape is read against the catalog.
4. Select the strongest property the code supports on the ordering `no crash → type preservation → invariant → idempotence → roundtrip / oracle`. "No crash" alone does not justify a library. Before settling for it, decide whether the shape is missing or merely buried: a calculation wrapped in I/O, a string built by concatenation, an in-place mutation, and a value read from a global or the environment each hold a property with no seam to assert it through. In the buried case, name exactly one rearrangement — extract the pure core, add the inverse, split a structured value from its renderer, return a value instead of mutating, or inject the bound as a parameter — state the property it unlocks, and mark it as the user's production-code decision. Never propose refactoring as part of the assessment. Done when: the strongest property is selected, or the shape is identified as buried with one rearrangement named as the user's decision.
5. Vacuity-check the candidate before naming it. Reject a tautology that restates the implementation (`add(a, b) == a + b`); no bug it shares with the code can fail it. `f(x) == f(x)` is a genuine determinism property only when purity is not obvious — serializers over unordered containers, hashing, anything reading the clock. Reject an `assume()` filter that discards nearly every generated input or is self-contradictory; the valid domain must be produced by the strategy itself, and the verdict must name that strategy as the domain. For Solidity: type bounds are compiler guarantees, not properties (`uint256` is never negative; `address(this).balance >= 0` is always true); a property over state no call sequence can reach is vacuous until coverage output shows otherwise. Done when: the candidate passes vacuity-check or is rejected with the specific reason.
6. Name the library. An existing one from step 2 wins outright. Otherwise use the language default: Python Hypothesis; TypeScript or JavaScript fast-check; Rust proptest; Go rapid; Java jqwik; Scala ScalaCheck; C# FsCheck; Elixir StreamData; Haskell QuickCheck; Clojure test.check; Ruby PropCheck; Kotlin Kotest; C++ RapidCheck; Swift SwiftCheck only after checking it is still maintained. For EVM contracts: Echidna by default, Medusa when parallel or coverage-guided execution matters; state whether the property is property mode (a `bool` function that must never become false) or assertion mode (an `assert` inside a fuzzer-callable function), chosen by where the property lives. Done when: the library is named (existing or language default).
7. Deliver the verdict. Recommend PBT when steps 3–6 produced a non-vacuous property stronger than "no crash": state the property, domain, strategy seam, and library; when a new dependency or the step-4 refactor is needed, offer it once bound to that specific property and accept either answer as final. Decline when the only reachable property is "no crash" after the buried-shape check, or the code has no computable relation to constrain: example tests are the better method, and saying so plainly is a correct outcome. Never implement either path. Done when: the verdict is delivered (recommend with property/domain/seam/library, or decline with reason).

## Failure and recovery
- Named path missing or unreadable: stop that path, ask for the corrected location, and issue no verdict for it; do not guess a nearby target.
- Stack not determinable from code or manifests: ask which language and runtime to assume before the library verdict; a guessed default is an invented recommendation.
- Candidate property survives only as tautology or vacuity: either name the seam-refactor as a user decision (buried shape) or decline; presenting a vacuous property as grounded violates the done predicate.
- Only some of several named paths assessable: report a per-path verdict and mark the remainder unassessed; never issue a blanket verdict over a partial read.
- Non-mutation rule: nothing is written, installed, refactored, or remotely executed at any point; if inspection itself fails, report the tool failure rather than widening scope to make progress.
- Blocked result: the response names what could not be inspected and the input that would unblock it. Never claim the done predicate holds without a named property plus library, or an explicit decline to example tests.

## Output
A chat assessment containing exactly: the verdict (PBT fits, or decline); for a fit, the property with its formula, the input domain, the strategy seam, and the library — existing, or proposed with the once-only consent note — plus at most one optional refactor with the property it unlocks, marked as the user's decision; for a decline, the reason example tests are the better method. No files change.
