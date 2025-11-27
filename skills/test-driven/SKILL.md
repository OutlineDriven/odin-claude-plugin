---
name: test-driven-development
description: eXtreme Programming Test-Driven Development (XP-style TDD) Skill. This skill provides both reference documentation AND execution capabilities for the full PLAN -> RED -> GREEN -> REFACTOR workflow.
---

# eXtreme Programming: Test-Driven Development (XP-style TDD) Skill

## Capability

This skill enables test-driven development (TDD) using the Red-Green-Refactor cycle. It supports comprehensive language coverage (Rust, Python, TypeScript, Go, Java, C#, C++) with language-specific test runners, conventions, and best practices.

- **Test Design**: Plan test architecture before implementation
- **Red-Green-Refactor**: Execute the complete TDD cycle
- **Multi-language Support**: 7+ languages with appropriate frameworks
- **Property-based Testing**: Enhance with generative testing

---

## When to Use

- Implementing new features with high confidence
- Ensuring code correctness from the start
- Building maintainable, well-tested codebases
- Preventing regressions
- Documenting behavior through tests
- Practicing extreme programming (XP)

---

## Workflow Overview

```nomnoml
[<start>Start] -> [Phase 1: PLAN]
[Phase 1: PLAN|
  Design test architecture
  Identify edge cases
  Map requirements to tests
] -> [Phase 2: RED]
[Phase 2: RED|
  Write failing test
  Verify test fails meaningfully
] -> [Phase 3: GREEN]
[Phase 3: GREEN|
  Implement minimal code
  Make test pass
] -> [Phase 4: REFACTOR]
[Phase 4: REFACTOR|
  Clean up code
  Maintain green tests
] -> [More Features?]
[More Features?] yes -> [Phase 2: RED]
[More Features?] no -> [<end>Complete]
```

---

## Phase 1: PLAN (Test Design)

### Process

1. **Understand Requirements**
   - Parse user's task/requirement
   - Identify testable behaviors and edge cases
   - Use sequential-thinking to plan Red-Green-Refactor cycles
   - Map requirements to test cases (error-first approach)

2. **Artifact Detection (Conditional)**
   - Check for existing test artifacts:
     ```bash
     fd -g '*test*' -g '*spec*' -e ts -e py -e rs -e java -e go $ARGUMENTS
     test -f package.json && rg '"vitest"|"jest"|"mocha"' package.json
     test -f Cargo.toml && rg 'proptest|quickcheck' Cargo.toml
     ```
   - If artifacts exist: analyze coverage gaps, plan extensions
   - If no artifacts: proceed to design test suite

3. **Design Test Architecture**
   - Design unit tests for core logic
   - Plan integration test boundaries
   - Identify property-based test candidates
   - Output: Test suite design with case signatures

4. **Prepare Run Phase**
   - Define target: `.outline/tests/` or language-specific location
   - Specify verification: test runner commands
   - Create traceability: requirement -> test case -> assertion

### Thinking Tool Integration

```
Use sequential-thinking for:
- Planning Red-Green-Refactor cycles
- Test case prioritization
- Dependency ordering

Use actor-critic-thinking for:
- Evaluating test coverage
- Challenging test effectiveness
- Edge case identification

Use shannon-thinking for:
- Coverage gap analysis
- Flaky test risk assessment
- Property-based test candidates
```

### Test Design Template

```
// Target: .outline/tests/{module}_test.{ext}

// ============================================
// From requirement: {requirement text}
// ============================================

// Unit Test: {description}
// Arrange: {setup description}
// Act: {action description}
// Assert: {expected outcome}
test_case_1() {
  // RED: This test should fail initially
  // GREEN: Minimal implementation to pass
  // REFACTOR: Improve without breaking
}

// Property-Based Test: {invariant description}
// For all valid inputs, {property} should hold
property_test_1() {
  // Generator: {input generation strategy}
  // Property: {invariant to verify}
}

// Edge Case: {boundary condition}
edge_case_1() {
  // Boundary: {specific edge case}
  // Expected: {behavior at boundary}
}
```

---

## Phase 2: RED (Write Failing Test)

### Setup

```bash
# Create .outline/tests directory structure
mkdir -p .outline/tests/{unit,integration,property}
```

### Run Tests (Expect Failure)

```bash
# TypeScript/JavaScript
npx vitest run || echo "RED: Tests failing as expected"

# Python
pytest .outline/tests/ -v || echo "RED: Tests failing as expected"

# Rust
cargo test || echo "RED: Tests failing as expected"

# Go
go test ./... || echo "RED: Tests failing as expected"
```

### Example: Shopping Cart (Rust)

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_cart_has_zero_total() {
        let cart = ShoppingCart::new();
        assert_eq!(0, cart.total());
    }

    #[test]
    fn test_adding_item_increases_total() {
        let mut cart = ShoppingCart::new();
        cart.add_item(Item::new("Widget", 10));
        assert_eq!(10, cart.total());
    }

    #[test]
    fn test_quantity_multiplies_price() {
        let mut cart = ShoppingCart::new();
        cart.add_item(Item::new("Widget", 10).quantity(3));
        assert_eq!(30, cart.total());
    }
}
```

Run: `cargo test` -> FAILS (ShoppingCart doesn't exist)

---

## Phase 3: GREEN (Implement Minimum Code)

### Implement Just Enough to Pass

```rust
pub struct Item {
    name: String,
    price: i32,
    quantity: i32,
}

impl Item {
    pub fn new(name: &str, price: i32) -> Self {
        Self { name: name.to_string(), price, quantity: 1 }
    }

    pub fn quantity(mut self, qty: i32) -> Self {
        self.quantity = qty;
        self
    }
}

pub struct ShoppingCart {
    items: Vec<Item>,
}

impl ShoppingCart {
    pub fn new() -> Self { Self { items: Vec::new() } }

    pub fn add_item(&mut self, item: Item) { self.items.push(item); }

    pub fn total(&self) -> i32 {
        self.items.iter().map(|item| item.price * item.quantity).sum()
    }
}
```

### Verify Tests Pass

```bash
# TypeScript/JavaScript
npx vitest run || exit 13

# Python
pytest .outline/tests/ -v || exit 13

# Rust
cargo test || exit 13

# Go
go test ./... || exit 13
```

---

## Phase 4: REFACTOR (Clean Up)

### Improve Code While Maintaining Green Tests

```rust
#[derive(Debug, Clone)]
pub struct Item {
    name: String,
    price: i32,
    quantity: i32,
}

impl Item {
    pub fn new(name: impl Into<String>, price: i32) -> Self {
        Self { name: name.into(), price, quantity: 1 }
    }

    pub fn with_quantity(mut self, qty: i32) -> Self {
        self.quantity = qty;
        self
    }

    pub fn subtotal(&self) -> i32 { self.price * self.quantity }
}

#[derive(Debug, Default)]
pub struct ShoppingCart { items: Vec<Item> }

impl ShoppingCart {
    pub fn new() -> Self { Self::default() }
    pub fn add_item(&mut self, item: Item) { self.items.push(item); }
    pub fn total(&self) -> i32 { self.items.iter().map(Item::subtotal).sum() }
    pub fn item_count(&self) -> usize { self.items.len() }
}
```

### Verify Tests Still Pass with Coverage

```bash
# TypeScript/JavaScript
npx vitest run --coverage || exit 13

# Python
pytest --cov=$MODULE --cov-report=html || exit 14

# Rust
cargo tarpaulin --out Html || exit 14

# Go
go test -coverprofile=coverage.out ./... || exit 14
```

---

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | All tests pass, coverage met | Continue with next feature |
| 11 | Framework missing | Install test framework |
| 12 | No test files | Run plan phase, create tests |
| 13 | Tests failed | Fix implementation or test |
| 14 | Coverage low | Add more tests |
| 15 | Refactoring broke tests | Revert changes, refactor carefully |

---

## Language Support Matrix

| Language | Test Framework | Command | Watch Mode |
|----------|---------------|---------|------------|
| Rust | cargo test | `cargo test` | `cargo watch -x test` |
| Python | pytest | `pytest` | `pytest-watch` |
| TypeScript | vitest/jest | `vitest run` | `vitest --watch` |
| Go | go test | `go test ./...` | `gotestsum --watch` |
| Java | JUnit 5 | `mvn test` | IDE integration |
| C# | xUnit | `dotnet test` | `dotnet watch test` |
| C++ | GoogleTest | `ctest` | `fd *.cpp \| entr ctest` |

## Test Framework Matrix

| Language | Unit Test | Property Test | Mock |
|----------|-----------|---------------|------|
| Rust | cargo test | proptest | mockall |
| Python | pytest | hypothesis | pytest-mock |
| TypeScript | vitest | fast-check | vi.mock |
| Go | go test | gopter | gomock |
| Java | JUnit 5 | jqwik | Mockito |
| C# | xUnit | FsCheck | Moq |
| C++ | GoogleTest | rapidcheck | GMock |

---

## Commands Reference

### Basic Commands

```bash
cargo test                    # Rust
pytest                        # Python
vitest run                    # TypeScript
go test ./...                 # Go
mvn test                      # Java
dotnet test                   # C#
ctest                         # C++
```

### Intermediate Commands

```bash
cargo test test_name -- --show-output
pytest --cov=module --cov-report=term
vitest --coverage --watch
go test -v -cover ./...
mvn test -Dtest=TestClass#method
dotnet test --collect:"XPlat Code Coverage"
ctest --verbose --output-on-failure
```

### Advanced Commands

```bash
cargo watch -x 'tarpaulin --out Lcov --all-features'
pytest-watch -v -m "not slow" -n auto
vitest --ui --typecheck --browser.enabled=true
gotestsum --watch -- -race -bench=. ./...
mvn verify pitest:mutationCoverage
dotnet watch test --logger "console;verbosity=detailed"
ctest --repeat until-fail:10 --parallel 4
```

---

## Best Practices

### 1. Test Naming

```
Rust:      test_<feature>_<condition>_<expected>
Python:    test_<feature>_when_<condition>_then_<expected>
TypeScript: 'should <expected> when <condition>'
Go:        Test<Feature><Condition>
Java:      @DisplayName("Should <expected> when <condition>")
C#:        Should<Expected>When<Condition>
C++:       TEST(Suite, Should<Expected>When<Condition>)
```

### 2. AAA Pattern

```python
def test_discount_applies_to_total():
    # ARRANGE
    cart = ShoppingCart()
    cart.add_item(Item("Widget", 100))
    discount = Discount(percent=10)

    # ACT
    total = cart.calculate_total(discount)

    # ASSERT
    assert total == 90
```

### 3. One Assertion Per Test

### 4. Test Independence

### 5. Fast Tests
- Avoid file I/O
- Mock external dependencies
- Use in-memory databases
- Parallelize execution

---

## Troubleshooting Guide

### Common Issues

| Symptom | Cause | Resolution |
|---------|-------|------------|
| Exit 11 | Test framework missing | Install: `npm i -D vitest`, `pip install pytest`, `cargo add --dev proptest` |
| Exit 12 | No test files | Run plan phase first |
| Exit 13 | Tests failed | Debug specific test |
| Exit 14 | Coverage too low | Add tests for uncovered paths |
| Flaky test | Non-determinism | Fix time/random/network dependencies |
| Slow tests | Too much I/O or sleep | Use mocks, reduce wait times |
| Test passes alone, fails in suite | Shared state pollution | Isolate test fixtures |

### Flaky Test Detection

```bash
# Run multiple times to detect flakiness
for i in {1..10}; do npm test 2>&1 | tail -1; done
```

### Debugging Commands

```bash
# Run single test
pytest test_module.py::TestClass::test_method -v
npx vitest run -t "specific test name"
cargo test test_name -- --nocapture

# Run with debugging output
pytest -v --tb=long --capture=no
npx vitest run --reporter=verbose
cargo test -- --nocapture

# Find slow tests
pytest --durations=10
```

---

## Property-Based Testing

### Rust (proptest)
```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn test_quantity_always_positive(qty in 1i32..1000) {
        let item = Item::new("Widget", 10).with_quantity(qty);
        assert!(item.subtotal() > 0);
    }
}
```

### Python (hypothesis)
```python
from hypothesis import given
import hypothesis.strategies as st

@given(st.integers(min_value=1, max_value=1000))
def test_quantity_always_positive(qty):
    item = Item("Widget", 10, quantity=qty)
    assert item.subtotal() > 0
```

### TypeScript (fast-check)
```typescript
import * as fc from 'fast-check';

it('quantity always gives positive subtotal', () => {
  fc.assert(
    fc.property(fc.integer({min: 1, max: 1000}), (qty) => {
      const item = new Item('Widget', 10, qty);
      expect(item.subtotal()).toBeGreaterThan(0);
    })
  );
});
```

---

## When NOT to Use Test-Driven Development

| Scenario | Better Alternative |
|----------|-------------------|
| Proving mathematical invariants | Proof-driven (Lean 4) |
| Ensuring type safety | Type-driven (Idris 2) |
| Verifying state machine correctness | Validation-first (Quint) |
| Exploratory prototyping | Spike first, then write tests |
| UI visual testing | Screenshot/visual regression tools |
| Already have formal specs | Generate tests from specs |

---

## Complementary Approaches

- **TDD + Property-based**: Unit tests for examples, properties for invariants
- **TDD + Contract**: Tests verify behavior, contracts enforce interfaces
- **TDD + Proof-driven**: Tests explore, proofs guarantee critical properties

---

## Resources

- [Test-Driven Development by Example (Kent Beck)](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [Growing Object-Oriented Software, Guided by Tests](https://www.amazon.com/Growing-Object-Oriented-Software-Guided-Tests/dp/0321503627)
- [Extreme Programming Explained](https://www.amazon.com/Extreme-Programming-Explained-Embrace-Change/dp/0321278658)
