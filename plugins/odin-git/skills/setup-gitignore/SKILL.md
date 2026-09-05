---
name: setup-gitignore
description: 'Use when the user says set up gitignore, fix gitignore, or untracked files keep appearing. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Setup gitignore

## Contract

| Field | Bound contract |
|---|---|
| Trigger | set up gitignore / fix gitignore / untracked files keep appearing |
| Authority | Reversible local: writes only the repository `.gitignore`; rollback is the pre-merge snapshot or version control. No remote mutation. Never read or write a global excludes file. |
| Side effect | Writes or edits `.gitignore`; never `~/.gitignore`, `~/.config/git/ignore`, or `git config --global`. |
| Done | `.gitignore` has stable section anchors, composing it again with the same inputs produces identical bytes, and before/after untracked counts are reported. |

## Inputs

No required user input. Operate on the current Git repository.

Optional input is a set of empirical ignore patterns explicitly confirmed by the user after reviewing current untracked-path clusters. Never infer confirmation and never add an empirical pattern silently.

## Procedure

1. **Locate the repository.** Run `git rev-parse --show-toplevel`, change the working directory used by this procedure to that exact root, and stop with `not-a-repository` if it fails. Do not inspect global Git ignore configuration. **Done when:** the repository root is confirmed or `not-a-repository` is reported.

2. **Detect template keys at depth two.** Enumerate regular files at repository-relative depth 0, 1, or 2, excluding `.git/`. Apply every matching row, deduplicate keys, and sort keys lexicographically before joining them with commas: **Done when:** the sorted key list is produced (possibly empty).

   | Evidence filename | gitignore.io key(s) |
   |---|---|
   | `tsconfig.json`, `tsconfig.*.json` | `node,typescript` |
   | `package.json` | `node` |
   | `pyproject.toml`, `requirements.txt`, `setup.py`, `setup.cfg`, `Pipfile` | `python` |
   | `Cargo.toml` | `rust` |
   | `go.mod` | `go` |
   | `dune-project`, `dune`, `*.opam` | `ocaml` |
   | `pom.xml`, `build.gradle`, `build.gradle.kts` | `java` |
   | `settings.gradle.kts` with Kotlin source files | `java,kotlin` |
   | `CMakeLists.txt` | `cmake,c++` |
   | `Gemfile`, `*.gemspec` | `ruby` |
   | `composer.json` | `php` |

   A filename may contribute several keys; an empty result is valid and means no network template is requested.

3. **Capture current state.** Count and retain the exact list from `git status --short --untracked-files=all` entries beginning `?? `, excluding `.gitignore`. If `.gitignore` exists, read its exact bytes and copy it to `/tmp/gitignore-snapshot-<UTC-YYYYMMDDTHHMMSSZ>.bak` before modifying it. If snapshot creation fails, stop without writing. **Done when:** the untracked list is captured and the snapshot exists or `snapshot-failed` is reported.

4. **Confirm empirical patterns.** Group untracked paths first by top-level directory; group root files by lowercase extension, with extensionless root files as `(no extension)`. Show every path in each group. Ask the user which exact directory (`name/`) or extension (`*.ext`) patterns to add. Normalize confirmed patterns to repository-relative slash form, reject `..`, absolute paths, and patterns matching `.gitignore`, then sort and deduplicate them. Declining empirical additions means an empty empirical block, not cancellation of the language and local-baseline composition. **Done when:** empirical patterns are confirmed, normalized, and deduplicated.

5. **Fetch the language block.** If the sorted key list is non-empty, run `scripts/compose-gitignore.sh <comma-separated-keys>`. Use its stdout verbatim after normalizing line endings to LF and removing trailing blank lines. If the script fails, stop with `template-fetch-failed` and leave `.gitignore` unchanged; there is no silent fallback. If the key list is empty, the language block is empty and the script is not run. **Done when:** the language block is fetched and normalized or `template-fetch-failed` is reported.

6. **Use these exact local baselines.** They are inline data, not support-file placeholders:

   ```gitignore
   # === AI TOOLING ===
   .claude/settings.local.json
   .cursor/
   .windsurf/
   .aider.chat.history.md
   .aider.input.history

   # === IDE / EDITOR ===
   .idea/
   .vscode/*
   !.vscode/extensions.json
   !.vscode/settings.json
   !.vscode/tasks.json
   !.vscode/launch.json
   *.swp
   *.swo
   *~
   .DS_Store
   Thumbs.db
   ```
   **Done when:** the exact local baselines are available unchanged for section assembly.

7. **Build managed sections.** Produce these four anchors in this exact order, each followed by its normalized body and one blank line except the final block:

   ```text
   # === LANGUAGE TEMPLATES ===
   <successful API body, or empty>

   # === AI TOOLING ===
   <the five AI patterns above>

   # === IDE / EDITOR ===
   <the ten IDE/editor patterns above>

   # === EMPIRICAL ===
   <confirmed patterns, one per line>
   ```

   Treat a non-comment, non-blank pattern line as a duplicate when its exact trimmed text has already appeared earlier in unmanaged user content or an earlier managed section; first occurrence wins. Preserve comment lines supplied by the API. Do not introduce angle-bracket text into the actual file. **Done when:** the four managed sections are built in order with duplicates removed.

8. **Merge deterministically.** If no `.gitignore` exists, the candidate is the four managed sections. If one exists, require each managed anchor to occur zero or one time. Duplicate or out-of-order managed anchors are `invalid-managed-sections`. Preserve all bytes before the first managed anchor and after/between managed regions that are not part of a managed block. Replace each existing managed block from its anchor through the line before the next managed anchor; append missing managed blocks in canonical order. Normalize only generated managed blocks to LF; do not rewrite preserved user content. Ensure exactly one terminal newline. **Done when:** the candidate is merged with preserved user content and exactly one terminal newline, or `invalid-managed-sections` is reported.

9. **Obtain write approval.** Show the complete before/candidate diff using any available local diff renderer; do not require `difft`. If the user declines, leave `.gitignore` unchanged. If approved, write the candidate to `.gitignore` atomically in the repository root. **Done when:** the user approves and the file is written, or the user declines and the file is unchanged.

10. **Prove idempotence and report.** Run steps 2, 5, 7, and 8 in memory against the newly written bytes with the same confirmed empirical inputs. Require the second candidate to be byte-identical; otherwise restore the snapshot (or remove a newly created `.gitignore`) and report `idempotence-failed`. Recount untracked entries with the same command as step 3 and report both counts plus every remaining untracked path. **Done when:** the second candidate is byte-identical and before/after untracked counts are reported, or `idempotence-failed` is reported.

## Failure and recovery

| Failure class | Recovery |
|---|---|
| `not-a-repository` | Stop; no file is written. |
| `snapshot-failed` | Stop before modifying `.gitignore`. |
| `template-fetch-failed` | Report keys and network error; leave `.gitignore` unchanged. Retry only on an explicit new run. |
| `invalid-empirical-pattern` | Show the rejected pattern and ask for a repository-relative replacement; do not write meanwhile. |
| `invalid-managed-sections` | Report duplicate or out-of-order anchors; leave the original file unchanged for manual repair. |
| `write-declined` | Leave the original file unchanged. |
| `write-failed` | Restore the snapshot, or remove a partially created new file. |
| `idempotence-failed` | Restore the snapshot, or remove the new file; report the second-pass diff. |

## Output

The repository-root `.gitignore`, created or updated with `LANGUAGE TEMPLATES`, `AI TOOLING`, `IDE / EDITOR`, and `EMPIRICAL` anchors. The response reports before/after untracked counts, remaining paths, and the snapshot path when an existing file was merged.
