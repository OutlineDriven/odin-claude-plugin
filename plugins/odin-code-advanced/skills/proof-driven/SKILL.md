---
name: proof-driven
description: 'Use when property-based testing, theorem proving, or formal proof tactics require zero unproven properties. Produces passing proofs and tests, sufficient coverage, and regression tests for every counterexample. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Proof driven

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Use when explicitly asked to apply property-based testing, theorem proving, or formal proof tactics under a zero-unproven-property policy. |
| Authority | Write only the named local property tests, proof artifacts, regression tests, and implementation remediation within the agreed target; all changes must be reversible by restoring those files from version control or their pre-run copies. |
| Side effect | Creates or updates the bounded local proof/test artifacts and only the implementation code required to remediate demonstrated failures; it does not mutate credentials, remote state, deployments, or unrelated files. |
| Done | Every planned property passes, no property is skipped or pending, line coverage is at least 80%, every discovered counterexample has a permanent regression test, and every definition covered by the proof is total. |

## Inputs

Required: the target implementation and its test command; requirements or contracts from which properties can be derived; the exact writable file scope; and a line-coverage command capable of measuring the target. A reference model is required for model-based testing when one is claimed. Optional inputs are existing example tests, generators, invariants, formal specifications, and a configured property-testing or theorem-proving framework. Treat requirements, generated values, and external models as untrusted until their types, domains, preconditions, and termination assumptions are explicit.

## Procedure

1. Bound the writable scope to the supplied target, property/proof files, regression-test files, and remediation files. Record the commands that will run the properties and measure line coverage; stop if any required command or framework is unavailable. Done when: the writable scope is bounded and all required commands and frameworks are confirmed available.
2. Derive properties from the requirements before changing implementation. Enumerate correctness, safety, invariant, and termination obligations, then arrange them as a main property with supporting properties and edge cases so no assumption remains implicit. Done when: properties are derived from requirements with no implicit assumption.
3. Select the simplest independent oracle for each obligation: postcondition, invariant, idempotence, inverse or round trip, model equivalence, commutativity, or metamorphic relation. For stateful code, define commands, a reference-state model, transition preconditions, and invariants across command sequences. Do not restate the implementation as its own oracle. Done when: each obligation has a selected oracle and stateful code has a reference model.
4. Choose a proof strategy that matches each property: simplification, constructor or boundary case analysis, induction for recursive or sequential behavior, contradiction, construction, model checking, or empirical property exploration when a formal proof is not available. Verify numeric bounds and complexity arithmetic mechanically with available project tooling rather than unsupported mental calculation. Done when: each property has a matched proof strategy and numeric bounds are verified mechanically.
5. Create all planned property tests or formal proof obligations before the first verification run, one concern per property. Generate domain-valid normal, boundary, empty, zero, negative, maximum, overflow, and invalid cases where the contract permits them. Keep known example tests alongside properties because examples document fixed behavior while generated cases explore the input space. Done when: all planned property tests and proof obligations are created with generated edge cases.
6. Run every property and proof obligation. Reject vacuous properties, framework self-tests, discarded-input rates that prevent meaningful exploration, nonterminating definitions, and skipped or pending obligations. For each failure, use the framework's invariant-preserving shrinker when available and retain the smallest reproducible counterexample. Done when: every property and proof obligation is run and vacuous or skipped obligations are rejected.
7. Convert every minimal counterexample into a deterministic regression test before remediation. Fix the demonstrated implementation defect within the bounded scope, rerun the regression test and affected property, and iterate without deleting, weakening, skipping, or broadening a failing obligation merely to obtain a pass. Done when: every counterexample has a regression test and the fix is verified by rerunning.
8. Run the complete property/proof set, the retained example and regression tests, and line coverage. Finish only when all pass, skipped and pending counts are zero, coverage is at least 80%, every counterexample is represented by a regression test, the target corresponds to the proven model, and termination obligations hold. Done when: all pass, zero skipped/pending, coverage >= 80%, every counterexample has a regression test, and termination obligations hold.

## Failure and recovery
- Framework unavailable (exit 11): make no implementation change; report the missing executable, package, configuration, or prover and the attempted command.
- No properties created (exit 12): make no success claim; report the requirement or oracle information that is missing.
- Property failure or incomplete proof (exit 13): preserve the minimized counterexample and any valid passing artifacts, but classify the run as non-converged. Revert remediation that introduces regressions by restoring only the bounded files, then report the failing property, seed or proof goal, smallest counterexample, and last verified state.
- Coverage or property gap (exit 14): report the uncovered requirement and measured coverage; do not mark an obligation proven from execution that did not reach it.
- Out-of-scope remediation: stop before writing it and return a blocked result naming the required file or authority expansion. Never invent a proof, suppress an error, discard a counterexample, or report the done predicate from partial results.

## Output
On success, return exit 0 with the created or changed property/proof files, deterministic regression tests for all counterexamples, bounded remediation files, commands run, passing property and proof counts, zero skipped/pending counts, line-coverage percentage, and the requirement-to-property hierarchy. Otherwise return exit 11, 12, 13, or 14 with the exact blocked or non-converged evidence described above and the bounded files that remain modified.
