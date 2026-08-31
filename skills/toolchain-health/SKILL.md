---
name: toolchain-health
description: 'Audit the installed toolchain and return a green, yellow, or red verdict with ranked repairs. Not for tasks that require source or remote-system changes.'
---

# Toolchain health

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /toolchain-health. |
| Authority | Read-only: run the project's own diagnostic tools, capture their output, and report; never fix an issue, write a health-stack config, persist a history file, or mutate any file, VCS state, credential, or remote. |
| Side effect | A green, yellow, or red health report in chat; no state change. |
| Done | A health verdict with repairs is returned. |

## Inputs

- The project's working directory. This required input is the current project root.
- An optional explicit health-stack configuration in the project's agent instructions that names the exact type-check, lint, test, dead-code, and shell-lint commands. When present, use those commands verbatim and skip auto-detection.

## Refusals

- Will not fix an issue, write a health-stack config, or persist a history file.
- Will not invent a score when no tool is detected in any category — return BLOCKED.
- Will not report a category as clean when its tool failed.
- Will not mutate any file, VCS state, credential, or remote to produce the report.

## Procedure

1. Bound scope: this audit is read-only. Run only the project's own diagnostic tools to capture their output. **Done when:** the read-only scope is confirmed.
2. Detect the toolchain. If an explicit health-stack configuration names the type-check, lint, test, dead-code, and shell-lint commands, use those commands verbatim. Otherwise auto-detect each category by probing for its config file or command: a type checker from `tsconfig.json`, `pyproject.toml`, `Cargo.toml`, or `go.mod`; a linter from `biome.json`, an eslint config, or ruff/pylint config; a test runner from `package.json` scripts, `pytest`, `cargo test`, or `go test`; a dead-code detector from `knip`; a shell linter from `shellcheck` against `*.sh` scripts. **Done when:** each category is resolved to a command or marked SKIPPED.
3. For each detected tool, run its command under a timeout, capturing stdout, stderr, exit code, and duration. Run tools sequentially. A tool that is not installed or not found is SKIPPED with its reason recorded. **Done when:** every detected tool has been run and its output captured.
4. Score each category 0-10 from the captured output: count type errors, lint warnings, test pass/fail counts, unused exports, and shell findings against the rubric where 10 is clean, 7 is a small count, 4 is a moderate count, and 0 is a large count or critical breakage. A category whose tool was SKIPPED contributes no score. **Done when:** every non-skipped category has a score.
5. Compute the weighted composite from the category scores using the weights type-check 22%, tests 28%, lint 18%, dead-code 13%, and shell 9%. Redistribute each skipped category's weight proportionally across the remaining categories before computing the composite. **Done when:** the composite is computed.
6. Map the composite to a verdict: green when the composite is at least 8.0 and no category scored 0-3; yellow when the composite is 5.0-7.9 or any category scored 4-6; red when the composite is below 5.0 or any category scored 0-3. **Done when:** the verdict is assigned.
7. Present a dashboard table listing each category, its tool, score, status label (CLEAN for 10, WARNING for 7-9, NEEDS WORK for 4-6, CRITICAL for 0-3), duration, and detail count. For every category below 7, list the top issues from that tool's captured output. **Done when:** the dashboard is presented.
8. Produce repairs ranked by impact: for each category scoring below 10, rank by `weight × (10 − score)` descending and give one concrete repair command drawn from the tool's own output. Present the verdict, dashboard, and repairs in chat. **Done when:** the ranked repairs are presented.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| No tool detected in any category | Return BLOCKED with the categories probed and the reason no tool was found; do not invent a score. |
| A tool hangs | The timeout kills it; record that category as SKIPPED with reason `timeout`, redistribute its weight, and continue. A partial verdict from surviving categories is valid. |
| A tool errors or crashes | Record the exit code and the last lines of output as that category's detail, score it from the observed output, and continue. Never swallow the error or report a category as clean when its tool failed. |
| Read-only invariant violated | If any step would require writing, fixing, or persisting to produce the report, stop and report BLOCKED instead of mutating. |

## Output

A green, yellow, or red health verdict plus a per-category dashboard (tool, score, status, duration, detail counts), the top issues for any category below 7, and a repairs list ranked by impact — no file, history, or project state is changed.

## Provenance

Origin: https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69, file health/SKILL.md. License MIT, copyright "Copyright (c) 2026 Garry Tan", retained per the license notice. Clean-room adaptation: the toolchain auto-detection, per-category 0-10 scoring, weighted composite with weight redistribution, status-labeled dashboard, and ranked-repairs mechanism are re-derived; the green/yellow/red verdict and read-only installation-audit framing are adapted for this skill; no source expression is copied wholesale.
