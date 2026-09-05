---
name: cargo-workflows
description: 'Use when managing Cargo workspaces, feature flags, build scripts, CI caching, dependency auditing, or Cargo.lock with Rust.'
---

# Cargo workflows

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user manages a Cargo workspace, sets feature flags, writes a `build.rs` script, configures CI caching, runs `cargo nextest`, audits dependencies, or updates `Cargo.lock`. |
| Authority | Reversible local: writes only local `Cargo.toml`, `build.rs`, `Cargo.lock`, CI workflow files, and report files the user names; rollback is `git checkout --` or `git reset` for tracked files and `rm` for new reports. No remote mutation. |
| Side effect | Local `Cargo.toml`, workspace, `build.rs`, CI, and lock files may change; guidance and command output go to chat. |
| Done | The requested Cargo workflow builds or runs cleanly, or the failing command and its cause are reported. |

## Inputs

1. The project path (required): the workspace root or member crate.
2. The task (required): workspace setup, feature flags, build script, CI caching, `cargo nextest`, dependency audit, or `Cargo.lock` management.
3. Rust version (optional): defaults to 1.98.1 with edition 2024.
4. Target crate or feature names (optional): used for scoped builds, tests, and updates.
5. CI platform (optional): GitHub Actions, GitLab CI, or local runner.

## Procedure

1. Identify the project and toolchain. Run `rustc --version` and `cargo --version`. Locate the workspace root by finding the `Cargo.toml` that contains `[workspace]` or the root package. Done when: the toolchain version and the workspace root are known.
2. Workspace setup. If the task is workspace setup, create or edit the root `Cargo.toml` with `[workspace]`, `members`, `resolver = "2"`, `[workspace.dependencies]`, and `[workspace.package]`. In member `Cargo.toml`, inherit with `version.workspace = true` and `edition.workspace = true`. For pattern details, see `references/workspace-patterns.md`. Done when: `cargo check --workspace` succeeds.
3. Feature flags. If the task is feature flags, configure `[features]` in the member `Cargo.toml`. Keep features additive, use `dep:optional_dep` syntax for optional dependencies, and set `resolver = "2"`. Verify with `cargo check --no-default-features` and `cargo check --all-features`. Done when: the requested feature combinations build cleanly.
4. Build scripts (`build.rs`). If the task is build scripts, add or edit `build.rs` at the crate root. Emit `cargo:rerun-if-changed=...`, `cargo:rustc-link-lib`, `cargo:rustc-link-search`, `cargo:rustc-cfg`, `cargo:rustc-env`, and `cargo:warning` directives. Done when: `cargo build` reruns the script only when inputs change and the crate links or generates correctly.
5. Incremental builds and CI caching. If the task is CI caching, configure `Swatinem/rust-cache@v2` or `actions/cache@v3` to cache `~/.cargo/registry` and `target/`. Set `[profile.release] incremental = false` when release builds must stay deterministic. Done when: CI logs show cache hits and build times are stable.
6. `cargo nextest`. If the task is test execution, install `cargo-nextest 0.9.143` and run `cargo nextest run`. Add `nextest.toml` with profiles for CI and local runs. Done when: tests pass under the chosen profile.
7. Dependency auditing. If the task is dependency auditing, run `cargo audit` from `cargo-audit 0.22.2`, `cargo deny check` from `cargo-deny 0.20.2`, or `cargo machete`. Configure `deny.toml` for licenses, duplicate versions, and banned crates. Done when: the tool reports no blocking findings or names each finding.
8. `Cargo.lock` management. If the task is lock management, keep `Cargo.lock` in version control for applications and binaries; omit it for libraries. Use `cargo generate-lockfile`, `cargo update`, and `cargo update -p <crate> --precise <version>`. Done when: the lock file matches the intended dependency versions.
9. Common commands. If the task is a one-off command, run the matching `cargo build`, `cargo test`, `cargo tree`, `cargo expand`, or `cargo package` invocation for the requested crate and features. Done when: the command output confirms the requested state.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Workspace does not build | Check `members` paths, `resolver`, and missing `Cargo.toml`; fix and rerun `cargo check --workspace`. |
| Feature unification leaks | Confirm `resolver = "2"`; split dev and prod feature edges; use `cargo tree -e features`. |
| Build script reruns too often | Add `cargo:rerun-if-changed` for every input file and environment variable. |
| CI cache misses | Verify cache keys include `Cargo.lock` and restore both `target/` and `~/.cargo`. |
| Audit blocks the build | Address the advisory, add a rationale to `deny.toml`, or switch to an allowed license. |
| Lock update changes unexpected crates | Use `cargo update --dry-run` and `cargo update -p <crate>` to scope the change. |

## Output

1. A configured `Cargo.toml`, workspace, `build.rs`, or CI file matching the task.
2. A `Cargo.lock` when needed, with deterministic dependency versions.
3. A `nextest.toml` or `deny.toml` configuration when requested.
4. A chat report naming the commands run and any remaining advisories or cache metrics.
