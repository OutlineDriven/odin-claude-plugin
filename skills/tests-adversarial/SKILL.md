---
name: tests-adversarial
description: 'Write adversarial tests for error handling, boundaries, and silent failures, with sanitizer gates. Not for feature development — use tdd (offensive-first); not for test deletion — use tests-purge-unneeded; not for remote or irreversible changes.'
---

# Adversarial test authoring

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The work is hardening error handling, validating boundary behavior, or hunting silent failures. |
| Authority | Reversible-local: write only test files and local artifacts; rollback by reverting the commit or deleting added files. |
| Side effect | Writes assumption-violation tests over inputs, ordering, timing, state, resources, and impossible cases; runs sanitized race-detector gates. |
| Done | Every documented assumption has a violation test and the sanitizers pass with zero warnings. |

## Inputs

- **Code under test** (required): source files, modules, or functions to harden.
- **Language runtime and sanitizer toolchain** (required): compiler, test runner, and available sanitizers (ASan, TSan, MSan, Miri, `-race`, or equivalent).
- **Existing test suite** (optional): prior tests to avoid duplication and to identify gaps.

## Refusals

- Will not commit while any sanitizer warning is unresolved.
- Will not commit while silent failures remain — every failure path must produce a descriptive error.
- Will not commit while untested assumptions remain — every documented assumption needs a violation test.
- Will not accept partial results — if any gate fails, the procedure stops at that gate.

## Procedure

1. **Read the code under test.** Understand actual behavior, not documentation claims. **Done when:** the code's real behavior is understood.
2. **Document every implicit assumption.** For each function or module, record assumptions across six categories: inputs (types, nullability, ranges, empty collections, boundary values, encoding); ordering (argument order, sequence dependencies, lifecycle ordering, concurrent call interleaving); timing (timeouts, premature delivery, clock skew, token expiry mid-operation); state (half-initialized state, shared-state corruption during operation, post-error recovery, double-close); resources (file descriptor exhaustion, disk full, permission revocation, allocation failure, connection pool saturation); impossible cases (concurrent modification during iteration, recursive re-entry, self-referential data, deep nesting overflow). **Done when:** every assumption is written down with its category.
3. **Write one violation test per assumption.** Name each test after what it violates (e.g., `test_rejects_negative_quantity`, `test_handles_empty_result_set`, `test_recovers_from_mid_write_crash`). Test through the public API only; if private access is needed to trigger a failure, record that as a finding. **Done when:** every documented assumption has at least one violation test.
4. **Apply attack vectors systematically.** Data: zero, negative, MAX_INT, NaN, Infinity, negative zero, empty string, null bytes, multi-byte Unicode (emoji, RTL, ZWJ), empty/single/capacity collections, encode-corrupt-decode. State: double-close, use-after-dispose, read-after-error, concurrent mutation during iteration or serialization, half-written interrupted state, out-of-state-machine events. Environment: file not found, permission denied, disk full, read-only filesystem, network timeout, connection reset, DNS failure, partial write, clock jumps, OOM during cleanup. Protocol: out-of-order messages, duplicate delivery, missing acknowledgment, partial writes (truncated JSON/protobuf), version mismatch, request after close, response after timeout. **Done when:** every applicable vector class is exercised.
5. **Verify error quality.** Every failure path must produce a descriptive error. Silent corruption or generic messages are failures. **Done when:** every failure path produces a descriptive, non-generic error.
6. **Test boundaries from both sides.** If the limit is N, test N-1, N, and N+1. If the limit is 0, test -1, 0, and 1. **Done when:** every boundary is tested from both sides.
7. **Run sanitizers and race detectors.** Execute the full test suite under ASan, MSan, TSan, `-race`, Miri, or the language equivalent. Tests that pass without sanitizers may hide undefined behavior. **Done when:** all tests pass under sanitizers with zero warnings.
8. **Commit test files.** Stage and commit with a message identifying the assumptions violated and the sanitizer results. **Done when:** the commit is made with the assumption list and sanitizer results in the message.

## Failure and recovery

| Failure class | Detection | Recovery |
|---|---|---|
| Untested assumptions | Assumption list has entries without corresponding violation tests | Write the missing tests before committing |
| Silent failures | Code swallows errors or produces wrong output without signaling | Flag as exit code 2; do not commit until error paths produce descriptive output |
| Crashes or panics | Unhandled exceptions, segfaults, or undefined behavior under sanitizers | Flag as exit code 3; fix or document the defect before committing |
| Sanitizer warnings | Non-zero warning count from ASan/TSan/MSan/Miri | Do not commit; resolve every warning |

Partial results are not accepted. If any gate fails, the procedure stops at the failing gate and reports the exit code. No rollback is needed because no commit occurs until all gates pass.

## Output

A validation gate table (assumptions documented, violations tested, errors meaningful, sanitizers pass) with exit code 0 (all clear), 1 (untested assumptions), 2 (silent failures), or 3 (crashes or panics) — ordering: gate table, then exit code with its meaning.

## Provenance

- Origin: current-odin-skill-tree, path `skills/tests-adversarial/SKILL.md`.
- Revision: none pinned (current working tree).
- License: project-owned.
- Adaptation: clean-room rewrite of the existing adversarial testing skill into the ODIN 2.0 literal contract. No third-party expression retained.
