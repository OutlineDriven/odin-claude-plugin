---
name: variant-hunt
description: 'Use when a confirmed root cause must be searched across a codebase or turned into a search rule. Returns triaged variants, false positives, and a CI-ready regression rule. Not for graph-neighborhood seeding — use variant-neighborhood-seeding.'
---

# Variant hunt

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A specific vulnerability, logic bug, or bad pattern has already been confirmed and the user asks where else the same root cause occurs or asks to generalize it into a search rule. |
| Authority | `reversible-local`: write only named local artifacts, the variant report and any CI-ready regression rule, to the working directory. Delete or edit by hand to reverse. |
| Side effect | Searches the full codebase, may execute ripgrep, Semgrep, or CodeQL, and may write a variant report and CI-ready regression rule. No other repository file is modified. |
| Done | The exact pattern hits the known bug, abstraction changes are calibrated one at a time, and every candidate is triaged. Confirmed variants and false positives are reported with evidence, and a reproducible final pattern and regression guard are supplied. |

## Inputs

Required:
- A confirmed root cause statement: what operation is dangerous, what data makes it dangerous, what protection is missing, and what context enables it.
- The original bug location (file and line) or the vulnerable code snippet.
- The project codebase reachable from the current working directory.

Optional:
- Preferred search tool (default: ripgrep for recon, Semgrep for iteration, CodeQL for precision).

## Procedure

1. **Receive and validate the root cause.** Require a root cause statement and the original bug location or snippet. If either is absent, stop and return `blocked: root cause and original location required`. Validate the location exists in the codebase before proceeding. **Done when:** the root cause statement and original location are validated.
2. **Enumerate expansion axes.** Ask four questions: what operation is dangerous, what data makes it dangerous, what is missing, and what context enables it. List every independent direction where a variant could hide: related identifiers, other manifestations of the same mistake, and data-type edge cases. Do not skip edge cases: null comparisons, empty strings, zero vs null, unauthenticated callers, boundary values. **Done when:** every expansion axis is enumerated including edge cases.
3. **Write an exact-match pattern.** Write a ripgrep, Semgrep, or CodeQL pattern that matches ONLY the known bug location. Run it; confirm it hits the known instance and nothing else. A pattern that matches zero locations means the root cause is misunderstood; stop and report that before building on it. **Done when:** the pattern hits the known bug location and nothing else.
4. **Generalize one element at a time.** From the exact match, climb the abstraction ladder: variable names, then surrounding structure, then semantics. Make one change per iteration. Run the pattern after each change. If more than half the matches are noise, stop and revert that change. Record every pattern tried with its match count, true-positive count, and false-positive count. **Done when:** the generalized pattern is stable with ≤50% false positives.
5. **Triage every candidate.** Read the surrounding function, callers, and types for each candidate. Look specifically for guards, sanitizers, type constraints, or callers that never supply attacker-controlled input. Record the reason every ruled-out candidate is safe. Attach severity and confidence to every verdict. **Done when:** every candidate is triaged with a verdict, severity, and confidence.
6. **Write the report.** Produce a variant report containing: root cause statement, original location, methodology table (pattern version, tool, matches, TP, FP), confirmed findings with evidence, false-positive table grouped by reason, and a CI-ready regression rule derived from the pattern that found the most variants. **Done when:** the report contains all six sections with evidence.

## Failure and recovery
| Failure class | Result |
|---|---|
| No root cause or original location supplied | Stop; return `blocked: root cause and original location required`. |
| Exact pattern matches zero locations | Stop; return `blocked: pattern does not match known bug`. |
| Pattern generalization produces >50% false positives | Revert to previous pattern level; record the regression in the report. |
| Tool unavailable (ripgrep, Semgrep, CodeQL) | Fall back to the next available tool in the stated preference order; document the fallback in the report. |
| Candidate count exceeds 200 before triage | Triage the first 200; document the remainder as not assessed in the report header. |
| Write failure | Stop; do not emit a partial report. Return `blocked: write failed`. |

Partial-result rule: if the write step fails after steps 1–5 succeed, delete any partially written file and return the failure class above.
Rollback: any written artifact is reversed by deleting the named report and any regression rule file from the working directory.

## Output
A local variant report with root cause statement, original location, methodology table, confirmed findings (severity-rated with evidence), false-positive table grouped by reason, and a CI-ready regression rule.
