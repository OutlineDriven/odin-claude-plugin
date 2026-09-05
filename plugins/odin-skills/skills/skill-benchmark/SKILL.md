---
name: skill-benchmark
description: 'Use when the user runs /skill-benchmark to score skills, compare models, or gate a skill release. Modes: score (default) and gate. Not for editing skills: use agent-surface-forge.'
disable-model-invocation: true
---

# Skill benchmark

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /skill-benchmark to score skills via LLM judges, compare candidate models on a shared task set, or gate a skill release. |
| Authority | Human-gated: previews the benchmark target, judge or candidate models, rubric or task set, and estimated spend before any LLM call; in gate mode, may open follow-up issues after confirmation. Every other write is reversible local, with version control as rollback. No remote mutation without explicit human confirmation in gate mode; no remote mutation in score mode. |
| Side effect | Writes benchmark artifacts under `.odin/benchmark-reports/` and incurs LLM inference spend; in gate mode, also writes gate logs and run-log entries and may open follow-up issues. |
| Done | A scored skill-quality report or model-comparison table (score mode) or a reproducible PASS/FAIL record (gate mode) is written and returned to the human. |

## Inputs

- **Mode** (required): `score` (default) or `gate`.

### Score mode

Choose a sub-mode:

- **Skill-quality sub-mode**:
  - `--baseline`: capture a scored baseline before changes. Run first on a clean branch.
  - `--quick`: single-pass scoring without baseline comparison.
  - `--skills <name1>,<name2>`: score only named skills. Omit to auto-discover from the skill directory.
  - `--diff`: score only skills whose files changed on the current branch.
  - `--trend`: show score trends from historical baseline files.
  - Judge model and rubric must be supplied or confirmed by the user before scoring begins.

- **Model-comparison sub-mode**:
  - The task or task set to run against every candidate model (required).
  - The candidate model list (required): two or more models to compare.
  - Per-model run count or spend budget cap (optional; defaults to one run per model per task).
  - Output path for the comparison table (optional; defaults to a local artifact under `.odin/benchmark-reports/`).

### Gate mode

All inputs are required and explicit. No defaults are inferred.

1. Changed skill and comparison revision: the skill slug, the diff or branch under test, and the baseline revision to compare against.
2. Explicit universal activation case set: the complete list of cases that must all show activation greater than 0% with the skill enabled.
3. Explicit critical regression case set and baseline: the list of critical scenarios and their recorded baseline results from the comparison revision.
4. Explicit context-budget ceiling: the maximum total context tokens the skill may load.
5. Explicit iteration budget: the maximum number of evaluation iterations the gate may run.

## Procedure

1. Select the mode. If the user asks for gating or a release gate, use `gate`; otherwise use `score` with sub-mode `skill-quality` or `model-comparison`. Done when: the mode is selected.
2. Mode `score` - skill-quality: create `.odin/benchmark-reports/` and `.odin/benchmark-reports/baselines/`. Mode `score` - model-comparison: create `.odin/benchmark-reports/`. Done when: the directories exist.
3. Mode `score`: preview the plan and confirm before any LLM call. In skill-quality mode: the skill list, judge model, rubric criteria, and estimated spend. In model-comparison mode: the candidate models, task set, per-model run count, and estimated spend. Done when: the user confirms the preview.
4. Mode `score`: resolve and lock the scope. In skill-quality mode: if `--skills` is supplied use those names; if `--diff` run `git diff <base>...HEAD --name-only` and select changed skills; otherwise auto-discover all skills. In model-comparison mode: fix the task set and model list. Done when: the scope is resolved and non-empty.
5. Mode `score`: run the benchmark. In skill-quality mode, for each skill send the body and the rubric to the LLM judge and collect a 0-10 score per criterion and an overall score. The rubric covers: trigger clarity, procedure executability, failure recovery, output concreteness. In model-comparison mode, for each task and each candidate model run the task the fixed number of times; record each result with model, task, run index, and observed cost. Done when: every skill has per-criterion and overall scores, or every model/task/run combination has a recorded result, cost, or failure marker.
6. Mode `score`: score the results. In skill-quality mode: if `--baseline`, write per-skill per-criterion scores, timestamp, and branch to `.odin/benchmark-reports/baselines/baseline.json` and report absolute scores. If a baseline exists and `--baseline` was not passed, compare each current score: a drop greater than 50% of the baseline or more than 2 points absolute is REGRESSION; a drop greater than 20% is WARNING; otherwise OK. In model-comparison mode: score or rank each result against the shared task success criterion; ask the human for a criterion if none is stated. Done when: every skill has a regression status or absolute scores are reported, or each completed result has a score.
7. Mode `score`: aggregate and rank. In skill-quality mode: check each skill against the quality budget (overall score 7 or above passes, below 7 fails), compute the overall grade from the fraction of skills passing, rank skills by lowest current score, and for each failing skill name the weakest criterion and quote the judge rationale. In model-comparison mode: aggregate per-model scores into a comparison table with one row per model showing aggregate score, per-task breakdown, total observed spend, and run count. Done when: the grade is computed and failing skills are ranked, or the table is complete.
8. Mode `score`: if `--trend` in skill-quality mode, load historical baseline files, tabulate overall scores over time, and state whether quality is improving, stable, or degrading. Done when: the trend table is produced or `--trend` was not passed.
9. Mode `score`: write and return the report. In skill-quality mode: write to `.odin/benchmark-reports/<date>-benchmark.md` and `.odin/benchmark-reports/<date>-benchmark.json`. In model-comparison mode: write the comparison table to the chosen output path. Present the completed report and its saved path to the human. Done when: the files are written and the contents are returned.
10. Mode `gate`: validate all gate inputs fail-closed. Confirm all five inputs are present and non-empty. If any input is missing or incomplete, fail immediately with `missing gate input` and name the missing input. Done when: all five inputs are confirmed present.
11. Mode `gate`: run activation cases. Execute each case in the universal activation set with the skill enabled. Record whether the skill fired or missed. Done when: every case is executed and its activation result is recorded.
12. Mode `gate`: run baseline and changed regression cases. Execute each critical regression scenario against the comparison revision and against the changed skill. Record pass/fail and context token count per scenario for both. Done when: every scenario is executed against both revisions and results are recorded.
13. Mode `gate`: measure context cost. Sum the total context tokens loaded by the skill across all executed cases. Compare against the explicit context-budget ceiling. Done when: the total context cost is measured and compared.
14. Mode `gate`: emit PASS or FAIL and file one issue per failure. Apply the gate criteria: every activation case must show activation greater than 0%; any negative regression delta (baseline pass to changed fail, or increased token count) is a failure; total context tokens must not exceed the ceiling; if the iteration budget is exhausted before all cases are executed, the gate fails with `iteration budget exhausted`. For each failure, open a follow-up issue with the failure class, scenario or case ID, observed value, and expected threshold. Write the run-log entry: timestamp, skill slug, change reference, case results, deltas, context cost, gate verdict, and filed issue references. Done when: the verdict is emitted, one issue is filed per failure, and the run-log entry is written.

## Failure and recovery

| Failure class | Mode | Partial-result rule | Blocked result |
|---|---|---|---|
| Judge unavailable or rate-limited | score / skill-quality | Report which skills were scored and which were not. Write a partial report. | Return BLOCKED with the judge error. |
| No baseline and not `--baseline` | score / skill-quality | Report absolute scores only. | State that regression detection requires a prior baseline and recommend running `--baseline` on a clean branch. |
| Empty skill set | score / skill-quality | n/a | Return BLOCKED stating no skills matched the selection. |
| Partial judge failure | score / skill-quality | Include scored skills; mark unscored skills as ERROR. | Never fabricate scores. |
| Model call fails or is unavailable | score / model-comparison | Record the failure for that model/task/run. Mark the cell as failed. | Continue the remaining runs. Do not retry past the fixed run count without human confirmation. |
| Spend exceeds budget cap | score / model-comparison | Return the partial table with completed rows and a `non-converged` marker. | Stop immediately; issue no further paid calls. |
| No success criterion for a task | score / model-comparison | Stop scoring that task. | Ask the human for a criterion. Do not invent one. |
| Partial results | score / model-comparison | Present a partial table with failed or unrun cells marked. | Never present them as scores. |
| Missing gate input | gate | Record which input is missing. Do not evaluate. | Gate fails before evaluation; no issues filed. |
| Evaluation unavailable | gate | Record all collected results; mark the unexecuted case as a gate failure. | Skill change blocked from shipping. Issue filed for the unexecuted case. |
| Iteration budget exhausted | gate | Record partial results collected so far. | Skill change blocked from shipping. Issue filed for incomplete run. |
| Any criterion failed | gate | Record all collected results; mark gate as FAIL. | Skill change blocked from shipping. One issue filed per failing case or scenario. |

Do not widen scope to find passing cases that offset failures in gate mode. Do not suppress or reclassify failures. If the gate fails, the skill change does not ship.

## Output

- Mode `score`: a benchmark artifact under `.odin/benchmark-reports/`, returned to the human with its saved path. In skill-quality mode: a scored report (Markdown + JSON) with per-skill per-criterion scores, overall grade, regression status, failing skills ranked with weakest-criterion rationale, and a trend table when `--trend` is passed. In model-comparison mode: a comparison table with one row per model showing aggregate score, per-task breakdown, total observed spend, and run count, plus a `non-converged` marker when the run stopped early.
- Mode `gate`: a reproducible PASS or FAIL record with case results (activation per case, regression deltas per scenario, context cost versus ceiling), filed issues (one per gate failure), and a run-log entry.
