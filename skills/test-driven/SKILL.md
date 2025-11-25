---
name: test-driven-development
description: eXtreme Programming: Test-Driven Development (XP-style TDD) Skill
---

# eXtreme Programming: Test-Driven Development (XP-style TDD) Skill

## Description

This skill enables test-driven development (TDD) using the Red-Green-Refactor cycle. It supports comprehensive language coverage (Rust, Python, TypeScript, Go, Java, C#, C++) with language-specific test runners, conventions, and best practices.

## When to Use

- Implementing new features with high confidence
- Ensuring code correctness from the start
- Building maintainable, well-tested codebases
- Preventing regressions
- Documenting behavior through tests
- Practicing extreme programming (XP)

## Capabilities

1. **Language Detection**
   - Auto-detect project language
   - Identify test framework
   - Validate test runner availability

2. **Red-Green-Refactor Guidance**
   - RED: Guide writing failing tests
   - GREEN: Implement minimal code to pass
   - REFACTOR: Clean up while maintaining green tests

3. **Test Execution**
   - Run language-appropriate test commands
   - Parse test output for failures
   - Provide feedback on test quality

4. **Best Practices Enforcement**
   - AAA pattern (Arrange-Act-Assert)
   - One assertion per test
   - Test independence
   - Fast test execution

## Workflow

```nomnoml
[<start>Start] -> [Detect Language]
[Detect Language] -> [Validate Test Runner]
[Validate Test Runner] -> [Runner Available?]
[Runner Available?] no -> [Install Framework]
[Runner Available?] yes -> [RED: Write Test]
[Install Framework] -> [RED: Write Test]
[RED: Write Test] -> [Test Compiles?]
[Test Compiles?] no -> [Fix Syntax]
[Fix Syntax] -> [Test Compiles?]
[Test Compiles?] yes -> [Run Test]
[Run Test] -> [Fails Meaningfully?]
[Fails Meaningfully?] no -> [Refine Test]
[Refine Test] -> [Run Test]
[Fails Meaningfully?] yes -> [GREEN: Implement]
[GREEN: Implement] -> [Run Test]
[Run Test] -> [Test Passes?]
[Test Passes?] no -> [Fix Implementation]
[Fix Implementation] -> [Run Test]
[Test Passes?] yes -> [REFACTOR: Clean]
[REFACTOR: Clean] -> [Run All Tests]
[Run All Tests] -> [All Pass?]
[All Pass?] no -> [Fix Regression]
[Fix Regression] -> [Run All Tests]
[All Pass?] yes -> [More Features?]
[More Features?] yes -> [RED: Write Test]
[More Features?] no -> [<end>Complete]
```

## Exit Codes

| Code | Meaning | Remediation |
|------|---------|-------------|
| 0 | Success | Continue with next feature |
| 11 | No test framework | Install appropriate test framework |
| 12 | Test compilation failed | Fix syntax errors |
| 13 | Test not failing meaningfully | Refine test expectations |
| 14 | Implementation fails tests | Fix implementation logic |
| 15 | Refactoring broke tests | Revert changes, refactor carefully |

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

## Tiered Commands

### Basic (≤40 chars)

```bash
# Rust
cargo test

# Python
pytest

# TypeScript
vitest run

# Go
go test ./...

# Java
mvn test

# C#
dotnet test

# C++
ctest
```

### Intermediate (≤80 chars)

```bash
# Rust
cargo test test_name -- --show-output

# Python
pytest --cov=module --cov-report=term

# TypeScript
vitest --coverage --watch

# Go
go test -v -cover ./...

# Java
mvn test -Dtest=TestClass#method

# C#
dotnet test --collect:"XPlat Code Coverage"

# C++
ctest --verbose --output-on-failure
```

### Advanced (≤120 chars)

```bash
# Rust
cargo watch -x 'tarpaulin --out Lcov --all-features'

# Python
pytest-watch -v -m "not slow" -n auto

# TypeScript
vitest --ui --typecheck --browser.enabled=true

# Go
gotestsum --watch -- -race -bench=. ./...

# Java
mvn verify pitest:mutationCoverage

# C#
dotnet watch test --logger "console;verbosity=detailed"

# C++
ctest --repeat until-fail:10 --parallel 4
```

## Example: Shopping Cart Feature

### RED: Write Failing Test

#### Rust
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

Run: `cargo test` → FAILS (ShoppingCart doesn't exist)

### GREEN: Implement Minimum Code

```rust
pub struct Item {
    name: String,
    price: i32,
    quantity: i32,
}

impl Item {
    pub fn new(name: &str, price: i32) -> Self {
        Self {
            name: name.to_string(),
            price,
            quantity: 1,
        }
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
    pub fn new() -> Self {
        Self { items: Vec::new() }
    }

    pub fn add_item(&mut self, item: Item) {
        self.items.push(item);
    }

    pub fn total(&self) -> i32 {
        self.items.iter()
            .map(|item| item.price * item.quantity)
            .sum()
    }
}
```

Run: `cargo test` → PASSES

### REFACTOR: Clean Up

```rust
#[derive(Debug, Clone)]
pub struct Item {
    name: String,
    price: i32,
    quantity: i32,
}

impl Item {
    pub fn new(name: impl Into<String>, price: i32) -> Self {
        Self {
            name: name.into(),
            price,
            quantity: 1,
        }
    }

    pub fn with_quantity(mut self, qty: i32) -> Self {
        self.quantity = qty;
        self
    }

    pub fn subtotal(&self) -> i32 {
        self.price * self.quantity
    }
}

#[derive(Debug, Default)]
pub struct ShoppingCart {
    items: Vec<Item>,
}

impl ShoppingCart {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add_item(&mut self, item: Item) {
        self.items.push(item);
    }

    pub fn total(&self) -> i32 {
        self.items.iter().map(Item::subtotal).sum()
    }

    pub fn item_count(&self) -> usize {
        self.items.len()
    }
}
```

Run: `cargo test` → PASSES (all tests still green)

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

**Bad:**
```python
def test_user_registration():
    user = register_user("john@example.com", "pass123")
    assert user.email == "john@example.com"
    assert user.is_active == True
    assert user.created_at is not None
```

**Good:**
```python
def test_user_registration_sets_email():
    user = register_user("john@example.com", "pass123")
    assert user.email == "john@example.com"

def test_user_registration_activates_user():
    user = register_user("john@example.com", "pass123")
    assert user.is_active == True

def test_user_registration_sets_timestamp():
    user = register_user("john@example.com", "pass123")
    assert user.created_at is not None
```

### 4. Test Independence

```go
// Bad: Tests depend on order
func TestCreateUser(t *testing.T) {
    user := CreateUser("alice")
    // ...
}

func TestUpdateUser(t *testing.T) {
    // Assumes TestCreateUser ran first
    UpdateUser("alice", "new_name")
}

// Good: Each test is independent
func TestCreateUser(t *testing.T) {
    user := CreateUser("alice")
    // ...
}

func TestUpdateUser(t *testing.T) {
    user := CreateUser("alice") // Own setup
    UpdateUser("alice", "new_name")
}
```

### 5. Fast Tests

- Avoid file I/O
- Mock external dependencies
- Use in-memory databases
- Parallelize execution

```rust
// Enable parallel test execution
#[test]
fn test_feature_a() {
    // Fast, independent test
}

#[test]
fn test_feature_b() {
    // Fast, independent test
}

// Run with: cargo test -- --test-threads=8
```

## Common Issues

### Issue: Tests Pass Without Implementation
```bash
# Make sure test actually exercises code
# Check that assertions are meaningful
```

### Issue: Slow Test Suite
```bash
# Profile test execution
# Mock expensive operations
# Use parallel execution
```

### Issue: Flaky Tests
```bash
# Ensure test independence
# Remove timing dependencies
# Fix non-determinism
```

### Issue: Hard to Test Code
```bash
# Refactor for testability
# Use dependency injection
# Extract pure functions
```

## Integration Points

### With Spec-First
1. Write Quint specification
2. Verify specification
3. **Generate test cases from spec** ← Start TDD here
4. Follow Red-Green-Refactor
5. Ensure implementation satisfies spec

### With CI/CD
```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    cargo test --all-features
    cargo tarpaulin --out Xml
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### With Watch Mode
```bash
# Continuous testing for rapid feedback
cargo watch -x test              # Rust
pytest-watch                     # Python
vitest --watch                   # TypeScript
gotestsum --watch                # Go
dotnet watch test                # C#
fd *.cpp | entr -c ctest        # C++
```

## Property-Based Testing

Enhance TDD with property-based tests:

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

## Resources

- [Test-Driven Development by Example (Kent Beck)](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [Growing Object-Oriented Software, Guided by Tests](https://www.amazon.com/Growing-Object-Oriented-Software-Guided-Tests/dp/0321503627)
- [Extreme Programming Explained](https://www.amazon.com/Extreme-Programming-Explained-Embrace-Change/dp/0321278658)

## Invocation

To use this skill in Claude Code:

```
Use the test-driven skill to implement a shopping cart feature
```

Or directly:

```
/test-driven shopping-cart rust
```

The agent will guide you through the complete Red-Green-Refactor cycle with language-specific best practices.
