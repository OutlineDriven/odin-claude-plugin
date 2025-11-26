---
description: Execute HODD-RUST validation pipeline for Rust projects
---
You are executing the HODD-RUST (Holistic Outline Driven Development for Rust) validation pipeline. This phase CREATES validation artifacts from the plan and VERIFIES them through the full Rust verification stack.

**Strict Enforcement**: Strictly validation-first before-and-after(-and-while) execution. CREATE validations FIRST, VERIFY continuously, REMEDIATE immediately.

## Constitutional Rules (Non-Negotiable)

1. **VALIDATION-FIRST COMPLIANCE**: Execute validation-first at every step
2. **CREATE Before Code**: Verification artifacts MUST exist before implementation
3. **Execution Order**: Execute stages in sequence (0 -> 6)
4. **Fail-Fast**: Stop on blocking failures; no skipping
5. **Complete Remediation**: Fix all issues; never skip verification

## Execution Steps

1. **CREATE**: Generate Rust validation artifacts from plan
2. **BASELINE**: Run rustfmt, clippy, cargo-audit, cargo-deny
3. **ADVANCED**: Run Miri, Loom, Prusti, Kani, Flux as applicable
4. **EXTERNAL**: Verify Lean4/Idris2/Quint specs if present

## Phase 1: Create Validation Artifacts

```bash
# Create .outline directory structure
mkdir -p .outline/{proofs,proofs/kani,specs,contracts,verifications/{loom,miri}}
```

### Generate Artifacts by Tool

#### Prusti Contracts (`.outline/contracts/`)
```rust
// .outline/contracts/{module}_contracts.rs
// Generated from plan design

use prusti_contracts::*;

// Source Requirement: {traceability from plan}

// Precondition: {from plan design}
// Postcondition: {from plan design}
#[requires(input > 0)]
#[ensures(result > input)]
pub fn process(input: i32) -> i32 {
    input + 1
}

// Invariant: {from plan design}
#[invariant(self.balance >= 0)]
impl Account {
    #[ensures(self.balance == old(self.balance) + amount)]
    pub fn deposit(&mut self, amount: u64) {
        self.balance += amount;
    }
}
```

#### Kani Proofs (`.outline/proofs/kani/`)
```rust
// .outline/proofs/kani/{module}_proofs.rs
// Generated from plan design

#[cfg(kani)]
mod proofs {
    use super::*;

    // From plan: {property to verify}
    #[kani::proof]
    fn verify_no_overflow() {
        let x: u32 = kani::any();
        let y: u32 = kani::any();
        kani::assume(x < 1000 && y < 1000);
        let result = add_safe(x, y);
        kani::assert(result >= x && result >= y, "No overflow");
    }

    // From plan: {invariant to check}
    #[kani::proof]
    #[kani::unwind(10)]
    fn verify_loop_bounds() {
        let n: usize = kani::any();
        kani::assume(n <= 10);
        let result = bounded_loop(n);
        kani::assert(result <= n * 2, "Loop bound maintained");
    }
}
```

#### Loom Verifications (`.outline/verifications/loom/`)
```rust
// .outline/verifications/loom/{module}_loom.rs
// Generated from plan design

#[cfg(loom)]
mod loom_verifications {
    use loom::sync::{Arc, Mutex};
    use loom::thread;

    // From plan: {concurrency property}
    fn verify_concurrent_access() {
        loom::model(|| {
            let data = Arc::new(Mutex::new(0));
            let d1 = data.clone();
            let d2 = data.clone();

            let t1 = thread::spawn(move || {
                *d1.lock().unwrap() += 1;
            });

            let t2 = thread::spawn(move || {
                *d2.lock().unwrap() += 1;
            });

            t1.join().unwrap();
            t2.join().unwrap();

            assert_eq!(*data.lock().unwrap(), 2);
        });
    }
}
```

## Phase 2: Execute Validation Pipeline

### Layer 0: Baseline
```bash
echo "=== Layer 0: BASELINE ==="

# Verify toolchain
command -v rustc >/dev/null || exit 11
command -v cargo >/dev/null || exit 11
test -f Cargo.toml || exit 12

# Format check
cargo fmt --check || exit 12

# Clippy with warnings as errors
cargo clippy -- -D warnings || exit 13

# Security audit
command -v cargo-audit >/dev/null && cargo audit || echo "Warning: cargo-audit not installed"

# Dependency policy
command -v cargo-deny >/dev/null && cargo deny check || echo "Warning: cargo-deny not installed"
```

### Layer 1: Memory Safety (Miri)
```bash
echo "=== Layer 1: MEMORY SAFETY (Miri) ==="

# Only run if unsafe code detected
if rg 'unsafe\s*\{' -t rust -q; then
  echo "Unsafe code detected - running Miri..."

  # Install Miri if needed
  rustup +nightly component add miri 2>/dev/null

  # Run Miri tests (advisory - local debugging only)
  cargo +nightly miri test 2>&1 || {
    echo "Warning: Miri found issues (advisory)"
  }
fi
```

### Layer 2: Concurrency (Loom)
```bash
echo "=== Layer 2: CONCURRENCY (Loom) ==="

# Only run if concurrent code detected
if rg 'Arc<|Mutex<|RwLock<|AtomicU|thread::spawn|tokio::spawn' -t rust -q; then
  echo "Concurrent code detected - running Loom verifications..."

  if rg 'loom::' -t rust -q; then
    RUSTFLAGS='--cfg loom' cargo build --release || exit 15
  else
    echo "Warning: No Loom verifications found for concurrent code"
  fi
fi
```

### Layer 3: Type Refinements (Flux)
```bash
echo "=== Layer 3: TYPE REFINEMENTS (Flux) ==="

if rg '#\[flux::' -t rust -q; then
  echo "Flux annotations detected..."
  command -v flux >/dev/null && {
    flux check || exit 15
  } || echo "Warning: Flux not installed"
fi
```

### Layer 4: Contracts (Prusti)
```bash
echo "=== Layer 4: CONTRACTS (Prusti) ==="

if rg '#\[(requires|ensures|invariant)' -t rust -q; then
  echo "Prusti annotations detected..."
  command -v prusti >/dev/null && {
    prusti || exit 15
  } || echo "Warning: Prusti not installed"
fi
```

### Layer 5: Formal Proofs (Lean4/Idris2)
```bash
echo "=== Layer 5: FORMAL PROOFS ==="

# Lean 4 proofs
if fd lakefile.lean .outline/proofs 2>/dev/null | grep -q .; then
  echo "Lean 4 proofs detected..."
  command -v lake >/dev/null && {
    cd .outline/proofs && lake build || exit 16
    rg '\bsorry\b' . && exit 16
    cd ../..
  } || echo "Warning: Lake/Lean4 not installed"
fi

# Idris 2 proofs
if fd -e idr .outline/proofs 2>/dev/null | grep -q .; then
  echo "Idris 2 proofs detected..."
  command -v idris2 >/dev/null && {
    idris2 --check .outline/proofs/*.idr || exit 16
  } || echo "Warning: Idris2 not installed"
fi
```

### Layer 6: Model Checking (Kani)
```bash
echo "=== Layer 6: MODEL CHECKING (Kani) ==="

if rg '#\[kani::proof\]' -t rust -q; then
  echo "Kani proofs detected..."
  command -v kani >/dev/null && {
    kani || exit 15
  } || echo "Warning: Kani not installed"
fi
```

### Layer 7: Specification (Quint)
```bash
echo "=== Layer 7: SPECIFICATION (Quint) ==="

if fd -e qnt .outline/specs 2>/dev/null | grep -q .; then
  echo "Quint specs detected..."
  command -v quint >/dev/null && {
    quint typecheck .outline/specs/*.qnt || exit 16
    quint verify .outline/specs/*.qnt || exit 16
  } || echo "Warning: Quint not installed"
fi
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | All validations pass | Ready for deployment |
| 11 | Toolchain missing | Install rustup/cargo |
| 12 | Format/structure issues | Run `cargo fmt` |
| 13 | Clippy failures | Fix warnings |
| 14 | Security issues | Review cargo audit/deny |
| 15 | Formal verification failed | Fix contracts/proofs/Loom |
| 16 | External validation failed | Fix Lean4/Idris2/Quint |

## Workflow

```
CREATE (generate artifacts from plan)
  |
  v
BASELINE (fmt -> clippy -> audit -> deny)
  |
  v
MEMORY (Miri if unsafe)
  |
  v
CONCURRENCY (Loom if Arc/Mutex/spawn)
  |
  v
REFINEMENTS (Flux if #[flux::])
  |
  v
CONTRACTS (Prusti if #[requires/ensures])
  |
  v
PROOFS (Lean4/Idris2 if .outline/proofs)
  |
  v
MODEL CHECK (Kani if #[kani::proof])
  |
  v
SPECS (Quint if .outline/specs)
  |
  v
COMPLETE (exit 0)
```

## Output Report

Provide:
- Artifacts created per layer
- Validation results per tool (PASS/FAIL/SKIP)
- Security findings summary
- Formal verification status (contracts/proofs verified)
- Traceability matrix (requirement -> validation -> status)
- Recommendations for missing coverage

Execute with thoroughness. Report comprehensive results.
