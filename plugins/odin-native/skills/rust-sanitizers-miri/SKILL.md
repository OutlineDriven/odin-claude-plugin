---
name: rust-sanitizers-miri
description: 'Use when running AddressSanitizer, ThreadSanitizer, MemorySanitizer, UndefinedBehaviorSanitizer, or Miri on Rust code, interpreting sanitizer output, or validating unsafe code for undefined behaviour.'
---

# Rust sanitizers and Miri

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Rust code is being checked with a sanitizer or Miri, or a user asks how to run ASan, TSan, MSan, UBSan, or `cargo miri` on Rust. |
| Authority | Reversible local. Edits `Cargo.toml`, CI workflow files, or build directories only when the user asks; most uses are read-only guidance. Rollback is `git checkout` or removal of added files. No remote mutation. |
| Side effect | Chat guidance, command output, and optionally local build artifacts or CI files. |
| Done | The chosen sanitizer or Miri command runs and produces an interpretable result, or the report explains why the target cannot run. |

## Inputs

1. **Tool** (required): ASan, TSan, MSan, UBSan, or Miri.
2. **Target** (required): the crate, workspace, test, or binary to check.
3. **Toolchain** (optional): nightly is required for Rust sanitizers and Miri.
4. **CI context** (optional): GitHub Actions, GitLab CI, or a local runner.

## Procedure

1. **Confirm the toolchain.** Run `rustup toolchain list` and `rustc +nightly --version`. Sanitizers and Miri require a nightly toolchain. Done when: nightly is selected, the user accepts installing it, or the missing toolchain is reported.
2. **Choose the tool.** ASan for memory errors, TSan for data races, MSan for uninitialized reads, UBSan for language and integer UB, and Miri for interpretation-time UB detection in unsafe code. Done when: the tool matches the failure mode.
3. **Run a sanitizer.** Set `RUSTFLAGS="-Z sanitizer=<tool>"` and run `cargo +nightly test -Zbuild-std --target <triple>`. For MSan add `-Z sanitizer-memory-track-origins`. Done when: the build completes and the sanitizer report appears.
4. **Interpret sanitizer output.** Match the `ERROR: AddressSanitizer:`, `WARNING: ThreadSanitizer:`, or similar banner to the code path and the likely Rust cause. Done when: the report maps to a source line and a failure class.
5. **Run Miri.** Install Miri with `rustup +nightly component add miri`, then run `cargo +nightly miri test` or `cargo +nightly miri run`. Miri interprets MIR and detects UB at interpretation time. Use `MIRIFLAGS="-Zmiri-strict-provenance"` for stricter pointer provenance and `MIRIFLAGS="-Zmiri-disable-isolation"` for host file I/O, clocks, or randomness. Done when: Miri reports UB or completes without error.
6. **Configure CI.** Add a step that installs the nightly toolchain, adds the `rust-src` and `miri` components, and runs the chosen command. For ASan, set `RUSTFLAGS="-Z sanitizer=address"` and use `-Zbuild-std` with a `--target` triple. Done when: the CI file is valid and the command is reproducible.
7. **Document findings.** Report each UB or sanitizer hit with the source location, the failure class, and a recommended fix. Done when: the report is complete.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Tool requires nightly | Install the nightly toolchain and the `rust-src` component, then retry. |
| Sanitizer fails to build | Check the target triple, `-Zbuild-std`, and the sanitizer compatibility for that target. |
| Miri reports an unsupported operation | Skip the test under Miri with `#[cfg(not(miri))]`, or stub the operation for Miri. |
| CI cannot fetch nightly | Pin a known-good nightly date and add it to the CI cache. |

## Output

1. The sanitizer or Miri command and its output.
2. A mapping of findings to source locations and failure classes.
3. Recommended fixes for each finding.
4. A CI snippet when CI was requested.
5. Pointers to `references/miri-ub-patterns.md` for Miri-detected UB patterns and sanitizer comparison.
