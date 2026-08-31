---
name: trailmark-summary
description: 'Use when the user or another workflow needs a quick structural overview before deeper codebase analysis. Runs a read-only Trailmark summary on the supplied target directory and returns detected languages, Entrypoints, and Dependencies, or reports the installation or language gap. Don''t use for tasks that require source or remote-system changes.'
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

## Procedure

1. Validate the target at its trust boundary: confirm the supplied path exists and is a directory. If not, report the invalid target and stop.
2. Check that trailmark is available:

   ```bash
   trailmark analyze --help 2>/dev/null || \
     uv run trailmark analyze --help 2>/dev/null
   ```

   If neither command works, report `trailmark is not installed` and stop. Never run `pip install`, `uv pip install`, `git clone`, or any install command; the user installs trailmark themselves.
3. Optionally record the version if the installed build supports it:

   ```bash
   trailmark --version 2>/dev/null || uv run trailmark --version 2>/dev/null || true
   ```

   Do not fail if the version command is missing; this is the v0.2-safe summary workflow and does not require Trailmark 0.4.0 or newer.
4. Detect languages with Trailmark's parse API:

   ```bash
   python3 - "<target-directory>" <<'PY'
   import json
   import sys

   try:
       from trailmark.parse import detect_languages  # canonical location since 0.3.x
   except ModuleNotFoundError:
       # v0.2.x predates trailmark.parse; the same function lives in query.api
       from trailmark.query.api import detect_languages

   print(json.dumps(detect_languages(sys.argv[1])))
   PY
   ```

   If the import fails, rerun the same snippet with `uv run --with trailmark python - "<target-directory>"`. If the result is `[]`, report `Trailmark found no supported languages under target` and stop.
5. Run the summary with auto-detection:

   ```bash
   trailmark analyze --language auto --summary <target-directory> 2>&1 || \
     uv run trailmark analyze --language auto --summary <target-directory> 2>&1
   ```

   Run only this summary pass; do not widen into full structural analysis, hotspot scores, or taint data.
6. Verify the output includes all three of: the detected languages from step 4, an `Entrypoints:` line, and a `Dependencies:` line. If any are missing, report exactly which field is missing and stop. Do not fabricate output.
7. Return the detected language list plus the full Trailmark summary output. If a version string was captured in step 3, include it in the returned metadata.

## Failure and recovery
- Not installed: neither availability command in step 2 works. Report `trailmark is not installed`; this is the installation gap and satisfies Done. Never install anything.
- No supported languages: step 4 returns `[]`. Report `Trailmark found no supported languages under target`; this is the language gap and satisfies Done.
- Import failure: the step 4 imports fail even after the `uv run --with trailmark` retry. Report `trailmark is not installed`; do not fall back to manual code reading.
- Missing field: step 6 finds a missing language list, `Entrypoints:`, or `Dependencies:` line. Report the specific missing field; a partial summary never satisfies Done.
- Invalid target: the supplied path does not exist or is not a directory. Report and stop; never probe a guessed path.
- Non-mutation rule: the skill writes nothing anywhere, so there is nothing to roll back. Never swallow errors and never claim Done while a field is missing without naming the gap.

## Output
A report containing the detected language list, the full `trailmark analyze --language auto --summary` output including its `Entrypoints:` and `Dependencies:` lines, and the trailmark version in the metadata when one was captured in step 3; or the terminal gap classification `trailmark is not installed`, `Trailmark found no supported languages under target`, or the named missing-field gap.

## Provenance

Origin: https://github.com/trailofbits/skills (Trail of Bits), path `/plugins/trailmark/skills/trailmark-summary/SKILL.md`, pinned revision `d1f1575cff97816e5cc08af66cd2506099c681d3`. License: CC-BY-SA-4.0; source https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3. Adaptation: adapted for ODIN 2.0 with modifications marked here — Trail of Bits plugin peer-skill routing removed and the workflow re-bound to the ODIN read-only contract — and the adaptation is distributed under CC-BY-SA-4.0 (ShareAlike). Trail of Bits attribution and the source link are preserved; no trademark rights are claimed and `trail-of-bits-mark.svg` is never used as branding.
