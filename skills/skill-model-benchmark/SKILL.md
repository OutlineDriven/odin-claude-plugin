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

1. Confirm the human invocation. Before any model call, preview the candidate models, the task set, the per-model run count, and the estimated spend; proceed only after the human confirms.
2. Bound scope: fix the task set and model list. Do not add tasks or models mid-run.
3. For each task, for each candidate model, run the task the fixed number of times and record each result plus the model, task, run index, and observed cost.
4. Score or rank each result against the shared task's success criterion. Use the criterion stated with the task; if none is stated, ask the human for one before scoring rather than inventing one.
5. Aggregate per-model scores across the task set into a comparison table: one row per model with aggregate score, per-task breakdown, total observed spend, and run count.
6. Write the table to the chosen output path and return it to the human.

## Failure and recovery
- A model call fails or is unavailable: record the failure for that model/task/run, mark the cell as failed, and continue the remaining runs. Do not retry past the fixed run count without human confirmation.
- Spend exceeds the stated budget cap before completion: stop, return the partial table with completed rows and a `non-converged` marker, and issue no further paid calls.
- No success criterion is available for a task: stop scoring that task and ask the human; do not invent a criterion.
- Partial results are returned as a partial table; never present a failed or unrun cell as a score.

## Output
A model-comparison table: one row per candidate model with aggregate score, per-task score breakdown, total observed spend, and run count, written to the output path and returned to the human. A `non-converged` marker is appended when the run stopped early.

## Provenance

Adapted from `benchmark-models/SKILL.md` in github.com/garrytan/gstack at revision 07b59e396c6be5a86619a43151cb9ed62a15ae69 (MIT, Copyright (c) 2026 Garry Tan). Expressive prose and procedure re-derived; the gstack model-versus-model comparison mechanism preserved. Copyright and permission notice retained per the MIT reuse constraints.
