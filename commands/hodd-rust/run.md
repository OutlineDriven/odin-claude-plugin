---
description: Execute HODD-RUST validation pipeline for Rust projects
---

You are executing the HODD-RUST (Stronger Outline Driven Development For Rust) validation pipeline.

HODD-RUST merges: Type-driven + Spec-first + Proof-driven + Design-by-contracts + Test-driven (XP)

## Execution Steps

1. **CHECK**: Verify Rust toolchain and dependencies
2. **BASIC**: Run rustfmt, clippy, cargo-audit, cargo-deny
3. **TYPE**: Validate type patterns (Typestate/Newtype/Phantom)
4. **CONTRACT**: Run Prusti verification (if annotations present)
5. **SPEC**: Run Kani bounded model checking (if proofs present)
6. **CONCURRENCY**: Run Loom tests (if concurrent code present)
7. **RUNTIME**: Run Miri for UB detection (advisory: local debugging only)
8. **TEST**: Run cargo test with coverage
9. **EXTERNAL**: Validate external specs (Idris2, Lean4, Quint) if present

## Commands (Tiered)

### Basic (Precondition Check)
```bash
# Verify Rust toolchain
command -v rustc >/dev/null || { echo "rustc not found"; exit 11; }
command -v cargo >/dev/null || { echo "cargo not found"; exit 11; }

# Verify project structure
test -f Cargo.toml || { echo "Cargo.toml not found"; exit 12; }

# Check format
cargo fmt --check || { echo "Format violations found"; exit 12; }

# Run clippy with warnings as errors
cargo clippy -- -D warnings || { echo "Clippy warnings found"; exit 13; }
```

### Intermediate (Security & Tests)
```bash
# Security audit (if cargo-audit installed)
command -v cargo-audit && {
  cargo audit || { echo "Security vulnerabilities found"; exit 14; }
}

# Dependency check (if cargo-deny installed)
command -v cargo-deny && {
  cargo deny check || { echo "Dependency policy violations"; exit 14; }
}

# Run tests
cargo test || { echo "Tests failed"; exit 13; }

# Coverage (if tarpaulin installed)
command -v cargo-tarpaulin && {
  cargo tarpaulin --out Html --output-dir target/coverage
  echo "Coverage report: target/coverage/tarpaulin-report.html"
}
```

### Advanced (Formal Verification)
```bash
# Prusti contract verification (if annotations present)
rg '#\[(requires|ensures|invariant)(\(|])' -q -t rust && {
  command -v cargo-prusti || { echo "Warning: Prusti not installed"; }
  command -v cargo-prusti && {
    cargo prusti || { echo "Prusti verification failed"; exit 15; }
  }
}

# Kani bounded model checking (if proofs present)
rg '#\[kani::proof\]' -q -t rust && {
  command -v cargo-kani || { echo "Warning: Kani not installed"; }
  command -v cargo-kani && {
    cargo kani || { echo "Kani verification failed"; exit 15; }
  }
}

# Flux refined types (if refinements present)
rg '#\[flux::' -q -t rust && {
  command -v flux || { echo "Warning: Flux not installed"; }
  command -v flux && {
    flux check || { echo "Flux verification failed"; exit 15; }
  }
}

# Loom concurrency tests (if present)
rg 'loom::' -q -t rust && {
  cargo test --features loom || { echo "Loom tests failed"; exit 15; }
}

# Miri UB detection (advisory: NOT recommended for CI/CD)
# Uncomment for local debugging only:
# rustup +nightly component add miri 2>/dev/null
# cargo +nightly miri test || { echo "Miri found UB"; exit 15; }
```

### External Tools (Optional)
```bash
# Idris2 type-driven models
fd -e idr -e lidr . proofs/ 2>/dev/null | head -1 | grep -q . && {
  command -v idris2 || { echo "Warning: Idris2 not installed"; }
  command -v idris2 && {
    idris2 --check proofs/*.idr || { echo "Idris2 check failed"; exit 16; }
  }
}

# Lean4 formal proofs
fd lakefile.lean . proofs/ 2>/dev/null | head -1 | grep -q . && {
  command -v lake || { echo "Warning: Lake/Lean4 not installed"; }
  command -v lake && {
    (cd proofs && lake build) || { echo "Lean4 proofs failed"; exit 16; }
    rg 'sorry' proofs/*.lean && { echo "Incomplete proofs (sorry found)"; exit 16; }
  }
}

# Quint specifications
fd -e qnt . specs/ 2>/dev/null | head -1 | grep -q . && {
  command -v quint || { echo "Warning: Quint not installed"; }
  command -v quint && {
    quint typecheck specs/*.qnt || { echo "Quint typecheck failed"; exit 16; }
    quint verify specs/*.qnt || { echo "Quint verification failed"; exit 16; }
  }
}

# Verus verified Rust
rg 'verus!' -q -t rust && {
  command -v verus || { echo "Warning: Verus not installed"; }
  command -v verus && {
    verus src/*.rs || { echo "Verus verification failed"; exit 16; }
  }
}
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | All validations pass | Proceed to deployment |
| 11 | Toolchain missing | Install rustup/cargo |
| 12 | Format/structure issues | Run `cargo fmt`, check Cargo.toml |
| 13 | Clippy/test failures | Fix warnings and failing tests |
| 14 | Security/dependency issues | Review cargo audit/deny findings |
| 15 | Formal verification failed | Fix proofs/contracts/Loom tests |
| 16 | External tool validation failed | Fix Idris2/Lean4/Quint specs |

## Miri Usage Notes

Miri detects undefined behavior at runtime but is NOT suitable for CI/CD:
- Requires nightly Rust
- Significantly slower than normal tests
- May have false positives with FFI
- Best used for local debugging of unsafe code

To run Miri manually:
```bash
rustup +nightly component add miri
cargo +nightly miri test
```

## Workflow Diagram

```
CHECK (toolchain)
  |
  v
BASIC (fmt -> clippy -> audit -> deny)
  |
  v
TEST (cargo test)
  |
  +--[if #[requires/ensures]]---> PRUSTI
  |
  +--[if #[kani::proof]]--------> KANI
  |
  +--[if #[flux::]]--> FLUX
  |
  +--[if loom::]-----------------> LOOM
  |
  +--[if unsafe, local only]----> MIRI (advisory)
  |
  v
EXTERNAL (optional)
  |
  +--[if *.idr]-----------------> IDRIS2
  +--[if lakefile.lean]---------> LEAN4
  +--[if *.qnt]-----------------> QUINT
  +--[if verus!]----------------> VERUS
  |
  v
COMPLETE (exit 0)
```

## Required Output

1. **Validation Results**
   - Each tier status (pass/fail/skip)
   - Specific failures with file:line references
   - Coverage percentage (if available)

2. **Security Summary**
   - Vulnerability count (cargo audit)
   - Policy violations (cargo deny)

3. **Formal Verification Status**
   - Prusti: contracts verified / total
   - Kani: proofs verified / total
   - Loom: concurrent tests passed
   - External tools: specs validated

4. **Recommendations**
   - Unverified critical paths
   - Suggested additional annotations
   - Missing test coverage areas

Execute the pipeline and report comprehensive results.
