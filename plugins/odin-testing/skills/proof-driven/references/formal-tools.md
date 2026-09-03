# Formal verification tools

**Grounded: 2026-08-31**

| Tool | Strength | Status | Use when |
|------|----------|---------------|----------|
| Lean 4 | General-purpose theorem prover, mathlib | Mature | Mathematical proofs, algorithm correctness |
| Dafny | Automated verification, Hoare logic | Active (AI-assisted annotations emerging) | Pre/postcondition verification |
| Rocq 9.2 (formerly Coq) | Dependent types, extraction to OCaml/Haskell | Mature | Certified compilers, crypto |
| Kani 0.66+ | Bounded model checking for Rust | Active development (Safety-Critical Rust Consortium) | Memory safety, UB, loop invariants |
| Verus | SMT-based verification for Rust | Practical (Asterinas OS verified) | Systems-level Rust verification |

## Practical guidance

- Lean 4: Its growing ecosystem includes mathlib. It is the best entry point for theorem proving. Its tactics-based proof writing is more ergonomic than Rocq.
- Dafny: The solver handles most of the proof work. DafnyBench (2025) is the largest formal verification benchmark. AI-assisted annotation tools are emerging, including dafny-annotator.
- Rocq: It is the gold standard for certified code extraction. It was renamed from Coq in 2025; the repository is `rocq-prover/rocq` and the opam package is `rocq-core`, so search under both names for anything older. CompCert (verified C compiler) and FSCQ (verified file system) were built with it under the Coq name.
- Kani: It integrates directly into Rust projects via `cargo kani`. It proves the absence of panics, overflow, and UB within bounded execution. It has supported loop invariants since 0.66+.
- Verus: It has a richer proof language than Kani and was used to verify Asterinas OS components. It is SMT-based (Z3 backend) and better suited to complex invariants than bounded checking.
