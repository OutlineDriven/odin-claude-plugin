---
description: Execute test-driven development workflow
allowed-tools: Read, Grep, Glob, Bash
---

You are executing test-driven development with comprehensive testing.

## Execution Steps

1. **CHECK**: Verify test framework is available
2. **RUN**: Execute test suite
3. **ANALYZE**: Check coverage and failures
4. **ITERATE**: Red-Green-Refactor cycle

## Commands by Language

### Rust
```bash
# Run all tests
cargo test || exit 13

# With coverage
cargo tarpaulin --out Html || exit 14

# Property tests
cargo test --features proptest || exit 13
```

### Python
```bash
# Run pytest
pytest $ARGUMENTS -v || exit 13

# With coverage
pytest --cov=$ARGUMENTS --cov-report=html || exit 14

# Property tests
pytest --hypothesis-show-statistics || exit 13
```

### TypeScript
```bash
# Vitest
npx vitest run || exit 13

# Jest
npx jest || exit 13

# With coverage
npx vitest run --coverage || exit 14
```

### Go
```bash
# Run tests
go test ./... || exit 13

# With coverage
go test -coverprofile=coverage.out ./... || exit 14

# Race detection
go test -race ./... || exit 13
```

### Java
```bash
# Maven
mvn test || exit 13

# Gradle
./gradlew test || exit 13

# With coverage
mvn test jacoco:report || exit 14
```

### C++
```bash
# GoogleTest with CMake
cmake --build build --target test || exit 13

# Direct execution
./build/tests || exit 13
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | All tests pass |
| 11 | Framework missing | Install test framework |
| 12 | No tests | Create test files |
| 13 | Tests failed | Fix failing tests |
| 14 | Coverage low | Add more tests |

## Test Patterns

### AAA Pattern (Arrange-Act-Assert)
```
ARRANGE: Set up test fixtures
  |
  v
ACT: Execute the code under test
  |
  v
ASSERT: Verify expected outcomes
```

### Property-Based Testing
```
DEFINE: Property that must hold
  |
  v
GENERATE: Random inputs
  |
  v
VERIFY: Property holds for all inputs
  |
  v
SHRINK: Find minimal failing case
```

## Workflow

```
CHECK (framework available)
  |
  v
RUN (execute tests)
  |
  v
ANALYZE (failures, coverage)
  |
  v
ITERATE (fix or add tests)
  |
  v
SUCCESS (exit 0)
```

Execute tests. Report failures with context. Suggest fixes for common issues.
