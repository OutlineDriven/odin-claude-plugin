---
name: skill-benchmark
description: 'Use when the user runs /skill-benchmark to score agent skills via LLM judges with baseline comparison, regression detection, and trend analysis. Don''t use for tasks that require source or remote-system changes; the only writes are benchmark reports.'
disable-model-invocation: true
---

# Skill benchmark

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /skill-benchmark |
| Authority | Human-only. Preview the target skills, judge model, rubric, and estimated spend before any LLM-judge call. No skill, code, credential, or remote mutation. |
| Side effect | Writes benchmark artifacts under .gstack/benchmark-reports/ and incurs LLM-judge model spend. |
| Done | A scored benchmark report is produced. |

## Inputs

- `--baseline`: capture a scored baseline before changes. Run first on a clean branch.
- `--quick`: single-pass scoring without baseline comparison.
- `--skills <name1>,<name2>`: score only named skills. Omit to auto-discover from the skill directory.
- `--diff`: score only skills whose files changed on the current branch.
- `--trend`: show score trends from historical baseline files.
- Judge model and rubric must be supplied or confirmed by the user before scoring begins.

## Procedure

1. Create `.gstack/benchmark-reports/` and `.gstack/benchmark-reports/baselines/`.
2. Resolve the skill set. If `--skills` is supplied, use those names. If `--diff`, run `git diff <base>...HEAD --name-only` and select skills whose files changed. Otherwise auto-discover all skills in the skill directory.
3. Preview to the user: the skill list, the judge model, the rubric criteria, and the estimated model spend. Stop and wait for confirmation before any judge call.
4. For each skill, send the skill body and the following rubric to the LLM judge. Collect a 0-10 score per criterion and an overall score (mean of criteria).
   - Trigger clarity: does the trigger predicate unambiguously route the skill?
   - Procedure executability: can the procedure be followed step-by-step without ambiguity?
   - Failure recovery: are failure classes named with recovery or stop rules?
   - Output concreteness: does the output section name a concrete artifact?
5. If `--baseline`: write per-skill per-criterion scores, timestamp, and branch to `.gstack/benchmark-reports/baselines/baseline.json`. Report absolute scores and stop.
6. If a baseline exists and `--baseline` was not passed: compare each current score against the baseline.
   - Score drop greater than 50% of the baseline value or more than 2 points absolute: REGRESSION.
   - Score drop greater than 20%: WARNING.
   - Otherwise: OK.
7. Check each skill against the quality budget: overall score 7 or above passes, below 7 fails. Compute the overall grade from the fraction of skills passing.
8. Rank skills by lowest current score. For each failing skill, name the weakest criterion and quote the judge rationale.
9. If `--trend`: load historical baseline files, tabulate overall scores over time, and state whether quality is improving, stable, or degrading.
10. Write the report to `.gstack/benchmark-reports/<date>-benchmark.md` and `.gstack/benchmark-reports/<date>-benchmark.json`.

## Failure and recovery
- **Judge unavailable or rate-limited:** stop scoring, report which skills were scored and which were not, write a partial report, and return BLOCKED with the judge error.
- **No baseline and not `--baseline`:** report absolute scores only. State that regression detection requires a prior baseline and recommend running `--baseline` on a clean branch.
- **Empty skill set:** return BLOCKED stating no skills matched the selection criteria.
- **Partial judge failure:** include scored skills in the report, mark unscored skills as ERROR, and never fabricate scores.
- Non-mutation rule: no skill, source, or configuration file is modified. The only writes are to `.gstack/benchmark-reports/`.

## Output
A scored benchmark report containing per-skill per-criterion scores, overall grade, regression status against baseline when available, failing skills ranked by lowest score with judge rationale, and a trend table when `--trend` is passed. Written as Markdown and JSON under `.gstack/benchmark-reports/`.

## Provenance

Adapted from garrytan/gstack benchmark/SKILL.md at revision 07b59e396c6be5a86619a43151cb9ed62a15ae69 (MIT, Copyright (c) 2026 Garry Tan). Clean-room re-derivation: the source measures web page performance via a browse daemon; this skill measures agent skill quality via LLM judges. Preserved mechanisms: baseline capture, relative-threshold regression detection, trend analysis, graded report, read-only non-mutation. Copyright and permission notice retained per MIT.
