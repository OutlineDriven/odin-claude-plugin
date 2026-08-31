---
name: offensive-possible-worlds-qa
description: 'Use when a user wants to enumerate hostile worlds and actively make the product break. Returns a proof-of-break report with every world attempted, its break status, and attached artifacts. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Offensive possible worlds QA

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to enumerate hostile worlds and actively make the product break. |
| Authority | Reversible-local: write only named local test cases and proof-of-break artifacts; state the rollback path before any write. |
| Side effect | Hostile-world test cases and proof-of-break artifacts written to local files. |
| Done | Hostile worlds are enumerated and the product is made to break in at least one; report returned. |

## Inputs

- **Product surface** (required): the code, API, binary, or feature under test. Must be accessible from the local environment.
- **Scope constraint** (optional): a boundary the human sets to focus the attack surface (e.g. one endpoint, one module, one configuration).

## Procedure

1. Read the product surface. Identify entry points, public interfaces, documented invariants, configuration knobs, and stated error-handling contracts. Done when: entry points, interfaces, invariants, knobs, and error contracts are identified.
2. Enumerate hostile worlds. Each world is a distinct adversarial environment defined by a combination of:
   - Extreme inputs: empty, maximal, malformed, boundary-value, type-confused, encoding-hostile.
   - Resource exhaustion: memory pressure, disk full, file-descriptor exhaustion, connection pool saturation.
   - Concurrency stress: race windows, lock contention, parallel mutation, interleaved teardown.
   - Dependency failure: upstream timeout, partial response, schema drift, network partition, DNS failure.
   - State corruption: partial writes, interrupted migration, stale cache, clock skew, duplicate delivery.
   - Configuration hostility: missing keys, conflicting flags, environment-variable injection, secret rotation mid-flight.
   Done when: a distinct hostile world is enumerated for each applicable combination.
3. For each hostile world, design one or more test cases that exercise the product under that world's conditions. Each test case must name the expected break signal: error, panic, data corruption, hang, incorrect output, or invariant violation. Done when: every hostile world has at least one test case with a named expected break signal.
4. Execute test cases against the actual product. Capture proof-of-break artifacts: error output, stack traces, incorrect results, timing anomalies, or corrupted state snapshots. Done when: every test case is executed with artifacts captured or survival confirmed.
5. If the product survives a hostile world without breaking, escalate the attack: increase intensity, combine worlds, or extend duration. Stop escalation when the world is exhausted or the product breaks. Done when: each survived world is escalated to exhaustion or break.
6. Compile the report (see Output). Include every hostile world attempted, its break status, and attached proof artifacts. Done when: the report covers every world attempted with break status and artifacts.

## Failure and recovery

- **Product surface inaccessible**: report the blocker, list the hostile worlds that could not be attempted, and stop. Do not fabricate test results.
- **Test execution fails due to environment, not product**: mark the test case as inconclusive, record the environment error, and continue with remaining worlds.
- **No hostile world produces a break**: report all worlds as survived. Escalate the most promising worlds with a note on what was tried. Do not claim the product is unbreakable.
- **Partial results**: always return the report with whatever worlds were completed. Mark incomplete worlds as not attempted with the reason.

## Output

One structured report: world catalog, break log, survived log, summary (worlds attempted, breaks found, survived, strongest break), in that order.
