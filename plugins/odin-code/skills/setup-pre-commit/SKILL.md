---
name: setup-pre-commit
description: 'Use when installing or repairing one repository-local pre-commit hook using the project''s current gates, or when a repo needs package-manager-native commit-time checks. Extends existing hook tooling instead of duplicating it; JS uses Lefthook and Biome, Python/Rust/OCaml use prek. Not for remote or irreversible changes.'
---

# Setup pre-commit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Install, repair, or standardize local pre-commit checks in an existing repository, including package-manager-native commit-time checks. |
| Authority | Reversible local writes to hook configuration, dependency manifests, and lockfiles. No push, remote setting, credential, or release mutation. |
| Side effect | Extends the existing hook manager or installs one current manager, writes its config, and installs the local Git hook. |
| Done | Exactly one hook manager owns pre-commit; its all-files command runs the repository formatter, linter, type checker, and targeted tests successfully; a deliberate failing probe blocks and a passing probe exits zero. |

## Inputs

- Repository root with `.git`: required.
- Repository-native format, lint, type-check, and targeted-test commands: required; infer only from committed scripts and configuration.
- Existing hook manager: optional; detect Husky, Lefthook, prek/pre-commit, cargo-husky, and native `.git/hooks/pre-commit` before adding anything.

## Procedure

1. Read the repository manifests, lockfiles, declared gate scripts, hook config, and `.git/hooks/pre-commit`. Detect `pnpm-lock.yaml`, `bun.lock`, legacy `bun.lockb`, `uv.lock`, `go.mod`, `Cargo.toml`, and `dune-project`. Do not infer a gate command that the repository does not declare. **Done when:** the repository's manifests, lockfiles, gate scripts, and existing hooks are inventoried.
2. If one hook manager already exists, extend it. If multiple managers can fire for the same commit, stop and report the conflict; do not add a third path. **Done when:** the hook-manager state is classified as extend, conflict, or install-new.
3. If none exists, select one manager: Lefthook for a pnpm, Bun, or Go repository; prek for Python, Rust, or OCaml. In a mixed repository, select the manager already represented by its lockfile or task runner. Ask only when two choices remain equally supported by repository evidence. **Done when:** the manager is selected or the user is asked.
4. Install through the current project toolchain: `pnpm add -D lefthook @biomejs/biome && pnpm exec lefthook install` for JavaScript or TypeScript; `go install github.com/evilmartians/lefthook@latest && lefthook install` for Go; `uv tool install prek && prek install` for Python, Rust, or OCaml. Do not install ESLint, Prettier, Black, isort, mypy, or a second package manager. **Done when:** the manager is installed.
5. Write only commands the repository can execute:
   - JavaScript or TypeScript Lefthook: `pnpm exec biome check --write --no-errors-on-unmatched .`, the declared type-check script, and the declared targeted-test script.
   - Python prek local hooks: `uv run ruff check --fix .`, `uv run ruff format --check .`, `uv run pyright`, and the declared targeted pytest command.
   - Go Lefthook: fail when `gofmt -l .` returns a path, then run `go vet ./...` and `go test ./...`.
   - Rust prek local hooks: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, and the repository test command, preferring `cargo nextest run` when configured.
   - OCaml prek local hooks: `dune fmt`, `dune build @runtest`, and any stricter repository alias already declared.
   Set `pass_filenames: false` for whole-repository commands. Keep independent read-only checks parallel only when their tools do not edit the same files. **Done when:** the config is written with repository-native commands only.
6. Run the manager's all-files entry point: `pnpm exec lefthook run pre-commit` or `prek run --all-files`. If a formatter changes files, inspect the diff and repeat until the non-mutating gate passes. **Done when:** the all-files command passes with no uncommitted formatter changes.
7. Prove enforcement without creating history. Add one temporary, reversible formatting violation inside an owned scratch file that the hook includes. Run the hook and require non-zero or an automatic repair followed by a dirty diff. Restore the scratch file, rerun the hook, and require zero. When the hook does not include a formatter, use the trivial-commit alternative: stage a trivial change (e.g., add a blank line to a tracked file), run the hook, and require all configured checks to pass; then revert the staged change. Never weaken a command to make the probe pass. **Done when:** the failing probe blocks and the passing probe exits zero, or the trivial-commit probe passes all checks and is reverted.
8. Confirm exactly one executable `.git/hooks/pre-commit` entry remains and that it delegates to the selected manager. Report changed files and both probe outcomes. Do not commit unless the user separately asks. **Done when:** one hook entry is confirmed and the report is emitted.

## Failure and recovery

- No repository-native gates: stop before installation and report which format, lint, type, or test command is missing.
- Competing hook managers: do not guess. Report every firing path and the smallest clean cutover; removal requires the user's approval when it changes an observable workflow.
- Install failure: restore the manifest, lockfile, hook config, and `.git/hooks/pre-commit` from the captured baseline.
- Probe does not trip: the hook is not load-bearing. Fix its file matching or command and repeat; a green normal run alone does not satisfy done.
- Probe residue: restore the scratch path and confirm the worktree matches the pre-probe baseline before returning.
- Probe failure is hook-wiring, not check-content: when the probe fails, distinguish between hook-wiring failures (the hook did not fire, fired the wrong command, or missed the file) and check-content failures (the check itself reported a real issue). Fix hook-wiring failures here; report check-content failures to the user without modifying check logic.

## Output

The selected manager, config and manifest paths changed, installed hook path, all-files command and output, failing-probe evidence, passing-probe evidence, and rollback command; the repository has one pre-commit owner and no superseded formatter, linter, or type checker introduced by this skill.
