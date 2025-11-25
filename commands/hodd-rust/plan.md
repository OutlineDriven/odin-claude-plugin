---
description: Plan HODD-RUST validation workflow for Rust projects
allowed-tools: Read, Grep, Glob, Bash
---

You are planning a HODD-RUST (Stronger Outline Driven Development For Rust) validation strategy. This is a READ-ONLY planning phase - do NOT modify any files.

HODD-RUST merges: Type-driven + Spec-first + Proof-driven + Design-by-contracts + Test-driven (XP)

## Your Process

1. **Detect Existing Validation Artifacts**
   - Find Prusti annotations (#[requires], #[ensures], #[invariant])
   - Find Kani proofs (#[kani::proof])
   - Find Flux refinements (#[flux::])
   - Find Loom tests (loom::)
   - Find property tests (proptest!, quickcheck)
   - Find existing test coverage

2. **Analyze Safety Requirements**
   - Identify unsafe blocks requiring manual review/Miri
   - Find FFI boundaries (extern "C")
   - Locate concurrent code (Arc, Mutex, atomics, spawn)
   - Detect panic paths (unwrap, expect, panic!)

3. **Design Validation Strategy**
   - Classify code criticality (critical path vs utility)
   - Select tools per code region
   - Identify candidates for formal verification
   - Plan external tool usage (Idris2, Lean4, Quint) if needed

4. **Identify Critical Files**
   - List 3-5 files requiring formal verification
   - Document which validation tools apply to each
   - Note existing vs missing validation coverage

## Detection Commands

```bash
# Find unsafe blocks
rg 'unsafe\s*\{' -t rust -l

# Find FFI boundaries
rg 'extern\s+"C"' -t rust -l

# Find concurrent code
rg 'Arc<|Mutex<|RwLock<|AtomicU|thread::spawn|tokio::spawn' -t rust -l

# Find Prusti annotations
rg '#\[(requires|ensures|invariant)(\(|])' -t rust -l

# Find Kani proofs
rg '#\[kani::proof\]' -t rust -l

# Find Flux refinements
rg '#\[flux::' -t rust -l

# Find Loom tests
rg 'loom::' -t rust -l

# Find property tests
rg 'proptest!|quickcheck' -t rust -l

# Find panic paths
rg '\.unwrap\(\)|\.expect\(|panic!' -t rust -l

# Count test files
fd -e rs -g '*test*' | wc -l

# Find Cargo.toml for dependencies
fd Cargo.toml -x rg -l 'prusti|kani|loom|proptest|quickcheck'
```

## External Tool Detection

```bash
# Idris2 models (outside Rust codebase)
fd -e idr -e lidr

# Lean4 proofs (outside Rust codebase)
fd lakefile.lean

# Quint specifications
fd -e qnt

# Verus annotations
rg 'verus!' -t rust -l
```

## Tool Stack Reference

| Layer | Tool | Detect | Usage |
|-------|------|--------|-------|
| 0 | rustc/clippy | Always present | Standard validation |
| 0 | cargo-audit/deny | Cargo.toml | Security checks |
| 1 | Miri | unsafe blocks | Local UB debugging only |
| 2 | Loom | concurrent code | Critical concurrency tests |
| 3 | Typestate/Newtype | type patterns | Compile-time safety |
| 3 | Flux | #[flux::] | Refined types |
| 4 | Prusti | #[requires/ensures] | Contract verification |
| 5 | Lean4 | lakefile.lean | Formal proofs (external) |
| 6 | Kani | #[kani::proof] | Bounded model checking |
| 6 | Quint | *.qnt files | Protocol specs (external) |
| 7 | Progenitor | OpenAPI spec | API generation |

## Exit Codes Reference

| Code | Meaning |
|------|---------|
| 0 | Planning complete |
| 11 | Toolchain not detected |
| 12 | No Rust files found |
| 13 | Cannot determine project structure |

## Required Output

1. **Validation Artifact Inventory**
   - Existing annotations/proofs found
   - Test coverage estimate
   - Security tooling status

2. **Safety Analysis**
   - Unsafe block count and locations
   - FFI boundary summary
   - Concurrency code locations
   - Panic path analysis

3. **Validation Strategy**
   - Tool selection per code region
   - Prioritized verification targets
   - External tool recommendations

4. **Critical Files List** (3-5 files)
   - File path with rationale
   - Applicable validation tools
   - Missing vs existing coverage

Remember: This is READ-ONLY planning. Do not modify files or run validation commands.
