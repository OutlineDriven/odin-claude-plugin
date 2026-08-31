---
name: fuzz-harness-writing
description: 'Use when a user needs to create or improve a deterministic fuzz harness for raw or structured target inputs. Reaches the intended API and preserves reproducible crashes. Not for coverage measurement — use fuzzing-coverage-analysis. Local writes only.'
---

# Fuzz harness writing

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs to create or improve a deterministic fuzz harness for raw or structured target inputs. |
| Authority | Write only the fuzz harness and target adapter code under the project tree; leave the target under test unchanged. Revert by deleting the added harness and adapter files or restoring them from version control. |
| Side effect | Local writes to fuzz harness and target adapter code only. |
| Done | The harness executes representative and boundary inputs deterministically, reaches the intended API, and preserves reproducible crashes. |

## Not for

- Coverage measurement or plateau analysis — use fuzzing-coverage-analysis.
- Patching the system under test to bypass obstacles — use fuzzing-obstacles.
- Remote, credential, publish, deploy, or irreversible changes.

## Inputs

Required: the target API entry point to fuzz and the input shape (raw bytes or structured data). Optional: an existing corpus, a seed dictionary, the language/runtime, and the fuzzing engine to target.

## Procedure

1. Identify the smallest public API entry point that consumes untrusted input; record its signature and the input type it accepts. Done when: the entry point signature and input type are recorded.
2. Classify the input as raw bytes or structured data. For structured input, define the minimal adapter that converts raw bytes into the structured type without rejecting valid shapes the target must handle. Done when: the input is classified and, if structured, the adapter is defined.
3. Write the harness so it feeds the converted input directly to the target entry point with no filtering, normalization, or early return that hides boundary behavior. Done when: the harness feeds input directly to the target with no filtering.
4. Make execution deterministic: seed any RNG, disable clocks and timeouts on the harness path, and isolate global state so each run reproduces. Done when: the harness runs deterministically across repeated executions.
5. Add representative and boundary inputs to the corpus: empty, maximal-length, and one-off-the-boundary cases for every accepted dimension. Done when: the corpus covers empty, maximal, and boundary cases for every dimension.
6. Run the harness against the corpus and confirm it reaches the intended API without harness-side crashes; preserve any target crash with its input, stack trace, and environment so it reproduces. Done when: the harness reaches the API and any target crash is preserved with input, stack trace, and environment.
7. Keep the harness and adapter in the project tree under version control; do not modify the target under test. Done when: the harness and adapter are committed and the target is unchanged.

## Failure and recovery

- **Target API unreachable from the harness**: stop and report the missing entry point; do not invent a wrapper that bypasses it.
- **Non-deterministic execution**: stop, identify the nondeterminism source (RNG, clock, shared global state), and pin it in the harness; never mask it by retrying.
- **Harness-side crash** (crash in adapter or harness code, not the target): fix the harness, not the target; re-run the corpus.
- **Reproducible target crash**: preserve the crashing input, stack trace, and environment verbatim; report it as a finding, do not suppress or "fix" it in the harness.
- **Partial result**: emit the harness and corpus that pass steps 1-6 for the reachable subset, and list the inputs or API paths that could not be covered with the reason. Roll back by deleting added harness/adapter files or restoring them from version control; the target under test is never mutated.

## Output

A version-controlled fuzz harness and target adapter that runs the corpus deterministically, reaches the intended API, and preserves reproducible crashes, plus a report listing covered API paths, corpus entries, and any preserved crash artifacts.
