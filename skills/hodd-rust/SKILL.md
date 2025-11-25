---
name: hodd-rust
description: Validation-first Rust development merging Type-driven + Spec-first + Proof-driven + Design-by-contracts + Test-driven (XP). Use for Rust projects requiring formal verification, safety proofs, comprehensive validation, or when working with unsafe code, concurrency, or FFI boundaries.
---

# HODD-RUST: Stronger Outline Driven Development For Rust

## Philosophy

Validation-first Rust programming that merges five verification paradigms:
- **Type-driven**: Leverage Rust's type system + external Idris2/Flux for refined types
- **Spec-first**: Quint specifications and Kani bounded model checking
- **Proof-driven**: Lean4 formal proofs for critical algorithms
- **Design-by-contracts**: Prusti pre/postconditions and invariants
- **Test-driven (XP)**: Property-based testing with proptest/quickcheck

## Tool Stack

| Layer | Tool | Usage | Notes |
|-------|------|-------|-------|
| 0 | rustc, rustfmt, Clippy | Standard toolchain | Always run |
| 0 | cargo-audit, cargo-deny | Security/dependency | CI mandatory |
| 1 | Miri | Runtime UB detection | Local debugging only, NOT for CI |
| 2 | Loom | Concurrency testing | Critical concurrent code only |
| 3 | Typestate/Newtype/Phantom | Rust type patterns | Compile-time guarantees |
| 3 | Flux | Refined types | Rust-native refinements |
| 3 | Idris2 | Type-driven prototyping | External, design validation |
| 4 | Prusti | Pre/postconditions | Apply with caution for readability |
| 5 | Lean4 | Formal proofs | External, algorithm verification |
| 6 | Kani | Bounded model checking | Minimal in production code |
| 6 | Quint | Spec-first design | External, protocol specs |
| 6 | Verus | Verified Rust | External, design validation |
| 7 | Progenitor | OpenAPI generation | When applicable |

## Workflow

```
PLAN
  |
  v
DETECT: Find unsafe/FFI/concurrency/existing annotations
  |
  v
DESIGN: Select tools per code criticality
  |
  v
VALIDATE
  |
  +---> BASIC: rustfmt -> clippy -> audit -> deny
  |
  +---> TYPE: Typestate/Newtype patterns, Flux refinements
  |
  +---> CONTRACT: Prusti verification (if annotations present)
  |
  +---> SPEC: Kani proofs (if bounded proofs present)
  |
  +---> CONCURRENCY: Loom tests (if concurrent code)
  |
  +---> RUNTIME: Miri (local UB debugging only)
  |
  v
TEST: cargo test + property tests + coverage
  |
  v
EXTERNAL (optional)
  |
  +---> Idris2: Type-level design validation
  +---> Lean4: Formal algorithm proofs
  +---> Quint: Protocol specifications
  +---> Verus: Verified Rust prototypes
  |
  v
COMPLETE
```

## Commands (Tiered)

### Basic (Precondition Check)
```bash
# Verify toolchain
command -v rustc >/dev/null || exit 11
command -v cargo >/dev/null || exit 11

# Format check
cargo fmt --check || exit 12

# Lint with all warnings as errors
cargo clippy -- -D warnings || exit 13
```

### Intermediate (Validation)
```bash
# Security audit
cargo audit || exit 14
cargo deny check || exit 14

# Run tests
cargo test || exit 13

# Coverage (if tarpaulin available)
command -v cargo-tarpaulin && cargo tarpaulin --out Html
```

### Advanced (Formal Verification)
```bash
# Prusti contracts (if annotations present)
rg '#\[requires\]|#\[ensures\]|#\[invariant\]' -q -t rust && {
  command -v cargo-prusti && cargo prusti || exit 15
}

# Kani bounded model checking (if proofs present)
rg '#\[kani::proof\]' -q -t rust && {
  command -v cargo-kani && cargo kani || exit 15
}

# Flux refined types (if refinements present)
rg '#\[flux::' -q -t rust && {
  command -v flux && flux check || exit 15
}

# Loom concurrency tests (if present)
rg 'loom::' -q -t rust && {
  cargo test --features loom || exit 15
}

# Miri UB detection (advisory: local debugging only)
# Note: Not recommended for CI/CD pipelines
cargo +nightly miri test || exit 15
```

### External Tools (Optional)
```bash
# Idris2 type-driven models
fd -e idr -e lidr . .outline/proofs/ && {
  command -v idris2 && idris2 --check .outline/proofs/*.idr || exit 16
}

# Lean4 formal proofs
fd lakefile.lean . .outline/proofs/ && {
  command -v lake && (cd proofs && lake build) || exit 16
  # Verify no 'sorry' placeholders remain
  rg 'sorry' .outline/proofs/*.lean && exit 16
}

# Quint specifications
fd -e qnt . .outline/specs/ && {
  command -v quint && quint typecheck .outline/specs/*.qnt || exit 16
  quint verify .outline/specs/*.qnt || exit 16
}

# Verus verified Rust
rg 'verus!' -q -t rust && {
  command -v verus && verus src/*.rs || exit 16
}
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | All validations pass | Proceed to deployment |
| 11 | Toolchain missing | Install rustup/cargo |
| 12 | Format violations | Run `cargo fmt` |
| 13 | Clippy/test failures | Fix warnings/tests |
| 14 | Security/dependency issues | Review audit findings |
| 15 | Formal verification failed | Fix .outline/proofs/contracts |
| 16 | External tool validation failed | Fix Idris2/Lean4/Quint specs |

## Rust-Specific Patterns

### Typestate Pattern
```rust
// Compile-time state machine enforcement
struct Unvalidated;
struct Validated;

struct Request<State> {
    data: String,
    _state: PhantomData<State>,
}

impl Request<Unvalidated> {
    fn validate(self) -> Result<Request<Validated>, Error> { ... }
}

impl Request<Validated> {
    fn process(self) -> Response { ... } // Only callable after validation
}
```

### Newtype Pattern
```rust
// Type-safe wrappers preventing mixing
struct UserId(u64);
struct OrderId(u64);

fn get_order(user: UserId, order: OrderId) { ... }
// Compiler prevents: get_order(order_id, user_id)
```

### Prusti Contracts
```rust
use prusti_contracts::*;

#[requires(x > 0)]
#[ensures(result > x)]
fn double_positive(x: i32) -> i32 {
    x * 2
}
```

### Kani Proof
```rust
#[cfg(kani)]
#[kani::proof]
fn verify_no_overflow() {
    let x: u8 = kani::any();
    let y: u8 = kani::any();
    kani::assume(x < 128 && y < 128);
    assert!(x.checked_add(y).is_some());
}
```

### Loom Concurrency Test
```rust
#[cfg(loom)]
#[test]
fn test_concurrent_access() {
    loom::model(|| {
        let data = Arc::new(AtomicUsize::new(0));
        let d1 = data.clone();
        let d2 = data.clone();

        let t1 = loom::thread::spawn(move || d1.fetch_add(1, Ordering::SeqCst));
        let t2 = loom::thread::spawn(move || d2.fetch_add(1, Ordering::SeqCst));

        t1.join().unwrap();
        t2.join().unwrap();

        assert_eq!(data.load(Ordering::SeqCst), 2);
    });
}
```

## Detection Commands

```bash
# Find unsafe blocks requiring Miri/manual review
rg 'unsafe\s*\{' -t rust

# Find FFI boundaries
rg 'extern\s+"C"' -t rust

# Find concurrent code requiring Loom
rg 'Arc|Mutex|RwLock|atomic|thread::spawn|tokio::spawn' -t rust

# Find existing Prusti annotations
rg '#\[(requires|ensures|invariant)\]' -t rust

# Find existing Kani proofs
rg '#\[kani::proof\]' -t rust

# Find Flux refinements
rg '#\[flux::' -t rust

# Find property tests
rg 'proptest!|quickcheck' -t rust
```

## Best Practices

1. **Unsafe Blocks**: Always document safety invariants; validate with Miri locally
2. **Concurrency**: Use Loom for lock-free algorithms and atomic operations
3. **Contracts**: Apply Prusti selectively to critical functions; avoid annotation bloat
4. **Proofs**: Use Kani for bounded verification of overflow, panics, assertions
5. **External Tools**: Keep Idris2/Lean4/Quint specs outside main codebase
6. **CI Pipeline**: rustfmt -> clippy -> audit -> deny -> test (Miri optional/local)
7. **Coverage**: Aim for 80%+ with tarpaulin; property tests for edge cases

## Integration with ODD

HODD-RUST fits within Outline Driven Development:

1. **Outline**: Document validation strategy in design phase
2. **Contracts**: Prusti annotations as executable contracts
3. **Proofs**: Kani/Lean4 for algorithm correctness
4. **Specs**: Quint for protocol-level specifications
5. **Tests**: Property-based tests validate proven properties
6. **Determinism**: Exit codes enable scripted validation gates
