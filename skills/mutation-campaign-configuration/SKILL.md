---
name: mutation-campaign-configuration
description: 'Use when the user mentions mewt, muton, or mutation testing and asks to initialize, scope, estimate, configure, validate, or optimize a campaign. Not for running the campaign — use mewt run separately.'
---

# Mutation campaign configuration

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user mentions mutation testing, mewt, or muton and asks to initialize, scope, estimate, configure, validate, or optimize a campaign before execution. |
| Authority | Reversible-local. Write only `mewt.toml` or `muton.toml`. Rollback restores the prior file from version control or a pre-edit snapshot. |
| Side effect | Create or update `mewt.toml` or `muton.toml`, generate and inspect mutant scope, measure test duration, optimize targets or mutation classes with user input, and validate readiness without interpreting completed campaign results. |
| Done | Configuration parses, intended source targets and mutant counts are confirmed, test commands pass, timeout policy is justified by measurement, estimated duration is acceptable, and the project is ready for a separate campaign run. |

## Inputs

- **Required**: Working directory containing a codebase to mutate, or an explicit `--config` path to an existing `mewt.toml`/`muton.toml`.
- **Required**: User intent for the campaign scope (which files or components to target).
- **Optional**: Existing `mewt.toml`/`muton.toml` with prior configuration.
- **Optional**: Non-standard tool binary name (`mewt` vs `muton`).

## Procedure

### Phase 1: initialize and validate targets

1. If no `mewt.toml`/`muton.toml` exists in the working directory, run `mewt init` (or `muton init`) to create it and the accompanying SQLite database. Pass `--config` with an explicit path if the user supplies one. Done when: the config file exists on disk.
2. Read the generated or existing configuration: `mewt print config`. Done when: the configuration is parsed and its contents are recorded.
3. Review `[targets]` include and ignore patterns. Include patterns must match only source code (e.g., `src/**/*.rs`, `contracts/**/*.sol`). Ignore patterns must exclude tests, mocks, and generated code within included paths. Done when: include and ignore patterns are confirmed to target only intended source files.
4. If patterns are incorrect, edit `mewt.toml`/`muton.toml` directly. Do not use CLI flags for persistent configuration. Done when: the config file reflects the corrected patterns.
5. Confirm: `mewt print config` shows no errors and `mewt print targets` lists only intended files. Done when: both commands succeed and the target list is clean.

### Phase 2: generate mutants and assess scope

6. Generate mutants for the scoped targets: `mewt mutate <paths>`. Done when: mutants are generated without error.
7. Record the total mutant count: `mewt status`. Done when: the mutant count is recorded.
8. Measure baseline test duration by running the test command from the config with `time` prefix. Store the result. Done when: the baseline duration is measured and stored.
9. Calculate worst-case estimated campaign duration: `mutant_count × test_duration_seconds`. Present this estimate to the user. Done when: the estimate is presented and the user has seen it.

### Phase 3: decide on optimization strategy

10. If estimated duration is under 1 hour, skip to Phase 4. Done when: the decision to skip optimization is recorded.
11. If estimated duration is 1–16 hours, ask the user whether to proceed or optimize. If the user declines, apply optimization before proceeding. Done when: the user's decision is recorded.
12. If estimated duration exceeds 16 hours, or the user requests optimization: run `mewt print targets` to check for unintended files; run `mewt print mutants --severity high` and `mewt print mutants --severity medium` to understand severity distribution. Present options with concrete time estimates: full campaign, critical components only (narrow `[targets].include`), high/medium severity only (restrict `[run].mutations`), or two-phase (`[[test.per_target]]` blocks). Apply the chosen option to `mewt.toml` and recalculate the reduced duration estimate. Done when: the chosen optimization is applied and the reduced estimate is confirmed.

### Phase 4: validate test command and timeout

13. Run the test command from `[test].cmd` manually and confirm it succeeds without errors. Skip if already validated in Phase 2 and not modified. Done when: the test command exits 0 or the failure is reported.
14. For compiled languages where incremental recompilation dominates test time (e.g., Solidity with Foundry): time the test command with a warm cache, touch a source file to force dependent recompilation and time again. If the recompilation-inflated time is substantially longer, set `[test].timeout` to `recompiled_time × 2` rounded up. Otherwise omit `timeout` and let the tool auto-calculate as `2 × baseline_test_time`. Done when: the timeout policy is set and justified by measurement.

### Phase 5: final validation

15. Run the checklist: `mewt print config` parses with no errors; `mewt status` mutant count matches the expected count; `mewt print targets` lists only intended source files; test command passes; timeout is set appropriately; duration estimate is acceptable to the user. Done when: every checklist item passes.
16. Report readiness. The campaign is ready for a separate execution of `mewt run`. Done when: the readiness report is produced.

## Failure and recovery

- **Configuration parse failure**: `mewt print config` reports a syntax or TOML error. Do not proceed. Edit `mewt.toml` to fix the error and re-run the validation checklist.
- **No mutants generated**: `mewt status` returns zero mutants. Verify the `[targets].include` patterns match existing source files with `find` (not `ls` or shell glob expansion). Verify the language is supported: `mewt print mutations --language <lang>`. Fix patterns or confirm support before proceeding.
- **Test command fails**: Running `<test-command>` returns non-zero. Do not proceed. Identify the correct test command by inspecting `Makefile`, `justfile`, `package.json`, or project `README.md`. Update `[test].cmd` in `mewt.toml`. Re-validate.
- **Duration estimate unacceptable**: User rejects the estimated campaign duration and no optimization path reduces it to an acceptable range. Do not force execution. Present the available options and wait for a decision. If no decision is reachable, stop.
- **Rollback**: All configuration edits are reversible. If an edit produces an invalid state, restore `mewt.toml`/`muton.toml` from version control (`git checkout`) or the pre-edit snapshot before returning.

## Output

A validated `mewt.toml` or `muton.toml` confirmed against the Phase 5 checklist, with mutant count, test duration estimate, and timeout policy known — ordered by the procedure phases that produced them. The campaign is ready to run via `mewt run` in a separate session.

## Provenance

Origin: Trail of Bits mutation-testing plugin (`github.com/trailofbits/skills`). Pinned revision: `d1f1575cff97816e5cc08af66cd2506099c681d3`. License: CC-BY-SA-4.0. Source paths: `/plugins/mutation-testing/skills/mutation-testing/SKILL.md`, `/plugins/mutation-testing/skills/mutation-testing/workflows/configuration.md`, `/plugins/mutation-testing/skills/mutation-testing/references/optimization-strategies.md`. Adapted from the 5-phase configuration workflow into a self-contained ODIN skill. Attribution and source link preserved per license terms. Modifications marked; adaptations ShareAlike. Trail of Bits trademark not claimed.
