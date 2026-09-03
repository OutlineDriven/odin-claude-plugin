---
name: vector-forge
description: 'Use when existing cryptographic implementations and a vector-consuming harness need mutation-driven, cross-implementation test vector expansion. Produces targeted test vectors isolating escaped-mutant defects and a measured before/after kill-rate delta. Not for validating against the established Wycheproof corpus — use wycheproof. Not for coverage-guided fuzzing — use fuzz-harness-writing.'
---

# Vector forge

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Existing cryptographic implementations and a vector-consuming harness need mutation-driven, cross-implementation test vector expansion. |
| Authority | Local write of test vectors, reports, and mutation artifacts in the working directory. No remote mutation, no credential mutation, no VCS mutation. |
| Side effect | Local writes only: mutation logs, new test vectors in JSON, harness files colocated with each implementation, and a kill-rate report. |
| Done | Escaped mutants are classified by fault class, each new vector isolates one defect, vectors are cross-verified against two or more independent implementations, and a before/after kill-rate delta is reported. |

## Inputs

Required:
- Target algorithm or protocol (e.g., ECDSA, BLS12-381, Ed25519, AES-GCM).
- Existing test vectors in Wycheproof JSON format (one file per algorithm variant).
- At least one implementation of the target algorithm in a language with an available mutation testing framework (Go, Rust, Python, JavaScript/TypeScript, Java, C/C++, C#, Ruby, PHP, Haskell).
- A test harness that reads vectors from JSON, exercises the implementation API per vector, and asserts both acceptance and rejection.

Optional:
- Pre-built call graphs for each implementation (built in stage 3 if not supplied).

## Procedure

1. **Identify target implementations and test vectors.** Scan the working directory and any named implementation paths for source files. Classify each implementation by type: pure implementation (high mutation value), FFI wrapper to C/assembly (low at binding layer, use Mull for underlying C), C/C++ implementation (high, use Mull), generated code (medium, may produce equivalent mutants). For each implementation, record: language, mutation framework, pure vs FFI classification, existing test suite size, and which API surface the test vectors exercise. Verify a vector harness exists for each pure implementation; if not, write one colocated inside the implementation package that reads Wycheproof JSON, exercises the API per vector, asserts acceptance and rejection, and reports pass/fail per vector with test IDs. Done when: every implementation, harness surface, and exercised API is classified and each pure implementation has a vector harness.

2. **Run baseline mutation testing.** Select the mutation testing framework by language: cargo-mutants (Rust), gremlins (Go), mutmut or pytest-gremlins (Python), Stryker (JavaScript/TypeScript, C#), PITest (Java), Mull (C/C++), mutant (Ruby), Infection (PHP), MuCheck (Haskell). If the mutation framework is not installed, halt with failure state `mutation-framework-absent`. For each implementation, capture the full mutation log as JSON: total mutants, killed, survived, not covered, timed out, and efficacy percentage (Killed / (Killed + Survived)). Resolve timed-out mutants before comparing baselines. Done when: each implementation has a complete baseline mutation log with recorded metrics.

3. **Classify escaped mutants.** For each survived mutant, map it to its function and classify by the defect it escapes:
   - Missing Vector: reachable from public API, cyclomatic complexity at or below 10. Design a targeted vector.
   - Fuzzing Target: reachable from public API, complexity above 10. Both vector and fuzz harness.
   - Negative Vector: validation or error-handling path. Craft invalid input that triggers the path.
   - Edge-Case Vector: optimization path (GLV, SIMD, batch). Input that triggers the threshold.
   - False Positive: no callers, only test callers, logging/display/formatting, or behavior unchanged by mutation. Skip.
   - Equivalent Mutant: mutation produces semantically equivalent code (e.g., `|` to `^` after left shift where bit 0 is always 0). Skip.
   Prioritize by security impact: P0 (weakens validation, equality, or authentication), P1 (deserialization flag parsing), P2 (field arithmetic internals), P3 (optimization path). Group escaped mutants by vector strategy. Done when: every escaped mutant is classified, prioritized, and grouped.

4. **Generate new vectors isolating defects.** For each escaped code path group, design test vectors targeting that path. Categories: point deserialization (malformed points, wrong length, invalid field elements, off-curve, wrong subgroup, identity point), signature verification (valid signature plus single-bit corruptions of signature, public key, and message), hash-to-curve (edge-case inputs: empty, single byte, maximum length), aggregate operations (1 signer, many signers, duplicate signers, mixed valid/invalid), error handling (one vector per error path), arithmetic edge cases (zero, one, field modulus minus one, points at infinity), serialization flags (every valid and invalid flag combination). Design each negative vector with exactly one defect, keeping everything else valid, to isolate the specific validation check. Verify every new vector against at least two independent implementations before adding it to the suite. If implementations disagree, investigate: one implementation has a bug. Done when: each new vector isolates one path and passes cross-implementation verification.

5. **Re-run mutation testing and report kill-rate delta.** Re-run mutation testing with the new vectors included. Record the same metrics as stage 2 for each implementation. Compute the before/after delta: killed, survived, not covered, and efficacy percentage. Report both retroactive value (measurable kill-rate improvement in existing implementations) and proactive value (vectors that would catch bugs in future implementations even if they do not improve kill rates in existing ones). Write the complete report to `VECTOR_FORGE_REPORT.md` in the working directory. Done when: the before/after kill-rate delta and the complete report are recorded.

## Failure and recovery

| Failure class | Result |
|---|---|
| Mutation framework absent | Halt. Return `blocked: mutation-framework-absent` naming the missing framework and language. Do not fall back to manual mutation analysis. |
| Baseline times out | Halt. Return `blocked: baseline-timeout` naming the implementation and the timed-out mutant. Do not skip the mutant to force completion. |
| Implementations disagree on a vector | Investigate which implementation has the bug. If the disagreement cannot be resolved, report it and exclude the vector. Do not ship a vector that one implementation accepts and another rejects without identifying the cause. |
| Partial result | If the campaign stops before stage 5 completes, return all intermediate artifacts: mutation logs, escape classifications, generated vectors, and a status report stating which stage stopped and why. Do not claim Done without the full before/after comparison. |

Rollback: delete the generated vectors, harness files, mutation logs, and `VECTOR_FORGE_REPORT.md` from the working directory.

## Output

New Wycheproof-format JSON vectors per algorithm variant, colocated harness files, Phase 2 and Phase 5 mutation logs, and `VECTOR_FORGE_REPORT.md` containing the before/after kill-rate delta table and retroactive/proactive value assessment.
