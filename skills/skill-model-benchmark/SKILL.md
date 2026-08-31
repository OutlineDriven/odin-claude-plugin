---
name: skill-model-benchmark
description: 'Use when the user runs /skill-model-benchmark to compare candidate models on a shared task set in a ranked table with per-model spend tracking. Don''t use for automated or unattended runs; every model call requires explicit human confirmation of the spend estimate.'
disable-model-invocation: true
---

# Skill model benchmark

## Contract

| Field | Bound contract |
|---|---|
| Trigger | the user runs /skill-model-benchmark |
| Authority | human-only: requires explicit human invocation; preview the candidate models, task set, run count, and estimated spend before any paid model call |
| Side effect | benchmark artifacts written locally and paid model-comparison inference spend |
| Done | a model-comparison table is produced |

## Inputs

- The task or task set to run against every candidate model (required).
- The candidate model list (required): two or more models to compare.
- Per-model run count or spend budget cap (optional; defaults to one run per model per task).
- Output path for the comparison table (optional; defaults to a local artifact).

## Procedure

1. Confirm the human invocation. Preview the candidate models, the task set, the per-model run count, and the estimated spend; proceed only after the human confirms. **Done when:** the human has explicitly approved the spend estimate and run plan.
2. Bound scope: fix the task set and model list. **Done when:** the task set and model list are locked and no new tasks or models may be added.
3. For each task and each candidate model, run the task the fixed number of times. Record each result with the model, task, run index, and observed cost. **Done when:** every model/task/run combination has a recorded result, cost, or failure marker.
4. Score or rank each result against the shared task's success criterion. Use the criterion stated with the task; if none is stated, ask the human for one before scoring. **Done when:** each completed result has a score and no score was invented without human approval.
5. Aggregate per-model scores across the task set into a comparison table with one row per model showing aggregate score, per-task breakdown, total observed spend, and run count. **Done when:** the table contains every model and accurately sums spend and run counts.
6. Write the table to the chosen output path and return it to the human. **Done when:** the table exists at the output path and has been returned.

## Failure and recovery

- **Model call fails or is unavailable:** record the failure for that model/task/run, mark the cell as failed, and continue the remaining runs. Do not retry past the fixed run count without human confirmation.
- **Spend exceeds the budget cap:** stop immediately, return the partial table with completed rows and a `non-converged` marker, and issue no further paid calls.
- **No success criterion for a task:** stop scoring that task and ask the human for a criterion. Do not invent one.
- **Partial results:** present a partial table with failed or unrun cells clearly marked as such. Never present them as scores.

## Output

A model-comparison table written to the output path, with one row per candidate model showing aggregate score, per-task breakdown, total observed spend, and run count, plus a `non-converged` marker when the run stopped early.
