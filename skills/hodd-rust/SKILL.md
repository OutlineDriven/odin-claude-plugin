---
name: hodd-rust
description: Validation-first Rust development. Strictly validation-first before-and-after(-and-while) planning and execution. Merges Type-driven + Spec-first + Proof-driven + Design-by-contracts. Use for Rust projects requiring formal verification, safety proofs, comprehensive validation, or when working with unsafe code, concurrency, or FFI boundaries. This skill provides both reference documentation AND execution capabilities for the full PLAN -> CREATE -> VERIFY -> REMEDIATE workflow.
---

# HODD-RUST: Stronger Outline Driven Development For Rust

## Philosophy: Strict Validation-First

Strictly validation-first before-and-after(-and-while) planning and execution.

**BEFORE** (Planning Phase):
- Design type specifications (Idris2/Flux)
- Design formal specifications (Quint)
- Design proofs (Lean4)
- Design contracts (Prusti)

**WHILE** (Execution Phase):
- CREATE verification artifacts from plan
- VERIFY each artifact as created
- REMEDIATE failures immediately

**AFTER** (Completion):
- Run full validation pipeline
- Ensure all stages pass
- Document verification coverage

**Four Paradigms**:
- **Type-driven**: Rust's type system + Idris2/Flux for refined types
- **Spec-first**: Quint specifications and Kani bounded model checking
- **Proof-driven**: Lean4 formal proofs for critical algorithms
- **Design-by-contracts**: Prusti pre/postconditions and invariants

---

## When to Use

- Rust projects requiring formal verification
- Safety proofs for critical code
- Unsafe code validation
- Concurrent/parallel code with atomics
- FFI boundaries
- Lock-free algorithms

---

## Workflow Overview

```nomnoml
[<start>Requirements] -> [Phase 1: PLAN]
[Phase 1: PLAN|
  Safety analysis
  Tool selection
  Design validations
] -> [Phase 2: CREATE]
[Phase 2: CREATE|
  Prusti contracts
  Kani proofs
  Loom tests
] -> [Phase 3: VERIFY]
[Phase 3: VERIFY|
  Run validation pipeline
  Basic -> Type -> Contract -> Proof
] -> [Phase 4: REMEDIATE]
[Phase 4: REMEDIATE|
  Fix failures
  Re-verify
] -> [<end>Success]
```

---

## Tool Selection Decision Matrix

| Scenario | Primary Tool | Secondary | Avoid |
|----------|--------------|-----------|-------|
| Unsafe code, raw pointers | **Miri** | Kani | - |
| Undefined behavior detection | **Miri** | - | CI (too slow) |
| Concurrent code, atomics | **Loom** | Miri | Kani |
| Lock-free algorithms | **Loom** | - | - |
| Array bounds verification | **Flux** | Kani | - |
| Integer overflow proofs | **Kani** | Flux | - |
| Public API contracts | **Prusti** | Flux | - |
| Algorithm correctness | **Kani** | Lean4 | - |
| Protocol state machines | **Quint** | Typestate | - |
| FFI boundaries | **Miri** | Manual review | - |

---

## Tool Stack

| Tool | Usage | When to Use |
|------|-------|-------------|
| rustc, rustfmt, Clippy | Standard toolchain | Always |
| cargo-audit, cargo-deny | Security/dependency | CI mandatory |
| Miri | Runtime UB detection | Unsafe code, FFI (local only) |
| Loom | Concurrency testing | Atomics, lock-free |
| Flux | Refined types | Array bounds, overflow |
| Prusti | Pre/postconditions | Public APIs |
| Kani | Bounded model checking | Overflow, assertions |
| Lean4 | Formal proofs | Algorithms |
| Quint | Spec-first design | Protocol specs |

---

## Phase 1: PLAN (Validation Design)

### Process

1. **Understand Requirements**
   - Identify safety requirements (memory, concurrency, panic-freedom)
   - Use sequential-thinking to plan multi-tool validation
   - Map requirements to Rust verification tools

2. **Artifact Detection**
   ```bash
   rg '#\[(requires|ensures|invariant)' -t rust $ARGUMENTS  # Prusti
   rg '#\[kani::proof\]' -t rust $ARGUMENTS                  # Kani
   rg '#\[flux::' -t rust $ARGUMENTS                         # Flux
   rg 'loom::' -t rust $ARGUMENTS                            # Loom
   ```

3. **Design Rust Validation Stack**
   - Layer 0: rustc/clippy + cargo-audit/deny
   - Layer 1-2: Miri (unsafe), Loom (concurrency)
   - Layer 3: Flux refinements, Prusti contracts
   - Layer 4-5: External proofs (Lean4, Quint)
   - Layer 6: Kani bounded model checking

---

## Phase 2: CREATE (Generate Artifacts)

### Prusti Contracts

```rust
use prusti_contracts::*;

#[requires(x > 0)]
#[ensures(result > x)]
fn double_positive(x: i32) -> i32 {
    x * 2
}

#[requires(slice.len() > 0)]
#[ensures(result >= 0 && result < slice.len())]
fn find_min_index(slice: &[i32]) -> usize {
    let mut min_idx = 0;
    let mut i = 1;
    while i < slice.len() {
        body_invariant!(i > 0 && i <= slice.len());
        body_invariant!(min_idx < slice.len());
        if slice[i] < slice[min_idx] { min_idx = i; }
        i += 1;
    }
    min_idx
}
```

### Kani Proofs

```rust
#[cfg(kani)]
mod verification {
    use super::*;

    #[kani::proof]
    fn verify_no_overflow() {
        let x: u8 = kani::any();
        let y: u8 = kani::any();
        kani::assume(x < 128 && y < 128);
        assert!(x.checked_add(y).is_some());
    }

    #[kani::proof]
    #[kani::unwind(10)]
    fn verify_vec_bounds() {
        let len: usize = kani::any();
        kani::assume(len > 0 && len <= 10);
        let vec: Vec<u32> = (0..len).map(|_| kani::any()).collect();
        let idx: usize = kani::any();
        kani::assume(idx < len);
        let _ = vec[idx];
    }
}
```

### Loom Concurrency Verification

```rust
#[cfg(loom)]
mod loom_tests {
    use loom::sync::atomic::{AtomicUsize, Ordering};
    use loom::sync::Arc;
    use loom::thread;

    #[test]
    fn verify_concurrent_counter() {
        loom::model(|| {
            let counter = Arc::new(AtomicUsize::new(0));
            let c1 = counter.clone();
            let c2 = counter.clone();

            let t1 = thread::spawn(move || c1.fetch_add(1, Ordering::SeqCst));
            let t2 = thread::spawn(move || c2.fetch_add(1, Ordering::SeqCst));

            t1.join().unwrap();
            t2.join().unwrap();

            assert_eq!(counter.load(Ordering::SeqCst), 2);
        });
    }
}
```

### Flux Refinement Types

```rust
#[flux::sig(fn(x: i32{x > 0}) -> i32{v: v > 0})]
fn positive_double(x: i32) -> i32 { x * 2 }

#[flux::sig(fn(slice: &[i32][@n], idx: usize{idx < n}) -> i32)]
fn safe_index(slice: &[i32], idx: usize) -> i32 {
    slice[idx]  // Guaranteed in-bounds at compile time
}
```

---

## Phase 3: VERIFY (Validation Pipeline)

### Basic (Precondition Check)

```bash
command -v rustc >/dev/null || exit 11
cargo fmt --check || exit 12
cargo clippy -- -D warnings || exit 13
```

### Security Audit

```bash
cargo audit || exit 14
cargo deny check || exit 14
```

### Formal Verification

```bash
# Prusti contracts
rg '#\[requires\]|#\[ensures\]' -q -t rust && prusti || exit 15

# Kani bounded model checking
rg '#\[kani::proof\]' -q -t rust && kani || exit 15

# Flux refined types
rg '#\[flux::' -q -t rust && flux check || exit 15

# Loom concurrency
rg 'loom::' -q -t rust && RUSTFLAGS='--cfg loom' cargo build || exit 15
```

---

## Phase 4: REMEDIATE (Fix Failures)

### Error Scenarios

| Tool | Error Message | Fix |
|------|---------------|-----|
| Miri | `pointer out of bounds` | Check slice/array bounds |
| Miri | `memory leaked` | Ensure Drop impl |
| Miri | `data race detected` | Use atomic or sync |
| Loom | `deadlock detected` | Review lock ordering |
| Kani | `VERIFICATION FAILED` | Check counterexample |
| Kani | `unwinding assertion failed` | Increase `#[kani::unwind(N)]` |
| Prusti | `precondition might not hold` | Strengthen caller |
| Prusti | `postcondition might not hold` | Fix implementation |
| Flux | `refinement type error` | Ensure input constraints |

---

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | All validations pass | Proceed to deployment |
| 11 | Toolchain missing | Install rustup/cargo |
| 12 | Format violations | Run `cargo fmt` |
| 13 | Clippy failures | Fix warnings |
| 14 | Security/dependency issues | Review audit findings |
| 15 | Formal verification failed | Fix proofs/contracts |
| 16 | External tool validation failed | Fix Lean4/Quint specs |

---

## Rust-Specific Patterns

### Typestate Pattern

```rust
use std::marker::PhantomData;

struct Unvalidated;
struct Validated;

struct Request<State> {
    data: String,
    _state: PhantomData<State>,
}

impl Request<Unvalidated> {
    fn new(data: String) -> Self {
        Request { data, _state: PhantomData }
    }

    fn validate(self) -> Result<Request<Validated>, Error> {
        if self.data.is_empty() {
            Err(Error::EmptyData)
        } else {
            Ok(Request { data: self.data, _state: PhantomData })
        }
    }
}

impl Request<Validated> {
    fn process(self) -> Response {
        Response::new(self.data)
    }
}
```

### Newtype Pattern

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct UserId(u64);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct OrderId(u64);

fn get_order(user: UserId, order: OrderId) -> Option<Order> {
    // Compiler prevents: get_order(order_id, user_id)
    todo!()
}
```

---

## Detection Commands

```bash
rg 'unsafe\s*\{' -t rust                                    # Unsafe blocks
rg 'extern\s+"C"' -t rust                                   # FFI
rg 'Arc|Mutex|RwLock|atomic|thread::spawn' -t rust         # Concurrency
rg '#\[(requires|ensures|invariant)\]' -t rust             # Prusti
rg '#\[kani::proof\]' -t rust                               # Kani
rg '#\[flux::' -t rust                                      # Flux
```

---

## Common Pitfalls

### Pitfall 1: Miri in CI
**Problem:** Too slow for CI.
**Solution:** Use Miri locally, Kani for CI.

### Pitfall 2: Kani Loop Unrolling
**Problem:** Timeout on unbounded loops.
**Solution:** Add `#[kani::unwind(N)]` + assume bounds.

### Pitfall 3: Loom State Explosion
**Problem:** Too many thread interleavings.
**Solution:** Start with 2-3 threads, tune `LOOM_MAX_PREEMPTIONS`.

### Pitfall 4: Prusti Annotation Bloat
**Problem:** Over-annotated code.
**Solution:** Annotate public API boundaries only.

### Pitfall 5: Ignoring Counterexamples
**Problem:** Silencing Kani with assumes.
**Solution:** Analyze and fix root cause.

---

## Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|--------------|--------------|-----------------|
| Miri in CI | Extremely slow | Local debugging only; Kani for CI |
| Unsafe without Kani | Unverified UB risk | Add `#[kani::proof]` |
| Ignoring counterexamples | Bugs remain | Analyze and fix |
| Unbounded Kani loops | Timeout | Add unwind + assume |
| Too many Loom threads | State explosion | 2-3 threads max |

---

## Best Practices

1. **Unsafe Blocks**: Document safety invariants; validate with Miri locally
2. **Concurrency**: Use Loom for lock-free algorithms
3. **Contracts**: Apply Prusti selectively to public APIs
4. **Proofs**: Use Kani for bounded verification
5. **External Tools**: Keep specs in `.outline/`
6. **CI Pipeline**: rustfmt -> clippy -> audit -> deny -> Kani
7. **Counterexamples**: Never ignore; always fix

---

## Resources

- [Kani Documentation](https://model-checking.github.io/kani/)
- [Loom GitHub](https://github.com/tokio-rs/loom)
- [Miri Documentation](https://github.com/rust-lang/miri)
- [Prusti User Guide](https://viperproject.github.io/prusti-dev/user-guide/)
- [Flux Refinement Types](https://flux-rs.github.io/flux/)
- [Verus Verified Rust](https://github.com/verus-lang/verus)
