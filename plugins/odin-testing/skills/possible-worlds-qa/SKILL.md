---
name: possible-worlds-qa
description: 'Use when a product surface must be tested against extreme or hostile worlds rather than collect green checks. Completeness mode classifies every world against stated criteria and reports gaps; break mode names an expected break signal per world, captures proof artifacts, and escalates worlds that survive. Not for interpreting a design dispute — use possible-worlds; not for remote, credential, publish, deploy, or irreversible changes.'
---

# Possible worlds QA

A passing test is not evidence that a surface is sound; it is evidence that one world was survivable.
This skill enumerates the worlds a surface can find itself in, then either measures what the surface
fails to cover or proves it can be broken.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A named product surface must be tested against extreme or hostile worlds rather than a green-check suite. |
| Authority | Write only named local test cases and report artifacts, and state the rollback path before the first write. No source, version control, credential, paid, published, deployed, or remote mutation. |
| Side effect | Test-case files and one report written to the local working tree. Deleting them reverses the run. |
| Done (completeness) | Every enumerated world is classified covered, gap, or untestable against a stated criterion, and the report names the world, observed behaviour, violated criterion or blocker, and test-case path for each. |
| Done (break) | Every enumerated world is broken with an attached artifact, escalated until exhausted, or recorded untestable with its blocker, and the report carries the world catalogue, break log, survived log, and summary. |

## Mode selection

| Mode | Select when | Verdict it produces |
|---|---|---|
| Completeness | The caller wants to know what the surface fails to handle, measured against criteria it claims to meet. | Each world is covered, a gap, or untestable. |
| Break | The caller wants proof the surface can be made to fail. | Each world breaks the surface, survives and is escalated until exhausted, or is untestable with a named blocker. |

Ask when the request names neither. The modes share steps 1 through 4 and diverge at step 5.

## Inputs

- The product surface, required: a named code path, module, API, binary, feature, or system boundary reachable from the local environment.
- Completeness criteria, required in completeness mode: the invariants, contracts, or acceptable behaviours the surface claims. When absent, derive minimal criteria from the surface's own stated invariants; when the surface states none, report completeness undefined and stop.
- World budget, optional: a cap on enumerated worlds. When absent, enumerate until every distinct dimension the surface exposes is represented once.

## Procedure

1. Bound the surface. Name it, and refuse to widen into unrelated surfaces. Read its entry points, public interfaces, documented invariants, configuration knobs, and stated error contracts. Done when: the surface is named as a single coherent target with its interfaces and claimed invariants listed, or the run stops naming the boundary ambiguity.
2. Enumerate worlds across every dimension the surface exposes. Each world is a specific falsifiable condition, never a generic stress label. The dimensions: extreme inputs (empty, maximal, malformed, boundary-value, type-confused, encoding-hostile); resource exhaustion (memory, disk, file descriptors, connection pools); concurrency (race windows, lock contention, parallel mutation, interleaved teardown); dependency failure (timeout, partial response, schema drift, partition, name resolution); state corruption (partial writes, interrupted migration, stale cache, clock skew, duplicate delivery); configuration hostility (missing keys, conflicting flags, environment injection, secret rotation mid-flight). Done when: each applicable dimension carries at least one concrete condition, and every enumerated world states the condition rather than a category name.
3. Construct a test case per world and write it to the local working tree. In break mode each case also names the break signal it expects: error, panic, data corruption, hang, incorrect output, or invariant violation. A world no case can be built for is recorded as untestable with its specific blocker and carried forward, because a world that cannot be tested is a finding rather than an omission. Done when: every world either has a test-case file on disk or is recorded untestable with the blocker that prevented it, and in break mode every buildable case names its expected break signal.
4. Execute or trace each case against the actual product, capturing what happened rather than what should have happened. Done when: every case has a recorded observation, or is marked inconclusive with the environment error that prevented it.
5. Classify by mode. Completeness mode records each result as covered, gap, or untestable, and a gap requires a stated criterion the surface violated under that world; a deliberate limit is not a gap, and a passing case is covered rather than success evidence. Break mode captures the proof artifact for each break — error output, stack trace, incorrect result, timing anomaly, corrupted state snapshot — and escalates each survived world by raising intensity, combining worlds, or extending duration. Worlds recorded untestable at step 3 keep that classification and their blocker. Done when: completeness mode has every world classified against a named criterion or as untestable, or break mode has every world broken with an attached artifact, escalated until exhausted, or untestable with its blocker.
6. Compile the report in the shape its mode requires, listed under Output. Done when: the report accounts for every enumerated world, its world count matches the count from step 2, and every untestable world names what blocked it.

## Failure and recovery

- Surface too broad to bound: stop and report the boundary ambiguity. Never invent a narrower surface.
- No completeness criteria and no derivable invariants, completeness mode: report completeness undefined for the surface and stop. Never fabricate a criterion.
- Surface inaccessible: report the blocker and list the worlds that could not be attempted. Never fabricate a result.
- Case fails because of the environment rather than the product: mark it inconclusive, record the error, and continue with the remaining worlds.
- No world breaks the surface, break mode: report every world as survived, name what escalation was tried, and state that the run found no break. Never claim the surface is unbreakable.
- Partial results: return every enumerated world with its classification, including untestable and unattempted ones. Never report done while a world is unclassified.
- Rollback: delete the written test cases and report. Nothing outside the local working tree changed, so no further recovery applies.

## Output

Completeness mode returns the test-case files plus a completeness-gap report, one entry per world naming its classification, the observed behaviour, the violated criterion or the blocker, and the test-case path where a case was built.

Break mode returns the test-case files plus a proof-of-break report in four sections, in order: world catalogue, break log with attached artifacts, survived log with the escalation tried, and a summary counting worlds attempted, breaks found, worlds survived, and the strongest break.
