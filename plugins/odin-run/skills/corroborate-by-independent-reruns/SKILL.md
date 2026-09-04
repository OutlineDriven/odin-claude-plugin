---
name: corroborate-by-independent-reruns
description: 'Use when a candidate patch or answer needs independent corroboration before it is trusted. Not for multi-stance investigation: use council.'
---

# Corroborate by independent reruns

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A candidate patch or answer needs independent corroboration before it is trusted |
| Authority | Reversible local: writes only the named corroboration report; rollback is discarding it if rejected. No remote mutation. Each run mutates only its own isolated sandbox, discarded after capture. |
| Side effect | Runs N isolated sandboxed attempts and returns the majority patch plus its agreement count; byte identity is a corroboration signal, not a correctness oracle; no-change runs never carry consensus |
| Done | Either a strict majority of launched runs produced byte-identical output and it is returned with its count, or no consensus is reported |

## Inputs

- The candidate patch or answer to corroborate.
- N, the number of isolated runs to launch (N >= 1).
- The sandbox execution command or task prompt each run performs independently from a clean baseline.
- Optional: a baseline output to classify no-change runs against.

## Procedure

1. Receive the candidate, N, and the sandbox execution command. Bound scope to N isolated runs; do not widen to additional runs or mutate the shared working tree. Done when: scope is bounded to exactly N isolated runs with no shared-tree mutation.
2. Launch N isolated sandboxed attempts, each starting from the same clean baseline and running the same task without access to any other run's output. Done when: N isolated runs are launched, each from a clean baseline with no cross-run access.
3. Capture each run's full output bytes. Done when: every launched run's full output bytes are captured.
4. Classify each output: a no-change run whose output is byte-identical to the baseline or empty is excluded from consensus and never carries consensus. Done when: every output is classified as candidate or no-change, with no-change runs excluded from consensus.
5. Group the remaining outputs by byte identity. If a single byte-identical group is a strict majority of the N launched runs (count > N/2), return that output with its agreement count. Done when: outputs are grouped by byte identity and either a strict-majority group is identified or no majority exists.
6. If no byte-identical group reaches a strict majority, report no consensus. Done when: no-consensus is reported with the per-run output groups, or the strict-majority output is returned with its count.
7. Treat byte identity as a corroboration signal only, never as a correctness oracle; do not assert the majority output is correct. Done when: the result is presented as a corroboration signal with no correctness claim.

## Failure and recovery
- Sandbox failure: a run that errors or cannot capture output counts as a launched run that produced no candidate; it contributes to no byte-identical group.
- Partial results: never return a partial majority; consensus requires a strict majority of all N launched runs, not a plurality.
- Non-mutation: each run operates in an isolated sandbox discarded after capture; the only named local artifact is the returned corroboration report, which the caller discards if rejected.
- Blocked or non-converged: if no byte-identical group is a strict majority, the terminal result is no consensus with the per-run output groups. Do not fabricate agreement, promote a plurality, or claim the majority output is correct.

## Output
Either the strict-majority byte-identical patch or answer with its agreement count, or a no-consensus classification listing the per-run output groups. Never a correctness claim.
