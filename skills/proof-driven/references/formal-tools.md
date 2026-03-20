# Formal Verification Tools

| Tool | Strength | Status (2025) | Use When |
|------|----------|---------------|----------|
| Lean 4 | General-purpose theorem prover, mathlib | Mature | Mathematical proofs, algorithm correctness |
| Dafny | Automated verification, Hoare logic | Active (AI-assisted annotations emerging) | Pre/postcondition verification |
| Coq | Dependent types, extraction to OCaml/Haskell | Mature | Certified compilers, crypto |
| Kani 0.66+ | Bounded model checking for Rust | Active development (Safety-Critical Rust Consortium) | Memory safety, UB, loop invariants |
| Verus | SMT-based verification for Rust | Practical (Asterinas OS verified) | Systems-level Rust verification |

## Practical Guidance

- **Lean 4**: Rapidly growing ecosystem (mathlib). Best entry point for theorem proving. Tactics-based proof writing is more ergonomic than Coq.
- **Dafny**: Automated verification -- the solver does most proof work. DafnyBench (2025) is the largest formal verification benchmark. AI-assisted annotation tools emerging (dafny-annotator).
- **Coq**: Gold standard for certified code extraction. CompCert (verified C compiler) and FSCQ (verified file system) built with Coq.
- **Kani**: Integrates directly into Rust projects via `cargo kani`. Proves absence of panics, overflow, and UB within bounded execution. Loop invariants supported since 0.66+.
- **Verus**: Richer proof language than Kani. Used to verify Asterinas OS components. SMT-based (Z3 backend). Better for complex invariants than bounded checking.
