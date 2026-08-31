---
name: trailmark-summary
description: 'Use when a quick structural overview of a target directory is needed before deeper codebase analysis. Runs a read-only Trailmark summary returning detected languages, Entrypoints, and Dependencies. Not for detailed structural analysis — use trailmark-structural; not for full graph queries — use build-program-graph; not for source or remote-system changes.'
---

# Trailmark summary

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user or another workflow needs a quick structural overview before deeper codebase analysis. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. Never install, upgrade, or clone trailmark or any dependency. |
| Side effect | Reads the target source tree and emits the language list and summary output; writes nothing. |
| Done | Detected languages, Entrypoints, and Dependencies are all present in the returned report, or an installation or language gap is reported. |

## Inputs

- Target directory path (required): supplied by the invoker; there is no default. Confirm it exists and is a readable directory before running anything.

## Refusals

- Will not install, upgrade, or clone trailmark or any dependency.
- Will not fall back to manual code reading if trailmark is unavailable.
- Will not widen into full structural analysis, hotspot scores, or taint data.
- Will not fabricate output or claim Done while a field is missing without naming the gap.

## Procedure

1. Validate the target at its trust boundary: confirm the supplied path exists and is a directory. If not, report the invalid target and stop. **Done when:** the target is confirmed as a readable directory.
2. Check that trailmark is available: `trailmark analyze --help 2>/dev/null || uv run trailmark analyze --help 2>/dev/null`. If neither command works, report `trailmark is not installed` and stop. Never run `pip install`, `uv pip install`, `git clone`, or any install command. **Done when:** trailmark availability is confirmed or the installation gap is reported.
3. Optionally record the version if the installed build supports it: `trailmark --version 2>/dev/null || uv run trailmark --version 2>/dev/null || true`. Do not fail if the version command is missing; this is the v0.2-safe summary workflow and does not require Trailmark 0.4.0 or newer. **Done when:** the version is recorded or confirmed absent.
4. Detect languages with Trailmark's parse API. If the import fails, rerun the same snippet with `uv run --with trailmark python - "<target-directory>"`. If the result is `[]`, report `Trailmark found no supported languages under target` and stop. **Done when:** the detected language list is returned or the language gap is reported.
5. Run the summary with auto-detection: `trailmark analyze --language auto --summary <target-directory> 2>&1 || uv run trailmark analyze --language auto --summary <target-directory> 2>&1`. Run only this summary pass; do not widen into full structural analysis, hotspot scores, or taint data. **Done when:** the summary output is captured.
6. Verify the output includes all three of: the detected languages from step 4, an `Entrypoints:` line, and a `Dependencies:` line. If any are missing, report exactly which field is missing and stop. Do not fabricate output. **Done when:** all three fields are present.
7. Return the detected language list plus the full Trailmark summary output. If a version string was captured in step 3, include it in the returned metadata. **Done when:** the report is returned.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Not installed | Neither availability command in step 2 works. Report `trailmark is not installed`; this is the installation gap and satisfies Done. Never install anything. |
| No supported languages | Step 4 returns `[]`. Report `Trailmark found no supported languages under target`; this is the language gap and satisfies Done. |
| Import failure | The step 4 imports fail even after the `uv run --with trailmark` retry. Report `trailmark is not installed`; do not fall back to manual code reading. |
| Missing field | Step 6 finds a missing language list, `Entrypoints:`, or `Dependencies:` line. Report the specific missing field; a partial summary never satisfies Done. |
| Invalid target | The supplied path does not exist or is not a directory. Report and stop; never probe a guessed path. |

Non-mutation rule: the skill writes nothing anywhere, so there is nothing to roll back.

## Output

A report containing the detected language list, the full `trailmark analyze --language auto --summary` output including its `Entrypoints:` and `Dependencies:` lines, and the trailmark version in the metadata when captured. Or a terminal gap classification: `trailmark is not installed`, `Trailmark found no supported languages under target`, or the named missing-field gap.
