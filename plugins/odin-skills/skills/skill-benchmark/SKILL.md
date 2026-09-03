---
name: skill-benchmark
description: 'Use when the user runs /skill-benchmark to score agent skills via LLM judges with baseline comparison, regression detection, and trend analysis, or to compare candidate models on a shared task set in a ranked table with per-model spend tracking. Not for release gating — use skill-benchmark-gate.'
disable-model-invocation: true
---

# Skill benchmark

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /skill-benchmark |
| Authority | Human-only. Preview the benchmark target, judge or candidate models, rubric or task set, and estimated spend before any LLM call. No skill, code, credential, or remote mutation. |
| Side effect | Writes benchmark artifacts under .gstack/benchmark-reports/ and incurs LLM inference spend. |
| Done | A scored skill-quality report or model-comparison table is written and returned to the human. |

## Inputs

### Skill-quality mode

- `--baseline`: capture a scored baseline before changes. Run first on a clean branch.
- `--quick`: single-pass scoring without baseline comparison.
- `--skills <name1>,<name2>`: score only named skills. Omit to auto-discover from the skill directory.
- `--diff`: score only skills whose files changed on the current branch.
- `--trend`: show score trends from historical baseline files.
- Judge model and rubric must be supplied or confirmed by the user before scoring begins.

### Model-comparison mode

- The task or task set to run against every candidate model (required).
- The candidate model list (required): two or more models to compare.
- Per-model run count or spend budget cap (optional; defaults to one run per model per task).
- Output path for the comparison table (optional; defaults to a local artifact under .gstack/benchmark-reports/).

## Procedure

1. Determine the benchmark target from the request. If the user names skills to score or asks for skill-quality scoring, select skill-quality mode. If the user names candidate models and a task set, select model-comparison mode. Done when: the mode is selected.
2. Create `.gstack/benchmark-reports/` and `.gstack/benchmark-reports/baselines/`. Done when: both directories exist.
3. Preview the benchmark plan to the user. In skill-quality mode: the skill list, judge model, rubric criteria, and estimated spend. In model-comparison mode: the candidate models, task set, per-model run count, and estimated spend. Stop and wait for confirmation before any LLM call. Done when: the user confirms the preview.
4. Resolve and lock the benchmark scope. In skill-quality mode: if `--skills` is supplied, use those names; if `--diff`, run `git diff <base>...HEAD --name-only` and select skills whose files changed; otherwise auto-discover all skills in the skill directory. In model-comparison mode: fix the task set and model list; no new tasks or models may be added after this step. Done when: the skill set is resolved and non-empty, or the task set and model list are locked.
5. Run the benchmark. In skill-quality mode: for each skill, send the skill body and the following rubric to the LLM judge; collect a 0-10 score per criterion and an overall score (mean of criteria).
   - Trigger clarity: does the trigger predicate unambiguously route the skill?
   - Procedure executability: can the procedure be followed step-by-step without ambiguity?
   - Failure recovery: are failure classes named with recovery or stop rules?
   - Output concreteness: does the output section name a concrete artifact?
   In model-comparison mode: for each task and each candidate model, run the task the fixed number of times; record each result with the model, task, run index, and observed cost. Done when: every skill has per-criterion and overall scores, or every model/task/run combination has a recorded result, cost, or failure marker.
6. Score the results. In skill-quality mode: if `--baseline`, write per-skill per-criterion scores, timestamp, and branch to `.gstack/benchmark-reports/baselines/baseline.json`, report absolute scores, and stop. If a baseline exists and `--baseline` was not passed, compare each current score against the baseline: score drop greater than 50% of the baseline value or more than 2 points absolute is REGRESSION; score drop greater than 20% is WARNING; otherwise OK. In model-comparison mode: score or rank each result against the shared task's success criterion; use the criterion stated with the task, or ask the human for one if none is stated. Done when: every skill has a regression status (or absolute scores reported for `--baseline`), or each completed result has a score with no score invented without human approval.
7. Aggregate and rank. In skill-quality mode: check each skill against the quality budget (overall score 7 or above passes, below 7 fails), compute the overall grade from the fraction of skills passing, rank skills by lowest current score, and for each failing skill name the weakest criterion and quote the judge rationale. In model-comparison mode: aggregate per-model scores across the task set into a comparison table with one row per model showing aggregate score, per-task breakdown, total observed spend, and run count. Done when: the overall grade is computed and failing skills are ranked with weakest-criterion rationale, or the table contains every model and accurately sums spend and run counts.
8. If `--trend` in skill-quality mode: load historical baseline files, tabulate overall scores over time, and state whether quality is improving, stable, or degrading. Done when: the trend table is produced or `--trend` was not passed.
9. Write and return the report. In skill-quality mode: write to `.gstack/benchmark-reports/<date>-benchmark.md` and `.gstack/benchmark-reports/<date>-benchmark.json`. In model-comparison mode: write the comparison table to the chosen output path (default `.gstack/benchmark-reports/<date>-model-comparison.md`). Present the completed report or table to the human with its saved path. Done when: the files are written and their completed contents have been returned.

## Failure and recovery

- Judge unavailable or rate-limited (skill-quality): stop scoring, report which skills were scored and which were not, write a partial report, and return BLOCKED with the judge error.
- No baseline and not `--baseline` (skill-quality): report absolute scores only. State that regression detection requires a prior baseline and recommend running `--baseline` on a clean branch.
- Empty skill set (skill-quality): return BLOCKED stating no skills matched the selection criteria.
- Partial judge failure (skill-quality): include scored skills in the report, mark unscored skills as ERROR, and never fabricate scores.
- Model call fails or is unavailable (model-comparison): record the failure for that model/task/run, mark the cell as failed, and continue the remaining runs. Do not retry past the fixed run count without human confirmation.
- Spend exceeds the budget cap (model-comparison): stop immediately, return the partial table with completed rows and a `non-converged` marker, and issue no further paid calls.
- No success criterion for a task (model-comparison): stop scoring that task and ask the human for a criterion. Do not invent one.
- Partial results (model-comparison): present a partial table with failed or unrun cells clearly marked as such. Never present them as scores.
- Non-mutation rule: no skill, source, or configuration file is modified. The only writes are to `.gstack/benchmark-reports/`.

## Output

A benchmark artifact under `.gstack/benchmark-reports/`, returned to the human with its saved path. In skill-quality mode: a scored report (Markdown + JSON) containing per-skill per-criterion scores, the overall grade, regression status against the baseline when available, failing skills ranked by lowest score with judge rationale, and a trend table when `--trend` is passed. In model-comparison mode: a comparison table with one row per candidate model showing aggregate score, per-task breakdown, total observed spend, and run count, plus a `non-converged` marker when the run stopped early.
