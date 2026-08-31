---
name: constant-time-testing
description: 'Use when a cryptographic implementation must be checked at runtime for timing side-channel leakage. Runs dudect statistical testing and Timecop dynamic tracing, applies a Welch t-test threshold, and reports leakage or a bounded inconclusive result. Not for static assembly inspection — use constant-time-analysis.'
---

# Constant-time testing

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

1. Bound scope. Create a scratch directory for the harness, compiled binary, and sample files. Do not edit the implementation under test; compile it unchanged into the harness. Done when: the scratch directory exists and the implementation under test is compiled unchanged.
2. Identify the secret inputs and the four common constant-time violation patterns to look for: secret-dependent conditional branches, secret-dependent array access, variable-time integer division by a secret, and variable-time shifts by a secret. Done when: secret inputs and violation patterns are identified.
3. Statistical test (dudect). Write a C harness that defines `do_one_computation` calling the target function and `prepare_inputs` that assigns each measurement to a fixed input class or a random input class keyed on the secret. Compile with the production flags. Pin the process to an isolated core (`taskset -c <cpu>`) to reduce OS noise. Run for the measurement budget (5-10 minutes minimum; hours for high assurance). Read the Welch's t-test t-value: a high absolute t-value indicates timing leakage correlated with the secret. Done when: the dudect harness runs for the budget and the t-value is read.
4. Dynamic trace (Timecop over Valgrind). If statistical testing detects leakage or a specific suspect site exists, mark only the true secret memory with `VALGRIND_MAKE_MEM_UNDEFINED` (poison), run the function under `valgrind --track-origins=yes`, then unpoison. Valgrind reports the exact line where a conditional jump or move depends on the secret. Mark only true secrets to avoid false positives. Done when: the dynamic trace runs and reports secret-dependent operations or confirms none.
5. Calibrate the result. Test at the production optimization level, since leaks hidden at `-O0` may appear at `-O3`; on the target architecture, since x86 and ARM differ; and across the compiler versions and architectures the user supplied or that are accessible. Do not require calibration across compilers or architectures that were not supplied and are not installed. Confirm the compiler did not introduce or remove branches by inspecting assembly (`objdump -d`). Done when: the result is calibrated across the supplied or accessible compiler versions and architectures.
6. Classify. If the Welch t-test yields p < 0.00001 (equivalently |t| > 4.5) or Valgrind reports a secret-dependent operation, report leakage with the site, the violated pattern, and the exercised configuration (compiler, flags, architecture, duration). If measurements are noisy or the t-value does not exceed the threshold after the budget, report a bounded inconclusive result: statistical testing gives confidence only over the exercised paths and inputs and cannot prove absence of leakage. Done when: a leakage or bounded inconclusive classification is stated with the exercised configuration.

## Failure and recovery
- Noisy measurements or t-value never settles: do not declare clean. Extend the run, pin to an isolated core, minimize non-crypto code in the harness, and re-run. If still unsettled after the budget, return the bounded inconclusive result naming the configuration.
- Valgrind reports no secret-dependent operation but dudect flags leakage: microarchitecture timing (cache, division, shifts) may not be visible to Valgrind. Report the statistical evidence and note the dynamic trace covered only executed paths.
- Harness fails to compile or the function cannot be isolated: stop; report the blocker and the attempted configuration. Do not edit the implementation under test to make it testable.
- Rollback: delete the scratch directory and compiled artifacts. No mutation of the implementation under test or any repository, VCS, credential, or remote state occurs.

## Output
One of: leakage detected (leak site, violated pattern, tool and signal, exercised configuration) or bounded inconclusive (exercised configuration named, statistical testing covers only exercised paths and inputs).
