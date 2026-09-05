---
name: writing-isabelle-proofs
description: 'Use when a proof needs Isabelle/HOL, its Sledgehammer automation, or an AFP session. Not for Lean 4: use writing-lean-proofs.'
---

# Writing Isabelle proofs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task is to write, review, or maintain Isabelle/HOL proofs, to drive Sledgehammer against a goal, or to build on an AFP entry. Methodology stays with proof-driven. |
| Authority | Reversible local: writes only theory files, session ROOT files, and Isabelle configuration inside the target project; rollback is version control. No remote mutation. |
| Side effect | Local writes to `.thy` sources, ROOT session definitions, and the AFP checkout already on disk. No remote mutation. |
| Done | `isabelle build` of the session succeeds, no `sorry` remains, and no `axiomatization` enters the delivered diff. |

## Inputs

- Isabelle2025-2, made available January 2026. Install the platform bundle from isabelle.in.tum.de: `Isabelle2025-2_linux.tar.gz`, `Isabelle2025-2_linux_arm.tar.gz`, `Isabelle2025-2.exe` for Windows, or `Isabelle2025-2_macos.tar.gz`. There is no LTS, so pin the bundle version.
- The theory sources (`.thy`), the session `ROOT` file, and for AFP work, the AFP release matching the Isabelle version.
- Sledgehammer provers ship with the official package: CVC4, cvc5, E, SPASS, Vampire, veriT, Z3, and Zipperposition.

## Procedure

1. **Open the session in the Prover IDE.** Run `isabelle jedit FILES` to edit theories in the bundled jEdit Prover IDE, where the prover checks continuously. Define the session in a `ROOT` file (`session Name = HOL` with its theories), and extend the session search with `-d DIR` or a `ROOTS` catalog when sessions span directories. Done when: the theory holds a checked state in the IDE and `isabelle build -D .` finds the session.
2. **State the skeleton before proving.** Write the target lemma and every helper lemma with `sorry` in place of a proof, then have the IDE check the skeleton: `sorry` is accepted only in interactive development, so the skeleton is filled in `isabelle jedit` while `isabelle build` stays the final gate. Each `sorry` marks an independent work unit. Done when: every `sorry` is an identified work unit and the IDE checks the skeleton.
3. **Fill goals: automation first, then structure.** Close routine goals with `by simp` or `by auto`. For a nontrivial goal, run `sledgehammer`: it drives the bundled external provers and returns a one-line proof such as `by (metis ...)`, which is pasted into the theory. `try0` runs a basket of standard methods; `nitpick` and `quickcheck` search for counterexamples. Structure what automation cannot close as Isar: `proof ... qed` with `fix`, `assume`, and `show` (`thus` expands to `then show`), with the `induction` and `cases` methods for recursive and case goals. Keep `apply` chains short; the manual defines `apply m` as backwards refinement, and long chains hide the proof state. Done when: every `sorry` is replaced and the build is green.
4. **Gate the result.** The batch build is the proof gate: `isabelle build` rejects `sorry` while the option `quick_and_dirty` keeps its default false, and enabling that option marks the result as fake. Check the delivered diff adds no `axiomatization`, and rebuild the session rather than trusting the IDE's incremental state. Done when: `isabelle build` succeeds at the defaults, with no `sorry` and no new `axiomatization`.
5. **Build on AFP entries.** Register the extracted AFP with `isabelle components -u <path-to-afp>/thys`, then import an entry by its own session name, for example `imports "ABC.Some_ABC_Theory"`. AFP sessions carry no extra namespace prefix. Done when: the AFP import resolves and the session builds.

## Failure and recovery

Sledgehammer finds nothing: run `nitpick` for a countermodel; if none appears, split the lemma or add the missing intermediate lemma, because the statement may be true but unprovable as stated. A pasted hammer one-liner fails on rebuild: it depended on facts visible only in the IDE state, so supply them with `using` or write the Isar proof by hand. Build error: fix the theory at the reported line; the build names the session. Timeout: split the proof into intermediate `have` steps instead of raising any time budget. Session drift: rebuild the session from the ROOT definition. Scope creep: stop and roll back to the last verified state.

## Output

Theory files and a ROOT session that build green under `isabelle build` at the defaults, delivered lemmas with no `sorry`, Sledgehammer one-liners confirmed by the batch build, and, where AFP is used, imports that resolve by AFP entry session name.
