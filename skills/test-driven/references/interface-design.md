# Interface Design for Testability

Good interfaces make testing natural.

## 1. Accept dependencies, do not construct them

**Python**

```python
# Testable — gateway is injected
def process_order(order: Order, gateway: PaymentGateway) -> Receipt: ...

# Hard to test — gateway is constructed internally
def process_order(order: Order) -> Receipt:
    gateway = StripeGateway()
    ...
```

**Rust**

```rust
// Testable
fn process_order(order: &Order, gateway: &dyn PaymentGateway) -> Receipt { ... }

// Hard to test
fn process_order(order: &Order) -> Receipt {
    let gateway = StripeGateway::new();
    ...
}
```

## 2. Return results, do not mutate

**Python**

```python
# Testable — pure return value
def calculate_discount(cart: Cart) -> Discount: ...

# Hard to test — hidden side effect
def apply_discount(cart: Cart) -> None:
    cart.total -= discount
```

**Rust**

```rust
// Testable
fn calculate_discount(cart: &Cart) -> Discount { ... }

// Hard to test
fn apply_discount(cart: &mut Cart) {
    cart.total -= discount;
}
```

## 3. Small surface area

- Fewer methods → fewer tests needed
- Fewer parameters → simpler test setup
- A narrow surface is easier to keep stable across refactors
