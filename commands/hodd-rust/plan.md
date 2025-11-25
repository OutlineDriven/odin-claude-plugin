---
description: Plan HODD-RUST validation workflow for Rust projects
allowed-tools: Read, Grep, Glob, Bash
---

You are planning a HODD-RUST (Holistic Outline Driven Development for Rust) validation strategy BEFORE code changes.

HODD-RUST merges: Type-driven + Spec-first + Proof-driven + Design-by-contracts

CRITICAL: This is a DESIGN planning task. You design Rust validation artifacts that will be created during the run phase.

## Your Process

1. **Understand Requirements**
   - Parse user's Rust task/requirement
   - Identify safety requirements (memory, concurrency, panic-freedom)
   - Use sequential-thinking to plan multi-tool validation
   - Map requirements to Rust verification tools

2. **Artifact Detection (Conditional)**
   - Check for existing Rust validation artifacts:
     ```bash
     # Prusti annotations
     rg '#\[(requires|ensures|invariant)' -t rust $ARGUMENTS
     # Kani proofs
     rg '#\[kani::proof\]' -t rust $ARGUMENTS
     # Flux refinements
     rg '#\[flux::' -t rust $ARGUMENTS
     # Loom verifications
     rg 'loom::' -t rust $ARGUMENTS
     # External proofs
     fd -e lean -e idr -e qnt $ARGUMENTS
     ```
   - If artifacts exist: analyze coverage gaps, plan extensions
   - If no artifacts: proceed to design validation stack

3. **Design Rust Validation Stack**
   - Layer 0: rustc/clippy + cargo-audit/deny
   - Layer 1-2: Miri (unsafe), Loom (concurrency)
   - Layer 3: Flux refinements, Prusti contracts
   - Layer 4-5: External proofs (Lean4, Quint)
   - Layer 6: Kani bounded model checking

4. **Prepare Run Phase**
   - Define targets in `.outline/` and source
   - Specify verification commands per tool
   - Create traceability matrix

## Thinking Tool Integration

```
Use sequential-thinking for:
- Safety property decomposition
- Tool selection per code region
- Verification order planning

Use actor-critic-thinking for:
- Tool coverage evaluation
- Safety gap identification
- Alternative verification approaches

Use shannon-thinking for:
- Unsafe code risk analysis
- Concurrency hazard assessment
- Panic path probability
```

## HODD-RUST Validation Design Template

```
HODD-RUST Validation Architecture
=================================

Requirement: {requirement text}

Safety Analysis:
├── Unsafe blocks: {locations}
├── FFI boundaries: {locations}
├── Concurrent code: {locations}
└── Panic paths: {locations}

Layer 0: BASELINE
├── Tool: rustc + clippy
├── Artifacts: Source code
└── Commands: cargo clippy --all-targets

Layer 1: MEMORY SAFETY (if unsafe present)
├── Tool: Miri
├── Target: .outline/tests/miri/
├── Artifacts: Miri test harnesses
└── Commands: cargo +nightly miri test

Layer 2: CONCURRENCY (if concurrent code)
├── Tool: Loom
├── Target: .outline/verifications/loom/
├── Artifacts: Loom verification modules
└── Commands: RUSTFLAGS='--cfg loom' cargo build

Layer 3: TYPE REFINEMENTS
├── Tool: Flux
├── Target: Source annotations
├── Artifacts: #[flux::] annotations
└── Commands: cargo flux

Layer 4: CONTRACTS
├── Tool: Prusti
├── Target: .outline/contracts/
├── Artifacts: #[requires], #[ensures]
└── Commands: cargo prusti

Layer 5: FORMAL PROOFS (critical paths)
├── Tool: Lean 4 / Idris 2
├── Target: .outline/proofs/
├── Artifacts: theorem files
└── Commands: lake build

Layer 6: MODEL CHECKING
├── Tool: Kani
├── Target: .outline/proofs/kani/
├── Artifacts: #[kani::proof] harnesses
└── Commands: cargo kani
```

## Tool Selection by Code Pattern

| Code Pattern | Primary Tool | Secondary |
|--------------|--------------|-----------|
| `unsafe { }` | Miri | Kani |
| `Arc<Mutex<>>` | Loom | Prusti |
| `extern "C"` | Miri | Kani |
| `unwrap()/expect()` | Prusti | Kani |
| State machine | Quint | Lean 4 |
| Arithmetic | Flux | Kani |

## Exit Codes Reference

| Code | Meaning |
|------|---------|
| 0 | Design complete, ready for run phase |
| 11 | Cannot determine validation strategy |
| 12 | Requirements too ambiguous |
| 13 | Tool unavailable for required validation |

## Required Output

### HODD-RUST Design Document

1. **Safety Analysis**
   - Unsafe blocks identified
   - FFI boundaries mapped
   - Concurrency patterns found
   - Panic paths catalogued

2. **Tool Stack Architecture**
   - Tools selected per code region
   - Verification order
   - Gating dependencies

3. **Target Artifacts**
   - `.outline/proofs/*.lean` - Formal proofs
   - `.outline/proofs/kani/` - Kani harnesses
   - `.outline/specs/*.qnt` - Protocol specs
   - `.outline/contracts/*.rs` - Prusti annotations
   - `.outline/verifications/loom/` - Loom verifications
   - `.outline/verifications/miri/` - Miri harnesses

4. **Verification Commands**
   - Per-tool commands
   - Success criteria per layer
   - CI integration notes

### Critical Files for HODD-RUST Validation
List files requiring verification:
- `src/critical.rs` - [Unsafe blocks, needs Miri + Kani]
- `src/concurrent.rs` - [Arc/Mutex, needs Loom]
- `src/api.rs` - [Public API, needs Prusti contracts]
