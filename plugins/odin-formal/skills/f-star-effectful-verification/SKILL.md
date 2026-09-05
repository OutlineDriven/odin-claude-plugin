---
name: f-star-effectful-verification
description: 'Use when effectful, security-sensitive code needs refinement-typed, SMT-backed verification in F*, in the HACL* or Project Everest style.'
---

# Effectful verification in F*

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task is to verify effectful code with F* refinement types and the effect system, with obligations discharged to SMT, in the HACL* or Project Everest style. Methodology stays with proof-driven. |
| Authority | Reversible local: writes only F* source and interface files, extraction configuration, and project build files inside the target project; rollback is version control. No remote mutation. |
| Side effect | Local writes to `.fst` and `.fsti` files and to build or extraction configuration. No remote mutation. |
| Done | `fstar.exe` verifies the module with `admit_smt_queries` at its default false, the `assume val` ledger names every trust boundary, and extraction runs for the chosen codegen target. |

## Inputs

- F* release v2026.08.30 (dated releases ship weekly), installed with `opam install fstar` or fetched as the dated binary release. The binary package ships `bin/fstar.exe` and its own Z3; a source install must supply Z3.
- The module to verify, its interface (`.fsti`) where the contract is split from the implementation, and the extraction target.
- Editor support: `--ide` mode, fstar-mode for Emacs, fstar-vscode-assistant for VS Code.

## Procedure

1. **Run the verifier on a trivial file.** Verify with `fstar.exe File.fst`: each failed obligation comes back as an error at a source span, for example `Sample.fst(11,26-11,31): (Error 19) Subtyping check failed`, followed by the error count. Done when: a trivial module verifies with zero reported errors.
2. **Type the fragment before proving it.** Write refinements in the `x:t { e }` form so invalid states fail to typecheck. Mark total definitions with the default effect `Tot`, an abbreviation of the primitive `PURE`; keep specification-only computation in `GHOST`; give stateful code the `ML` effect with `requires` and `ensures` contracts on the heap. Done when: the file typechecks, every definition's effect is stated, and each effect is minimal.
3. **Discharge obligations one at a time.** Read each error span, state the missing intermediate fact as an `assert` or as a separate `lemma`, and re-run. `--query_stats` reports per-query SMT cost and is the first tool for a slow or failing query; scope option changes to a region with `#push-options "..."/#pop-options`. Done when: every reported obligation is discharged and the module verifies.
4. **Gate against admitted queries.** Keep `admit_smt_queries` at its default false for delivered code; a module that only verifies with it true is unproven. Each `assume val` is a declared trust boundary: list it with its type and the plan to prove it or audit it. Done when: the module verifies at the defaults and the `assume val` ledger names every trust boundary.
5. **Extract.** Extract with `--codegen OCaml` or `--codegen FSharp`, adding search paths with `--include PATH`. `GHOST` definitions stay out of extraction, so the emitted code carries only the verified computational content. Done when: extraction completes for the chosen target and the generated code matches the verified interfaces.

## Failure and recovery

An SMT query fails or stalls: split it with intermediate asserts or a standalone lemma and inspect `--query_stats` before changing any option. Effect mismatch: the error names the heap operation, so add the missing `requires` or `ensures`, or purify the function. A caller cannot establish a precondition: strengthen the refinement on the definition rather than weakening the caller. Query admitted by mistake: re-run the module with `admit_smt_queries` false to expose it. Scope creep: stop and roll back to the last verified state.

## Output

F* modules that verify with `admit_smt_queries` false, refinement-typed interfaces stating each definition's effect, the `assume val` ledger naming trust boundaries, and extracted output for the chosen codegen target.
