---
name: skill-benchmark-gate
description: 'Use when a skill change is about to ship and must pass a release gate: runs activation, regression, and context-cost benchmarks and blocks shipping on any gate failure. Not for scoring without gating — use skill-benchmark.'
disable-model-invocation: true
---

# Skill benchmark gate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Before shipping any skill change; diagnosing weak skill activation, regressions, or context cost; setting release gates for skill packs. |
| Authority | Human-only. Requires explicit human invocation. Preview target and consequence before running evaluation loops, writing run-log entries, or opening follow-up issues. |
| Side effect | Runs evaluation loops; writes run-log entries; opens follow-up issues on GitHub or equivalent tracker. |
| Done | Gate satisfied before shipping: zero universal 0% criteria with skill enabled, zero negative deltas on critical scenarios, run recorded, issues filed; post-merge rerun scheduled after model updates. |

## Inputs

1. **Skill change** (required): the diff, branch, or description of the skill modification under test.
2. **Gate criteria** (optional): override defaults for universal-activation thresholds, critical-scenario set, and context-budget ceiling. If omitted, use the standard gate criteria defined in the procedure.
3. **Benchmark scenarios** (optional): override the default scenario set. If omitted, derive scenarios from the skill's trigger predicate and known activation paths.

## Procedure

1. Identify the skill change under test. Record the skill slug, change description, and commit or branch reference. Done when: the skill change is recorded with slug, description, and ref.
2. Design benchmark scenarios:
   a. Activation scenarios: test whether the skill fires on each trigger predicate variant with the skill enabled.
   b. Regression scenarios: test critical paths that the skill must continue to handle correctly after the change.
   c. Context-cost scenarios: measure token consumption for the skill's context load against the budget ceiling.
   Done when: all three scenario types are designed.
3. Run evaluation loops:
   a. Execute each scenario with the skill enabled.
   b. Record activation (fired or missed), output correctness (pass or fail), and context token count per scenario.
   c. Repeat until all scenarios are executed or the iteration budget is exhausted.
   Done when: all scenarios are executed or the iteration budget is exhausted.
4. Collect results and apply gate criteria:
   a. Universal activation: every scenario in the universal set must show activation > 0% with the skill enabled. Any 0% activation is a gate failure.
   b. Regression deltas: compare each critical scenario's result against the baseline. Any negative delta is a gate failure.
   c. Context budget: total context tokens must not exceed the ceiling. An overrun is a gate failure.
   Done when: all three gate criteria are applied and pass/fail is determined.
5. For each gate failure, open a follow-up issue with the failure class, scenario ID, observed value, and expected threshold. Done when: one issue is filed per gate failure, or none if the gate passed.
6. Write the run-log entry: timestamp, skill slug, change reference, scenario results, gate verdict, and filed issue references. Done when: the run-log entry is written.
7. If the gate passes, schedule a post-merge rerun to execute after the next model update. Done when: the rerun is scheduled or the gate failed.
8. Render the gate verdict as PASS or FAIL. For FAIL, include the specific failure classes. Done when: the verdict is rendered.

## Failure and recovery
| Failure class | Trigger | Partial-result rule | Blocked result |
|---|---|---|---|
| Universal 0% activation | One or more universal scenarios show 0% activation with skill enabled | Record all collected results; mark gate as FAIL | Skill change blocked from shipping. Issue filed per failing scenario. |
| Negative regression delta | One or more critical scenarios show negative delta vs baseline | Record all collected results; mark gate as FAIL | Skill change blocked from shipping. Issue filed per regressing scenario. |
| Non-convergent evaluation | Evaluation loop exhausts iteration budget without completing all scenarios | Record partial results collected so far; mark gate as FAIL | Skill change blocked from shipping. Issue filed for incomplete run. |
| Context budget overrun | Total context tokens exceed ceiling | Record measured cost; mark gate as FAIL | Skill change blocked from shipping. Issue filed with measured vs. allowed cost. |

Do not widen scope to find passing scenarios that offset failures. Do not suppress or reclassify failures. If the gate fails, the skill change does not ship.

## Output
Gate verdict (PASS or FAIL), run log with full scenario results, filed issues (one per gate failure), and a scheduled post-merge rerun if the gate passes.
