---
name: skill-benchmark-gate
description: 'Use when a skill change is about to ship and must pass a release gate. Validates gate inputs fail-closed, runs activation and regression cases against an explicit baseline, measures context cost against an explicit ceiling, and emits PASS or FAIL with one issue per failure. Not for scoring without gating — use skill-benchmark.'
disable-model-invocation: true
---

# Skill benchmark gate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Before shipping any skill change; diagnosing weak skill activation, regressions, or context cost; setting release gates for skill packs |
| Authority | Read and evaluate the skill; write only gate logs and issue artifacts; do not ship the change |
| Side effect | Runs evaluation loops; writes run-log entries; opens follow-up issues on GitHub or equivalent tracker |
| Done | A reproducible PASS or FAIL record with case results, deltas, context cost, and failure issues |

## Inputs

All inputs are required and must be explicit. No defaults are inferred from the procedure.

1. Changed skill and comparison revision: the skill slug, the diff or branch under test, and the baseline revision to compare against.
2. Explicit universal activation case set: the complete list of cases that must all show activation greater than 0% with the skill enabled. Every case must be named; no case is implied.
3. Explicit critical regression case set and baseline: the list of critical scenarios and their recorded baseline results (pass/fail and context token count per scenario) from the comparison revision. Every scenario must be named with its baseline; no scenario is implied.
4. Explicit context-budget ceiling: the maximum total context tokens the skill may load, stated as a number.
5. Explicit iteration budget: the maximum number of evaluation iterations the gate may run, stated as a number.

## Procedure

1. Validate all gate inputs fail-closed. Confirm every required input is present and non-empty. If any input is missing or incomplete, fail immediately with `missing gate input` and name the missing input. Do not proceed to evaluation. Done when: all five required inputs are confirmed present and explicit.
2. Run activation cases. Execute each case in the universal activation set with the skill enabled. Record whether the skill fired (activated) or missed for each case. Done when: every case in the universal activation set is executed and its activation result is recorded.
3. Run baseline and changed regression cases. Execute each critical regression scenario against the comparison revision (baseline) and against the changed skill. Record pass/fail and context token count per scenario for both. Done when: every critical regression scenario is executed against both baseline and changed skill, and results are recorded.
4. Measure context cost. Sum the total context tokens loaded by the skill across all executed cases. Compare against the explicit context-budget ceiling. Done when: the total context cost is measured and compared against the ceiling.
5. Emit PASS or FAIL and file one issue per failure. Apply the gate criteria:
   - Universal activation: every case in the universal activation set must show activation greater than 0%. Any 0% activation is a gate failure.
   - Regression deltas: compare each critical scenario's changed result against its recorded baseline. Any negative delta (baseline pass to changed fail, or increased token count) is a gate failure.
   - Context budget: total context tokens must not exceed the explicit ceiling. An overrun is a gate failure.
   - Iteration budget: if the iteration budget is exhausted before all cases are executed, the gate fails with `iteration budget exhausted`.
   For each gate failure, open a follow-up issue with the failure class, scenario or case ID, observed value, and expected threshold. Write the run-log entry: timestamp, skill slug, change reference, case results, deltas, context cost, gate verdict, and filed issue references. Done when: the verdict is emitted, one issue is filed per failure (or none if the gate passed), and the run-log entry is written.

## Failure and recovery

| Failure class | Trigger | Partial-result rule | Blocked result |
|---|---|---|---|
| Missing gate input | Any of the five required inputs is absent or incomplete | Record which input is missing; do not evaluate | Gate fails before evaluation; no issues filed |
| Evaluation unavailable | An evaluation case cannot be executed (tool error, model unavailable) | Record all collected results; mark the unexecuted case as a gate failure | Skill change blocked from shipping. Issue filed for the unexecuted case. |
| Iteration budget exhausted | The iteration budget is reached before all cases are executed | Record partial results collected so far | Skill change blocked from shipping. Issue filed for incomplete run. |
| Any criterion failed | Universal 0% activation, negative regression delta, or context budget overrun | Record all collected results; mark gate as FAIL | Skill change blocked from shipping. One issue filed per failing case or scenario. |

Do not widen scope to find passing cases that offset failures. Do not suppress or reclassify failures. If the gate fails, the skill change does not ship.

## Output

A reproducible PASS or FAIL record with case results (activation per case, regression deltas per scenario, context cost versus ceiling), filed issues (one per gate failure), and a run-log entry. If the gate passes, schedule a post-merge rerun to execute after the next model update.
