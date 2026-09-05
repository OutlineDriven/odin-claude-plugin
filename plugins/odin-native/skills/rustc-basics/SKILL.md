---
name: rustc-basics
description: 'Use when selecting RUSTFLAGS, configuring Cargo profiles, tuning release builds, reading assembly or MIR output, understanding monomorphization, or diagnosing compilation errors.'
---

# rustc basics

rustc is driven through Cargo profiles and `-C` codegen flags. The right answer is a profile entry or a flag, verified against the installed toolchain.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Choosing RUSTFLAGS or Cargo profile settings, inspecting compiler output (assembly, MIR, LLVM IR), reducing binary size, or triaging a compilation error. |
| Authority | Read-only. Chat output only. No remote mutation. |
| Side effect | Emits a configuration recommendation or explanation to chat. |
| Done | The report names the profile settings, flag set, inspection command, or error fix, each verified against the installed rustc. |

## Inputs

1. **Goal** (required): build mode, profile tuning, output inspection, binary size, or error triage.
2. **Toolchain** (required if not inferrable): `rustc --version` output and the target triple.
3. **Existing configuration** (optional): the workspace Cargo.toml profiles and `.cargo/config.toml`.

## Procedure

1. **Identify the goal and the toolchain.** Read `rustc --version`, the target triple, and any existing profile or rustflags configuration. Done when: the goal and toolchain are named.

2. **Recommend the build mode.** `cargo build` for debug, `cargo build --release` for optimized, `cargo check` for the fastest type-check pass, `--target` for cross builds. Done when: the mode matches the goal.

3. **Recommend profile settings.** Profiles apply only in the workspace-root Cargo.toml.

```toml
[profile.release]
opt-level = 3          # 0-3, "s" for size, "z" for aggressive size
debug = false          # true, 1 for line tables, 0 for none
lto = "thin"           # false, "thin", or true for fat LTO
codegen-units = 1      # 1 for maximum optimization, higher for faster compiles
panic = "abort"        # "unwind" (default) or "abort" for a smaller binary
strip = "symbols"      # "none", "debuginfo", or "symbols"
```

| Setting | Effect |
|---|---|
| `lto = true` | Fat LTO: best optimization, slowest link |
| `lto = "thin"` | Parallel LTO: near-fat optimization, faster link |
| `codegen-units = 1` | Best inlining, slower compile |
| `panic = "abort"` | Drops unwind tables; smaller binary, panics cannot be caught |
| `opt-level = "z"` | Aggressive size reduction |

Done when: the recommended profile block is complete.

4. **Recommend RUSTFLAGS for invocation-level control.** `-C` flags apply per build; persist them in `.cargo/config.toml` when they should be permanent.

```bash
RUSTFLAGS="-C target-cpu=native" cargo build --release
```

```toml
# .cargo/config.toml
[build]
rustflags = ["-C", "target-cpu=native"]
```

Warn that `target-cpu=native` ties the binary to the build machine; recommend a named microarchitecture level such as `x86-64-v3` for distributed binaries. Done when: flags are given with their persistence story.

5. **Give the inspection command for the requested output.**

```bash
cargo install cargo-show-asm
cargo asm --release 'myapp::module::function'

rustc --emit=asm -C opt-level=3 src/lib.rs      # .s assembly
rustc --emit=mir -C opt-level=3 src/lib.rs      # MIR text
rustc --emit=llvm-ir -C opt-level=3 src/lib.rs  # LLVM IR
```

Done when: the command produces the requested representation.

6. **Explain monomorphization when compile time or binary size is the complaint.** Each concrete instantiation of a generic produces separate code. Measure with `cargo llvm-lines --release`; mitigate with `dyn Trait` type erasure or a non-generic inner function that does the work behind a thin generic wrapper. Done when: the measurement command and one mitigation are given.

7. **Recommend the size profile when binary size is the goal.**

```toml
[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
panic = "abort"
strip = "symbols"
```

Measure with `cargo bloat --release --crates` for per-crate size and `cargo bloat --release -n 20` for the largest functions. Done when: the profile and the measurement commands are given.

8. **Triage compilation errors by class.**

| Error | Cause | Fix |
|---|---|---|
| `cannot find function in this scope` | Missing `use` or wrong module path | Import the item |
| `the trait X is not implemented for Y` | Missing impl or wrong generic bound | Implement the trait or fix the bound |
| `lifetime may not live long enough` | Borrow outlives its owner | Add or fix lifetime annotations |
| `cannot borrow as mutable` | Overlapping borrows | Restructure so borrows do not overlap |
| `use of moved value` | Value moved earlier | Borrow or clone |
| `mismatched types` | `String` vs `&str` and similar | Convert at the boundary |

Use `rustc --explain E0382` for the long form of any error code. Done when: each error maps to a row.

9. **Verify every flag against the installed toolchain** with `rustc -C help`, `rustc --print target-list`, `rustc --print target-features --target <triple>`, and `rustc --print cfg`. Done when: no recommended flag is unverified.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Flag rejected by the toolchain | Verify with `rustc -C help` or `rustc --print`; drop the flag and note the rejection. |
| Profile key has no effect | Profiles apply only in the workspace-root manifest; per-member profiles are ignored. Say so. |
| `target-cpu=native` requested for distribution | Warn that the binary may fault on older CPUs; recommend a named microarchitecture level instead. |
| `--emit` artifact not found | rustc writes next to the input or under `target/`; recommend `cargo-show-asm` for locating one function. |
| Error matches no row | Report the error text verbatim and the closest class; do not invent a fix. |

## Output

1. A recommendation report: profile block, RUSTFLAGS, or inspection commands, each verified against the installed rustc.
2. The full `-C` flag table, profile inheritance, per-package overrides, and linker configuration are in `references/rustflags-profiles.md`.
