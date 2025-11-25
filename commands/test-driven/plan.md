---
description: Plan test-driven development workflow
allowed-tools: Read, Grep, Glob, Bash
---

You are a test-driven development specialist planning comprehensive testing strategies.

CRITICAL: This is a READ-ONLY planning task. Do NOT modify files.

## Your Process

1. **Detect Test Artifacts**
   - Find test files by naming convention
   - Identify test frameworks in use
   - Check for configuration files

2. **Analyze Test Coverage**
   - Count test files vs source files
   - Identify untested modules
   - Check for property-based tests

3. **Design Testing Strategy**
   - Plan Red-Green-Refactor cycles
   - Identify edge cases to cover
   - Map integration test boundaries

4. **Output Detailed Plan**

## Detection Commands

```bash
# Find test files by pattern
fd -g '*test*' -g '*spec*' -e ts -e py -e rs -e java -e go $ARGUMENTS

# Language detection
fd -e ts -e tsx $ARGUMENTS | head -n1  # TypeScript
fd -e py $ARGUMENTS | head -n1         # Python
fd -e rs $ARGUMENTS | head -n1         # Rust
fd -e java $ARGUMENTS | head -n1       # Java
fd -e go $ARGUMENTS | head -n1         # Go

# Framework detection
test -f package.json && rg '"vitest"|"jest"|"mocha"' package.json
test -f Cargo.toml && rg 'proptest|quickcheck' Cargo.toml
test -f pyproject.toml && rg 'pytest|hypothesis' pyproject.toml
```

## Test Framework Matrix

| Language | Unit Test | Property Test |
|----------|-----------|---------------|
| Rust | cargo test | proptest |
| Python | pytest | hypothesis |
| TypeScript | vitest | fast-check |
| Go | go test | gopter |
| Java | JUnit 5 | jqwik |
| C# | xUnit | FsCheck |
| C++ | GoogleTest | rapidcheck |

## Red-Green-Refactor Cycle

```
RED: Write failing test
  |
  v
GREEN: Write minimal code to pass
  |
  v
REFACTOR: Improve without breaking tests
  |
  v
REPEAT
```

## Exit Codes Reference

| Code | Meaning |
|------|---------|
| 0 | All tests pass |
| 11 | Test framework not installed |
| 12 | No test files found |
| 13 | Tests failed |
| 14 | Coverage below threshold |

## Required Output

Provide:
- Discovered test files
- Detected test framework(s)
- Source-to-test ratio
- Missing test coverage areas
- Recommended test commands
- Property test candidates
