---
name: toolchain-health
description: 'Use when the user runs /toolchain-health and wants a trustworthy green/yellow/red verdict on the installed toolchain with ranked repairs. Not for tasks that require source or remote-system changes.'
---

# Toolchain health

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /toolchain-health |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Runs the project's own diagnostic tools, captures output, and reports; never fixes, writes config, or persists history. |
| Side effect | A green, yellow, or red health report in chat; no state change |
| Done | A green/yellow/red verdict, a per-category dashboard, top issues for categories below threshold, and ranked repairs are returned with no state change |

## Inputs

- The project's working directory (required): the current project root.
- Optional explicit health-stack configuration in the project's agent instructions naming the five category commands verbatim. When present, use those commands verbatim and skip auto-detection.

## Procedure

1. Resolve exact commands. If an explicit health-stack configuration names the type-check, lint, test, dead-code, and shell-lint commands, use those commands verbatim. Otherwise map each manifest or tool to one pinned safe command using the detection table below. Unresolved categories are SKIPPED with reason.

   | Category | Manifest or config trigger | Pinned command |
   |---|---|---|
   | type-check | `tsconfig.json` | `tsc --noEmit` |
   | type-check | `pyproject.toml` with `[tool.mypy]` | `mypy .` |
   | type-check | `pyproject.toml` with `[tool.pyright]` | `pyright` |
   | type-check | `Cargo.toml` | `cargo check` |
   | type-check | `go.mod` | `go vet ./...` |
   | tests | `package.json` with `scripts.test` | `npm test` (or `pnpm test` when `pnpm-lock.yaml` exists) |
   | tests | `pytest` in dependencies | `pytest --tb=short -q` |
   | tests | `Cargo.toml` | `cargo test` |
   | tests | `go.mod` | `go test ./...` |
   | lint | `biome.json` | `biome check` |
   | lint | eslint config present | `eslint .` |
   | lint | `ruff` in dependencies | `ruff check .` |
   | lint | `pyproject.toml` with `[tool.pylint]` | `pylint <package>` |
   | dead-code | `knip` in dependencies | `knip` |
   | shell | `*.sh` files present | `shellcheck *.sh` |

   Multi-tool tie-break: when two tools in the same category are detected, prefer the one with a dedicated config file. Run commands from the project root. Done when: each category is resolved to a command or marked SKIPPED with reason.
2. Run each command sequentially under a 120-second timeout, capturing stdout, stderr, exit code, and duration. A tool that is not installed or not found is SKIPPED with its reason recorded. Done when: every detected tool has been run and its output captured, or SKIPPED with reason.
3. Score each category 0-10 against the threshold table. Count findings from the captured output: type errors, lint warnings, test failures, unused exports, and shell findings.

   | Score | Finding count | Meaning |
   |---|---|---|
   | 10 | 0 | clean |
   | 7-9 | 1-3 | small count |
   | 4-6 | 4-10 | moderate count |
   | 0-3 | >10 or critical breakage | large count or tool failed |

   A category whose tool was SKIPPED contributes no score. A tool that errored or crashed is scored from observed output, never reported as clean. Done when: every non-skipped category has a score.
4. Compute the weighted composite. Weights: type-check 22%, tests 28%, lint 18%, dead-code 13%, shell 9%. Redistribute each skipped category's weight proportionally across the remaining categories before computing the composite. Done when: the composite is computed.
5. Map the composite to a verdict with one consistent status scale. Green when the composite is at least 8.0 and no category scored 0-3. Yellow when the composite is 5.0-7.9 or any category scored 4-6. Red when the composite is below 5.0 or any category scored 0-3. Present the dashboard table listing each category, its tool, score, status label (CLEAN for 10, WARNING for 7-9, NEEDS WORK for 4-6, CRITICAL for 0-3), duration, and detail count. For every category below 7, list the top issues from that tool's captured output. Produce repairs ranked by `weight x (10 - score)` descending, with one concrete repair command drawn from the tool's own output per category scoring below 10. Done when: the verdict, dashboard, and ranked repairs are presented.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| No tool detected in any category | Return BLOCKED with the categories probed and the reason no tool was found; do not invent a score. |
| Tool hang | The 120-second timeout kills it; record that category as SKIPPED with reason `timeout`, redistribute its weight, and continue. A partial verdict from surviving categories is valid. |
| Tool error or crash | Record the exit code and the last lines of output as that category's detail, score it from the observed output, and continue. Never swallow the error or report a category as clean when its tool failed. |
| Read-only invariant violated | If any step would require writing, fixing, or persisting to produce the report, stop and report BLOCKED instead of mutating. |

## Output

A green, yellow, or red health verdict plus a per-category dashboard (tool, score, status, duration, detail counts), the top issues for any category below 7, and a repairs list ranked by `weight x (10 - score)` descending: no file, history, or project state is changed.
