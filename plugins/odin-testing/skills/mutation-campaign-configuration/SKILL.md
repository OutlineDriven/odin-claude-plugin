---
name: mutation-campaign-configuration
description: 'Use when asked to initialize, scope, estimate, configure, validate, or optimize a mewt, muton, or mutation testing campaign before execution. Writes the TOML config. Not for running it: use the mewt CLI.'
---

# Mutation campaign configuration

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user mentions mutation testing, mewt, or muton and asks to initialize, scope, estimate, configure, validate, or optimize a campaign before execution. |
| Authority | Reversible local: writes only `mewt.toml` or `muton.toml`; rollback is restoring the prior TOML from version control or a pre-edit snapshot. No remote mutation. Does not create or modify the accompanying SQLite database, generate mutants, or touch source files. |
| Side effect | Create or update `mewt.toml` or `muton.toml`; inspect target files and estimate mutant scope read-only; measure test duration; validate readiness without interpreting completed campaign results. |
| Done | Configuration parses, intended source targets and mutant counts are estimated, test commands pass, timeout policy is justified by measurement, estimated duration is acceptable, and the project is ready for a separate campaign run. |

## Inputs

- Required: Working directory containing a codebase to mutate, or an explicit `--config` path to an existing `mewt.toml`/`muton.toml`.
- Required: User intent for the campaign scope (which files or components to target).
- Optional: Existing `mewt.toml`/`muton.toml` with prior configuration.
- Optional: Non-standard tool binary name (`mewt` vs `muton`).

## Procedure

### Phase 1: initialize and validate targets

1. If no `mewt.toml`/`muton.toml` exists in the working directory, create one with the minimum structure: `[targets]` with include and ignore patterns, `[test]` with the test command, and `[run]` with mutation operators. Do not run `mewt init` or `muton init` because those commands create the SQLite database, which exceeds this skill's authority. Done when: the config file exists on disk.
2. Read the configuration: `mewt print config` (or `muton print config`). Done when: the configuration is parsed and its contents are recorded.
3. Review `[targets]` include and ignore patterns. Include patterns must match only source code (e.g., `src/**/*.rs`, `contracts/**/*.sol`). Ignore patterns must exclude tests, mocks, and generated code within included paths. Done when: include and ignore patterns are confirmed to target only intended source files.
4. If patterns are incorrect, edit `mewt.toml`/`muton.toml` directly. Do not use CLI flags for persistent configuration. Done when: the config file reflects the corrected patterns.
5. Confirm: `mewt print config` shows no errors and `mewt print targets` lists only intended files. Done when: both commands succeed and the target list is clean.

### Phase 2: assess scope

6. Estimate the mutant count without generating mutants. Run `mewt print targets` to list target files. If the tool supports a dry-run or count mode (`mewt print mutants --count` or equivalent), use it. Otherwise estimate from the target file count and the configured mutation operators. Do not run `mewt mutate` or any command that creates the SQLite database or writes mutants to disk. Done when: an estimated mutant count is recorded.
7. Measure baseline test duration by running the test command from the config with `time` prefix. Store the result. Done when: the baseline duration is measured and stored.
8. Calculate worst-case estimated campaign duration: `estimated_mutant_count * test_duration_seconds`. Present this estimate to the user. Done when: the estimate is presented and the user has seen it.

### Phase 3: decide on optimization strategy

9. If estimated duration is under 1 hour, skip to Phase 4. Done when: the decision to skip optimization is recorded.
10. If estimated duration is 1 to 16 hours, ask the user whether to proceed or optimize. If the user declines, apply optimization before proceeding. Done when: the user's decision is recorded.
11. If estimated duration exceeds 16 hours, or the user requests optimization: run `mewt print targets` to check for unintended files; inspect the configured mutation operators and severity distribution. Present options with concrete time estimates: full campaign, critical components only (narrow `[targets].include`), high or medium severity only (restrict `[run].mutations`), or two-phase (`[[test.per_target]]` blocks). Apply the chosen option to `mewt.toml` and recalculate the reduced duration estimate. Done when: the chosen optimization is applied and the reduced estimate is confirmed.

### Phase 4: validate test command and timeout

12. Run the test command from `[test].cmd` manually and confirm it succeeds without errors. Done when: the test command exits 0 or the failure is reported.
13. Set the timeout policy. For compiled languages where incremental recompilation dominates test time, note that a cold-cache run may substantially exceed the warm-cache measurement. Set `[test].timeout` to `2 * warm_cache_duration` rounded up as a baseline. Record in the config comments that the user should verify with a cold-cache run before committing to a long campaign. Do not touch source files to force recompilation; that exceeds this skill's authority. Done when: the timeout policy is set and justified by measurement.

### Phase 5: final validation

14. Run the checklist: `mewt print config` parses with no errors; `mewt print targets` lists only intended source files; estimated mutant count is reasonable; test command passes; timeout is set and justified; duration estimate is acceptable to the user. Done when: every checklist item passes.
15. Report readiness. The campaign is ready for a separate execution of `mewt run`, which will create the SQLite database, generate mutants, and run the campaign. Done when: the readiness report is produced.

## Failure and recovery

- Configuration parse failure: `mewt print config` reports a syntax or TOML error. Do not proceed. Edit `mewt.toml` to fix the error and re-run the validation checklist.
- No target files matched: `mewt print targets` returns an empty list. Verify the `[targets].include` patterns match existing source files. Fix patterns or confirm language support before proceeding.
- Test command fails: Running the test command returns non-zero. Do not proceed. Identify the correct test command by inspecting `Makefile`, `justfile`, `package.json`, or project `README.md`. Update `[test].cmd` in `mewt.toml`. Re-validate.
- Duration estimate unacceptable: User rejects the estimated campaign duration and no optimization path reduces it to an acceptable range. Do not force execution. Present the available options and wait for a decision. If no decision is reachable, stop.
- Rollback: All configuration edits are reversible. If an edit produces an invalid state, restore `mewt.toml`/`muton.toml` from version control or the pre-edit snapshot before returning.

## Output

A validated `mewt.toml` or `muton.toml` confirmed against the Phase 5 checklist, with estimated mutant count, test duration estimate, and timeout policy. The campaign is ready to run via `mewt run` in a separate session.
