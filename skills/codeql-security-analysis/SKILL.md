---
name: codeql-security-analysis
description: 'Use when building or reusing a CodeQL database, running CodeQL security analysis, or modeling project-specific sources and sinks. Produces a quality-gated database, nonzero query suite, and final SARIF. Not for manual vulnerability review — use confirmed-security-review.'
---

# CodeQL security analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to build or reuse a CodeQL database, run CodeQL security analysis, perform interprocedural taint/data-flow analysis, or model project-specific sources and sinks. |
| Authority | Reversible local writes only: a dedicated CodeQL output directory, an optional target-project dependency or query-pack install performed with explicit user authority, a built or reused database, and CodeQL execution that writes logs, data extensions, suites, and SARIF results. Roll back by deleting the output directory; never mutate the target project source. |
| Side effect | Creates a dedicated CodeQL output directory, may install target-project dependencies or query packs with user authority, builds a database, executes CodeQL, and writes logs, extensions, suites, and SARIF results. |
| Done | The selected database resolves and passes the applicable quality gate; the explicit query suite resolves nonzero; analysis completes; raw and final SARIF, ruleset selections, and build evidence are present; skipped coverage and zero findings are explained. |

## Inputs

Required:
- Target project root path.
- Primary language(s) to analyze, or an existing reusable CodeQL database path.

Optional but needed when applicable:
- Build command for compiled languages (the real build must run under CodeQL extraction).
- Explicit query suite or ruleset selection.
- Project-specific source and sink models to author as CodeQL data extensions.
- Output directory path; defaults to a dedicated directory under the project root.
- User authority for any target-project dependency or query-pack installation.

## Procedure

1. Create a dedicated output directory (for example `<project-root>/.codeql-out`); every database, log, data extension, suite, and SARIF artifact lands there. Do not write anywhere else. Done when: the output directory exists and no artifact is written outside it.
2. Resolve or build the database. If a reusable database path is supplied, resolve it with `codeql database resolve` and confirm it targets the requested language. Otherwise build with `codeql database create` using the project's real build command for compiled languages, or source-only `--overwrite` extraction for interpreted languages. Record the exact build command and its exit status as build evidence in the output directory. Done when: the database resolves or builds and build evidence is recorded.
3. Run the applicable quality gate. Inspect extraction warnings and source-file coverage with `codeql database resolve` and source-location inspection. If the database fails the gate (missing source files, zero extracted files, build errors, or unresolved language), stop and report the failure class; do not proceed to analysis. Done when: the database passes the quality gate or the failure class is reported and the skill stops.
4. Select an explicit query suite or ruleset and resolve it with `codeql resolve queries --queries=<suite>`. Confirm the resolved query count is nonzero. If it resolves to zero queries, stop and report the suite path. Done when: the query suite resolves nonzero or the zero-query suite path is reported.
5. If the user asks to model project-specific sources and sinks, author CodeQL data-extension YAML under the output directory and include it via `--search-path` or `--additional-packs`. Validate each extension against the CodeQL data-extension schema before use; reject invalid extensions and stop. Done when: all data extensions validate or an invalid extension is rejected.
6. Run analysis with `codeql database analyze <database> <suite> --format=sarif-latest --output=<output>/raw.sarif`, passing any data-extension search path. Capture stdout and stderr as an analysis log in the output directory. Tune `--threads` to available cores and memory; prefer `--threads=0` only when memory is sufficient. Done when: analysis completes and raw SARIF plus the analysis log are in the output directory.
7. Post-process raw SARIF: de-duplicate results, apply severity filtering, attach the ruleset-selection metadata, and write final SARIF to the output directory. Record which ruleset and query suite were selected. Done when: final SARIF is written with ruleset metadata.
8. Explain coverage. If findings are zero, or if any language or path was skipped (for example a language that was not built), state explicitly why. Never report a clean result without stating the coverage basis. Done when: zero findings or skipped coverage is explained with the coverage basis.
9. Rollback path: to undo all side effects, delete the output directory. The target project source is never modified. Done when: the rollback path is stated and the target source is confirmed unmodified.

## Failure and recovery
- Database build failure (build errors, missing toolchain, failed extraction): report the failure class and build evidence; do not run analysis. Recovery is to fix the build and rebuild in the output directory.
- Quality-gate failure (missing or zero source files, unresolved language): stop before analysis and report the gate output. Do not treat a failed database as analyzable.
- Zero-query resolution: stop and report the suite or ruleset path that resolved to zero queries.
- Invalid data extension: reject the extension, stop, and report the schema violation; do not run analysis with an unvalidated model.
- Analysis runtime error: preserve the partial analysis log and any partial raw SARIF, report the error, and classify the result as blocked. Never present a partial result as the done state.
- Zero findings or skipped coverage: must be explained with the coverage basis; an unexplained zero is not a success.
- Non-mutation rule: the target project source is never modified. All artifacts live in the output directory, whose deletion is the complete rollback.
- Blocked or non-converged result: report the exact failure class, the evidence captured, and the step that stopped; do not swallow errors or pretend the done predicate holds.

## Output
Output directory containing: database, build evidence, resolved query suite and ruleset, data-extension models, analysis log, raw SARIF, final SARIF. Terminal classification: done or blocked with named failure class and evidence.
