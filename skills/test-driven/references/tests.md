# Good and Bad Tests

## Good Tests

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

## Bad Tests

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

## Verify Through the Interface, Not the Side Channel

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
