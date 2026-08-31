# Good and bad tests

## Good tests

**Integration-style**: drive the system through real public interfaces, not through mocks of internal parts.

**Python**

```python
# GOOD — tests observable behavior
def test_user_can_checkout_with_valid_cart():
    cart = create_cart()
    cart.add(product)
    result = checkout(cart, payment_method)
    assert result.status == "confirmed"
```

**Rust**

```rust
// GOOD — tests observable behavior
#[test]
fn user_can_checkout_with_valid_cart() {
    let mut cart = create_cart();
    cart.add(product);
    let result = checkout(&cart, &payment_method).unwrap();
    assert_eq!(result.status, Status::Confirmed);
}
```

Characteristics of good tests:

- Test behavior the caller cares about
- Use the public API only
- Survive internal refactors
- Describe **what**, not **how**
- One logical assertion per test

## Bad tests

**Implementation-detail tests**: coupled to internal structure; break under refactors that preserve behavior.

**Python**

```python
# BAD — asserts on internal call
def test_checkout_calls_payment_service_process(monkeypatch):
    spy = MagicMock()
    monkeypatch.setattr(payment_service, "process", spy)
    checkout(cart, payment)
    spy.assert_called_with(cart.total)
```

**Rust**

```rust
// BAD — asserts on internal call via a hand-rolled spy
#[test]
fn checkout_calls_payment_service_process() {
    let spy = SpyPaymentService::new();
    checkout(&cart, &payment, &spy);
    assert_eq!(spy.calls(), vec![Call::Process(cart.total)]);
}
```

Red flags:

- Mocking internal collaborators
- Testing private methods
- Asserting on call counts or call order
- Test breaks under a refactor that did not change behavior
- Test name describes **how**, not **what**
- Verifying outcomes through a side channel instead of through the interface

## Tautological tests

A tautological assertion computes its expected value with the same rule as the implementation, so it cannot reveal a disagreement. Use a known-good literal, worked example, or specification instead.

**TypeScript**

```typescript
// BAD — expected value repeats the implementation's addition rule
expect(add(a, b)).toBe(a + b);

// GOOD — expected value comes from a worked example
expect(add(2, 3)).toBe(5);
```

**Python**

```python
# BAD — expected value repeats the implementation's addition rule
assert add(a, b) == a + b

# GOOD — expected value comes from a worked example
assert add(2, 3) == 5
```

## Verify through the interface, not the side channel

**Python**

```python
# BAD — bypasses the interface to inspect storage
def test_create_user_saves_to_database():
    create_user({"name": "Alice"})
    row = db.query("SELECT * FROM users WHERE name = ?", ["Alice"])
    assert row is not None

# GOOD — verifies through the interface itself
def test_create_user_makes_user_retrievable():
    user = create_user({"name": "Alice"})
    retrieved = get_user(user.id)
    assert retrieved.name == "Alice"
```

**Rust**

```rust
// BAD — bypasses the interface to inspect storage
#[test]
fn create_user_saves_to_database() {
    create_user(NewUser { name: "Alice".into() }).unwrap();
    let row = db.query_one("SELECT * FROM users WHERE name = $1", &[&"Alice"]).unwrap();
    assert!(row.get::<_, Option<i64>>(0).is_some());
}

// GOOD — verifies through the interface itself
#[test]
fn create_user_makes_user_retrievable() {
    let user = create_user(NewUser { name: "Alice".into() }).unwrap();
    let retrieved = get_user(user.id).unwrap();
    assert_eq!(retrieved.name, "Alice");
}
```
