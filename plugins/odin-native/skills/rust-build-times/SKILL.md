---
name: rust-build-times
description: 'Use when profiling slow Rust builds with cargo --timings, configuring sccache, selecting the Cranelift dev backend, splitting a workspace for parallelism, or tuning LTO and the linker.'
---

# Rust build times

Compile time is a measurement problem first. Profile before changing anything, apply one change at a time, and keep only measured wins.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A Rust build is slow and the user wants it measured and reduced: `cargo build --timings`, sccache, the Cranelift backend, workspace splitting, LTO tuning, or a faster linker. |
| Authority | Reversible local. Writes only the project's Cargo.toml and .cargo/config.toml; rollback is version control. Toolchain component and system package installs are reported as commands for the user, not executed. No remote mutation. |
| Side effect | Edits project build configuration and emits a measurement report. |
| Done | A baseline `cargo build --timings` report exists, each applied change is measured against it, and only measured wins remain in the configuration. |

## Inputs

1. **Build command** (required): the slow invocation, such as `cargo build`, `cargo test`, or `cargo build --release`.
2. **Workspace layout** (required if not inferrable): single crate or workspace, member count, and dependency graph.
3. **Toolchain** (required): stable or nightly; the Cranelift backend needs nightly.
4. **Constraints** (optional): CI environment, cache storage (local disk or S3), and whether runtime performance may regress.

## Procedure

1. **Measure the baseline.** Run `cargo build --timings` (add `--release` when release is the slow path) and read the HTML report for long serial chains, crates that dominate the timeline, and proc-macro crates blocking downstream work. Run `cargo llvm-lines --release` to find monomorphization-heavy functions. Done when: the top offenders are named.

2. **Add sccache for repeated builds.** sccache wraps rustc and caches compiled artifacts locally or in S3.

```bash
export RUSTC_WRAPPER=sccache
sccache --show-stats
```

```toml
# .cargo/config.toml
[build]
rustc-wrapper = "sccache"
```

For CI, the S3 backend is configured through `SCCACHE_BUCKET` and `SCCACHE_REGION`. Done when: `sccache --show-stats` reports hits on a rebuild.

3. **Select the Cranelift backend for dev builds when nightly is allowed.** Cranelift compiles faster than LLVM and produces slower code, so it belongs in the dev profile only. Done when: the dev profile uses Cranelift and release stays on LLVM.

```toml
# .cargo/config.toml (nightly only)
[unstable]
codegen-backend = true

[profile.dev]
codegen-backend = "cranelift"
```

The component is `rustc-codegen-cranelift-preview` on the nightly toolchain; report the `rustup component add` command for the user to run.

4. **Split the workspace for parallelism.** One large crate compiles serially; independent crates compile in parallel. Break circular dependencies first, move proc macros into their own crate, and isolate frequently changed code so edits invalidate less. Inspect the graph with `cargo tree`. Done when: the timing report shows parallel compilation where a serial chain ran before.

5. **Tune LTO per profile.** LTO trades link time for runtime performance: `false` for dev, `"thin"` for most release builds, `true` (fat) only when runtime performance is measured to matter. `codegen-units = 1` maximizes optimization and serializes codegen. Done when: each profile carries the LTO setting its purpose needs.

```toml
[profile.release]
lto = "thin"

[profile.dev]
codegen-units = 16
```

6. **Switch to a faster linker.** The link step often dominates large projects. mold is the fastest option on Linux; lld is the portable fast option. Both are selected through the clang driver. Done when: the configured linker appears in the build log and link time drops.

```toml
# .cargo/config.toml
[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=mold"]   # or =lld
```

Report the system package install command for the user rather than running it.

7. **Apply the smaller wins.** `debug = 1` in the dev profile emits line tables only; `split-debuginfo = "unpacked"` shrinks linker input on platforms that support it; `CARGO_INCREMENTAL=0` can win on clean CI builds. Done when: each candidate is measured, not assumed.

8. **Re-measure after every change.** Compare each timing report against the baseline and keep only changes that measurably help this workload. Done when: the final configuration is the measured fastest acceptable set.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `--timings` produces no report | Requires a recent Cargo; record the toolchain version and fall back to per-crate timing from `cargo build -vv` output. |
| sccache reports no hits | Check `RUSTC_WRAPPER` or `rustc-wrapper` is set in the right config file and that the cache directory is writable. |
| Cranelift rejects a crate | Some intrinsics and SIMD paths are unsupported; keep that crate or profile on LLVM. |
| Workspace split hits a dependency cycle | Extract the shared types into a common crate both sides depend on. |
| mold or lld not installed | Report the install command; do not run system package managers. |
| A change regresses the build | Revert it; the baseline report is the arbiter. |
| Partial result | Configuration edits already made remain; the report names the unmeasured or reverted changes. Rollback is version control. |

## Output

1. A measurement report: baseline timing, the named bottleneck crates, and per-change before/after numbers.
2. The final Cargo.toml and .cargo/config.toml edits that survived measurement.
