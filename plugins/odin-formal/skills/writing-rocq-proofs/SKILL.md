---
name: writing-rocq-proofs
description: 'Use when a proof needs Rocq (formerly Coq), including legacy Coq codebase maintenance and migration through the Coq to Rocq rename. Not for Lean 4: use writing-lean-proofs.'
---

# Writing Rocq proofs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task is to write, review, or maintain Rocq 9.x proofs, or to migrate a legacy Coq codebase through the Coq to Rocq rename. Methodology stays with proof-driven. |
| Authority | Reversible local: writes only Rocq source files, project build files such as `_CoqProject` and opam files inside the target project, and scoped mechanical Rocq checks; rollback is version control. No remote mutation. |
| Side effect | Local writes to `.v` sources, project build files, and migration edits. No remote mutation. |
| Done | The project compiles under the pinned Rocq version, and `Print Assumptions` on each delivered theorem lists only the axioms the project declares. |

## Inputs

- Rocq 9.2.0, the current release of a monthly cadence that started with 9.0.0 in March 2025, installed with `opam install rocq-prover.9.2.0` or as the Rocq Platform bundle. Docs: rocq-prover.org.
- A proof environment: VsCoq (the official VS Code extension) or Proof General for Emacs, or `rocq repl`.
- The `.v` sources and theorem statements; for a migration, the legacy Coq project.
- Build facts: source files keep the `.v` extension, `rocq compile` emits `.vo` files that are specific to the compiling Rocq version, and `-Q directory dirpath` maps a directory to a logical prefix so `Require` resolves.

## Procedure

1. **Pin the toolchain and open the proof loop.** Install the pinned version with `opam install rocq-prover.<version>`, and prove in `rocq repl` or an editor session with VsCoq or Proof General. Compile with `rocq compile file.v`; for a project, generate a Makefile with `rocq makefile -f _CoqProject -o CoqMakefile`, where `_CoqProject` lists sources and `-Q`/`-R` mappings. Done when: the repl or editor runs against the project's pinned version and a `Require` of project code resolves.
2. **State the skeleton before proving.** Write the target theorem and every helper lemma with its body closed by `Admitted`, and compile: the skeleton type-checks while each `Admitted` marks an independent work unit. Separate subgoals with focused bullets so each stays addressable. Done when: the skeleton compiles and every `Admitted` is an identified work unit.
3. **Fill proofs one goal at a time.** Introduce the context with `intros`, decompose with `destruct` and `induction`, transform with `rewrite` and `apply`, and close with a terminal step such as `exact` or `reflexivity`. Prefer structured steps over long `apply` chains, and close every finished proof with `Qed`. Done when: every `Admitted` is replaced by a proof that closes with `Qed`.
4. **Audit the axiom footprint.** Run `Print Assumptions <theorem>` on each delivered theorem: it displays the axioms, parameters, and variables the theorem depends on. An `Admitted` helper or an `Axiom` declaration appears in that output, so the kernel report is the gate, not a text search. Done when: each delivered theorem's footprint matches the declared axioms and no `Admitted` remains.
5. **Migrate a legacy Coq project.** Rename the opam dependency: `coq` is replaced by `rocq-core`, the prover ships as `rocq-prover`, and ported packages take `rocq-*` names. Rewrite `From Coq Require Import X` to `From Stdlib Require Import X`, because the `Coq.*` standard-library namespace became `Stdlib.*` in 9.0. Compile and fix each deprecation at its site: 9.1 added the modular integer arithmetic theory with about 450 lemmas and deprecates the `Rtauto` and `rtauto.Bintree` plugins. The legacy `coqc`, `coqtop`, and `coq_makefile` shims still exist in 9.x; remove calls to them as the migration lands. Done when: the project builds under the pinned Rocq 9.x with `rocq-*` package names, `Stdlib` imports, and no deprecation warning on delivered files.

## Failure and recovery

Compile error: fix the source at the reported span and rebuild; do not widen scope. Stuck goal: record the goal, the hypotheses, and the tactics tried, then report them; do not close a delivered theorem with `Admitted`. Axiom leakage: `Print Assumptions` names an unexpected axiom, so trace it to its `Axiom` declaration or `Admitted` proof and remove it before delivery. A dependency has no Rocq 9 port: pin the last compatible version or port the dependent module; do not fake the import. Non-convergent proof: report the stuck goal and the evidence; do not weaken the statement.

## Output

`.v` sources that compile under the pinned Rocq version with proofs closed by `Qed`, delivered theorems whose `Print Assumptions` footprint matches the declared axioms, and for a migration, a build on `rocq-*` package names with `Stdlib` imports and no deprecation warning on delivered files.
