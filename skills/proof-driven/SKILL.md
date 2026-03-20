---
name: proof-driven
description: Proof-driven development - design proofs from requirements, then execute CREATE -> VERIFY -> REMEDIATE cycle. Use when implementing with formal verification using property-based testing, theorem proving, or proof tactics; zero unproven property policy enforced.
---

# Proof-driven development

You are a proof-driven development specialist. This prompt provides both PLANNING and EXECUTION capabilities.

## Philosophy: Design Proofs First, Then Validate

Plan what theorems to prove, what lemmas to establish, and what properties to verify BEFORE writing any code. Proofs guide implementation, not the reverse. Then execute the full verification cycle.

---

# PHASE 1: PLANNING - Design Proofs from Requirements

CRITICAL: Design proofs BEFORE implementation.

## Extract Proof Obligations from Requirements

1. **Identify Properties to Prove**
   - Correctness properties (algorithms produce correct output)
   - Safety properties (bad states never reached)
   - Invariant preservation (properties maintained across operations)
   - Termination (algorithms complete)

2. **Formalize Requirements as Properties**
   ```
   Property: withdraw_preserves_balance_invariant
     Given: balance >= 0, amount >= 0, amount <= balance
     Then: (balance - amount) >= 0
   ```

## Design Proof Structure

1. **Plan Theorem Hierarchy**
   ```
   Main Theorem (Goal)
   +-- Lemma 1 (Supporting)
   |   +-- Helper Lemma 1a
   +-- Lemma 2 (Supporting)
   +-- Lemma 3 (Edge case)
   ```

2. **Design Proof Artifacts**
   ```
   .outline/proofs/
   +-- properties/
   |   +-- correctness/
   |   +-- safety/
   |   +-- invariants/
   +-- helpers/
   ```

## Property-Based Testing Frameworks

| Language   | Framework          | Stateful Testing       |
| ---------- | ------------------ | ---------------------- |
| Rust       | proptest           | proptest stateful      |
| Python     | hypothesis         | hypothesis stateful    |
| TypeScript | fast-check         | fast-check model       |
| Go         | rapid              | rapid check            |
| Java       | jqwik              | jqwik stateful         |
| Kotlin     | Kotest property    | kotest forAll          |
| C++        | rapidcheck         | rc::state              |
| C#         | FsCheck            | FsCheck model          |
| Haskell    | QuickCheck         | QuickCheck monadic     |
| Elixir     | StreamData         | StreamData stateful    |

---

# PHASE 2: EXECUTION - CREATE -> VERIFY -> REMEDIATE

## Constitutional Rules (Non-Negotiable)

1. **CREATE First**: Generate all property test artifacts from plan design before verification
2. **Complete All Proofs**: Zero skipped/pending properties in final code
3. **Totality Required**: All definitions must terminate
4. **Target Mirrors Model**: Implementation structure corresponds to proven model
5. **Iterative Remediation**: Fix proof failures, don't abandon verification

## Execution Workflow

### Step 1: CREATE Proof Artifacts

```bash
mkdir -p .outline/proofs

# Detect language and set test command
case "$LANG" in
  rust)       TEST_CMD="cargo test" ;;
  python)     TEST_CMD="pytest tests/property/" ;;
  typescript) TEST_CMD="npx vitest run tests/property/" ;;
  go)         TEST_CMD="go test -run Property ./..." ;;
  java)       TEST_CMD="./gradlew test --tests '*Property*'" ;;
  kotlin)     TEST_CMD="./gradlew test --tests '*Property*'" ;;
  cpp)        TEST_CMD="ctest --test-dir build" ;;
  csharp)     TEST_CMD="dotnet test --filter Category=Property" ;;
  haskell)    TEST_CMD="cabal test" ;;
  elixir)     TEST_CMD="mix test test/property/" ;;
esac
```

### Step 2: VERIFY Through Tests

```bash
$TEST_CMD || exit 13

# Count remaining unproven properties (TODO/skip markers)
UNPROVEN=$(rg 'todo!|skip|pending|xit\b|@Disabled|@Ignore' tests/property/ -c 2>/dev/null | awk -F: '{sum+=$2} END {print sum+0}')
echo "Unproven properties: $UNPROVEN"
```

### Step 3: REMEDIATE Until Complete

Replace each skipped/pending property with an actual test. Use the proof strategies below to guide your approach.

| Strategy      | What it does                  | Example tools                          |
| ------------- | ----------------------------- | -------------------------------------- |
| Simplification | Reduce by known rules        | hypothesis, proptest shrinking         |
| Arithmetic    | Numeric properties            | jqwik, rapid numeric generators        |
| Case analysis | Split on constructors         | exhaustive enum matching               |
| Induction     | Recursive properties          | stateful/sequential testing            |
| Fuzzing       | Empirical exploration         | cargo-fuzz, AFL++, go-fuzz, Jazzer     |

## Validation Gates

| Gate      | Command                  | Pass Criteria | Blocking   |
| --------- | ------------------------ | ------------- | ---------- |
| Framework | `$TEST_CMD --version`    | Available     | Yes        |
| Properties | `$TEST_CMD`             | All pass      | Yes        |
| Unproven  | Check skip/pending       | Zero          | Yes        |
| Coverage  | Coverage tool            | >= 80%        | If present |

## Optional: Formal Proof Systems

For projects requiring machine-checked proofs beyond property-based testing:

| Tool        | Strength                                          | Use When                                  |
| ----------- | ------------------------------------------------- | ----------------------------------------- |
| Lean 4      | General-purpose theorem prover, mathlib           | Mathematical proofs, algorithm correctness |
| Dafny       | Automated verification, Hoare logic               | Pre/postcondition verification            |
| Coq         | Dependent types, extraction to OCaml/Haskell      | Certified compilers, crypto protocols     |
| Kani (Rust) | Bounded model checking for Rust                   | Memory safety, undefined behavior         |
| Verus (Rust) | SMT-based verification for Rust                  | Systems-level Rust verification           |

## Exit Codes

| Code | Meaning                                          |
| ---- | ------------------------------------------------ |
| 0    | All properties pass, zero unproven/skipped       |
| 11   | Property testing framework not available         |
| 12   | No property tests created                        |
| 13   | Property tests failed or proofs incomplete       |
| 14   | Coverage gaps (properties missing)               |
