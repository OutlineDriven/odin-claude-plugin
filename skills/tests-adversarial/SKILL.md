---
name: tests-adversarial
description: 'Use when asked to write adversarial tests when hardening error handling, validating boundary behavior, or hunting silent failures. Produces assumption-violation tests with passing sanitizer gates. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

## Procedure

1. **Read the code under test.** Understand actual behavior, not documentation claims.
2. **Document every implicit assumption.** For each function or module, record assumptions across six categories:
   - **Inputs**: types, nullability, ranges, empty collections, boundary values, encoding.
   - **Ordering**: argument order, sequence dependencies, lifecycle ordering, concurrent call interleaving.
   - **Timing**: timeouts, premature delivery, clock skew, token expiry mid-operation.
   - **State**: half-initialized state, shared-state corruption during operation, post-error recovery, double-close.
   - **Resources**: file descriptor exhaustion, disk full, permission revocation, allocation failure, connection pool saturation.
   - **Impossible cases**: concurrent modification during iteration, recursive re-entry, self-referential data, deep nesting overflow.
3. **Write one violation test per assumption.** Name each test after what it violates (e.g., `test_rejects_negative_quantity`, `test_handles_empty_result_set`, `test_recovers_from_mid_write_crash`). Test through the public API only; if private access is needed to trigger a failure, record that as a finding.
4. **Apply attack vectors systematically:**
   - *Data*: zero, negative, MAX_INT, NaN, Infinity, negative zero, empty string, null bytes, multi-byte Unicode (emoji, RTL, ZWJ), empty/single/capacity collections, encode-corrupt-decode.
   - *State*: double-close, use-after-dispose, read-after-error, concurrent mutation during iteration or serialization, half-written interrupted state, out-of-state-machine events.
   - *Environment*: file not found, permission denied, disk full, read-only filesystem, network timeout, connection reset, DNS failure, partial write, clock jumps, OOM during cleanup.
   - *Protocol*: out-of-order messages, duplicate delivery, missing acknowledgment, partial writes (truncated JSON/protobuf), version mismatch, request after close, response after timeout.
5. **Verify error quality.** Every failure path must produce a descriptive error. Silent corruption or generic messages are failures.
6. **Test boundaries from both sides.** If the limit is N, test N-1, N, and N+1. If the limit is 0, test -1, 0, and 1.
7. **Run sanitizers and race detectors.** Execute the full test suite under ASan, MSan, TSan, `-race`, Miri, or the language equivalent. Tests that pass without sanitizers may hide undefined behavior.
8. **Commit test files.** Stage and commit with a message identifying the assumptions violated and the sanitizer results.

## Failure and recovery
| Failure class | Detection | Recovery |
|---|---|---|
| Untested assumptions | Assumption list has entries without corresponding violation tests | Write the missing tests before committing |
| Silent failures | Code swallows errors or produces wrong output without signaling | Flag as exit code 2; do not commit until error paths produce descriptive output |
| Crashes or panics | Unhandled exceptions, segfaults, or undefined behavior under sanitizers | Flag as exit code 3; fix or document the defect before committing |
| Sanitizer warnings | Non-zero warning count from ASan/TSan/MSan/Miri | Do not commit; resolve every warning |

Partial results are not accepted. If any gate fails, the procedure stops at the failing gate and reports the exit code. No rollback is needed because no commit occurs until all gates pass.

## Output
Validation gate table:

| Gate | Condition |
|---|---|
| Assumptions documented | Every implicit assumption in the code under test is written down |
| Violations tested | Each documented assumption has at least one test that violates it |
| Errors are meaningful | Every failure path produces a descriptive error, not silence or a generic message |
| Sanitizers pass | All tests pass under sanitizers and race detectors with zero warnings |

Exit codes:

| Code | Meaning |
|---|---|
| 0 | All assumptions identified, violated, and handled; error paths produce meaningful output |
| 1 | Untested assumptions remain: some assumptions lack violation tests |
| 2 | Silent failures found: code swallows errors or produces wrong output without signaling |
| 3 | Crashes or panics discovered: unhandled exceptions, segfaults, or undefined behavior found |

## Provenance

- Origin: current-odin-skill-tree, path `skills/tests-adversarial/SKILL.md`.
- Revision: none pinned (current working tree).
- License: project-owned.
- Adaptation: clean-room rewrite of the existing adversarial testing skill into the ODIN 2.0 literal contract. No third-party expression retained.
