---
name: behavior-validator
description: 'Use when asked to validate a web app, CLI, API, or generated artifact against a source-blind behavior contract. Produces a structured pass/fail/blocked/out-of-scope report with anti-cheat probes and redacted evidence. Not for source or remote-system changes.'
---

# Behavior validator

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs a code-review-agnostic skill to validate a web app, CLI, API, or generated artifact against a source-blind behavior contract, or as a black-box companion to a code-aware review |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Reads only the runtime output of the target; never reads source code, repository state, or build internals |
| Side effect | Produces a structured behavior validation report. No mutation of the target, source, or workspace beyond emitting the report |
| Done | Every contract clause has an observable result; the report correctly reflects real-time behavior and no implementation evidence contaminated the validation |

## Inputs

- A behavior contract: a list of clauses, each with an identifier, a stimulus, and an expected observable outcome. Must be supplied.
- A target descriptor: how to reach the subject — a URL, a CLI invocation, an API endpoint, or an artifact path. Must be supplied.
- Optional: authentication material (tokens, headers), environment variables, seed data, or a run budget.
- Source code, repository state, and build internals are never inputs and must not be read.

## Procedure

1. Parse the contract into clauses. Reject any clause whose expected outcome references source structure (file names, function names, internal types, line numbers) — mark it out-of-scope, because source-blind validation cannot observe implementation structure. Done when: all clauses are parsed and source-referencing clauses are marked out-of-scope.
2. Establish source-blind isolation for the whole run: do not read, list, grep, or otherwise inspect source files, repository state, or build internals. Operate only against the target's runtime surface. Done when: source-blind isolation is established and maintained.
3. For each in-scope clause, construct a probe from its stimulus: an HTTP request, a CLI invocation, an API call, or an artifact inspection limited to observable output. Done when: every in-scope clause has a constructed probe.
4. Apply anti-cheat probes per clause: re-run the stimulus with perturbed and edge inputs (empty, oversized, malformed, reordered, boundary values) to distinguish genuine behavior from hardcoded or coincidental outputs. Record whether the outcome is stable across the perturbations. Done when: every clause has its anti-cheat stability flag recorded.
5. Execute each probe against the live target and capture only the observable result (status code, headers, stdout/stderr, exit code, rendered output). Redact secrets and personally identifying information from every captured evidence excerpt. Done when: every probe is executed with redacted evidence captured.
6. Classify each clause: pass (observed outcome matches the expected outcome), fail (observable mismatch), blocked (target unreachable or probe could not execute), out-of-scope (clause not observable from the runtime surface). Done when: every clause has its classification assigned.
7. Assemble the report mapping each probe category to its clause result, attaching the redacted evidence excerpt and the anti-cheat stability flag. Done when: the report maps every clause to its result with evidence and stability flag.
8. Stop. Do not widen scope, patch the target, read source to explain a result, or infer an expected outcome the contract did not state. Done when: the report is emitted and no scope widening, patching, or source reading occurred.

## Failure and recovery
- Target unreachable: classify every affected clause as blocked. Do not retry beyond the supplied run budget; report the blocked set with the unreachable reason.
- Probe execution error: classify the clause as blocked with the error class recorded. Never swallow an error or mask it as pass.
- Ambiguous or contradictory contract: halt and report blocked for the affected clauses. Do not infer or rewrite an expected outcome.
- Anti-cheat instability: if perturbed inputs change a clause's classification, mark the clause fail with an instability note rather than pass.
- Partial-result rule: emit the report with whatever clauses resolved; list every blocked and out-of-scope clause explicitly. No rollback is needed because nothing was mutated.
- The blocked/non-converged result is a report whose summary shows one or more blocked clauses and zero inferred results.

## Output
A structured behavior validation report ordered: per-clause results (identifier, classification pass/fail/blocked/out-of-scope, redacted evidence excerpt, anti-cheat stability flag), summary count of each classification — the report contains no source references.
