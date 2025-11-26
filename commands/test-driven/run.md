---
description: Execute test-driven development workflow
---
You are executing test-driven development. This phase CREATES test artifacts from the plan and runs the Red-Green-Refactor cycle.

## Execution Steps

1. **CREATE**: Generate test files from plan design
2. **RED**: Run tests (expect failures for new features)
3. **GREEN**: Implement minimal code to pass
4. **REFACTOR**: Improve without breaking tests

## Phase 1: Create Test Artifacts

```bash
# Create .outline/tests directory structure
mkdir -p .outline/tests/{unit,integration,property}
```

### Generate Test Files from Plan

Create test files with cases from the plan design:

```
// .outline/tests/unit/{module}_test.{ext}
// Generated from plan design

// ============================================
// Source Requirement: {traceability from plan}
// ============================================

// Test Case: {description from plan}
// Arrange: {setup from plan}
// Act: {action from plan}
// Assert: {expected outcome from plan}
test("{test_name}", () => {
  // RED: This test should initially fail
  // Arrange
  const input = setupFromPlan();

  // Act
  const result = functionUnderTest(input);

  // Assert
  expect(result).toEqual(expectedFromPlan);
});

// Property Test: {invariant from plan}
// For all valid inputs, {property} should hold
test.prop("{property_name}", () => {
  // Generator from plan
  const input = arbitrary(inputSpec);

  // Property from plan
  return propertyHolds(input);
});

// Edge Case: {boundary from plan}
test("{edge_case_name}", () => {
  // Boundary condition from plan
  const edge = boundaryValue;
  expect(() => functionUnderTest(edge)).toMatchBehavior();
});
```

## Phase 2: Execute Red-Green-Refactor

### RED Phase (Tests Fail)
```bash
# Run tests expecting failures for new features
# This validates test correctness - tests should fail before implementation

# TypeScript/JavaScript
npx vitest run || echo "RED: Tests failing as expected"

# Python
pytest .outline/tests/ -v || echo "RED: Tests failing as expected"

# Rust
cargo test || echo "RED: Tests failing as expected"

# Go
go test ./... || echo "RED: Tests failing as expected"
```

### GREEN Phase (Minimal Implementation)
```bash
# After implementing minimal code to pass tests
# All tests should now pass

# TypeScript/JavaScript
npx vitest run || exit 13

# Python
pytest .outline/tests/ -v || exit 13

# Rust
cargo test || exit 13

# Go
go test ./... || exit 13
```

### REFACTOR Phase (Improve Code)
```bash
# After refactoring, tests must still pass
# Run with coverage to ensure nothing regressed

# TypeScript/JavaScript
npx vitest run --coverage || exit 13

# Python
pytest --cov=$MODULE --cov-report=html || exit 14

# Rust
cargo tarpaulin --out Html || exit 14

# Go
go test -coverprofile=coverage.out ./... || exit 14
```

## Framework-Specific Commands

### Rust
```bash
# Unit tests
cargo test --lib || exit 13

# Integration tests
cargo test --test '*' || exit 13

# Property tests (proptest)
cargo test --features proptest || exit 13

# Coverage
cargo tarpaulin --out Html --output-dir .outline/tests/coverage
```

### Python
```bash
# All tests
pytest .outline/tests/ -v || exit 13

# Property tests (hypothesis)
pytest --hypothesis-show-statistics || exit 13

# Coverage
pytest --cov=$MODULE --cov-report=html --cov-report=term
```

### TypeScript
```bash
# Vitest
npx vitest run || exit 13

# Property tests (fast-check)
npx vitest run --reporter=verbose || exit 13

# Coverage
npx vitest run --coverage
```

### Go
```bash
# Unit tests
go test ./... -v || exit 13

# Race detection
go test -race ./... || exit 13

# Coverage
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | All tests pass, coverage met |
| 11 | Framework missing | Install test framework |
| 12 | No test files | Run plan phase, create tests |
| 13 | Tests failed | Fix implementation or test |
| 14 | Coverage low | Add more tests |

## Test Patterns Reference

### AAA Pattern
```
ARRANGE: Set up test fixtures and preconditions
    |
    v
ACT: Execute the code under test
    |
    v
ASSERT: Verify expected outcomes
```

### Property-Based Testing
```
DEFINE: Property that must always hold
    |
    v
GENERATE: Random valid inputs
    |
    v
VERIFY: Property holds for all inputs
    |
    v
SHRINK: Find minimal failing case
```

## Workflow

```
CREATE (generate test files from plan)
  |
  v
RED (tests fail - validates test correctness)
  |
  v
GREEN (minimal implementation to pass)
  |
  v
REFACTOR (improve without breaking)
  |
  v
COVERAGE (verify test coverage)
  |
  v
SUCCESS (exit 0)
```

## Output Report

Provide:
- Test files created in `.outline/tests/`
- Red phase results (expected failures)
- Green phase results (all passing)
- Coverage percentage
- Property test statistics
- Traceability update (requirement -> test -> status)

Execute with thoroughness. Report test results clearly.
