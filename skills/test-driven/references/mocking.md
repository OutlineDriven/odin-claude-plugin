# When to Mock

Mock at **system boundaries** only:

- External APIs (payment, email, etc.)
- Databases (sometimes — prefer a test DB)
- Time / randomness
- File system (sometimes)

Do not mock:

- Internally owned classes / modules
- Internal collaborators
- Anything under the same change boundary as the test subject

## Designing for Mockability

At system boundaries, design interfaces that are easy to mock.

### 1. Use dependency injection

Pass external dependencies in rather than constructing them internally.

**Python**

```python
# Easy to mock — gateway is a parameter
def process_payment(order: Order, payment_client: PaymentClient) -> Receipt:
    return payment_client.charge(order.total)

# Hard to mock — gateway is hard-wired inside
def process_payment(order: Order) -> Receipt:
    client = StripeClient(os.environ["STRIPE_KEY"])
    return client.charge(order.total)
```

**Rust**

```rust
// Easy to mock — trait object passed in
fn process_payment(order: &Order, client: &dyn PaymentClient) -> Receipt {
    client.charge(order.total)
}

// Hard to mock — concrete type constructed inside
fn process_payment(order: &Order) -> Receipt {
    let client = StripeClient::new(env::var("STRIPE_KEY").unwrap());
    client.charge(order.total)
}
```

### 2. Prefer SDK-style interfaces over generic fetchers

Define a specific function for each external operation rather than one generic dispatcher with conditional logic. Each operation becomes independently mockable.

**Python**

```python
# GOOD — every method has one shape; mocks return one value
class Api:
    def get_user(self, user_id: int) -> User: ...
    def get_orders(self, user_id: int) -> list[Order]: ...
    def create_order(self, data: OrderInput) -> Order: ...

# BAD — mocking requires conditional logic per endpoint
class Api:
    def fetch(self, endpoint: str, options: dict) -> Any: ...
```

**Rust**

```rust
// GOOD — distinct method per operation
trait Api {
    fn get_user(&self, id: UserId) -> Result<User>;
    fn get_orders(&self, user: UserId) -> Result<Vec<Order>>;
    fn create_order(&self, data: OrderInput) -> Result<Order>;
}

// BAD — one method, many shapes, branchy mock
trait Api {
    fn fetch(&self, endpoint: &str, options: &Options) -> Result<Value>;
}
```

The SDK-style approach yields:

- One mock per shape; no conditionals in test setup
- Visible call surface — readers see which endpoints a test exercises
- Per-endpoint type safety
