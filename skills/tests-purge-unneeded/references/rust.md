# Rust — cargo test deletion patterns

Rust's type system is the strongest of the mainstream languages — ownership, lifetimes, exhaustive matching, no implicit conversions, no null. **A test that asserts a struct has the fields the compiler proved it has catches nothing.** The compiler is the test for structure; `cargo test` is for behavior at boundaries.

## Delete

### Struct field initialization

```rust
#[derive(Debug, PartialEq)]
struct User {
    id: u64,
    name: String,
}

#[test]
fn user_constructor_sets_fields() {
    let u = User { id: 1, name: "alice".into() };
    assert_eq!(u.id, 1);
    assert_eq!(u.name, "alice");
}
```

The compiler proves that `User { id: 1, name: "alice".into() }` constructs a `User` with those exact fields. The test is a tautology.

### Identity / passthrough functions

```rust
fn wrap(n: u64) -> u64 {
    n
}

#[test]
fn wrap_returns_input() {
    assert_eq!(wrap(42), 42);
}
```

If `wrap` is genuinely identity, it is dead code — `let n = n;` should be inlined and the function deleted. The test then deletes itself.

### Pure type-check tests (no runtime work, no panic surface)

```rust
#[test]
fn http_client_typestate_compiles() {
    // Only declarations — no method calls that could panic, no I/O, no Result-bearing work
    let _: PhantomData<HttpClient<Configured>> = PhantomData;
}
```

Delete this kind of test only when the test's *sole* purpose is type-checking AND it has no meaningful runtime behavior — no method calls that could panic, no `unwrap`/`expect`, no I/O, no fallible operations. Such tests should live in `trybuild` UI tests rather than the regular test runner.

**Keep no-assert smoke tests** — a `#[test]` with no `assert!` still fails the suite if any code it executes panics, returns an unhandled `Err`, or aborts. A test like:

```rust
#[test]
fn parser_does_not_panic_on_empty_input() {
    parse(""); // no assert, but a panic in `parse` would fail this test
}
```

is a real smoke test against the panic-free contract. Keep.

**Important caveat**: a runtime assertion (`assert_eq!(get_id(&item), 7)`) tests the *behavior* of `get_id` / `HasId for Foo`, not just the type. That is a real-bug test (a refactor could swap fields, change the impl, etc.) — see the **Keep** section below.

### Default::default trivial assertion

```rust
#[derive(Default)]
struct Config {
    debug: bool,
    timeout_ms: u64,
}

#[test]
fn config_default() {
    let c = Config::default();
    assert_eq!(c.debug, false);
    assert_eq!(c.timeout_ms, 0);
}
```

`#[derive(Default)]` generates exactly this. Asserting the derived behavior tests the compiler, not your code. Delete unless the `Default` impl is hand-written and *non-obvious*.

## Keep

### `serde::Deserialize` reject path

```rust
#[test]
fn deserialize_rejects_missing_required_field() {
    let json = r#"{"name": "alice"}"#;  // missing required "id"
    let result: Result<User, _> = serde_json::from_str(json);
    assert!(result.is_err());
}
```

JSON parsing is a runtime boundary — the type system does not check JSON shape. Real-bug surface. Keep.

### Error-type variants

```rust
#[test]
fn validate_returns_invalid_email_for_no_at() {
    match validate_email("alice") {
        Err(ValidationError::InvalidEmail) => {}
        other => panic!("expected InvalidEmail, got {:?}", other),
    }
}
```

Tests the *semantic* of the error variant — what failure produces what error. Real-bug surface (a refactor could silently return a different variant). Keep.

### Trait impl behavior at boundary

```rust
#[test]
fn user_repo_persists_to_real_postgres() {
    let pool = test_pool();
    let repo = PgUserRepo::new(pool.clone());
    let user = User { id: 1, name: "alice".into() };
    repo.save(&user).unwrap();
    let found = repo.find(1).unwrap();
    assert_eq!(found.name, "alice");
}
```

Real DB, real transaction — catches schema mismatches, query bugs, sqlx type-mapping errors. Keep.

### Unsafe invariant

```rust
#[test]
fn from_raw_parts_handles_zero_length() {
    let v: Vec<u8> = unsafe { Vec::from_raw_parts(std::ptr::NonNull::dangling().as_ptr(), 0, 0) };
    assert!(v.is_empty());
}
```

Tests the contract of `unsafe` code at its boundary — exactly where the compiler stops helping. Keep, and keep proudly.

### Concurrency invariant

```rust
#[test]
fn channel_drops_remaining_messages_on_close() {
    // tests the actual concurrency contract — compiler cannot prove this
}
```

Type system enforces send/sync; it does not enforce *semantics* of concurrent operations. Keep.
