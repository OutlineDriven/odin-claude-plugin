---
name: fuzz-harness-writing
description: 'Use when a user needs to create or improve a deterministic, engine-agnostic fuzz harness for raw or structured target inputs. Identifies the API entry point, defines an adapter for structured input, writes a deterministic harness, populates a boundary corpus, and confirms API reachability with preserved crashes. Not for coverage measurement — use fuzzing-coverage-analysis.'
---

# Fuzz harness writing

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs to create or improve a deterministic fuzz harness for raw or structured target inputs. |
| Authority | Reversible local writes to the fuzz harness, target adapter code, corpus entries, and crash artifacts under the project tree; no VCS commit required. Revert by deleting the added harness, adapter, corpus, and artifact files. |
| Side effect | Local writes to fuzz harness, target adapter code, corpus, and crash artifacts. |
| Done | The harness executes representative and boundary inputs deterministically, reaches the intended API, and preserves reproducible crashes. |

## Not for

- Coverage measurement or plateau analysis — use fuzzing-coverage-analysis.
- Patching the system under test to bypass obstacles — use fuzzing-obstacles.
- Remote, credential, publish, deploy, or irreversible changes.

## Inputs

Required:
- Target API entry point to fuzz.
- Input shape (raw bytes or structured data).
- Language/runtime and fuzzing engine (needed for invocation and harness format).

Optional:
- Existing corpus.
- Seed dictionary.

## Procedure

1. Identify the smallest public API entry point that consumes untrusted input; record its signature and the input type it accepts. Done when: the entry point signature and input type are recorded.

2. Classify the input as raw bytes or structured data. For structured input, define the minimal adapter that converts raw bytes into the structured type without rejecting valid shapes the target must handle. Done when: the input is classified and, if structured, the adapter is defined.

3. Write the harness so it feeds the converted input directly to the target entry point with no filtering, normalization, or early return that hides boundary behavior. Make execution deterministic: seed any RNG, disable clocks and timeouts on the harness path, and isolate global state so each run reproduces. Done when: the harness feeds input directly to the target with no filtering and runs deterministically across repeated executions.

4. Populate the corpus with representative and boundary inputs: empty, maximal-length, and one-off-the-boundary cases for every accepted dimension. Done when: the corpus covers empty, maximal, and boundary cases for every dimension.

5. Run the harness against the corpus and confirm it reaches the intended API without harness-side crashes; preserve any target crash with its input, stack trace, and environment so it reproduces. Done when: the harness reaches the API and any target crash is preserved with input, stack trace, and environment.

## Failure and recovery

- Target API unreachable from the harness: stop and report the missing entry point; do not invent a wrapper that bypasses it.
- Non-deterministic execution: stop, identify the nondeterminism source (RNG, clock, shared global state), and pin it in the harness; never mask it by retrying.
- **Harness-side crash** (crash in adapter or harness code, not the target): fix the harness, not the target; re-run the corpus.
- Reproducible target crash: preserve the crashing input, stack trace, and environment verbatim; report it as a finding, do not suppress or fix it in the harness.
- Partial result: emit the harness and corpus that pass steps 1 through 5 for the reachable subset, and list the inputs or API paths that could not be covered with the reason. Roll back by deleting added harness, adapter, corpus, and artifact files; the target under test is never mutated.

## Output

A fuzz harness and target adapter that runs the corpus deterministically, reaches the intended API, and preserves reproducible crashes, plus a report listing covered API paths, corpus entries, and any preserved crash artifacts.
