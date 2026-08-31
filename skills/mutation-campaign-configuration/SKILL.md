---
name: mutation-campaign-configuration
description: 'Use when the user mentions mewt, muton, or mutation testing and asks to initialize, scope, estimate, configure, validate, or optimize a campaign, configure the tool, generate mutant scope, measure test duration, optimize targets with user input, and confirm readiness for a separate run. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

- **Required:** Working directory containing a codebase to mutate, or an explicit `--config` path to an existing `mewt.toml`/`muton.toml`.
- **Required:** User intent for the campaign scope (which files or components to target).
- **Optional:** Existing `mewt.toml`/`muton.toml` with prior configuration.
- **Optional:** Non-standard tool binary name (`mewt` vs `muton`).

## Procedure

### Phase 1: initialize and validate targets

1. If no `mewt.toml`/`muton.toml` exists in the working directory, run `mewt init` (or `muton init`) to create it and the accompanying SQLite database. Pass `--config` with an explicit path if the user supplies one.
2. Read the generated or existing configuration: `mewt print config`.
3. Review `[targets]` include and ignore patterns. Include patterns must match only source code (e.g., `src/**/*.rs`, `contracts/**/*.sol`). Ignore patterns must exclude tests, mocks, and generated code within included paths.
4. If patterns are incorrect, edit `mewt.toml`/`muton.toml` directly. Do not use CLI flags for persistent configuration.
5. Confirm: `mewt print config` shows no errors and `mewt print targets` lists only intended files.

### Phase 2: generate mutants and assess scope

6. Generate mutants for the scoped targets: `mewt mutate <paths>`.
7. Record the total mutant count: `mewt status`.
8. Measure baseline test duration by running the test command from the config with `time` prefix. Store the result.
9. Calculate worst-case estimated campaign duration: `mutant_count × test_duration_seconds`. Present this estimate to the user.

### Phase 3: decide on optimization strategy

10. If estimated duration is under 1 hour, skip to Phase 4.
11. If estimated duration is 1–16 hours, ask the user whether to proceed or optimize. If the user declines, apply optimization before proceeding.
12. If estimated duration exceeds 16 hours, or the user requests optimization:
    a. Run `mewt print targets` to check for unintended files (mocks, tests, dependencies, generated code).
    b. Run `mewt print mutants --severity high` and `mewt print mutants --severity medium` to understand severity distribution.
    c. Present these options to the user with concrete time estimates:
       - **Full campaign:** proceed as-is.
       - **Critical components only:** narrow `[targets].include` to specific directories, then run `mewt purge` followed by `mewt mutate` for newly included paths.
       - **High/medium severity only:** set `[run].mutations` to restrict mutation types, then run `mewt purge --all` followed by `mewt mutate` to regenerate.
       - **Two-phase:** configure `[[test.per_target]]` blocks for targeted tests in Phase 1; full-suite re-test happens in Phase 2 after uncaught mutants are known.
    d. Apply the chosen option to `mewt.toml`. Recalculate and confirm the reduced duration estimate.

### Phase 4: validate test command and timeout

13. Run the test command from `[test].cmd` manually and confirm it succeeds without errors. Skip if the command was already validated in Phase 2 and was not modified.
14. For compiled languages where incremental recompilation dominates test time (e.g., Solidity with Foundry):
    a. Time the test command with a warm cache.
    b. Touch a source file to force dependent recompilation and time the test again.
    c. If the recompilation-inflated time is substantially longer, set `[test].timeout` to `recompiled_time × 2`, rounded up.
    d. Otherwise, omit `timeout` and let the tool auto-calculate it as `2 × baseline_test_time`.

### Phase 5: final validation

15. Run the checklist:
    - `mewt print config` — configuration parses with no errors.
    - `mewt status` — mutant count matches the expected count from Phase 2 (or the reduced count after optimization).
    - `mewt print targets` — only intended source files are targeted; no tests, mocks, or dependencies.
    - Test command passes (manually verified in Phase 2 or Phase 4).
    - Timeout is set appropriately (auto or manual, justified by measurement).
    - Duration estimate is acceptable to the user.
16. Report readiness. The campaign is ready for a separate execution of `mewt run`.

## Failure and recovery
**Configuration parse failure:** `mewt print config` reports a syntax or TOML error. Do not proceed. Edit `mewt.toml` to fix the error and re-run the validation checklist.

**No mutants generated:** `mewt status` returns zero mutants. Verify the `[targets].include` patterns match existing source files with `find` (not `ls` or shell glob expansion). Verify the language is supported: `mewt print mutations --language <lang>`. Fix patterns or confirm support before proceeding.

**Test command fails:** Running `<test-command>` returns a non-zero exit code. Do not proceed. Identify the correct test command by inspecting `Makefile`, `justfile`, `package.json`, or project `README.md`. Update `[test].cmd` in `mewt.toml`. Re-validate the command before continuing.

**Duration estimate unacceptable:** User rejects the estimated campaign duration and no optimization path reduces it to an acceptable range. Do not force execution. Present the available options (critical-component targeting, severity filtering, two-phase) and wait for a decision. If no decision is reachable, stop.

**Rollback rule:** All configuration edits are reversible. If an edit produces an invalid state, restore `mewt.toml`/`muton.toml` from version control (`git checkout`) or the pre-edit snapshot before returning.

## Output
A validated `mewt.toml` or `muton.toml` in the working directory, confirmed against the Phase 5 checklist. The file is version-controlled. Mutant count, test duration estimate, and timeout policy are known. The campaign is ready to run via `mewt run` in a separate session.

## Provenance

Origin: Trail of Bits mutation-testing plugin (`github.com/trailofbits/skills`).
Pinned revision: `d1f1575cff97816e5cc08af66cd2506099c681d3`.
License: CC-BY-SA-4.0. Source paths: `/plugins/mutation-testing/skills/mutation-testing/SKILL.md`, `/plugins/mutation-testing/skills/mutation-testing/workflows/configuration.md`, `/plugins/mutation-testing/skills/mutation-testing/references/optimization-strategies.md`. Adapted from the 5-phase configuration workflow into a self-contained ODIN skill. Attribution and source link preserved per license terms. Modifications marked; adaptations ShareAlike. Trail of Bits trademark not claimed.
