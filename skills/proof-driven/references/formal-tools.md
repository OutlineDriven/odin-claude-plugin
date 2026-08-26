# Formal Verification Tools

**Grounded: 2026-08-26**

| Tool | Strength | Status | Use When |
|------|----------|---------------|----------|
| Lean 4 | General-purpose theorem prover, mathlib | Mature | Mathematical proofs, algorithm correctness |
| Dafny | Automated verification, Hoare logic | Active (AI-assisted annotations emerging) | Pre/postcondition verification |
| Rocq 9.2 (formerly Coq) | Dependent types, extraction to OCaml/Haskell | Mature | Certified compilers, crypto |
| Kani 0.66+ | Bounded model checking for Rust | Active development (Safety-Critical Rust Consortium) | Memory safety, UB, loop invariants |
| Verus | SMT-based verification for Rust | Practical (Asterinas OS verified) | Systems-level Rust verification |

## Practical Guidance

- **Lean 4**: Rapidly growing ecosystem (mathlib). Best entry point for theorem proving. Tactics-based proof writing is more ergonomic than Rocq.
- **Dafny**: Automated verification -- the solver does most proof work. DafnyBench (2025) is the largest formal verification benchmark. AI-assisted annotation tools emerging (dafny-annotator).
- **Rocq**: Gold standard for certified code extraction. Renamed from Coq in 2025; the repository is `rocq-prover/rocq` and the opam package is `rocq-core`, so search under both names for anything older. CompCert (verified C compiler) and FSCQ (verified file system) were built with it under the Coq name.
- **Kani**: Integrates directly into Rust projects via `cargo kani`. Proves absence of panics, overflow, and UB within bounded execution. Loop invariants supported since 0.66+.
- **Verus**: Richer proof language than Kani. Used to verify Asterinas OS components. SMT-based (Z3 backend). Better for complex invariants than bounded checking.
