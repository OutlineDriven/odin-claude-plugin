---
name: tests-adversarial
description: 'Use when hardening error handling, validating boundary behavior, or hunting silent failures. Not for feature development: use tdd. Not for test deletion: use tests-purge-unneeded.'
---

# Adversarial test authoring

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The work is hardening error handling, validating boundary behavior, or hunting silent failures. |
| Authority | Reversible local: writes only test files, local artifacts, and minimal production code changes to fix silent failures discovered by the tests; rollback is reverting the commit or deleting added files. No remote mutation. |
| Side effect | Writes assumption-violation tests over inputs, ordering, timing, state, resources, and impossible cases; fixes silent failures in production code so every failure path signals; runs sanitized race-detector gates. |
| Done | Every documented assumption has a violation test, every failure path produces a descriptive error, and every selected sanitizer available on the toolchain passes with zero warnings; a sanitizer unavailable on the toolchain is recorded as a gap and never excuses a failure in one that ran. |

## Inputs

- Code under test (required): source files, modules, or functions to harden.
- Language runtime and sanitizer toolchain (required): compiler, test runner, and available sanitizers (ASan, TSan, MSan, Miri, `-race`, or equivalent).
- Existing test suite (optional): prior tests to avoid duplication and to identify gaps.

## Refusals

- Will not commit while any sanitizer warning is unresolved.
- Will not commit while silent failures remain; every failure path must produce a descriptive error.
- Will not commit while untested assumptions remain; every documented assumption needs a violation test.
- Will not accept partial results; if any gate fails, the procedure stops at that gate.

## Procedure

1. **Read the code under test.** Understand actual behavior, not documentation claims. **Done when:** the code's real behavior is understood.

2. **Document implicit assumptions, bounded to the error surface.** For each function or module, record assumptions across six categories that affect error paths, boundary behavior, or silent failures: inputs (types, nullability, ranges, empty collections, boundary values, encoding); ordering (argument order, sequence dependencies, lifecycle ordering, concurrent call interleaving); timing (timeouts, premature delivery, clock skew, token expiry mid-operation); state (half-initialized state, shared-state corruption during operation, post-error recovery, double-close); resources (file descriptor exhaustion, disk full, permission revocation, allocation failure, connection pool saturation); impossible cases (concurrent modification during iteration, recursive re-entry, self-referential data, deep nesting overflow). Do not enumerate assumptions about correct-path behavior that the existing test suite already covers. **Done when:** every error-surface assumption is a named, executable check with a unique identifier.

3. **Write one violation test per assumption.** Name each test after what it violates (e.g., `test_rejects_negative_quantity`, `test_handles_empty_result_set`, `test_recovers_from_mid_write_crash`). Test through the public API only; if private access is needed to trigger a failure, record that as a finding. **Done when:** every documented assumption has at least one violation test.

4. **Apply attack vectors systematically.** Data: zero, negative, MAX_INT, NaN, Infinity, negative zero, empty string, null bytes, multi-byte Unicode (emoji, RTL, ZWJ), empty/single/capacity collections, encode-corrupt-decode. State: double-close, use-after-dispose, read-after-error, concurrent mutation during iteration or serialization, half-written interrupted state, out-of-state-machine events. Environment: file not found, permission denied, disk full, read-only filesystem, network timeout, connection reset, DNS failure, partial write, clock jumps, OOM during cleanup. Protocol: out-of-order messages, duplicate delivery, missing acknowledgment, partial writes (truncated JSON/protobuf), version mismatch, request after close, response after timeout. **Done when:** every attack vector category has at least one test per applicable assumption.

5. **Verify error quality and fix silent failures.** Every failure path must produce a descriptive error. Silent corruption or generic messages are failures. When a test exposes a silent failure in production code, apply the minimal fix that makes the failure path signal descriptively: add an error return, raise a typed exception, or log and propagate. Do not refactor unrelated code or widen scope. **Done when:** every failure path produces a descriptive, non-generic error.

6. **Test boundaries from both sides.** If the limit is N, test N-1, N, and N+1. If the limit is 0, test -1, 0, and 1. **Done when:** every boundary is tested from both sides.

7. **Run sanitizer gates.** Select sanitizers by failure class and language, at most two per run to keep the gate tractable:
   - Memory safety in C/C++: ASan. Add MSan when uninitialized reads are in scope.
   - Data races in concurrent languages: TSan (C/C++/Go), `-race` (Go), ThreadSanitizer (Swift).
   - Rust unsafe code: Miri.
   - Java: ThreadSanitizer or `-XX:+UseThreadSanitizer` where available.
   If the project's toolchain does not support a selected sanitizer, record the gap and proceed with the available one. Execute the full test suite under each selected sanitizer. Tests that pass without sanitizers may hide undefined behavior. **Done when:** all tests pass under the selected sanitizers with zero warnings, or unsupported sanitizer gaps are recorded.

8. **Commit test files and silent-failure fixes.** Stage and commit with a message identifying the assumptions violated, the silent failures fixed, and the sanitizer results. **Done when:** the commit is made with the assumption list, fix list, and sanitizer results in the message.

## Failure and recovery

| Failure class | Detection | Recovery |
|---|---|---|
| Untested assumptions | Assumption list has entries without corresponding violation tests | Write the missing tests before committing |
| Silent failures | Code swallows errors or produces wrong output without signaling | Apply the minimal production fix that makes the failure path signal; do not commit until error paths produce descriptive output |
| Crashes or panics | Unhandled exceptions, segfaults, or undefined behavior under sanitizers | Flag as exit code 3; fix or document the defect before committing |
| Sanitizer warnings | Non-zero warning count from the selected sanitizers | Do not commit; resolve every warning |
| Sanitizer unavailable | The selected sanitizer is not supported by the project toolchain | Record the gap; proceed with the available sanitizer; note the unsupported gap in the commit message |

Partial results are not accepted. If any gate fails, the procedure stops at the failing gate and reports the exit code. No rollback is needed because no commit occurs until all gates pass.

## Output

A validation gate table (assumptions documented, violations tested, errors meaningful, sanitizers pass) with exit code 0 (all clear), 1 (untested assumptions), 2 (silent failures), or 3 (crashes or panics), followed by the exit code with its meaning.
