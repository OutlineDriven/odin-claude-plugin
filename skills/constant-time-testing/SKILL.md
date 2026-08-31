---
name: constant-time-testing
description: 'Use when a cryptographic implementation must be checked at runtime for timing side-channel leakage. Returns calibrated statistical or dynamic evidence of leakage, or a bounded inconclusive result naming the exercised configuration. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Constant time testing

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs runtime or statistical evidence that a cryptographic implementation leaks timing information. |
| Authority | Reversible local: write only a timing-test harness, its compiled binary, and measured sample files under a scratch directory. The implementation under test is read and compiled into the harness but never edited. Roll back by deleting the scratch directory and compiled artifacts. |
| Side effect | Local write to the timing-test harness and measured runtime samples. |
| Done | A runtime test reports calibrated evidence of leakage or a bounded inconclusive result, with the exercised configuration named. |

## Inputs

Required: the cryptographic function or binary to test, and a statement of which inputs are secret (private keys, exponents, nonces, password hashes) versus public.

Optional: the compiler and flags used in production (default tests at the production optimization level, e.g. `-O3 -march=native`), the target CPU architecture, and a measurement budget in minutes.

## Procedure

1. Bound scope. Create a scratch directory for the harness, compiled binary, and sample files. Do not edit the implementation under test; compile it unchanged into the harness.
2. Identify the secret inputs and the four common constant-time violation patterns to look for: secret-dependent conditional branches, secret-dependent array access, variable-time integer division by a secret, and variable-time shifts by a secret.
3. Statistical test (dudect). Write a C harness that defines `do_one_computation` calling the target function and `prepare_inputs` that assigns each measurement to a fixed input class or a random input class keyed on the secret. Compile with the production flags. Pin the process to an isolated core (`taskset -c <cpu>`) to reduce OS noise. Run for the measurement budget (5-10 minutes minimum; hours for high assurance). Read the Welch's t-test t-value: a high absolute t-value indicates timing leakage correlated with the secret.
4. Dynamic trace (Timecop over Valgrind). If statistical testing detects leakage or a specific suspect site exists, mark only the true secret memory with `VALGRIND_MAKE_MEM_UNDEFINED` (poison), run the function under `valgrind --track-origins=yes`, then unpoison. Valgrind reports the exact line where a conditional jump or move depends on the secret. Mark only true secrets to avoid false positives.
5. Calibrate the result. Test at the production optimization level, since leaks hidden at `-O0` may appear at `-O3`; on the target architecture, since x86 and ARM differ; and across compilers when feasible. Confirm the compiler did not introduce or remove branches by inspecting assembly (`objdump -d`).
6. Classify. If the t-value exceeds the leak threshold or Valgrind reports a secret-dependent operation, report leakage with the site, the violated pattern, and the exercised configuration (compiler, flags, architecture, duration). If measurements are noisy or below threshold after the budget, report a bounded inconclusive result: statistical testing gives confidence only over the exercised paths and inputs and cannot prove absence of leakage.

## Failure and recovery
- Noisy measurements or t-value never settles: do not declare clean. Extend the run, pin to an isolated core, minimize non-crypto code in the harness, and re-run. If still unsettled after the budget, return the bounded inconclusive result naming the configuration.
- Valgrind reports no secret-dependent operation but dudect flags leakage: microarchitecture timing (cache, division, shifts) may not be visible to Valgrind. Report the statistical evidence and note the dynamic trace covered only executed paths.
- Harness fails to compile or the function cannot be isolated: stop; report the blocker and the attempted configuration. Do not edit the implementation under test to make it testable.
- Rollback: delete the scratch directory and compiled artifacts. No mutation of the implementation under test or any repository, VCS, credential, or remote state occurs.

## Output
A report stating either leakage detected, with the leak site, the violated constant-time pattern, the tool and signal (dudect t-value or Valgrind report), and the exercised configuration (compiler, flags, architecture, measurement duration), or a bounded inconclusive result, naming the exercised configuration and stating that statistical testing covers only the exercised paths and inputs and cannot prove absence of leakage.

## Provenance

Adapted from the Trail of Bits `constant-time-testing` skill (https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3, path /plugins/testing-handbook-skills/skills/constant-time-testing/SKILL.md). Licensed CC-BY-SA-4.0; preserve Trail of Bits attribution and the source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding. This adaptation restates the runtime statistical (dudect, Welch's t-test) and dynamic (Timecop over Valgrind) testing mechanism as a semantic-minimum procedure and is marked as a modification of the original.
