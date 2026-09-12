---
name: git-guardrails
description: 'Use when a repository needs Git safety controls: guard destructive commands, set up gitignore or fix gitignore when untracked files keep appearing, or install or repair a repository-local pre-commit hook from project gates, including package-manager-native commit-time checks. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Manage Git repository guardrails

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A repository needs destructive-command protection, deterministic `.gitignore` composition, or installing or repairing one repository-local pre-commit owner from project gates; this includes `set up gitignore`, `fix gitignore`, `untracked files keep appearing`, and package-manager-native commit-time checks. |
| Authority | Reversible local: guard mode writes only the installed hook and one merged settings entry; `setup-gitignore` mode writes only the repository `.gitignore`; `setup-pre-commit` mode writes only hook configuration, dependency manifests, lockfiles, a temporary probe file, a staged trivial change, and the local Git hook. Rollback is mode-specific cleanup or restoration. No remote, credential, or release mutation. |
| Side effect | Installs a command guard and settings registration, or deterministically composes `.gitignore`, or selects/installs one pre-commit manager and runs repository-native checks. |
| Done | The chosen mode meets its gate: guard mode passes all 16 payloads and registers the hook; `setup-gitignore` mode produces deterministic managed sections and reports before/after untracked counts; `setup-pre-commit` mode has exactly one manager owning the hook, its all-files command passes without formatter residue, a deliberate failing probe blocks, and the restored passing probe exits zero. |

## Inputs

- Mode (required, chosen by the user): `guard`, `setup-gitignore`, or `setup-pre-commit`.
- Guard mode: scope (project `.claude/settings.json` plus `.claude/hooks/`, or global `~/.claude/settings.json` plus `~/.claude/hooks/`), the shipped `scripts/block-dangerous-git.py` source, and optional rule additions or removals decided before installation.
- `setup-gitignore` mode: the current Git repository and, optionally, empirical ignore patterns explicitly confirmed by the user after reviewing current untracked-path clusters. Never infer confirmation or add an empirical pattern silently.
- `setup-pre-commit` mode: a repository root with `.git`, repository-native format/lint/type-check/targeted-test commands inferred only from committed scripts and configuration, and any existing hook manager (optional; detect Husky, Lefthook, prek/pre-commit, cargo-husky, and native `.git/hooks/pre-commit`).

## Procedure

1. Choose exactly one mode. Mutate nothing before the mode-specific prerequisites are available. Done when: the user has chosen `guard`, `setup-gitignore`, or `setup-pre-commit`, and the required inputs for that mode are identified.

2. For `guard` mode, ask the user to choose project or global scope. Mutate nothing before the choice. Done when: the scope is chosen with no mutation made.

   a. Copy `scripts/block-dangerous-git.py` to the chosen location, project: `.claude/hooks/block-dangerous-git.py`; global: `~/.claude/hooks/block-dangerous-git.py`, and run `chmod +x` on the copy. Leave the skill's source copy untouched. Done when: the hook copy exists at the chosen path, is executable, and the source copy is unchanged.

   b. Show the default blocked operations, forced pushes and forced refspecs; `reset --hard`; forced `clean`; forced branch deletion; `checkout .` and `restore .`; `stash drop` and `stash clear`; `reflog expire`; `gc --prune=now`, and ask whether to add or remove a rule. On approval, edit only the installed copy. When a rule is added or removed, add or remove the corresponding test case in the verification matrix so the gate covers the modified policy. Done when: the blocked-operations list is shown, any approved rule change is applied to the installed copy only, and the verification matrix matches.

   c. Verify before registration. For each payload below, run:

      ```bash
      printf '%s\n' '<payload>' | <path-to-hook>
      printf 'exit=%s\n' "$?"
      ```

      Must exit 2:

      1. `{"tool_input":{"command":"git push --force origin main"}}`
      2. `{"tool_input":{"command":"ok && git reset --hard"}}`
      3. `{"tool_input":{"command":"echo ok\ngit reset --hard"}}`
      4. `{"tool_input":{"command":"bash -c \"git reset --hard\""}}`
      5. `{"tool_input":{"command":"bash -lc \"git reset --hard\""}}`
      6. `{"tool_input":{"command":"eval \"git reset\" --hard"}}`
      7. `{"tool_input":{"command":"git clean --force"}}`
      8. `{"tool_input":{"command":"git branch --delete --force"}}`
      9. `{"tool_input":{"command":"git checkout ."}}`
      10. `{"tool_input":{"command":"git stash clear"}}`
      11. `{"tool_input":{"command":"git reflog expire --all"}}`
      12. `{"tool_input":{"command":"git gc --prune=now"}}`
      13. `{"tool_input":{"command":"git push origin +main"}}`

      Must exit 0:

      14. `{"tool_input":{"command":"git push origin main"}}`
      15. `{"tool_input":{"command":"git commit -m \"oops; git reset --hard\""}}`
      16. `{"tool_input":{"command":"git --git-dir=.git status"}}`

      All sixteen cases must match before registration. A blocked command prints this to stderr and exits 2:

      ```text
      BLOCKED: '<command>' matches dangerous pattern '<pattern>'. The user has prevented you from doing this.
      ```

      Done when: all sixteen payloads exit as expected, the thirteen dangerous commands exit 2, the three safe ones exit 0, and the BLOCKED stderr message is confirmed.

   d. After all sixteen cases pass, merge the entry into the existing `hooks.PreToolUse` array of the chosen settings file. Never overwrite the settings file or discard existing hooks. Done when: the entry is merged into the existing `hooks.PreToolUse` array with all prior hooks preserved.

      Project fragment:

      ```json
      {
        "hooks": {
          "PreToolUse": [
            {
              "matcher": "Bash",
              "hooks": [
                {
                  "type": "command",
                  "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-dangerous-git.py"
                }
              ]
            }
          ]
        }
      }
      ```

      Global fragment:

      ```json
      {
        "hooks": {
          "PreToolUse": [
            {
              "matcher": "Bash",
              "hooks": [
                {
                  "type": "command",
                  "command": "~/.claude/hooks/block-dangerous-git.py"
                }
              ]
            }
          ]
        }
      }
      ```

   e. The hook parses shell quoting, scans every Git invocation, and follows code passed to common shells (`bash -c`, `bash -lc`) and `eval`. It is a guardrail, not a sandbox: a determined caller can still hide Git behind runtime indirection. Do not widen rules or scope beyond what the user approved. Done when: the guard's parsing boundary and approved scope are recorded.

3. For `setup-gitignore` mode, locate the repository. Run `git rev-parse --show-toplevel`, change the working directory used by this procedure to that exact root, and stop with `not-a-repository` if it fails. Do not inspect global Git ignore configuration. Done when: the repository root is confirmed or `not-a-repository` is reported.

   a. Detect template keys at depth two. Enumerate regular files at repository-relative depth 0, 1, or 2, excluding `.git/`. Apply every matching row, deduplicate keys, and sort keys lexicographically before joining them with commas. Done when: the sorted key list is produced, possibly empty.

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

   b. Capture current state. Count and retain the exact list from `git status --short --untracked-files=all` entries beginning `?? `, excluding `.gitignore`. If `.gitignore` exists, read its exact bytes and copy it to `/tmp/gitignore-snapshot-<UTC-YYYYMMDDTHHMMSSZ>.bak` before modifying it. If snapshot creation fails, stop without writing. Done when: the untracked list is captured and the snapshot exists or `snapshot-failed` is reported.

   c. Confirm empirical patterns. Group untracked paths first by top-level directory; group root files by lowercase extension, with extensionless root files as `(no extension)`. Show every path in each group. Ask the user which exact directory (`name/`) or extension (`*.ext`) patterns to add. Normalize confirmed patterns to repository-relative slash form, reject `..`, absolute paths, and patterns matching `.gitignore`, then sort and deduplicate them. Declining empirical additions means an empty empirical block, not cancellation of the language and local-baseline composition. Done when: empirical patterns are confirmed, normalized, and deduplicated.

   d. Fetch the language block. If the sorted key list is non-empty, fetch `https://www.toptal.com/developers/gitignore/api/<comma-separated-keys>` with `curl -sf --max-time 10`, using the response verbatim after normalizing line endings to LF and removing trailing blank lines. If the request fails, report `ERROR: gitignore.io unreachable for keys: <comma-separated-keys>` and stop with `template-fetch-failed`, leaving `.gitignore` unchanged; there is no silent fallback. If the key list is empty, the language block is empty and no network request is made. Done when: the language block is fetched and normalized or `template-fetch-failed` is reported.

   e. Use these exact local baselines. They are inline data, not support-file placeholders:

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

      Done when: the exact local baselines are available unchanged for section assembly.

   f. Build managed sections. Produce these four anchors in this exact order, each followed by its normalized body and one blank line except the final block:

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

      Treat a non-comment, non-blank pattern line as a duplicate when its exact trimmed text has already appeared earlier in unmanaged user content or an earlier managed section; first occurrence wins. Preserve comment lines supplied by the API. Do not introduce angle-bracket text into the actual file. Done when: the four managed sections are built in order with duplicates removed.

   g. Merge deterministically. If no `.gitignore` exists, the candidate is the four managed sections. If one exists, require each managed anchor to occur zero or one time. Duplicate or out-of-order managed anchors are `invalid-managed-sections`. Preserve all bytes before the first managed anchor and after/between managed regions that are not part of a managed block. Replace each existing managed block from its anchor through the line before the next managed anchor; append missing managed blocks in canonical order. Normalize only generated managed blocks to LF; do not rewrite preserved user content. Ensure exactly one terminal newline. Done when: the candidate is merged with preserved user content and exactly one terminal newline, or `invalid-managed-sections` is reported.

   h. Obtain write approval. Show the complete before/candidate diff using any available local diff renderer; do not require `difft`. If the user declines, leave `.gitignore` unchanged. If approved, write the candidate to `.gitignore` atomically in the repository root. Done when: the user approves and the file is written, or the user declines and the file is unchanged.

   i. Prove idempotence and report. Run the key detection, language fetch, section build, and merge steps in memory against the newly written bytes with the same confirmed empirical inputs. Require the second candidate to be byte-identical; otherwise restore the snapshot (or remove a newly created `.gitignore`) and report `idempotence-failed`. Recount untracked entries with the same command as the capture step and report both counts plus every remaining untracked path. Done when: the second candidate is byte-identical and before/after untracked counts are reported, or `idempotence-failed` is reported.

4. For `setup-pre-commit` mode, read the repository manifests, lockfiles, declared gate scripts, hook config, and `.git/hooks/pre-commit`. Detect `pnpm-lock.yaml`, `bun.lock`, legacy `bun.lockb`, `uv.lock`, `go.mod`, `Cargo.toml`, and `dune-project`. Do not infer a gate command that the repository does not declare. Done when: the repository's manifests, lockfiles, gate scripts, and existing hooks are inventoried.

   a. If one hook manager already exists, extend it. If multiple managers can fire for the same commit, stop and report the conflict; do not add a third path. Done when: the hook-manager state is classified as extend, conflict, or install-new.

   b. If none exists, select one manager: Lefthook for a pnpm, Bun, or Go repository; prek for Python, Rust, or OCaml. In a mixed repository, select the manager already represented by its lockfile or task runner. Ask only when two choices remain equally supported by repository evidence. Done when: the manager is selected or the user is asked.

   c. Install through the current project toolchain: `pnpm add -D lefthook @biomejs/biome && pnpm exec lefthook install` for JavaScript or TypeScript; `go install github.com/evilmartians/lefthook@latest && lefthook install` for Go; `uv tool install prek && prek install` for Python, Rust, or OCaml. Do not install ESLint, Prettier, Black, isort, mypy, or a second package manager. Done when: the manager is installed.

   d. Write only commands the repository can execute:
      - JavaScript or TypeScript Lefthook: `pnpm exec biome check --write --no-errors-on-unmatched .`, the declared type-check script, and the declared targeted-test script.
      - Python prek local hooks: `uv run ruff check --fix .`, `uv run ruff format --check .`, `uv run pyright`, and the declared targeted pytest command.
      - Go Lefthook: fail when `gofmt -l .` returns a path, then run `go vet ./...` and `go test ./...`.
      - Rust prek local hooks: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, and the repository test command, preferring `cargo nextest run` when configured.
      - OCaml prek local hooks: `dune fmt`, `dune build @runtest`, and any stricter repository alias already declared.

      Set `pass_filenames: false` for whole-repository commands. Keep independent read-only checks parallel only when their tools do not edit the same files. Done when: the config is written with repository-native commands only.

   e. Run the manager's all-files entry point: `pnpm exec lefthook run pre-commit` or `prek run --all-files`. If a formatter changes files, inspect the diff and repeat until the non-mutating gate passes. Done when: the all-files command passes with no uncommitted formatter changes.

   f. Prove enforcement without creating history. Add one temporary, reversible formatting violation inside an owned scratch file that the hook includes. Run the hook and require non-zero or an automatic repair followed by a dirty diff. Restore the scratch file, rerun the hook, and require zero. When the hook does not include a formatter, use the trivial-commit alternative: stage a trivial change (for example, add a blank line to a tracked file), run the hook, and require all configured checks to pass; then revert the staged change. Never weaken a command to make the probe pass. Done when: the failing probe blocks and the passing probe exits zero, or the trivial-commit probe passes all checks and is reverted.

   g. Confirm exactly one executable `.git/hooks/pre-commit` entry remains and that it delegates to the selected manager. Report changed files and both probe outcomes. Do not commit unless the user separately asks. Done when: one hook entry is confirmed and the report is emitted.

## Failure and recovery

### Guard mode

- Payload mismatch: any of the sixteen cases exits other than expected. Do not register; report the payload with expected versus actual exit and classify blocked.
- Script not runnable: missing `python3`, failed copy, or failed `chmod +x`. Stop before verification; make no settings change.
- Settings unreadable or invalid JSON: stop without writing, report the parse failure, and never overwrite the file or discard existing hooks.
- Partial result: a copied but unregistered script is inert; either complete registration only after all sixteen cases pass or delete the copy.
- Rollback: delete the installed hook copy and remove the registered `hooks.PreToolUse` entry from the chosen settings file.
- Blocked result: report `BLOCKED: git-guardrails <exact reason>` with no settings change made. Never swallow an error; never claim done while any check failed.

### Gitignore mode

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

### Pre-commit mode

- No repository-native gates: stop before installation and report which format, lint, type, or test command is missing.
- Competing hook managers: do not guess. Report every firing path and the smallest clean cutover; removal requires the user's approval when it changes an observable workflow.
- Install failure: restore the manifest, lockfile, hook config, and `.git/hooks/pre-commit` from the captured baseline.
- Probe does not trip: the hook is not load-bearing. Fix its file matching or command and repeat; a green normal run alone does not satisfy done.
- Probe residue: restore the scratch path and confirm the worktree matches the pre-probe baseline before returning.
- Probe failure is hook-wiring, not check-content: when the probe fails, distinguish between hook-wiring failures (the hook did not fire, fired the wrong command, or missed the file) and check-content failures (the check itself reported a real issue). Fix hook-wiring failures here; report check-content failures to the user without modifying check logic.

## Output

- `guard`: an executable hook at the chosen path, one merged `hooks.PreToolUse` entry, the sixteen-line verification transcript, and terminal classification `installed (project)`, `installed (global)`, or `blocked: <reason>`.
- `setup-gitignore`: the repository-root `.gitignore`, created or updated with `LANGUAGE TEMPLATES`, `AI TOOLING`, `IDE / EDITOR`, and `EMPIRICAL` anchors; before/after untracked counts, remaining paths, and the snapshot path when an existing file was merged.
- `setup-pre-commit`: the selected manager, config and manifest paths changed, installed hook path, passing all-files command and output with no formatter residue, failing-probe evidence showing a block, passing-probe evidence showing zero, and rollback command; the repository has one pre-commit owner and no superseded formatter, linter, or type checker introduced by this skill.
