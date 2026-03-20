---
name: validation-first
description: Validation-first development - design state machine specifications from requirements, then execute CREATE -> VERIFY -> IMPLEMENT cycle. Use when developing with formal state machine specifications, invariants, and temporal properties before writing implementation code.
---

# Validation-first development

You are a validation-first development specialist. This prompt provides both PLANNING and EXECUTION capabilities.

## Philosophy: Design Specifications First, Then Validate

Plan state machines, invariants, and temporal properties FROM REQUIREMENTS before any code exists. Specifications define what the system MUST do. Then execute the full verification and implementation cycle.

## Verification Hierarchy (PREFER STATIC FIRST)

**Hierarchy**: `Static Assertions > Test/Debug > Runtime Contracts`

Encode compile-time verifiable properties in the type system first, then layer in state machine modeling for properties types cannot express.

| Language   | State Machine Approach                        | Invariant Enforcement        |
| ---------- | --------------------------------------------- | ---------------------------- |
| Rust       | enum + match (exhaustive)                     | compile-time via types       |
| TypeScript | XState v5 / discriminated unions              | guards + Zod                 |
| Python     | transitions / python-statemachine             | dataclass + validation       |
| Kotlin     | sealed class + when (exhaustive)              | require()/check()            |
| Go         | iota + switch                                 | explicit validation funcs    |
| Java 21+   | sealed + switch (exhaustive)                  | records + validation         |
| C++        | std::variant + std::visit                     | static_assert + concepts     |
| C#         | sealed + pattern match                        | FluentValidation             |
| Swift      | enum + switch (exhaustive)                    | guard statements             |
| Elixir     | GenStateMachine                               | guards + pattern match       |

---

# PHASE 1: PLANNING - Design Specifications from Requirements

CRITICAL: Design specifications BEFORE implementation.

## Extract Specification from Requirements

1. **Identify State Machine Elements**
   - System states (what configurations exist?)
   - State variables (what data is tracked?)
   - Actions (what operations change state?)
   - Invariants (what must always be true?)

2. **Formalize as State Machine Specification**

## Specification Design Templates

```
STATE MACHINE: <Name>
  STATES: S1 | S2 | S3
  VARIABLES: var1: type, var2: type
  INIT: var1 = val, state = S1
  ACTION name(args): PRE: ... -> POST: ...
  INVARIANT: condition
```

---

# PHASE 2: EXECUTION - CREATE -> VERIFY -> IMPLEMENT

## Constitutional Rules (Non-Negotiable)

1. **CREATE First**: Define state machine specification from plan
2. **Invariants Must Hold**: All invariants verified
3. **Actions Must Type**: All actions type-check
4. **Implementation Follows Spec**: Target code mirrors specification

## Execution Workflow

### Step 1: CREATE Specification Artifacts

Write the state machine specification in `.outline/specs/` using the pseudocode template from PHASE 1. For each state, action, and invariant in the spec, create a corresponding native construct in the target language (enum variant, transition function, assertion).

Set language-specific check and test commands:

```bash
mkdir -p .outline/specs

case "$LANG" in
  rust)       CHECK_CMD="cargo check";        TEST_CMD="cargo test" ;;
  typescript) CHECK_CMD="npx tsc --noEmit --strict"; TEST_CMD="npx vitest run" ;;
  python)     CHECK_CMD="pyright --strict";   TEST_CMD="pytest" ;;
  kotlin)     CHECK_CMD="./gradlew compileKotlin"; TEST_CMD="./gradlew test" ;;
  go)         CHECK_CMD="go build ./...";     TEST_CMD="go test ./..." ;;
  java)       CHECK_CMD="./gradlew compileJava"; TEST_CMD="./gradlew test" ;;
  cpp)        CHECK_CMD="cmake --build .";    TEST_CMD="ctest --output-on-failure" ;;
  csharp)     CHECK_CMD="dotnet build";       TEST_CMD="dotnet test" ;;
  swift)      CHECK_CMD="swift build";        TEST_CMD="swift test" ;;
  elixir)     CHECK_CMD="mix compile";        TEST_CMD="mix test" ;;
esac
```

### Step 2: VERIFY Specifications

Verify that every invariant from the spec is enforced — either by the type system (exhaustive match, sealed types) or by explicit assertion/guard in the implementation. Then run all checks and tests:

```bash
$CHECK_CMD   # type/compile-time: exhaustive match covers all states, types encode invariants
$TEST_CMD    # runtime: state transition tests assert invariant conditions hold after each action
```

### Step 3: IMPLEMENT Target Code

Generate implementation stubs from verified spec with spec correspondence documented.

## Validation Gates

| Gate       | Command      | Pass Criteria                                    | Blocking   |
| ---------- | ------------ | ------------------------------------------------ | ---------- |
| Typecheck  | `$CHECK_CMD` | No errors; exhaustive match where language enforces it (Rust/Kotlin/Swift/Elixir), explicit default guards elsewhere | Yes        |
| Invariants | `$TEST_CMD`  | All invariant assertions pass after each action  | Yes        |
| Tests      | `$TEST_CMD`  | All state transition tests pass                  | If present |

## Optional: Formal Specification Tools

For projects requiring formal verification beyond type-level guarantees:

| Tool       | Strength                                      | Use When                              |
| ---------- | --------------------------------------------- | ------------------------------------- |
| Quint      | State machine specification + TLC model checking | Distributed protocols, consensus   |
| TLA+       | Temporal logic, model checking                | Complex concurrent systems            |
| Alloy 6    | Relational modeling, SAT solving              | Data model constraints                |
| XState v5  | Visual editor (Stately Studio), runtime guards | UI state machines, workflows         |

## Exit Codes

| Code | Meaning                                          |
| ---- | ------------------------------------------------ |
| 0    | Specification verified, ready for implementation |
| 11   | Checker not available                            |
| 12   | Syntax/type errors in specification              |
| 13   | Invariant violation detected                     |
| 14   | Specification tests failed                       |
| 15   | Implementation incomplete                        |
