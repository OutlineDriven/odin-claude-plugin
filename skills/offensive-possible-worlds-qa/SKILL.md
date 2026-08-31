---
name: offensive-possible-worlds-qa
description: 'Use when a user wants to enumerate hostile worlds and actively make the product break. Hostile worlds are enumerated, the product is made to break in at least one, and a proof-of-break report is returned. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

1. Read the product surface. Identify entry points, public interfaces, documented invariants, configuration knobs, and stated error-handling contracts.
2. Enumerate hostile worlds. Each world is a distinct adversarial environment defined by a combination of:
   - Extreme inputs: empty, maximal, malformed, boundary-value, type-confused, encoding-hostile.
   - Resource exhaustion: memory pressure, disk full, file-descriptor exhaustion, connection pool saturation.
   - Concurrency stress: race windows, lock contention, parallel mutation, interleaved teardown.
   - Dependency failure: upstream timeout, partial response, schema drift, network partition, DNS failure.
   - State corruption: partial writes, interrupted migration, stale cache, clock skew, duplicate delivery.
   - Configuration hostility: missing keys, conflicting flags, environment-variable injection, secret rotation mid-flight.
3. For each hostile world, design one or more test cases that exercise the product under that world's conditions. Each test case must name the expected break signal: error, panic, data corruption, hang, incorrect output, or invariant violation.
4. Execute test cases against the actual product. Capture proof-of-break artifacts: error output, stack traces, incorrect results, timing anomalies, or corrupted state snapshots.
5. If the product survives a hostile world without breaking, escalate the attack: increase intensity, combine worlds, or extend duration. Stop escalation when the world is exhausted or the product breaks.
6. Compile the report (see Output). Include every hostile world attempted, its break status, and attached proof artifacts.

## Failure and recovery
- **Product surface inaccessible**: report the blocker, list the hostile worlds that could not be attempted, and stop. Do not fabricate test results.
- **Test execution fails due to environment, not product**: mark the test case as inconclusive, record the environment error, and continue with remaining worlds.
- **No hostile world produces a break**: report all worlds as survived. Escalate the most promising worlds with a note on what was tried. Do not claim the product is unbreakable.
- **Partial results**: always return the report with whatever worlds were completed. Mark incomplete worlds as not attempted with the reason.

## Output
A structured report containing:
- **World catalog**: each hostile world with its name, attack surface, and conditions.
- **Break log**: for each world that broke the product, the test case, the observed failure, and the proof-of-break artifact (file path or inline content).
- **Survived log**: for each world that did not break the product, what was tried and what escalation remains.
- **Summary**: total worlds attempted, total breaks found, total survived, and the strongest break identified.

## Provenance

- Origin: curated:curated-ideas:curated-034 from project-owned:user-curated-skill-ideas and project-owned:user-supplied-source-brief.
- Revision: null (no pinned revision).
- License: project-owned.
- Adaptation: clean-room rewrite of the user-curated entry "offensive-possible-worlds-qa: enumerate hostile worlds and actively make the product break" into a bounded, falsifiable procedure. No third-party expression copied.
