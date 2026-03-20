# Dependent Type Systems and Verification Tools

| Tool | Strength | Status |
|------|----------|--------|
| Idris 2 | Dependent types, totality checking, proof terms | Academic, niche production use |
| F* | Refinement types, effects, proof automation | Research (Microsoft), used in Project Everest |
| Agda | Dependently typed, cubical type theory | Academic |
| Refined (Haskell) | Compile-time refinement predicates | Production-ready |

## Practical Guidance

- **Idris 2**: Best learning path for dependent types. Totality checker ensures all functions handle all inputs. Proof terms enable machine-checked correctness.
- **F\***: Used to verify real cryptographic code (HACL*, EverCrypt). Refinement types add predicates to existing types without full dependent type overhead.
- **Agda**: Strongest theoretical foundation (cubical type theory). Primarily academic but influences practical language design.
- **Refined (Haskell)**: Pragmatic compile-time predicates. `Refined Positive Int` ensures positive at compile time via Template Haskell.
