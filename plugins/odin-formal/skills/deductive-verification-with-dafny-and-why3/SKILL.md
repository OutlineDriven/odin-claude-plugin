---
name: deductive-verification-with-dafny-and-why3
description: 'Use when an imperative program needs pre-conditions, post-conditions, and loop invariants proved automatically by SMT in Dafny or Why3, short of a tactic prover.'
---

# Deductive verification with Dafny and Why3

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task is to prove the pre-conditions, post-conditions, and loop invariants of imperative code with an SMT-backed prover: Dafny for annotate-then-verify on executable code, Why3 for multi-prover goals over WhyML. Methodology stays with proof-driven. |
| Authority | Reversible local: writes only Dafny and WhyML source files, prover configuration, and session files under the project; rollback is version control. No remote mutation. |
| Side effect | Local writes to annotated sources, the Why3 user configuration, and `.why3session.xml` proof sessions. No remote mutation. |
| Done | The module verifies with no unproved obligations: `dafny verify` reports zero errors, or every Why3 goal is Valid and `why3 replay` re-confirms the session. |

## Inputs

- Code to verify: Dafny sources (`.dfy`) or WhyML sources (`.mlw`), new or existing.
- The property set: pre-conditions, post-conditions, loop invariants, and termination measures.
- Dafny 4.11 (current release 4.11.0, 2026-08-25), installed per dafny.org with `dotnet tool install --global dafny`, Homebrew, or the binary archive; the release bundles its own Z3. Reference: DafnyRef at dafny.org.
- Why3 1.8.2, installed with `opam install why3` (add `why3-ide` for the GUI), with at least one prover detected. Manual at why3.org/doc.
- Pipeline fact: Dafny verification lowers to Boogie, which encodes to Z3.

## Procedure

1. **Install and detect provers.** Install Dafny or Why3, then confirm a solver exists. Dafny carries a bundled Z3, so its CLI runs directly. Why3 needs `why3 config detect` to find provers (Alt-Ergo, CVC4, CVC5, Z3) and record them in the user configuration. Done when: `dafny verify` runs on a trivial file, or `why3 config detect` lists at least one prover.
2. **Write the contracts first.** State `requires` and `ensures` on every method or function, `modifies` where a method touches the heap, and a `decreases` measure on recursion. Give every `while` loop an `invariant` set, because Dafny verifies loops through their specifications. In WhyML, write `requires`, `ensures`, and a `variant` termination measure on each `let rec`. Done when: every property is in the source and the first verification run names unproved goals instead of failing on structure.
3. **Clear failures one obligation at a time.** Read the error span, state the missing intermediate fact as an `assert`, and re-verify. Strengthen a loop invariant before touching the post-condition. A `calc` chain decomposes an arithmetic gap in Dafny. Cap noisy output with `--verification-error-limit:<n>` (default 5; 0 reports all). Done when: the targeted obligation passes and no new obligation appeared.
4. **Drive Why3 goals across provers.** Run `why3 prove file.mlw` for a batch summary of Valid, Unknown, or Timeout per goal. Open `why3 ide file.mlw` to run one goal under alternate provers and apply transformations such as split. Save the session, then re-check it in batch with `why3 replay <project-directory>`, which reruns every proof stored in the directory's `why3session.xml`. Done when: every goal is Valid under a prover recorded in the session and `why3 replay` confirms it.
5. **Gate the result.** Delivered code has zero verification errors and no weakened contract: never drop a `requires` or `ensures` to make a goal pass, and make an inferred loop invariant explicit when the proof depends on it. Run `dafny run` for an executable check, or `dafny translate cs|java|go|py` (js also exists; cpp has limited support) when a build target is set. Done when: verification is clean, the executable check or translation target succeeds, and the contracts in the diff match the stated properties.

## Failure and recovery

Post-condition fails on a loop: add the invariant that states what the completed iterations have established, and re-verify. Verification times out: split the method or the goal, with intermediate asserts or `calc` steps in Dafny and the split transformation in Why3, before raising any time budget. Why3 session drifts: `why3 replay` reports a status change, so re-run the affected goal in `why3 ide` instead of trusting the stored result. No prover detected: install a solver and run `why3 config detect` again; a missing Dafny Z3 is fixed by reinstalling Dafny. A property that cannot be established: factor it into a `lemma` (Dafny) or a helper function (WhyML) and prove it separately; do not weaken the contract. Scope creep: stop and roll back to the last verified state.

## Output

Sources whose contracts verify: `dafny verify` clean, or a Why3 session whose every goal is Valid and which `why3 replay` re-confirms. Where a build target applies, the translated or runnable output of the verified module.
