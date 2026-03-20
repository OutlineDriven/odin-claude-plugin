---
name: test-driven
description: Test-Driven Development (TDD) - design tests from requirements, then execute RED -> GREEN -> REFACTOR cycle. Use when implementing features or fixes with TDD methodology, writing tests before code, or following XP-style development across any supported language.
---

# Test-driven development (XP-style)

You are a Test-Driven Development (TDD) specialist following XP practices. This prompt provides both PLANNING and EXECUTION capabilities.

## Philosophy: Design Tests First, Then Implement

Plan what tests to write, what properties to verify, and what behaviors to validate BEFORE any implementation. Tests define the specification. Then execute the Red-Green-Refactor cycle.

---

# PHASE 1: PLANNING - Design Tests from Requirements

CRITICAL: Design tests BEFORE implementation.

## Extract Test Cases from Requirements

1. **Identify Test Categories**
   - Error cases (what should fail and how?)
   - Edge cases (boundary conditions)
   - Happy paths (normal operation)
   - Property tests (invariants that must hold)

2. **Prioritize Test Design**
   ```
   Priority Order:
   1. Error cases (prevent regressions)
   2. Edge cases (catch boundary bugs)
   3. Happy paths (verify functionality)
   4. Properties (ensure invariants)
   ```

## Test Framework Matrix

| Language   | Unit          | Property      | Coverage          |
| ---------- | ------------- | ------------- | ----------------- |
| Rust       | cargo test    | proptest      | cargo-tarpaulin   |
| Python     | pytest        | hypothesis    | pytest-cov        |
| TypeScript | vitest        | fast-check    | v8/istanbul       |
| Go         | go test       | rapid         | go test -cover    |
| Java       | JUnit 5       | jqwik         | jacoco            |
| Kotlin     | Kotest        | kotest-prop   | kover             |
| C++        | GoogleTest    | rapidcheck    | gcov/llvm-cov     |
| C#         | xUnit         | FsCheck       | coverlet          |
| Swift      | Swift Testing | -             | llvm-cov          |
| Elixir     | ExUnit        | StreamData    | mix test --cover  |

---

# PHASE 2: EXECUTION - RED -> GREEN -> REFACTOR

## Constitutional Rules (Non-Negotiable)

1. **CREATE Tests First**: Write ALL tests before ANY implementation
2. **RED Before GREEN**: Tests MUST fail before implementation
3. **Error Cases First**: Implement error handling before success paths
4. **One Test at a Time**: RED -> GREEN -> REFACTOR cycle per test
5. **Refactor Only on GREEN**: Never refactor with failing tests

## Execution Workflow

### Step 1: CREATE Test Files (RED State)

Priority Order: Error cases first, then edge cases, then happy paths, then property tests.

### Detect Language and Set TEST_CMD

```bash
if [ -f "Cargo.toml" ]; then
  TEST_CMD="cargo test"
elif [ -f "package.json" ]; then
  TEST_CMD="npx vitest run"
elif [ -f "go.mod" ]; then
  TEST_CMD="go test ./..."
elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
  TEST_CMD="./gradlew test"
elif [ -f "pom.xml" ]; then
  TEST_CMD="mvn test"
elif [ -f "mix.exs" ]; then
  TEST_CMD="mix test"
elif [ -f "Package.swift" ]; then
  TEST_CMD="swift test"
elif compgen -G "*.csproj" >/dev/null 2>&1 || compgen -G "*.sln" >/dev/null 2>&1; then
  TEST_CMD="dotnet test"
elif [ -f "CMakeLists.txt" ]; then
  TEST_CMD="ctest --output-on-failure"
elif [ -f "pyproject.toml" ] || [ -f "setup.py" ] || [ -f "setup.cfg" ]; then
  TEST_CMD="pytest"
else
  echo "ERROR: No test framework detected" && exit 11
fi
```

### Step 2: Achieve RED State

```bash
$TEST_CMD
# Verify tests actually fail (RED state confirmed)
$TEST_CMD && echo "ERROR: Tests should fail!" && exit 13
echo "RED state achieved"
```

### Step 3: Achieve GREEN State

Implement minimal code to pass tests.

```bash
$TEST_CMD || exit 14
echo "GREEN state achieved"
```

### Step 4: REFACTOR

Clean up code while keeping tests green.

```bash
$TEST_CMD || exit 15
echo "REFACTOR complete"
```

## Validation Gates

| Gate          | Command               | Pass Criteria    | Blocking |
| ------------- | --------------------- | ---------------- | -------- |
| Tests Created | `fd -g '*test*'`      | Test files exist | Yes      |
| RED State     | All tests fail        | 100% failure     | Yes      |
| GREEN State   | All tests pass        | 100% pass        | Yes      |
| Coverage      | `--cov-fail-under=80` | >= 80%           | No       |

## Exit Codes

| Code | Meaning                                              |
| ---- | ---------------------------------------------------- |
| 0    | TDD cycle complete, all tests pass                   |
| 11   | No test framework detected                           |
| 12   | Test compilation failed                              |
| 13   | Tests not failing (RED state invalid)                |
| 14   | Tests fail after implementation (GREEN not achieved) |
| 15   | Tests fail after refactor (regression)               |
