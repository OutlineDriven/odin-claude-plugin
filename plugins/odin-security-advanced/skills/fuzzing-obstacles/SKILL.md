---
name: fuzzing-obstacles
description: 'Use when asked to identify and bypass checksums, nondeterminism, or validation barriers that block fuzzing coverage. Patches the SUT behind an explicit fuzzing build flag with false-positive risk assessed. Not for dictionary creation — use fuzzing-dictionary. Local writes only.'
---

# Fuzzing obstacles

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs to identify and safely bypass checksums, nondeterminism, or validation barriers that block fuzzing coverage. |
| Authority | Reversible local write: modify only the System Under Test source behind an explicit fuzzing build flag so production behavior is unchanged. Rollback by deleting the conditional block or the fuzz build configuration; production code path is never altered. |
| Side effect | Fuzz-only target behavior behind explicit build controls. No production binary, credential, remote, or published artifact is touched. |
| Done | The specific obstacle is bypassed only in fuzz builds, coverage improves over the unpatched baseline, and false-positive risk is assessed. |

## Not for

- Dictionary creation for fixed-token gates — use fuzzing-dictionary.
- Coverage measurement or plateau analysis — use fuzzing-coverage-analysis.
- Remote, credential, publish, deploy, or irreversible changes.

## Inputs

Required:
- The System Under Test source tree and its build system.
- A fuzzer harness and coverage tooling already producing a baseline coverage report.

Optional:
- A seed corpus or dictionary (use these first; only patch when they cannot overcome the obstacle).

## Procedure

1. Identify the obstacle. Run the fuzzer and inspect coverage to locate unreachable code. Look for: checksum or hash verification before deeper processing; calls to `rand()`, `time()`, or `srand()` with system seeds; validation functions that reject most inputs; global-state initialization that differs across runs. Confirm the obstacle cannot be cleared with a better seed corpus or dictionary before patching. Done when: the obstacle is identified and confirmed unclearable by seeds or dictionary.
2. Add conditional compilation gated on the fuzzing build flag. Wrap the obstacle so it is enforced in production and bypassed only under the fuzzing build mode. See `references/patch-patterns.md` for C/C++ and Rust bypass patterns. Done when: the obstacle is wrapped behind the fuzzing build flag.
3. Patch incrementally. Bypass one obstacle at a time. Keep cheap validation (magic bytes, size checks) that guides the fuzzer at low cost; skip only the specific check that blocks coverage. Done when: one obstacle is bypassed and cheap validation is retained.
4. Provide safe defaults when downstream code assumes validated state. If code after the skipped check depends on a validated property (e.g., a divisor is nonzero), supply a safe fallback value under the fuzzing branch instead of skipping wholesale. See `references/patch-patterns.md` for the safe-default pattern. Done when: downstream assumptions are satisfied under the fuzzing branch.
5. Verify coverage improvement. Rebuild with fuzzing instrumentation, run the fuzzer for a short time, and compare line/basic-block/function coverage and corpus diversity against the unpatched baseline. Confirm new code paths are reachable. Done when: coverage improves over the unpatched baseline.
6. Assess false-positive risk. For each patch, determine whether skipping the check introduces program states impossible in production: does downstream code assume validated properties; could skipping cause crashes that cannot occur in production; is there implicit state dependency. Classify risk (LOW / MEDIUM / MITIGATED) and record it. If risk is high, narrow the patch or restore validation with safe defaults rather than skipping. Done when: each patch has a risk classification with rationale.
7. Document each patch so the fuzzing-vs-production divergence is visible to future maintainers. Done when: every patch is documented.

## Failure and recovery

- No coverage gain after patching: the patched check was not the real blocker. Revert the conditional block and re-run coverage analysis to find the next obstacle. Do not stack unverified patches.
- High false-positive rate: skipping the check introduced impossible states. Replace the skip with safe-default fallbacks (step 4) or narrow the bypass to a cheaper sub-check. Re-assess risk before continuing.
- Production behavior changed: the build flag leaked into a production build path. Stop. The flag must be defined only in the fuzzing build configuration. Roll back the conditional block and fix the build configuration so the flag is absent from production builds.
- Non-converged: if coverage does not improve and risk cannot be reduced below acceptable, return the obstacle as unresolved with the evidence gathered; do not declare the done predicate holds.

Rollback: delete the conditional compilation block (or remove the fuzz build configuration defining the flag). Because production code is guarded by the negated flag, removing the fuzz branch restores the original behavior with no production-side change.

## Output

Conditional-compilation patches in the System Under Test (each gated on the fuzzing build flag and documented), a coverage delta showing improved reachability over the unpatched baseline, and a per-patch false-positive risk classification (LOW / MEDIUM / MITIGATED) with rationale — unresolved obstacles reported as such with evidence rather than marked done.
