---
name: writing-lean-proofs
description: 'Use when asked to design, write, review, refactor, lint, or performance-diagnose Lean 4 proofs, libraries, or tactic extensions under Mathlib conventions. The declarations compile under the project toolchain with stable statements, structured proofs, and the selected axiom and linter policy satisfied. Don''t use for non-Lean code, remote mutation, or changes outside Lean source, library API, proof structure, and project linter configuration.'
---

# Writing Lean proofs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task is to design, write, review, refactor, lint, or performance-diagnose Lean 4 proofs, libraries, or tactic extensions under Mathlib conventions. |
| Authority | Reversible local writes to Lean source files, library API, proof structure, project linter configuration, and scoped mechanical Lean checks. Rollback via version control restore of changed files. |
| Side effect | Local writes to Lean source, library API, proof structure, project linter configuration, and scoped mechanical Lean checks. No remote mutation, credential change, paid action, or deployment. |
| Done | The requested Lean declarations have stable statements and structured proofs, compile under the project toolchain, and satisfy the selected axiom and linter policy. |

## Inputs

- **Required**: Lean 4 project with a working `lakefile.lean` and toolchain (`lean-toolchain`). Target theorem statements, definitions to formalize, or proof obligations to discharge.
- **Optional**: Project-specific linter configuration, axiom policy (default: `[propext, Classical.choice, Quot.sound]`), `maxHeartbeats` budget, Mathlib dependency.

## Procedure

1. **Design definitions and their API first.** Prefer total functions with junk values over subtypes or `Option` in signatures. Bundle morphisms with `FunLike`, subobjects with `SetLike`. Pick the canonical simp-normal form for every concept. Write `ext`, `@[simp]`, coercion, and injectivity lemmas in the same file immediately after the definition. Never use `unfold` or `show ... from rfl` downstream.

2. **Build a sorry skeleton.** State the target theorem and every lemma it needs with `:= sorry`. Verify the file compiles. Each `sorry` is an independent work unit. Inside a proof, lay out `have`/`suffices`/`calc` skeleton with `sorry` justifications and verify Lean accepts the structure before filling.

3. **Fill goals one focused goal at a time.** Every subgoal gets a focusing dot `·` with an indented block. Open each block with a redundant `show` stating its goal; use `change` instead if `show` would alter the goal. Chained rewrites of (in)equalities become `calc` blocks with relations aligned vertically. Use `have` for forward stepping stones, `suffices` for backward reduction. Annotate goal state as a comment before non-obvious tactics; in headless workflows insert `trace_state` or deliberate `done`, run `lake env lean Path/To/File.lean`, and copy reported hypotheses and target. Strip probes after the proof works.

4. **Verify mechanically.** Run `lake build`: a green build is the floor, not the gate, because `sorry` exits 0. Gate unproved obligations by asking the kernel: `#print axioms myTheorem` for spot checks; for CI, collect axioms per declaration with `Lean.collectAxioms` and assert the whole expected footprint (`[propext, Classical.choice, Quot.sound]` unless deliberately widened) so stray `sorry` or new trust assumptions like `native_decide` fail loudly. Never grep for `sorry`: it matches comments and misses unproved helpers.

5. **Apply the extraction ladder.** Before extracting, state the fragment type in a scratch `example`, run `exact?` and `apply?` on the bare goal, then try type-pattern and source search. Level 0: sub-argument repeats within one proof → local `have`. Level 1: statement is independently interesting or extraction sheds hypotheses → standalone lemma. Level 2: proof reads as long and unwieldy → split; if a fragment has a clean statement, it wanted to be a lemma.

6. **Run project linters.** Self-contained proof: `linter.auxLemma`, `linter.style.maxHeartbeats`, `linter.style.multiGoal`, `linter.style.setOption`, `linter.style.show`. Reusable library: also `linter.flexible`, `linter.style.missingEnd`, `linter.style.openClassical`, `unused*InType`. Treat `nativeDecide` as a trust-policy choice. Run Batteries' declaration-level `#lint` checks including `simpNF` separately. Verify every option against pinned Mathlib source with a known-trigger fixture. No warning gates anything unless warnings fail the build.

7. **Write a custom linter for every project-specific convention.** A declaration-level `@[env_linter]` is one structure. It is the only mechanism that reliably catches missing attributes across declarations. Include vacuity anchors, prove-it-can-fail fixtures, and allowlists.

8. **Diagnose performance.** Measure per-declaration cost with `#count_heartbeats` before adjusting `maxHeartbeats`. Every `maxHeartbeats` override is an unproven claim. Conditional simp lemma fires shallow but not deep → raise `maxDischargeDepth` (default 2). Re-derive every `simp only` list with `simp?` at its own site.

## Failure and recovery
- **Compilation failure**: fix the source error and rebuild. Do not widen scope.
- **Sorry leakage**: replace with structured proof or gate with `collectAxioms`/`#print axioms`. A build that exits 0 with sorries present is not done.
- **Linter violation**: fix the code or suppress with explicit justification. No blanket `#nolint`.
- **Performance regression**: measure with `#count_heartbeats`, restructure definition or decompose goal. Do not raise `maxHeartbeats` without measurement.
- **Scope violation**: stop and roll back to the last clean state. Do not widen authority.
- **Non-convergent proof**: report the stuck goal, the tactics tried, and the hypotheses. Do not invent evidence or weaken the statement.

## Output
- Lean source files with stable declarations, structured proofs, and no ungated `sorry`.
- Axiom footprint matching the declared policy.
- Linter output clean under the selected profile.
- For custom tactics: failure-surface tests and structured tracing.

## Provenance

Adapted from Trail of Bits `writing-lean-proofs` skill (https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3). Licensed CC-BY-SA-4.0. Trail of Bits attribution and source link preserved. Modifications marked. Adaptations licensed ShareAlike. No trademark rights claimed. trail-of-bits-mark.svg not reused as branding.
